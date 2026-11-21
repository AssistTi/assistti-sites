(()=>{
const c=window.ASSISTTI_AUTH||{},$=id=>document.getElementById(id);
if(!c.url||!c.anonKey||!window.supabase||!window.grapesjs){document.body.textContent='Falha ao carregar as ferramentas do editor.';return}
const db=window.supabase.createClient(c.url,c.anonKey),params=new URLSearchParams(location.search),siteId=params.get('site');
let editor,user,site,version=0,dirty=false,hasDraft=false,isAdministrator=false;
let zoom=100;
const esc=s=>String(s??'').replace(/[&<>"']/g,v=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[v]));
function message(title,detail){$('modal').innerHTML='<div class="overlay"><div class="dialog"><h2>'+esc(title)+'</h2><p>'+esc(detail)+'</p><div class="row"><button id="close">Fechar</button></div></div></div>';$('close').onclick=()=>{$('modal').innerHTML=''}}
function init(){
editor=grapesjs.init({
 container:'#editor',height:'100%',width:'auto',storageManager:false,fromElement:false,noticeOnUnload:false,
 panels:{defaults:[]},
 blockManager:{appendTo:'#elementorWidgets'},
 styleManager:{appendTo:'#elementorStyles',sectors:[
  {name:'Layout',open:true,buildProps:['display','position','width','height','max-width','min-height','margin','padding','overflow','flex-direction','justify-content','align-items','gap']},
  {name:'Tipografia',open:false,buildProps:['font-family','font-size','font-weight','color','text-align','line-height','letter-spacing']},
  {name:'Fundo',open:false,buildProps:['background-color','background-image','background-size','background-position','opacity']},
  {name:'Borda e efeitos',open:false,buildProps:['border','border-radius','box-shadow','transform','transition']}
 ]},
 traitManager:{appendTo:'#elementorTraits'},
 layerManager:{appendTo:'#elementorLayers'},
 deviceManager:{devices:[{name:'Computador',width:''},{name:'Tablet',width:'768px',widthMedia:'992px'},{name:'Celular',width:'390px',widthMedia:'480px'}]}
});
const blocks=[
['Título','<h2 style="font-size:40px">Seu novo título</h2>'],
['Texto','<p style="font-size:18px;line-height:1.7">Seu texto aqui</p>'],
['Botão','<a href="#" style="background:#8951dc;color:white;padding:15px 24px;display:inline-block;border-radius:9px">Clique aqui</a>'],
['Imagem','<img src="https://placehold.co/900x500?text=Sua+imagem" alt="Imagem" style="max-width:100%">'],
['Seção','<section style="padding:75px 25px"><h2>Nova seção</h2><p>Arraste elementos para cá.</p></section>'],
['Duas colunas','<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:22px"><div>Coluna 1</div><div>Coluna 2</div></div>'],
['Três colunas','<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px"><div>Coluna 1</div><div>Coluna 2</div><div>Coluna 3</div></div>'],
['Cartão','<div style="padding:25px;background:#f2ecfa;border-radius:15px"><h3>Destaque</h3><p>Descrição do seu cartão.</p></div>'],
['Lista','<ul><li>Item um</li><li>Item dois</li></ul>'],
['Vídeo','<video controls style="width:100%"></video>'],
['Divisor','<hr>'],
['Espaçador','<div style="height:55px"></div>'],
['FAQ','<details style="padding:15px;border-bottom:1px solid #ccc"><summary>Sua pergunta</summary><p>Resposta aqui.</p></details>'],
['Depoimento','<blockquote style="padding:22px;border-left:3px solid #a24cf0">Depoimento verdadeiro e autorizado.</blockquote>'],
['Preço','<div style="padding:28px;border:1px solid #ddd;border-radius:12px;text-align:center"><h3>Produto</h3><p style="font-size:32px">R$ 00,00</p><a href="#">Comprar</a></div>'],
['Formulário','<form><label>Nome<input name="nome"></label><label>E-mail<input type="email" name="email"></label><button>Enviar</button></form>']
];
blocks.forEach(([label,content],i)=>editor.BlockManager.add('assist-'+i,{label,content,category:i<4?'Básicos':i<9?'Estrutura':i<12?'Mídia':'Interação'}));
editor.on('update',()=>{dirty=true;$('saveState').textContent='Alterações não salvas'});
}
async function load(){
const {data,error}=await db.from('site_documents').select('project,html,css,version').eq('site_id',siteId).maybeSingle();if(error)throw error;
version=data?.version||0;
hasDraft=Boolean(data?.html||(data?.project&&Object.keys(data.project).length));
if(data?.project&&Object.keys(data.project).length)editor.loadProjectData(data.project);
else if(data?.html){editor.setComponents(data.html);editor.setStyle(data.css||'')}
else editor.setComponents('<section style="background:linear-gradient(130deg,#1d1535,#60388a);padding:100px 25px;color:#fff;text-align:center"><h1 style="font-size:55px">Seu site começa aqui</h1><p>Clique para editar. Arraste elementos para personalizar.</p><a href="#conteudo" style="color:white">Saiba mais</a></section><section id="conteudo" style="padding:75px 25px"><h2>Nova seção</h2></section>');
const revision=params.get('revision');
if(revision){const {data:r}=await db.from('site_revisions').select('project,html,css').eq('id',revision).eq('site_id',siteId).maybeSingle();if(r){if(r.project&&Object.keys(r.project).length)editor.loadProjectData(r.project);else{editor.setComponents(r.html);editor.setStyle(r.css)}message('Versão anterior','Você abriu uma versão anterior. Clique em Salvar online para restaurá-la como rascunho atual.')}}
dirty=false;$('saveState').textContent='Rascunho carregado';
}
async function save(){
$('save').disabled=true;$('saveState').textContent='Salvando...';
const payload={site_id:siteId,project:editor.getProjectData(),html:editor.getHtml(),css:editor.getCss(),version:version+1,updated_by:user.id,updated_at:new Date().toISOString()};
const {error}=await db.from('site_documents').upsert(payload,{onConflict:'site_id'});
if(error){$('save').disabled=false;message('Falha ao salvar',error.message);return false}
version++;hasDraft=true;dirty=false;$('saveState').textContent='Salvo online';
const {error:revError}=await db.from('site_revisions').insert({site_id:siteId,project:payload.project,html:payload.html,css:payload.css,created_by:user.id,label:'Rascunho '+version});
if(revError)message('Rascunho salvo','Não foi possível registrar o histórico: '+revError.message);
$('save').disabled=false;
return true;
}
function exportHTML(){const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(site.name)+'</title><style>'+editor.getCss()+'</style></head><body>'+editor.getHtml()+'</body></html>';const url=URL.createObjectURL(new Blob([html],{type:'text/html'})),a=document.createElement('a');a.href=url;a.download='index.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function publishedUrl(){
 const repo=String(site?.repository||'');
 if(!/^AssistTi\/[a-zA-Z0-9._-]+$/i.test(repo))return null;
 const slug=repo.split('/')[1];
 return 'https://assistti.github.io/'+encodeURIComponent(slug)+'/';
}
function updateZoom(value){
 zoom=Math.max(45,Math.min(150,Math.round(value/5)*5));
 $('zoomLabel').textContent=zoom+'%';
 try{if(editor?.Canvas?.setZoom)editor.Canvas.setZoom(zoom)}catch(err){console.warn('Editor zoom:',err)}
 const frame=$('liveFrame');
 if(frame){
  const factor=zoom/100;
  frame.style.width=(100/factor)+'%';
  frame.style.height=(100/factor)+'%';
  frame.style.transform='scale('+factor+')';
 }
 try{sessionStorage.setItem('assistti-editor-zoom-v2',String(zoom))}catch{}
}
function showLive(){
 const url=publishedUrl();
 if(!url){message('Sem site publicado','Este projeto ainda não tem um repositório GitHub vinculado para exibir uma prévia.');return}
 $('liveFrame').src=url;
 updateZoom(zoom);
 $('openLive').href=url;
 $('siteLive').style.display='flex';
 $('saveState').textContent='Visualizando site publicado';
}
function hideLive(){
 $('siteLive').style.display='none';
 $('liveFrame').src='about:blank';
 $('saveState').textContent=hasDraft?'Rascunho carregado':'Nenhum rascunho salvo';
}
function installKeyboardShortcuts(){
 const handler=e=>{
  if(!(e.ctrlKey||e.metaKey)||e.altKey||e.isComposing)return;
  const node=e.target;
  // Durante edição de texto, o navegador continua controlando desfazer/refazer.
  const textEditing=node&&typeof node.closest==='function'&&node.closest('input,textarea,select,[contenteditable="true"],[contenteditable=""],[role="textbox"]');
  if(textEditing||node?.isContentEditable)return;
  const key=String(e.key||'').toLowerCase();
  if(key==='z'){
    e.preventDefault();
    if(e.shiftKey)editor.UndoManager.redo();
    else editor.UndoManager.undo();
  }else if(key==='y'&&!e.shiftKey){
    e.preventDefault();
    editor.UndoManager.redo();
  }else if(key==='s'&&!e.shiftKey){
    e.preventDefault();
    if(!$('save').disabled)save();
  }
 };
 document.addEventListener('keydown',handler,true);
 const attachCanvas=()=>{
  const canvasDoc=editor?.Canvas?.getDocument?.();
  if(canvasDoc&&!canvasDoc.__assisttiShortcutsAdded){
    canvasDoc.addEventListener('keydown',handler,true);
    canvasDoc.__assisttiShortcutsAdded=true;
  }
 };
 editor.on('load',attachCanvas);
 editor.on('canvas:frame:load',attachCanvas);
 attachCanvas();
}
function bind(){
window.AssistElementorShell?.install?.(editor);
window.AssistAdvanced?.install?.(editor);
window.AssistWorkspace?.install?.(editor,{updateZoom,getZoom:()=>zoom});
window.AssistAIEditor?.install?.(editor);
installKeyboardShortcuts();
$('zoomOut').onclick=()=>updateZoom(zoom-10);
$('zoomIn').onclick=()=>updateZoom(zoom+10);
$('zoomReset').onclick=()=>updateZoom(100);
try{const stored=Number(sessionStorage.getItem('assistti-editor-zoom-v2'));zoom=stored>=45&&stored<=150?stored:100}catch{zoom=100}
editor.on('load',()=>updateZoom(zoom));
updateZoom(zoom);
$('livePreview').onclick=showLive;
$('editLive').onclick=()=>{if(!isAdministrator)return;$('githubImport').click()};
$('closeLive').onclick=hideLive;
$('save').onclick=save;$('desktop').onclick=()=>editor.setDevice('Computador');$('tablet').onclick=()=>editor.setDevice('Tablet');$('mobile').onclick=()=>editor.setDevice('Celular');
$('undo').onclick=()=>editor.UndoManager.undo();$('redo').onclick=()=>editor.UndoManager.redo();
let show=false;$('preview').onclick=()=>{show=!show;editor.runCommand(show?'core:preview':'core:stop-preview');$('preview').textContent=show?'Editar':'Prévia'};
$('export').onclick=exportHTML;
$('image').onclick=async()=>{
 $('modal').innerHTML='<div class="overlay"><div class="dialog"><h2>Biblioteca de imagens</h2><p>Envie uma imagem JPG, PNG, WEBP ou GIF de até 8 MB. As imagens publicadas nesta biblioteca ficam acessíveis por link público.</p><input id="assetFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif"><button id="assetUpload">Enviar imagem</button><p>Ou use o endereço de uma imagem:</p><input id="assetUrl" type="url" placeholder="https://..."><button id="assetLink">Inserir link</button><div id="assetStatus"></div><div id="assetList"></div><div class="row"><button id="assetClose">Fechar</button></div></div></div>';
 const insert=u=>{editor.addComponents('<img src="'+esc(u)+'" alt="Imagem" style="max-width:100%;height:auto">');$('modal').innerHTML=''};
 $('assetClose').onclick=()=>{$('modal').innerHTML=''};
 $('assetLink').onclick=()=>{const u=$('assetUrl').value.trim();if(!/^https:\/\//i.test(u)){alert('Use uma URL HTTPS.');return}insert(u)};
 const bucket=db.storage.from('assistti-site-assets');
 async function refresh(){const {data,error}=await bucket.list(siteId,{limit:30,sortBy:{column:'created_at',order:'desc'}});const area=$('assetList');if(!area)return;if(error){area.textContent='Não foi possível carregar a biblioteca.';return}area.innerHTML='<h3>Imagens já enviadas</h3>'+(data||[]).filter(f=>f.name!=='emptyFolderPlaceholder').map(f=>{const url=bucket.getPublicUrl(siteId+'/'+f.name).data.publicUrl;return '<button data-asset="'+esc(url)+'" style="margin:4px;padding:6px"><img src="'+esc(url)+'" alt="Imagem" style="width:70px;height:55px;object-fit:cover"></button>'}).join('');area.querySelectorAll('[data-asset]').forEach(b=>b.onclick=()=>insert(b.dataset.asset))}
 $('assetUpload').onclick=async()=>{const f=$('assetFile').files[0];if(!f)return;const allowed=['image/jpeg','image/png','image/webp','image/gif'];if(!allowed.includes(f.type)||f.size>8*1024*1024){$('assetStatus').textContent='Formato ou tamanho não permitido.';return}const ext=f.type.split('/')[1].replace('jpeg','jpg');const filepath=siteId+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,9)+'.'+ext;$('assetStatus').textContent='Enviando...';const {error}=await bucket.upload(filepath,f,{contentType:f.type,upsert:false});if(error){$('assetStatus').textContent='Falha no envio: '+error.message;return}$('assetStatus').textContent='Imagem enviada.';await refresh();insert(bucket.getPublicUrl(filepath).data.publicUrl)};
 refresh();
};
$('template').onclick=()=>{if(confirm('Substituir a página por uma estrutura nova? Salve a atual primeiro.'))editor.setComponents('<section style="padding:100px 30px;background:#161127;color:white;text-align:center"><h1 style="font-size:60px">Uma nova página</h1><p>Uma mensagem que merece destaque.</p><a href="#conteudo" style="color:#d9afff">Saiba mais</a></section><section id="conteudo" style="padding:80px 30px;text-align:center"><h2>Conteúdo</h2><p>Comece por aqui.</p></section>')};
$('import').onclick=()=>$('fileImport').click();
$('fileImport').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 if(!confirm('A importação substituirá o conteúdo atual do editor. Salve seu rascunho antes. Continuar?'))return;
 try{
  const result=await window.AssistAdvanced.importHtml(await file.text(),null);
  hideLive();editor.setComponents(result.html);editor.setStyle(result.css);
  const msg='Importação concluída. '+result.summary.scripts+' script(s) removido(s). '+result.summary.failed+' arquivo(s) CSS externo(s) não carregado(s). Revise animações, checkout e responsividade antes de publicar.';
  message('HTML importado',msg);
 }catch(error){message('Falha na importação',error.message)}
 e.target.value='';
};
$('githubImport').onclick=async()=>{
 if(!isAdministrator){message('Acesso restrito','Somente o administrador pode importar do GitHub.');return}
 const {data:record,error}=await db.from('sites').select('repository').eq('id',siteId).maybeSingle();
 if(error||!record?.repository){message('Repositório não configurado','Vincule o repositório no painel administrativo.');return}
 if(!confirm('Importar do GitHub substituirá a página no editor. Salve o rascunho antes. Continuar?'))return;
 try{
  $('saveState').textContent='Carregando página e estilos...';
  const base='https://raw.githubusercontent.com/'+record.repository+'/main/';
  const response=await fetch(base+'index.html',{cache:'no-store'});
  if(!response.ok)throw new Error('Não foi possível encontrar o index.html do repositório público.');
  const result=await window.AssistAdvanced.importHtml(await response.text(),base);
  hideLive();editor.setComponents(result.html);editor.setStyle(result.css);
  $('saveState').textContent='Importação concluída, não salva';
  const x=result.summary;
  message('Página importada para edição','Foram carregados '+x.linked+' arquivo(s) CSS e corrigidos '+x.relatives+' links relativos. '+x.scripts+' script(s) JavaScript foram removidos; '+x.failed+' CSS externo(s) não puderam ser lidos. Confira a página inteira, checkout e animações antes de salvar ou publicar.');
 }catch(error){message('Falha na importação',error.message)}
};
$('history').onclick=async()=>{const {data,error}=await db.from('site_revisions').select('id,label,created_at').eq('site_id',siteId).order('created_at',{ascending:false}).limit(20);if(error){message('Histórico',error.message);return}const options=(data||[]).map(r=>'<option value="'+esc(r.id)+'">'+esc(r.label)+' • '+new Date(r.created_at).toLocaleString('pt-BR')+'</option>').join('');$('modal').innerHTML='<div class="overlay"><div class="dialog"><h2>Versões salvas</h2><p>Selecione uma versão do site.</p><select id="revSelect">'+options+'</select><div class="row"><button id="revClose">Fechar</button><button id="revOpen">Abrir versão</button></div></div></div>';$('revClose').onclick=()=>{$('modal').innerHTML=''};$('revOpen').onclick=()=>{const r=$('revSelect').value;if(r)location.href='editor-pro.html?site='+encodeURIComponent(siteId)+'&revision='+encodeURIComponent(r)}};
let publishAccess=false;
async function publicationStatus(){
 try{
 const {data,error}=await db.functions.invoke('publish-site',{body:{action:'status',siteId}});
 if(error){$('publish').disabled=true;$('publish').title='Falha ao consultar o serviço de publicação';return}
 publishAccess=Boolean(data?.canPublish);
 $('publish').disabled=!publishAccess||!data?.configured;
 $('publish').title=!publishAccess?'Este usuário não tem permissão de publicação':!data?.configured?'Falta configurar o token do GitHub no Supabase':'Publicar a página salva no GitHub Pages';
 $('publish').textContent=data?.configured?'Publicar':'Publicar (configurar)';
 }catch(e){$('publish').disabled=true;$('publish').title='Integração indisponível'}
}
publicationStatus();
$('publish').onclick=async()=>{
 if(!publishAccess){message('Sem permissão','Seu usuário não tem permissão para publicar este site.');return}
 if(!$('publish').disabled){
 const approved=confirm('Publicar agora? A versão atual do site no GitHub será preservada em um backup. O conteúdo salvo no editor substituirá o index.html público. Se você importou uma página, confira as imagens, botões e funções que dependem de JavaScript antes de continuar.');
 if(!approved)return;
 $('publish').disabled=true;$('publish').textContent='Publicando...';
 try{
 if(dirty||!version){const saved=await save();if(!saved){await publicationStatus();return}}
 const {data,error}=await db.functions.invoke('publish-site',{body:{action:'publish',siteId}});
 if(error||!data?.ok){
 let code=data?.error;
 if(!code&&error?.context?.json){try{code=(await error.context.json()).error}catch{}}
 const messages={GITHUB_SECRET_MISSING:'O token de publicação ainda não foi configurado no Supabase.',GITHUB_PUBLISH_FAILED:'Não foi possível atualizar o GitHub. Confira a permissão do token e a proteção da branch.',NO_SAVED_DRAFT:'Salve um rascunho antes de publicar.',PUBLISH_NOT_ALLOWED:'Seu usuário não tem permissão para publicar este site.',REPOSITORY_NOT_CONFIGURED:'Configure o repositório do site no painel de administração.',PAGE_TOO_LARGE:'O HTML ficou grande demais para publicar automaticamente.'};
 message('Não foi possível publicar',messages[code]||'A publicação não foi concluída. Confira a integração e tente novamente.');
 }else{
 const backup=data.backupBranch||'';
 message('Publicação enviada ao GitHub','O site foi atualizado no repositório. O GitHub Pages deve publicar após concluir o processamento. Backup: '+backup);
 $('saveState').textContent='Commit: '+String(data.commit||'').slice(0,8);
 }
 }catch(e){message('Erro de publicação','Não foi possível contatar o serviço de publicação: '+e.message)}
 await publicationStatus();
 }
};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
}
async function boot(){
if(!siteId){location.replace('dashboard.html');return}
const {data:{user:u}}=await db.auth.getUser();if(!u){location.replace('login.html');return}user=u;
const {data:p}=await db.from('profiles').select('role').eq('id',u.id).maybeSingle();
const {data:s}=await db.from('sites').select('id,name,repository').eq('id',siteId).maybeSingle();
if(!p||!s){location.replace('dashboard.html');return}site=s;
isAdministrator=p.role==='admin';
$('githubImport').hidden=!isAdministrator;
$('editLive').hidden=!isAdministrator;
if(!isAdministrator){$('liveMessage').textContent='Esta é a visualização do site que está no ar. Para editar, utilize os elementos liberados no painel e salve seu rascunho.';}
if(p.role!=='admin'){const {data:a}=await db.from('site_access').select('can_edit').eq('user_id',u.id).eq('site_id',siteId).maybeSingle();if(!a?.can_edit){document.body.textContent='Você não tem permissão para editar este site.';return}}
$('siteTitle').textContent=site.name;
try{init();await load();bind();if(!hasDraft&&publishedUrl())showLive()}catch(e){message('Não foi possível carregar',e.message)}
}
boot();
})();