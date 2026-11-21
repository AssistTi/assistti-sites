(()=>{
"use strict";
window.AssistWorkspace={
 install(editor,opts={}){
  const $=id=>document.getElementById(id);
  const area=$("editorArea"),center=$("editorCenter"),sidebar=$("editorSidebar");
  if(!area||!center||!sidebar||$("workspaceToolbar"))return;
  const make=(id,txt,title,container)=>{
   const btn=document.createElement("button");btn.id=id;btn.type="button";btn.textContent=txt;btn.title=title;
   container.append(btn);return btn;
  };
  const controls=document.createElement("div");
  controls.id="workspaceToolbar";
  const toggle=make("workspaceToggle","Ocultar painel","Mostrar ou esconder a barra lateral",controls);
  const fit=make("workspaceFit","Ajustar","Ajustar visualização à largura",controls);
  const actual=make("workspaceActual","100%","Visualizar no tamanho original",controls);
  const full=make("workspaceFull","Tela cheia","Expandir a área de edição",controls);
  full.setAttribute("aria-pressed","false");
  const label=document.createElement("span");label.className="ws-text";label.textContent="Edição visual";controls.append(label);
  center.append(controls);
  const relayout=()=>{try{editor.refresh?.()}catch{}};
  let collapsed=false,fullscreen=false;
  function showSidebar(visible){
   collapsed=!visible;
   area.classList.toggle("ws-hide-left",collapsed);
   sidebar.style.display=collapsed?"none":"";
   toggle.textContent=collapsed?"Mostrar painel":"Ocultar painel";
   relayout();
   try{sessionStorage.setItem("assistti:panel",collapsed?"closed":"open")}catch{}
  }
  toggle.onclick=()=>showSidebar(collapsed);
  $("esSidebarHide")?.addEventListener("click",()=>showSidebar(false));
  $("esShowWidgets")?.addEventListener("click",()=>showSidebar(true));
  function fitWidth(){
   const device=editor.getDevice?.()||"Computador";
   const areaWidth=Math.max(280,center.clientWidth-24);
   const target=device==="Celular"?390:device==="Tablet"?768:areaWidth;
   const percent=Math.max(45,Math.min(100,Math.floor(areaWidth/target*100)));
   opts.updateZoom?.(percent);
   relayout();
  }
  fit.onclick=fitWidth;
  actual.onclick=()=>{opts.updateZoom?.(100);relayout()};
  function toggleFullscreen(){
   fullscreen=!fullscreen;
   area.classList.toggle("ws-fullscreen",fullscreen);
   full.setAttribute("aria-pressed",String(fullscreen));
   full.textContent=fullscreen?"Sair da tela cheia":"Tela cheia";
   if(fullscreen)showSidebar(false);
   else showSidebar(true);
   relayout();
  }
  full.onclick=toggleFullscreen;
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&fullscreen){e.preventDefault();toggleFullscreen()}});
  try{if(sessionStorage.getItem("assistti:panel")==="closed")showSidebar(false)}catch{}
  // Controles contextuais para os elementos realmente selecionados no GrapesJS.
  const ctx=document.createElement("div");ctx.id="esContext";
  const contextHolder=document.querySelector('[data-escontent="layout"]');
  contextHolder?.prepend(ctx);
  const styleCtx=document.createElement("div");styleCtx.id="esStyleQuick";
  document.querySelector('[data-escontent="style"]')?.prepend(styleCtx);
  const clean=s=>String(s??"");
  const toHtmlText=s=>clean(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const selected=()=>editor.getSelected?.();
  function typeOf(c){
   const tag=clean(c?.get?.("tagName")).toLowerCase();
   const type=clean(c?.get?.("type")).toLowerCase();
   if(tag==="img"||type==="image")return "image";
   if(tag==="a"||type==="link")return "button";
   if(/^h[1-6]$/.test(tag))return "title";
   if(["p","span","label","strong","em","blockquote"].includes(tag)||type==="text")return "text";
   return "container";
  }
  function attr(c,key){return clean(c?.getAttributes?.()?.[key]??c?.get?.(key)??"")}
  function content(c){
   if(!c)return "";
   // A leitura serve apenas para preencher o formulário, mantendo alterações até o usuário clicar em aplicar.
   const el=c.getEl?.();
   return clean(c.get?.("content")||el?.textContent||"").trim();
  }
  function note(parent,value){
   const el=document.createElement("p");el.className="es-note";el.textContent=value;parent.append(el);
  }
  function field(parent,name,initial,kind="input"){
   const label=document.createElement("label");label.textContent=name;parent.append(label);
   const input=document.createElement(kind==="textarea"?"textarea":"input");
   input.value=initial;parent.append(input);
   return input;
  }
  function applyText(c,value){
   // Texto simples: evita injetar HTML, mantendo edição intuitiva.
   const escaped=toHtmlText(value).replace(/\n/g,"<br>");
   c.components(escaped);
  }
  function buildContext(){
   const c=selected();
   ctx.replaceChildren();
   if(!c){const h=document.createElement("h3");h.textContent="Nenhum elemento selecionado";ctx.append(h);note(ctx,"Clique em um título, imagem, botão ou contêiner para ver as opções.");return}
   const type=typeOf(c),title=document.createElement("h3");
   title.textContent=type==="image"?"Editar imagem":type==="button"?"Editar botão":type==="title"?"Editar título":type==="text"?"Editar texto":"Editar contêiner";
   ctx.append(title);
   if(type==="image"){
    const src=field(ctx,"Endereço da imagem",attr(c,"src")),alt=field(ctx,"Texto alternativo",attr(c,"alt"));
    const apply=make("esApplyImage","Aplicar imagem","Salvar endereço e descrição",ctx);
    apply.onclick=()=>{if(!/^(https:\/\/|data:image\/)/i.test(src.value.trim()))return alert("Use um endereço HTTPS ou uma imagem válida.");c.addAttributes({src:src.value.trim(),alt:alt.value.trim()});c.set("src",src.value.trim())};
   }else if(type==="button"){
    const text=field(ctx,"Texto do botão",content(c),"textarea"),href=field(ctx,"Link do botão",attr(c,"href"));
    const apply=make("esApplyButton","Aplicar botão","Atualizar botão e endereço",ctx);
    apply.onclick=()=>{applyText(c,text.value);c.addAttributes({href:href.value.trim()||"#"})};
   }else if(type==="title"||type==="text"){
    const input=field(ctx,type==="title"?"Título":"Texto",content(c),"textarea");
    let tagSelect=null;
    if(type==="title"){
      const lab=document.createElement("label");lab.textContent="Tag HTML";ctx.append(lab);
      tagSelect=document.createElement("select");
      for(const tag of ["h1","h2","h3","h4","h5","h6"]){const option=document.createElement("option");option.value=tag;option.textContent=tag.toUpperCase();tagSelect.append(option)}
      tagSelect.value=clean(c.get("tagName")).toLowerCase();ctx.append(tagSelect);
    }
    const apply=make("esApplyText","Aplicar texto","Atualizar elemento selecionado",ctx);
    apply.onclick=()=>{applyText(c,input.value);if(tagSelect)c.set("tagName",tagSelect.value)};
   }else{
    const tag=clean(c.get("tagName")||"div").toUpperCase();
    note(ctx,"Tipo: "+tag+". Para organizar este contêiner, use a aba Estilo ou Ferramentas avançadas.");
    const label=document.createElement("label");label.textContent="Classe CSS adicional";ctx.append(label);
    const input=document.createElement("input");input.value=clean(c.getClasses?.()?.join(" ")||"");ctx.append(input);
    const apply=make("esApplyClasses","Aplicar classes","Aplicar nomes de classe CSS",ctx);
    apply.onclick=()=>{const classes=input.value.split(/\s+/).filter(x=>/^[A-Za-z_][\w-]*$/.test(x));c.setClass(classes)};
   }
   note(ctx,"Alterações aplicadas no editor. Use Salvar online para guardar o rascunho.");
  }
  function quickStyle(){
   styleCtx.replaceChildren();
   const c=selected();
   if(!c)return;
   const box=document.createElement("div");box.id="esContext";
   const title=document.createElement("h3");title.textContent="Estilo rápido";box.append(title);
   const font=field(box,"Tamanho do texto",clean(c.getStyle?.()?.["font-size"]||""));
   font.placeholder="Ex.: 22px";
   const color=field(box,"Cor do texto",clean(c.getStyle?.()?.color||""));
   color.placeholder="#ffffff";
   const background=field(box,"Fundo",clean(c.getStyle?.()?.["background-color"]||""));
   background.placeholder="#1a1a1a";
   const radius=field(box,"Arredondamento",clean(c.getStyle?.()?.["border-radius"]||""));
   radius.placeholder="12px";
   const btn=make("esApplyQuick","Aplicar estilo","Aplicar estilos ao elemento",box);
   btn.onclick=()=>{
     const props={};
     if(font.value.trim())props["font-size"]=font.value.trim();
     if(color.value.trim())props.color=color.value.trim();
     if(background.value.trim())props["background-color"]=background.value.trim();
     if(radius.value.trim())props["border-radius"]=radius.value.trim();
     c.addStyle(props);
   };
   note(box,"Outras opções estão logo abaixo nos controles de estilo.");
   styleCtx.append(box);
  }
  let timer;
  function refreshContext(){
   clearTimeout(timer);
   timer=setTimeout(()=>{if(document.activeElement?.closest?.("#esContext,#esStyleQuick"))return;buildContext();quickStyle()},80);
  }
  editor.on("component:selected",refreshContext);
  editor.on("component:deselected",refreshContext);
  editor.on("load",()=>{
    refreshContext();
    // Largura total no desktop e ajuste nos dispositivos menores.
    try{const current=editor.getDevice?.()||"Computador";if(current!=="Computador")fitWidth()}catch{}
    relayout();
  });
  editor.on("device:select",()=>{setTimeout(fitWidth,100)});
  window.addEventListener("resize",()=>{
    clearTimeout(timer);
    timer=setTimeout(relayout,130);
  });
  buildContext();
  quickStyle();
  // Nenhum dado é enviado nem publicado por estes controles.
 }
};
})();