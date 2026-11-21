(()=>{
"use strict";
const safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
window.AssistAdvanced={
install(editor){
 if(document.getElementById("assistTools"))return;
 const style=document.createElement("style");
 style.textContent=[
 "#assistTools{position:absolute;right:0;top:0;bottom:0;z-index:12;display:none;flex-direction:column;width:min(340px,90vw);background:#172238;border-left:1px solid #456080;box-shadow:-10px 0 36px #070b1899;color:#e9f2ff}",
 "#assistTools.on{display:flex}#assistTools .head{display:flex;justify-content:space-between;align-items:center;padding:14px;border-bottom:1px solid #405273}",
 "#assistTools .tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:10px}",
 "#assistTools .area{min-height:0;overflow-y:auto;flex:1;padding:10px 13px}",
 "#assistTools button{border:1px solid #405574;background:#263954;color:#f1f5ff;padding:8px;border-radius:7px;font:650 12px system-ui;cursor:pointer}",
 "#assistTools button.selected{background:#586de2}#assistTools button:hover{filter:brightness(1.13)}",
 "#assistTools .layer{display:flex;gap:5px;align-items:center;padding:5px 4px;cursor:pointer;border-radius:7px;border:1px solid transparent;font-size:12px}",
 "#assistTools .layer:hover{background:#2b405c}#assistTools .layer.active{background:#2b3f67;border-color:#7189e8}",
 "#assistTools .layer .name{flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}",
 "#assistTools .layer button{padding:4px 7px}",
 "#assistTools label{display:block;font:650 11px system-ui;color:#b9cdec;margin:12px 0 6px}",
 "#assistTools input,#assistTools select{width:100%;min-width:0;border-radius:8px;border:1px solid #405575;background:#0e192b;color:white;padding:9px;font:12px system-ui}",
 "#assistTools .two{display:grid;grid-template-columns:1fr 1fr;gap:9px}",
 "#assistTools .actions{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}",
 "#assistTools .hint{font:11px/1.55 system-ui;color:#a8bad7;margin:12px 0}",
 "#assistAdvancedOpen{background:#344772;border:1px solid #7189c2;font-weight:750}",
 "#assistAdvancedOpen.selected{background:#5267e9}"
 ].join("\n");
 document.head.appendChild(style);
 let tab="layers",open=false;
 const panel=document.createElement("aside");panel.id="assistTools";
 panel.innerHTML='<div class="head"><strong>Ferramentas avançadas</strong><button id="assistToolsClose">Fechar</button></div><div class="tabs"><button data-at="layers">Camadas</button><button data-at="layout">Layout</button><button data-at="effects">Efeitos</button></div><div class="area" id="assistToolsBody"></div>';
 document.getElementById("editorArea").append(panel);
 const trigger=document.createElement("button");trigger.id="assistAdvancedOpen";trigger.textContent="Ferramentas avançadas";document.querySelector(".subbar").append(trigger);
 const body=()=>document.getElementById("assistToolsBody");
 const select=()=>editor.getSelected();
 const name=c=>String(c?.getName?.()||c?.get("tagName")||"Elemento").slice(0,60);
 function show(value){open=value;panel.classList.toggle("on",value);trigger.classList.toggle("selected",value);if(value)render()}
 trigger.onclick=()=>show(!open);
 document.getElementById("assistToolsClose").onclick=()=>show(false);
 panel.querySelectorAll("[data-at]").forEach(x=>x.onclick=()=>{tab=x.dataset.at;render()});
 function applyStyle(styles){
  const c=select();if(!c)return alert("Selecione um elemento para ajustar.");
  const d=editor.getDevice()||"Computador";
  if(d==="Computador"){c.addStyle(styles);return}
  let id=String(c.getAttributes()?.id||"");
  if(!/^[A-Za-z][\w-]*$/.test(id)){id="assist-"+Math.random().toString(36).slice(2,12);c.addAttributes({id})}
  const media=d==="Celular"?"(max-width: 480px)":"(min-width: 481px) and (max-width: 992px)";
  editor.Css.setRule("#"+id,styles,{atRuleType:"media",atRuleParams:media,addStyles:true});
 }
 function layers(){
  const all=[];function walk(c,depth){if(all.length>450)return;if(c!==editor.getWrapper())all.push({c,depth});for(const child of c.components?.().models||[])walk(child,depth+1)}
  walk(editor.getWrapper(),-1);
  body().innerHTML='<p class="hint">Selecione um elemento ou altere sua ordem. Arraste uma camada para dentro de outra.</p><div class="actions"><button id="asDuplicate">Duplicar</button><button id="asDelete">Excluir</button><button id="asParent">Selecionar pai</button></div>'+all.map((v,i)=>'<div class="layer '+(v.c===select()?"active":"")+'" draggable="true" data-id="'+i+'" style="padding-left:'+Math.min(v.depth*12+7,80)+'px"><span>⋮</span><span class="name">'+safe(name(v.c))+'</span><button data-up="'+i+'">↑</button><button data-down="'+i+'">↓</button></div>').join("");
  body().querySelector("#asDuplicate").onclick=()=>{const c=select(),p=c?.parent?.();if(!p)return;const i=p.components().indexOf(c),clone=c.clone();p.append(clone,{at:i+1});editor.select(clone);layers()};
  body().querySelector("#asDelete").onclick=()=>{const c=select();if(c?.parent?.()&&confirm("Excluir este elemento?")){c.remove();layers()}};
  body().querySelector("#asParent").onclick=()=>{const p=select()?.parent?.();if(p&&p!==editor.getWrapper()){editor.select(p);layers()}};
  body().querySelectorAll(".layer").forEach(el=>{
   const c=all[Number(el.dataset.id)]?.c;
   el.addEventListener("click",e=>{if(e.target.closest("button"))return;editor.select(c);layers()});
   el.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/plain",el.dataset.id);e.dataTransfer.effectAllowed="move"});
   el.addEventListener("dragover",e=>e.preventDefault());
   el.addEventListener("drop",e=>{e.preventDefault();const from=all[Number(e.dataTransfer.getData("text/plain"))]?.c;if(!from||from===c)return;let par=c;while(par){if(par===from)return;par=par.parent?.()}try{from.move(c,{at:c.components().length});editor.select(from);layers()}catch{}});
  });
  body().querySelectorAll("[data-up],[data-down]").forEach(btn=>btn.onclick=e=>{
   e.stopPropagation();const idx=Number(btn.dataset.up??btn.dataset.down),c=all[idx]?.c,p=c?.parent?.();if(!p)return;const next=p.components().indexOf(c)+(btn.hasAttribute("data-up")?-1:1);if(next>=0&&next<p.components().length){c.move(p,{at:next});editor.select(c);layers()}
  });
 }
 function layout(){
  body().innerHTML='<p class="hint">Selecionado: <b>'+safe(name(select()))+'</b>. Dispositivo: <b>'+safe(editor.getDevice()||"Computador")+'</b>.</p>'+
   '<div class="two"><div><label>Largura</label><input data-prop="width" placeholder="100%"></div><div><label>Altura mínima</label><input data-prop="min-height" placeholder="300px"></div><div><label>Margem</label><input data-prop="margin" placeholder="0 auto"></div><div><label>Padding</label><input data-prop="padding" placeholder="25px"></div><div><label>Espaçamento</label><input data-prop="gap" placeholder="15px"></div><div><label>Arredondamento</label><input data-prop="border-radius" placeholder="12px"></div></div>'+
   '<div class="two"><div><label>Tipo de layout</label><select data-prop="display"><option value="">Manter</option><option value="block">Bloco</option><option value="flex">Flex</option><option value="grid">Grade</option><option value="none">Ocultar</option></select></div><div><label>Direção</label><select data-prop="flex-direction"><option value="">Manter</option><option value="column">Coluna</option><option value="row">Linha</option></select></div><div><label>Alinhamento horizontal</label><select data-prop="justify-content"><option value="">Manter</option><option value="center">Centro</option><option value="space-between">Espaçado</option><option value="flex-start">Início</option></select></div><div><label>Alinhamento vertical</label><select data-prop="align-items"><option value="">Manter</option><option value="center">Centro</option><option value="flex-start">Início</option></select></div></div>'+
   '<div class="actions"><button id="asApply">Aplicar layout</button><button id="asCenter">Centralizar</button><button id="asWidth">Largura total</button></div><p class="hint">As alterações em Tablet e Celular criam regras CSS específicas desses tamanhos de tela.</p>';
  body().querySelector("#asApply").onclick=()=>{const o={};body().querySelectorAll("[data-prop]").forEach(el=>{if(el.value.trim())o[el.dataset.prop]=el.value.trim()});if(Object.keys(o).length)applyStyle(o)};
  body().querySelector("#asCenter").onclick=()=>applyStyle({margin:"0 auto","text-align":"center"});
  body().querySelector("#asWidth").onclick=()=>applyStyle({width:"100%","max-width":"100%"});
 }
 const effectCSS=[
 "@keyframes assistFadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}",
 "@keyframes assistFade{from{opacity:0}to{opacity:1}}",
 "@keyframes assistZoom{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}",
 ".assist-fadeup{animation:assistFadeUp .8s ease-out both}",
 ".assist-fade{animation:assistFade .8s ease-out both}",
 ".assist-zoom{animation:assistZoom .8s ease-out both}",
 ".assist-lift{transition:transform .4s ease}.assist-lift:hover{transform:translateY(-6px)}",
 ".assist-scale{transition:transform .4s ease}.assist-scale:hover{transform:scale(1.035)}",
 "@media(prefers-reduced-motion:reduce){.assist-fadeup,.assist-fade,.assist-zoom{animation:none!important}.assist-lift,.assist-scale{transition:none!important}}"
 ].join("\n");
 const effectsList=["assist-fadeup","assist-fade","assist-zoom","assist-lift","assist-scale"];
 function effects(){
  const c=select(),classes=c?.getClasses?.()||[];
  body().innerHTML='<p class="hint">Animações CSS suaves para o elemento selecionado.</p><label>Entrada</label><select id="asEntry"><option value="">Sem animação</option><option value="assist-fadeup">Subir suavemente</option><option value="assist-fade">Aparecer suavemente</option><option value="assist-zoom">Zoom suave</option></select><label>Ao passar o mouse</label><select id="asHover"><option value="">Sem efeito</option><option value="assist-lift">Levantar</option><option value="assist-scale">Aproximar</option></select><div class="actions"><button id="asEffects">Aplicar efeitos</button><button id="asClear">Remover efeitos</button></div>';
  body().querySelector("#asEntry").value=classes.find(x=>["assist-fadeup","assist-fade","assist-zoom"].includes(x))||"";
  body().querySelector("#asHover").value=classes.find(x=>["assist-lift","assist-scale"].includes(x))||"";
  const change=clear=>{
   const comp=select();if(!comp)return alert("Selecione um elemento.");
   if(!editor.Css.getRule(".assist-fadeup"))editor.Css.addRules(effectCSS);
   const entry=body().querySelector("#asEntry").value,hover=body().querySelector("#asHover").value;
   effectsList.forEach(cls=>comp.removeClass(cls));
   if(!clear){if(entry)comp.addClass(entry);if(hover)comp.addClass(hover)}
   effects();
  };
  body().querySelector("#asEffects").onclick=()=>change(false);
  body().querySelector("#asClear").onclick=()=>change(true);
 }
 function render(){panel.querySelectorAll("[data-at]").forEach(b=>b.classList.toggle("selected",b.dataset.at===tab));if(tab==="layers")layers();else if(tab==="layout")layout();else effects()}
 let timeout;const refresh=()=>{if(!open)return;clearTimeout(timeout);timeout=setTimeout(render,120)};
 editor.on("component:selected",refresh);editor.on("component:add",refresh);editor.on("component:remove",refresh);editor.on("device:select",refresh);
},
async importHtml(html,baseURL){
 const parsed=new DOMParser().parseFromString(html,"text/html");
 const scripts=parsed.querySelectorAll("script").length;
 parsed.querySelectorAll("script,base").forEach(x=>x.remove());
 let relatives=0;
 if(baseURL)for(const el of parsed.querySelectorAll("[src],[href],[poster]"))for(const prop of ["src","href","poster"]){
  const value=el.getAttribute(prop);
  if(!value||/^(?:https?:|data:|blob:|mailto:|tel:|#|javascript:)/i.test(value))continue;
  try{el.setAttribute(prop,new URL(value,baseURL).href);relatives++}catch{}
 }
 function absolutizeCssUrls(source,sourceBase){
  if(!sourceBase)return source;
  return source.replace(/url\(\s*(["']?)([^)"']+)\1\s*\)/gi,(match,quote,path)=>{
    const value=path.trim();
    if(/^(?:data:|https?:|blob:|#|\/\/)/i.test(value))return match;
    try{return "url("+quote+new URL(value,sourceBase).href+quote+")"}catch{return match}
  });
 }
 let css=[...parsed.querySelectorAll("style")].map(x=>absolutizeCssUrls(x.textContent||"",baseURL)).join("\n"),linked=0,failed=0;
 for(const link of [...parsed.querySelectorAll('link[rel~="stylesheet"]')].slice(0,10)){
  const href=link.getAttribute("href");if(!href)continue;
  try{
   const target=baseURL?new URL(href,baseURL).href:href;
   if(!/^https:\/\//i.test(target))continue;
   const response=await fetch(target,{mode:"cors"});if(!response.ok)throw new Error("Cannot fetch");
   css+="\n"+absolutizeCssUrls(await response.text(),target);linked++;
  }catch{failed++}
 }
 return {html:parsed.body.innerHTML,css,summary:{scripts,relatives,linked,failed}};
}
};
})();