(()=>{
"use strict";
window.AssistAIEditor={
 install(editor){
  if(document.getElementById("aiCommandBar"))return;
  const bar=document.querySelector(".subbar");
  const btn=document.createElement("button");
  btn.id="aiCommand";btn.textContent="✦ Ações rápidas";
  btn.title="Pesquisar ferramentas e ações (Ctrl + K)";
  bar?.append(btn);
  const modal=document.createElement("div");
  modal.id="aiCommandBar";
  modal.innerHTML='<div class="ai-command-modal" role="dialog" aria-modal="true" aria-label="Ações rápidas"><div class="ai-command-top"><span>✦</span><input id="aiCommandSearch" placeholder="O que você quer fazer na página?" autocomplete="off"><button id="aiCommandClose">ESC</button></div><div id="aiCommandList" class="ai-command-list"></div><div class="ai-command-hint">Pesquise ferramentas disponíveis. Este recurso organiza ações, não gera conteúdo por IA.</div></div>';
  document.body.append(modal);
  const input=document.getElementById("aiCommandSearch"),list=document.getElementById("aiCommandList");
  const options=[
   {name:"Adicionar título",desc:"Insere um título editável",tag:"Elemento",run:()=>editor.addComponents('<h2 style="font-size:40px">Novo título</h2>')},
   {name:"Adicionar texto",desc:"Insere um parágrafo",tag:"Elemento",run:()=>editor.addComponents('<p style="font-size:18px;line-height:1.7">Seu texto aqui</p>')},
   {name:"Adicionar botão",desc:"Botão com link personalizável",tag:"Elemento",run:()=>editor.addComponents('<a href="#" style="display:inline-block;background:#8052ed;padding:15px 25px;color:white;border-radius:10px">Clique aqui</a>')},
   {name:"Adicionar seção",desc:"Nova área de conteúdo",tag:"Layout",run:()=>editor.addComponents('<section style="padding:70px 25px"><h2>Nova seção</h2><p>Seu conteúdo aqui.</p></section>')},
   {name:"Abrir widgets",desc:"Mostra a biblioteca de elementos",tag:"Painel",run:()=>document.getElementById("esShowWidgets")?.click()},
   {name:"Abrir estrutura",desc:"Mostra as camadas da página",tag:"Painel",run:()=>document.getElementById("esShowLayers")?.click()},
   {name:"Ferramentas avançadas",desc:"Camadas, layout e efeitos",tag:"Painel",run:()=>document.getElementById("assistAdvancedOpen")?.click()},
   {name:"Pré-visualizar",desc:"Alterna a prévia do rascunho",tag:"Visualizar",run:()=>document.getElementById("preview")?.click()},
   {name:"Ver site publicado",desc:"Abre a versão online existente",tag:"Visualizar",run:()=>document.getElementById("livePreview")?.click()},
   {name:"Modo computador",desc:"Muda para desktop",tag:"Dispositivos",run:()=>document.getElementById("desktop")?.click()},
   {name:"Modo tablet",desc:"Muda para tablet",tag:"Dispositivos",run:()=>document.getElementById("tablet")?.click()},
   {name:"Modo celular",desc:"Muda para smartphone",tag:"Dispositivos",run:()=>document.getElementById("mobile")?.click()},
   {name:"Ajustar à largura",desc:"Aproveita a área disponível",tag:"Visualizar",run:()=>document.getElementById("workspaceFit")?.click()},
   {name:"Tela cheia",desc:"Expande a área de criação",tag:"Visualizar",run:()=>document.getElementById("workspaceFull")?.click()},
   {name:"Salvar rascunho",desc:"Guarda seu trabalho no Supabase",tag:"Salvar",run:()=>document.getElementById("save")?.click()},
   {name:"Histórico de versões",desc:"Abre rascunhos anteriores",tag:"Salvar",run:()=>document.getElementById("history")?.click()},
   {name:"Biblioteca de imagens",desc:"Adiciona imagem por URL ou upload",tag:"Mídia",run:()=>document.getElementById("image")?.click()}
  ];
  let visible=[];
  function esc(text){return String(text).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function render(){
   const q=input.value.toLowerCase().trim();
   visible=options.filter(x=>!q||(x.name+" "+x.desc+" "+x.tag).toLowerCase().includes(q));
   list.innerHTML=visible.length?visible.map((x,i)=>'<button class="ai-command-item" data-command="'+i+'"><span><strong>'+esc(x.name)+'</strong><small>'+esc(x.desc)+'</small></span><span class="ai-command-tag">'+esc(x.tag)+'</span></button>').join(''):'<p style="padding:15px;color:#9eb0d1">Nenhuma ação encontrada.</p>';
   list.querySelectorAll("[data-command]").forEach(b=>b.onclick=()=>invoke(Number(b.dataset.command)));
  }
  function invoke(i){const action=visible[i];close();if(action)action.run()}
  function open(){modal.classList.add("open");input.value="";render();input.focus()}
  function close(){modal.classList.remove("open");btn.focus()}
  btn.onclick=open;
  document.getElementById("aiCommandClose").onclick=close;
  modal.addEventListener("click",e=>{if(e.target===modal)close()});
  input.addEventListener("input",render);
  input.addEventListener("keydown",e=>{if(e.key==="Enter"&&visible.length){e.preventDefault();invoke(0)}});
  document.addEventListener("keydown",e=>{
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();modal.classList.contains("open")?close():open()}
   else if(e.key==="Escape"&&modal.classList.contains("open")){e.preventDefault();close()}
  });
 }
};
})();