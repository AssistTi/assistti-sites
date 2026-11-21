(()=>{
"use strict";
window.AssistElementorShell={
 install(editor){
  const $=id=>document.getElementById(id);
  if(!$("editorSidebar"))return;
  let current="widgets";
  const tabs=[...document.querySelectorAll("[data-estab]")];
  function openTab(name){
   current=name;
   tabs.forEach(el=>el.classList.toggle("on",el.dataset.estab===name));
   document.querySelectorAll("[data-escontent]").forEach(el=>el.classList.toggle("on",el.dataset.escontent===name));
   const selected=editor.getSelected();
   $("esPanelTitle").textContent=name==="widgets"?"Elementos":name==="advanced"?"Avançado":selected?.getName?.()||"Editar elemento";
   if(name==="layout")$("esNoSelection").style.display=selected?"none":"block";
   $("editorArea").classList.remove("mobile-sidebar-hidden");
  }
  tabs.forEach(el=>el.addEventListener("click",()=>openTab(el.dataset.estab)));
  $("esShowWidgets").onclick=()=>openTab("widgets");
  $("esShowLayers").onclick=()=>toggleLayers();
  $("esSidebarHide").onclick=()=>{
    const sidebar=$("editorSidebar"),hidden=sidebar.style.display==="none";
    sidebar.style.display=hidden?"":"none";
    $("esShowWidgets").textContent=hidden?"+ Elementos":"Mostrar elementos";
    editor.refresh?.();
  };
  $("esAdvanced").onclick=()=>document.getElementById("assistAdvancedOpen")?.click();
  $("esStructureClose").onclick=()=>toggleLayers(false);
  function toggleLayers(on){
   const visible=typeof on==="boolean"?on:!$("esStructure").classList.contains("on");
   $("esStructure").classList.toggle("on",visible);
  }
  editor.on("component:selected",()=>{
   if(current==="widgets"||current==="advanced")openTab("layout");
   else openTab(current);
  });
  editor.on("component:deselected",()=>{if(current==="layout")openTab("layout")});
  const search=$("esSearch");
  function applySearch(){
   const q=search.value.trim().toLowerCase();
   let count=0;
   $("elementorWidgets").querySelectorAll(".gjs-block").forEach(el=>{
    const label=(el.textContent||"").trim().toLowerCase();
    const show=!q||label.includes(q);
    el.style.display=show?"":"none";
    if(show)count++;
   });
   $("elementorWidgets").querySelectorAll(".gjs-block-category").forEach(category=>{
    const any=[...category.querySelectorAll(".gjs-block")].some(b=>b.style.display!=="none");
    category.style.display=any?"":"none";
   });
   $("esBlockEmpty").style.display=count?"none":"block";
  }
  search.addEventListener("input",applySearch);
  editor.on("block:add",applySearch);
  // Os painéis de GrapesJS usam containers fixos, como acontece em editores profissionais.
  const header=document.querySelector("#editorSidebar .es-head");
  header?.addEventListener("dblclick",()=>openTab("widgets"));
  editor.on("load",()=>{openTab("widgets");applySearch();editor.refresh?.()});
  openTab("widgets");
 }
};
})();