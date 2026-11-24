(()=>{
'use strict';
const cfg=window.ASSISTTI_AUTH||{};
if(!cfg.url||!cfg.anonKey||!window.supabase){location.replace('login.html');return}
const sb=window.supabase.createClient(cfg.url,cfg.anonKey);
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={user:null,profile:null,sites:[],profiles:[],access:[],tab:'inicio'};
function isAdmin(){return state.profile?.role==='admin'}
function alertMsg(msg,type='ok'){$('alert').innerHTML='<div class="notice '+type+'">'+esc(msg)+'</div>';setTimeout(()=>{$('alert').innerHTML=''},6000)}
function showModal(html){$('modalHost').innerHTML='<div class="modalroot"><div class="modal">'+html+'<div style="margin-top:20px;text-align:right"><button class="btn soft" id="modalClose">Fechar</button></div></div></div>';$('modalClose').onclick=closeModal;$('modalHost').querySelector('.modalroot').addEventListener('click',e=>{if(e.target.classList.contains('modalroot'))closeModal()})}
function closeModal(){$('modalHost').innerHTML=''}
function siteAccess(s){return isAdmin()?{can_edit:true,can_publish:true}:state.access.find(a=>a.site_id===s.id)||{can_edit:false,can_publish:false}}
async function load(){
 const [sitesRes,accessRes,usersRes]=await Promise.all([
 sb.from('sites').select('id,name,repository,created_at').order('created_at',{ascending:false}),
 sb.from('site_access').select('user_id,site_id,can_edit,can_publish'),
 isAdmin()?sb.from('profiles').select('id,email,role,created_at').order('created_at',{ascending:false}):Promise.resolve({data:[]})
 ]);
 if(sitesRes.error)throw sitesRes.error;
 state.sites=sitesRes.data||[];
 state.access=accessRes.data||[];
 state.profiles=usersRes.data||[];
}
function nav(tab){if(!isAdmin()&&['clientes','permissoes','publicacao'].includes(tab))tab='inicio';
 if(!['inicio','sites','clientes','permissoes','publicacao','historico','conta'].includes(tab))tab='inicio';
 state.tab=tab;
 const titles={inicio:['Visão geral','Acompanhe seus sites em um só lugar.'],sites:['Meus sites','Edite e organize seus projetos.'],clientes:['Clientes e acessos','Contas cadastradas e sites vinculados.'],permissoes:['Permissões','Controle quem pode editar e salvar cada site.'],publicacao:['Publicação dos sites','Confira a conexão com o GitHub e os backups.'],historico:['Versões salvas','Recupere rascunhos anteriores.'],conta:['Minha conta','Informações e segurança do seu acesso.']};
 $('pageTitle').textContent=titles[tab][0];$('pageSubtitle').textContent=titles[tab][1];
 document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));
 render();
}
function siteCard(s){
 const a=siteAccess(s),repo=s.repository||'';
 return '<div class="siteitem"><div class="sitethumb">'+esc(s.name.slice(0,1).toUpperCase())+'</div><div class="sitemeta"><strong>'+esc(s.name)+'</strong><small>'+esc(repo||'Sem repositório vinculado')+'</small></div><span class="status">'+(a.can_edit?'Edição liberada':'Visualização')+'</span><div class="flex">'+(a.can_edit?'<a class="btn primary" href="editor-pro.html?site='+encodeURIComponent(s.id)+'">Abrir editor</a>':'')+(repo?'<a class="btn soft" target="_blank" rel="noopener" href="https://github.com/'+encodeURI(repo).replace(/[^\w%\-.]/g,'')+'">GitHub</a>':'')+(isAdmin()?'<button class="btn" data-rename="'+s.id+'">Configurar</button>':'')+'</div></div>'
}
function listenSite(){
 document.querySelectorAll('[data-rename]').forEach(b=>b.onclick=()=>editSite(b.dataset.rename));
}
function overview(){
 const own=state.sites.filter(s=>isAdmin()||siteAccess(s).can_edit);
 const totalClients=state.profiles.filter(p=>p.role==='client').length;
 let html='<section class="aihero"><div class="aihero-content"><span class="ai-eyebrow">✦ Seu espaço de criação</span>'+
 '<h2>'+(isAdmin()?'Seus sites, tudo em um só lugar.':'Seu site, suas ideias, seu espaço.')+'</h2>'+
 '<p>'+(isAdmin()?'Crie, edite e organize os sites dos seus clientes sem complicação. Escolha um projeto e continue de onde parou.':'Encontre seus sites, faça alterações e acompanhe as versões salvas com facilidade.')+'</p>'+
 '<div class="ai-actions"><button class="btn primary" id="heroMain">'+(isAdmin()?'+ Criar novo site':'Ver meus sites')+'</button><button class="btn soft" id="heroSecond">'+(isAdmin()?'Gerenciar clientes':'Abrir meus projetos')+'</button></div></div>'+
 '<div class="aihero-art" aria-hidden="true"><div class="ai-orbit"></div><div class="ai-orbit"></div><div class="ai-orbit">✦</div></div></section>';
 html+='<section class="ai-shortcuts">'+
 '<button class="ai-shortcut" data-quick="sites"><span class="symbol">▧</span><span><strong>Meus sites</strong><small>Continue a edição das páginas</small></span></button>'+
 (isAdmin()?'<button class="ai-shortcut" data-quick="clientes"><span class="symbol">♙</span><span><strong>Clientes</strong><small>Contas e acessos individuais</small></span></button>':'<button class="ai-shortcut" data-quick="historico"><span class="symbol">◷</span><span><strong>Histórico</strong><small>Consulte suas versões salvas</small></span></button>')+
 '<button class="ai-shortcut" data-quick="'+(isAdmin()?'publicacao':'conta')+'"><span class="symbol">'+(isAdmin()?'↑':'⚙')+'</span><span><strong>'+(isAdmin()?'Publicações':'Minha conta')+'</strong><small>'+(isAdmin()?'Confira o envio ao GitHub':'Gerencie seu acesso')+'</small></span></button></section>';
 html+='<div class="sectiontitle section"><div><h2>Resumo do seu espaço</h2><p class="ai-section-copy">Informações dos projetos conectados à sua conta</p></div></div>';
 html+='<div class="grid">'+
 '<div class="card kpi"><small>Sites cadastrados</small><strong>'+state.sites.length+'</strong><span>Projetos no painel</span></div>'+
 '<div class="card kpi"><small>'+(isAdmin()?'Clientes':'Sites liberados')+'</small><strong>'+(isAdmin()?totalClients:own.length)+'</strong><span>'+(isAdmin()?'Contas de clientes':'Com acesso à edição')+'</span></div>'+
 '<div class="card kpi"><small>GitHub vinculado</small><strong>'+state.sites.filter(s=>s.repository).length+'</strong><span>Repositórios cadastrados</span></div>'+
 '<div class="card kpi"><small>Seu perfil</small><strong style="font-size:24px">'+(isAdmin()?'Admin':'Cliente')+'</strong><span>Conta autenticada</span></div></div>';
 html+='<div class="section"><div class="sectiontitle"><div><h2>Seus projetos</h2><p class="ai-section-copy">Acesse rapidamente o site que deseja editar</p></div><button class="btn" data-go="sites">Ver todos</button></div><div class="list">'+
 (own.length?own.slice(0,6).map(siteCard).join(''):'<div class="empty">Nenhum site liberado até o momento.</div>')+'</div></div>';
 html+='<div class="ai-footer-card"><div><h3>Pronto para continuar?</h3><p>As alterações podem ser salvas como rascunho antes da publicação. Abra um site para editar, conferir a prévia e continuar seu trabalho.</p></div><button class="btn primary" data-go="sites">Abrir meus sites</button></div>';
 $('view').innerHTML=html;
 listenSite();
 $('heroMain').onclick=()=>isAdmin()?editSite(null):nav('sites');
 $('heroSecond').onclick=()=>nav(isAdmin()?'clientes':'sites');
 document.querySelectorAll('[data-quick]').forEach(el=>el.onclick=()=>nav(el.dataset.quick));
 document.querySelectorAll('[data-go="sites"]').forEach(el=>el.onclick=()=>nav('sites'));
}
function sites(){
 $('view').innerHTML='<div class="sectiontitle"><h2>Biblioteca de sites</h2>'+(isAdmin()?'<button class="btn primary" id="newSite">+ Novo site</button>':'')+'</div>'+
 '<div class="toolbar"><input class="ai-search" id="siteSearch" placeholder="Pesquisar sites pelo nome ou repositório..."></div>'+
 '<div class="list" id="siteList">'+(state.sites.length?state.sites.map(siteCard).join(''):'<div class="empty">Nenhum site cadastrado.</div>')+'</div>';
 listenSite();const newSite=$('newSite');if(newSite)newSite.onclick=()=>editSite(null);
 $('siteSearch').oninput=e=>{
 const q=e.target.value.toLowerCase();
 $('siteList').innerHTML=state.sites.filter(s=>((s.name+' '+(s.repository||'')).toLowerCase().includes(q))).map(siteCard).join('')||'<div class="empty">Nenhum resultado encontrado.</div>';
 listenSite();
 };
}
function editSite(id){
 if(!isAdmin())return;
 const s=state.sites.find(x=>x.id===id);
 showModal('<h2>'+(s?'Configurar site':'Cadastrar site')+'</h2><div class="formrow"><label>Nome do site</label><input id="mSiteName" value="'+esc(s?.name||'')+'" placeholder="Ex.: Treino Magnético"></div><div class="formrow"><label>Repositório GitHub</label><input id="mSiteRepo" value="'+esc(s?.repository||'')+'" placeholder="AssistTi/nome-do-repositorio"></div><p class="hint">Vincular um repositório não autoriza a publicação automática.</p><button class="btn primary" id="mSiteSave">Salvar informações</button>');
 $('mSiteSave').onclick=async()=>{
 const name=$('mSiteName').value.trim(),repository=$('mSiteRepo').value.trim()||null;
 if(!name){alertMsg('Informe o nome do site.','error');return}
 if(repository&&!/^[\w.-]+\/[\w.-]+$/.test(repository)){alertMsg('Use o formato usuario/repositorio.','error');return}
 const q=s?sb.from('sites').update({name,repository}).eq('id',s.id):sb.from('sites').insert({name,repository});
 const {error}=await q;
 if(error){alertMsg('Não foi possível salvar: '+error.message,'error');return}
 closeModal();await load();nav('sites');alertMsg('Site salvo com sucesso.');
 };
}
function clients(){
 const rows=state.profiles.map(p=>{
 const access=state.access.filter(a=>a.user_id===p.id);
 return '<tr><td><strong>'+esc(p.email)+'</strong></td><td>'+esc(p.role==='admin'?'Administrador':'Cliente')+'</td><td>'+access.length+' site(s)</td><td>'+(p.role==='client'?'<button class="btn" data-permission="'+p.id+'">Gerenciar acessos</button>':'<span class="muted">Acesso geral</span>')+'</td></tr>';
 }).join('');
 $('view').innerHTML='<div class="sectiontitle"><h2>Usuários cadastrados</h2><button class="btn primary" id="invite">+ Orientar cadastro</button></div><div class="notice">Novos clientes precisam criar uma conta em <strong>login.html</strong>. Depois você libera os sites abaixo. Não cadastre senhas dos clientes neste painel.</div><div class="card tablewrap"><table><thead><tr><th>E-mail</th><th>Tipo de acesso</th><th>Sites liberados</th><th>Ações</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
 $('invite').onclick=()=>{showModal('<h2>Convidar cliente</h2><p class="hint">Envie este endereço ao cliente. Ele cria a conta e confirma o e-mail; depois aparece nesta lista para você liberar o acesso.</p><input id="inviteUrl" readonly value="'+esc(new URL('login.html',location.href).href)+'"><button class="btn primary" id="copyInvite">Copiar link</button>');$('copyInvite').onclick=async()=>{try{await navigator.clipboard.writeText($('inviteUrl').value);alertMsg('Link copiado.')}catch{alertMsg('Selecione e copie o link acima.','error')}}};
 document.querySelectorAll('[data-permission]').forEach(b=>b.onclick=()=>permissions(b.dataset.permission));
}
function permissions(userId){
 const clients=state.profiles.filter(p=>p.role==='client');
 if(!clients.length){$('view').innerHTML='<div class="empty">Ainda não há contas de clientes. Peça para que se cadastrem na tela de login.</div>';return}
 const chosen=userId||clients[0].id;
 let html='<div class="sectiontitle"><h2>Permissões por cliente</h2></div><div class="card"><div class="formrow"><label>Cliente</label><select id="permUser">'+clients.map(c=>'<option value="'+c.id+'" '+(chosen===c.id?'selected':'')+'>'+esc(c.email)+'</option>').join('')+'</select></div><div class="tablewrap"><table><thead><tr><th>Site</th><th>Acesso</th><th>Editar</th><th>Publicar (futuro)</th><th></th></tr></thead><tbody>';
 for(const s of state.sites){const a=state.access.find(x=>x.user_id===chosen&&x.site_id===s.id);html+='<tr><td>'+esc(s.name)+'</td><td>'+ (a?'<span class="status">Liberado</span>':'<span class="muted">Sem acesso</span>')+'</td><td><input style="width:18px" type="checkbox" data-edit="'+s.id+'" '+(a?.can_edit?'checked':'')+'></td><td><input style="width:18px" type="checkbox" data-publish="'+s.id+'" '+(a?.can_publish?'checked':'')+'></td><td><button class="btn '+(a?'':'primary')+'" data-grant="'+s.id+'">'+(a?'Atualizar':'Liberar')+'</button> '+(a?'<button class="btn danger" data-revoke="'+s.id+'">Revogar</button>':'')+'</td></tr>'}
 html+='</tbody></table></div><p class="hint">Permissões são verificadas pelo banco de dados. A opção de publicar será aplicada quando a integração GitHub estiver pronta.</p></div>';
 $('view').innerHTML=html;
 $('permUser').onchange=e=>permissions(e.target.value);
 document.querySelectorAll('[data-grant]').forEach(b=>b.onclick=async()=>{
 const site_id=b.dataset.grant,user_id=$('permUser').value;
 const can_edit=!!document.querySelector('[data-edit="'+site_id+'"]').checked;
 const can_publish=!!document.querySelector('[data-publish="'+site_id+'"]').checked;
 if(can_publish&&!can_edit){alertMsg('Para publicar, também é necessário permitir edição.','error');return}
 const {error}=await sb.from('site_access').upsert({user_id,site_id,can_edit,can_publish});
 if(error){alertMsg(error.message,'error');return}await load();permissions(user_id);alertMsg('Permissões salvas.');
 });
 document.querySelectorAll('[data-revoke]').forEach(b=>b.onclick=async()=>{
 if(!confirm('Revogar o acesso a este site?'))return;
 const user_id=$('permUser').value,{error}=await sb.from('site_access').delete().eq('user_id',user_id).eq('site_id',b.dataset.revoke);
 if(error){alertMsg(error.message,'error');return}await load();permissions(user_id);alertMsg('Acesso revogado.');
 });
}
async function history(){
 $('view').innerHTML='<div class="empty">Carregando versões...</div>';
 const {data,error}=await sb.from('site_revisions').select('id,site_id,label,created_at,created_by').order('created_at',{ascending:false}).limit(60);
 if(error){$('view').innerHTML='<div class="notice error">'+esc(error.message)+'</div>';return}
 const rows=(data||[]).map(r=>'<tr><td>'+esc(state.sites.find(s=>s.id===r.site_id)?.name||'Site')+'</td><td>'+esc(r.label)+'</td><td>'+new Date(r.created_at).toLocaleString('pt-BR')+'</td><td><a class="btn" href="editor-pro.html?site='+encodeURIComponent(r.site_id)+'&revision='+encodeURIComponent(r.id)+'">Visualizar no editor</a></td></tr>').join('');
 $('view').innerHTML='<div class="sectiontitle"><h2>Histórico dos rascunhos</h2></div><div class="card tablewrap"><table><thead><tr><th>Site</th><th>Descrição</th><th>Data</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'+(rows?'':'<p class="hint">Nenhuma versão salva ainda.</p>')+'</div>';
}
async function publications(){
 if(!isAdmin()){nav('inicio');return}
 $('view').innerHTML='<div class="sectiontitle"><h2>Publicação no GitHub</h2></div><div class="card"><h3 style="margin-top:0">Conectar o GitHub</h3><p class="hint">A publicação já está integrada ao editor, mas precisa de uma credencial de acesso guardada no Supabase. Não coloque a credencial neste painel, no repositório nem em mensagens.</p><p class="hint"><strong>1.</strong> No GitHub, gere um token com acesso somente aos repositórios que deseja publicar, permissão <strong>Contents: Read and write</strong> e prazo de validade limitado.</p><p class="hint"><strong>2.</strong> No Supabase, abra <strong>Edge Functions → Secrets</strong> e crie uma variável chamada <code>GITHUB_PUBLISH_TOKEN</code> com o token gerado.</p><p class="hint"><strong>3.</strong> Volte ao editor do site e atualize a página. A opção Publicar será liberada para usuários autorizados.</p><div class="flex"><a class="btn primary" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Criar token no GitHub</a><a class="btn" href="https://supabase.com/dashboard/project/tlverdwpewfoxbojyxqf/functions/secrets" target="_blank" rel="noopener">Configurar no Supabase</a></div></div><div class="section"><div class="sectiontitle"><h2>Status por site</h2></div><div class="card"><div id="publicationStatuses" class="list">Verificando...</div></div></div><div class="section card"><h3 style="margin-top:0">Proteção da versão anterior</h3><p class="hint">Antes de cada publicação, a função tenta criar uma branch de backup no GitHub. Se não conseguir criar esse backup, não substitui a página pública. Os rascunhos salvos continuam no Supabase.</p></div>';
 const container=$('publicationStatuses');container.innerHTML='';
 for(const site of state.sites){
 const row=document.createElement('div');row.className='siteitem';
 const info=document.createElement('div');info.className='sitemeta';const strong=document.createElement('strong');strong.textContent=site.name;
 const small=document.createElement('small');small.textContent=site.repository||'Sem repositório cadastrado';
 info.append(strong,small);const label=document.createElement('span');label.className='muted';label.textContent='Verificando...';row.append(info,label);
 const checkBtn=document.createElement('button');checkBtn.className='btn';checkBtn.textContent='Testar conexão';row.append(checkBtn);
 const diagnosis=document.createElement('p');diagnosis.className='hint';diagnosis.style.width='100%';
 row.append(diagnosis);container.append(row);
 checkBtn.onclick=async()=>{
  checkBtn.disabled=true;diagnosis.textContent='Verificando token e acesso ao GitHub, sem publicar nada...';
  try{
   const {data,error}=await sb.functions.invoke('publish-site',{body:{action:'diagnose',siteId:site.id}});
   let details=data||{};
   if(error?.context?.json){try{details=await error.context.json()}catch{}}
   if(details.ok){
    label.textContent='Leitura funcionando, escrita não testada';
    diagnosis.textContent='Token consegue ler o repositório. Branch: '+details.defaultBranch+'. Atenção: a permissão de escrita da conta não garante que o token possa gravar arquivos. A última publicação recebeu HTTP 403 (Resource not accessible by personal access token). Confira se este token específico tem Contents: Read and write no repositório.';
   }else{
    const phases={read_repository:'acesso ao repositório',read_branch:'leitura da branch'};
    diagnosis.textContent='Falha na '+(phases[details.stage]||'conexão')+'. Código GitHub: '+(details.githubStatus||'não informado')+'. Confira no token: proprietário AssistTi, repositório correto e Contents: Read and write.';
   }
  }catch(e){diagnosis.textContent='Não foi possível completar o diagnóstico. Verifique o serviço de publicação.'}
  finally{checkBtn.disabled=false}
 };
 try{const {data,error}=await sb.functions.invoke('publish-site',{body:{action:'status',siteId:site.id}});
 if(error)label.textContent='Não foi possível consultar';else label.textContent=data?.configured?'Token encontrado, acesso ainda não verificado':'Falta token no Supabase';
 }catch{label.textContent='Serviço indisponível'}
 }
 if(!state.sites.length)container.textContent='Nenhum site cadastrado.';
}
function account(){
 $('view').innerHTML='<div class="card" style="max-width:720px"><h2 style="margin-top:0">Minha conta</h2><p class="muted">E-mail: <strong>'+esc(state.user.email)+'</strong></p><p class="muted">Perfil: <strong>'+(isAdmin()?'Administrador':'Cliente')+'</strong></p><hr style="border:0;border-top:1px solid #37435b;margin:22px 0"><h3>Redefinir senha</h3><p class="hint">Enviaremos um e-mail com instruções para redefinir sua senha.</p><button class="btn" id="resetPass">Enviar e-mail de recuperação</button></div>';
 $('resetPass').onclick=async()=>{const {error}=await sb.auth.resetPasswordForEmail(state.user.email,{redirectTo:new URL('redefinir-senha.html',location.href).href});alertMsg(error?'Não foi possível enviar o e-mail.':'Verifique sua caixa de entrada.',error?'error':'ok')};
}
function render(){if(state.tab==='inicio')overview();if(state.tab==='sites')sites();if(state.tab==='clientes')clients();if(state.tab==='permissoes')permissions();if(state.tab==='publicacao')publications();if(state.tab==='historico')history();if(state.tab==='conta')account()}
async function boot(){
 const {data:{user},error}=await sb.auth.getUser();
 if(error||!user){location.replace('login.html');return}
 const {data:profile,error:pe}=await sb.from('profiles').select('id,email,role').eq('id',user.id).single();
 if(pe||!profile){location.replace('login.html');return}
 state.user=user;state.profile=profile;
 $('sideEmail').textContent=user.email||'Usuário';$('sideRole').textContent=isAdmin()?'Administrador':'Cliente';
 $('roleTag').textContent=isAdmin()?'Administrador':'Painel do cliente';
 document.querySelectorAll('.admin-only').forEach(n=>n.classList.toggle('hidden',!isAdmin()));
 $('logout').onclick=async()=>{await sb.auth.signOut();location.replace('login.html')};
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>nav(b.dataset.tab));
 try{await load();const tab=new URLSearchParams(location.search).get('tab');nav(tab||'inicio')}catch(e){alertMsg('Erro ao carregar dados: '+e.message,'error')}
}
boot();
})();