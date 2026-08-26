const STORAGE_KEY = "tirelireDataV11";

const DEFAULT_FIXED_CATEGORIES = [
  {id:"voiture", name:"Voiture", emoji:"🚗"},
  {id:"logement", name:"Logement", emoji:"🏠"},
  {id:"medias", name:"Médias", emoji:"📺"},
  {id:"assurances", name:"Assurances", emoji:"🛡️"},
  {id:"abonnements", name:"Abonnements", emoji:"🔁"},
  {id:"telephone", name:"Téléphone / Internet", emoji:"📱"},
  {id:"paiement-plusieurs-fois", name:"Paiement en plusieurs fois", emoji:"💳"},
  {id:"autres-fixes", name:"Autres", emoji:"📦"}
];

const DEFAULT_CATEGORIES = [
  {id:"courses", name:"Courses", emoji:"🛒"},
  {id:"restaurant", name:"Restaurants", emoji:"🍔"},
  {id:"transport", name:"Transport", emoji:"🚗"},
  {id:"shopping", name:"Shopping", emoji:"🛍️"},
  {id:"loisirs", name:"Loisirs", emoji:"🎬"},
  {id:"maison", name:"Maison", emoji:"🏠"},
  {id:"chats", name:"Chats", emoji:"🐱"},
  {id:"voyages", name:"Voyages", emoji:"✈️"},
  {id:"sante", name:"Santé", emoji:"💊"},
  {id:"cadeaux", name:"Cadeaux", emoji:"🎁"},
  {id:"autres", name:"Autres", emoji:"📦"}
];

function todayISO(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function monthKey(date = new Date()){
  const d = typeof date === "string" ? new Date(date+"T12:00:00") : date;
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}
function defaultState(){
  return {
    settings:{income:0,payDay:1},
    categories:DEFAULT_CATEGORIES,
    fixedCategories:DEFAULT_FIXED_CATEGORIES,
    fixedCharges:[],
    expenses:[],
    savings:[],
    goals:[]
  };
}
function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(!saved) return defaultState();
    return {
      ...defaultState(),
      ...saved,
      categories:saved.categories?.length?saved.categories:DEFAULT_CATEGORIES,
      fixedCategories:saved.fixedCategories?.length?saved.fixedCategories:DEFAULT_FIXED_CATEGORIES,
      fixedCharges:saved.fixedCharges||[]
    };
  }catch(e){ return defaultState(); }
}
let state = loadState();

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}

const euro = new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"});
function fmt(v){ return euro.format(Number(v)||0); }
function uid(){ return `${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }

function openDialog(dialog){
  if(!dialog) return;
  try{
    if(typeof dialog.showModal==="function"){
      dialog.showModal();
    }else{
      dialog.setAttribute("open","");
      dialog.classList.add("fallback-open");
      document.body.classList.add("modal-open");
    }
  }catch(e){
    dialog.setAttribute("open","");
    dialog.classList.add("fallback-open");
    document.body.classList.add("modal-open");
  }
}
function closeDialog(dialog){
  if(!dialog) return;
  try{
    if(typeof dialog.close==="function") dialog.close();
    else dialog.removeAttribute("open");
  }catch(e){
    dialog.removeAttribute("open");
  }
  dialog.classList.remove("fallback-open");
  document.body.classList.remove("modal-open");
}



function fixedCategoryInfo(id){
  return state.fixedCategories.find(c=>c.id===id) || {name:"Autres",emoji:"📦"};
}
function activeFixedCharges(){
  return state.fixedCharges.filter(x=>!x.archived);
}
function fixedTotal(){
  return activeFixedCharges().reduce((s,x)=>s+Number(x.amount||0),0);
}
function maybeArchiveFinishedInstallments(){
  let changed=false;
  state.fixedCharges.forEach(x=>{
    if(x.category==="paiement-plusieurs-fois" && x.autoEnd && Number(x.installmentCount)>0 && Number(x.installmentCurrent)>=Number(x.installmentCount) && !x.archived){
      x.archived=true; changed=true;
    }
  });
  if(changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentMonthExpenses(){
  const key = monthKey();
  return state.expenses.filter(x => monthKey(x.date) === key);
}
function currentMonthSavings(){
  const key = monthKey();
  return state.savings.filter(x => monthKey(x.date) === key);
}
function totalsForMonth(key){
  const expenses = state.expenses.filter(x => monthKey(x.date)===key).reduce((s,x)=>s+Number(x.amount),0);
  const savings = state.savings.filter(x => monthKey(x.date)===key).reduce((s,x)=>s+Number(x.amount),0);
  const income = key===monthKey() ? Number(state.settings.income)||0 : 0;
  const fixed = key===monthKey() ? fixedTotal() : 0;
  return {income,fixed,expenses,savings,remaining:income-fixed-expenses-savings};
}

function categoryInfo(id){
  return state.categories.find(c=>c.id===id) || {name:"Autres",emoji:"📦"};
}

function setMonthTitle(){
  const label = new Intl.DateTimeFormat("fr-FR",{month:"long",year:"numeric"}).format(new Date());
  document.getElementById("monthTitle").textContent = label.charAt(0).toUpperCase()+label.slice(1);
}

function renderHome(){
  const exps = currentMonthExpenses();
  const savs = currentMonthSavings();
  const expenseTotal = exps.reduce((s,x)=>s+Number(x.amount),0);
  const savingTotal = savs.reduce((s,x)=>s+Number(x.amount),0);
  const income = Number(state.settings.income)||0;
  const fixed = fixedTotal();
  const remaining = income-fixed-expenseTotal-savingTotal;

  document.getElementById("remainingValue").textContent = fmt(remaining);
  document.getElementById("incomeValue").textContent = fmt(income);
  document.getElementById("fixedValue").textContent = fmt(fixed);
  document.getElementById("expenseValue").textContent = fmt(expenseTotal);
  document.getElementById("savingValue").textContent = fmt(savingTotal);
  document.getElementById("spentSummary").textContent = `${fmt(fixed+expenseTotal+savingTotal)} utilisés`;
  document.getElementById("incomeSummary").textContent = `${fmt(income)} de revenus`;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  const daysLeft = Math.max(1,daysInMonth-now.getDate()+1);
  document.getElementById("dailyBudget").textContent = `${fmt(Math.max(0,remaining)/daysLeft)} / jour`;

  const used = fixed+expenseTotal+savingTotal;
  const pct = income>0 ? Math.min(100,Math.max(0,(used/income)*100)) : 0;
  document.getElementById("monthProgress").style.width = `${pct}%`;

  const byCat = {};
  exps.forEach(x=>byCat[x.category]=(byCat[x.category]||0)+Number(x.amount));
  const sorted = Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const preview = document.getElementById("categoryPreview");
  if(!sorted.length){
    preview.className="category-list empty-state";
    preview.textContent="Ajoute une première dépense pour voir la répartition.";
  }else{
    preview.className="category-list";
    const max = sorted[0][1]||1;
    preview.innerHTML = sorted.map(([id,val])=>{
      const c=categoryInfo(id);
      return `<div class="category-row">
        <div class="emoji">${c.emoji}</div>
        <div class="row-main"><strong>${c.name}</strong><div class="bar-wrap"><div class="bar" style="width:${Math.max(6,(val/max)*100)}%"></div></div></div>
        <div class="row-value">${fmt(val)}</div>
      </div>`;
    }).join("");
  }

  const tx = [
    ...exps.map(x=>({...x,type:"expense"})),
    ...savs.map(x=>({...x,type:"saving",label:"Épargne"}))
  ].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  const recent = document.getElementById("recentTransactions");
  if(!tx.length){
    recent.className="transaction-list empty-state";
    recent.textContent="Aucune opération pour le moment.";
  }else{
    recent.className="transaction-list";
    recent.innerHTML=tx.map(x=>transactionHTML(x,false)).join("");
  }
}

function transactionHTML(x,clickable=true){
  const isSaving=x.type==="saving";
  const c=isSaving?{emoji:"💚",name:"Épargne"}:categoryInfo(x.category);
  const label=x.label || c.name;
  const date=new Intl.DateTimeFormat("fr-FR",{day:"2-digit",month:"short"}).format(new Date(x.date+"T12:00:00"));
  return `<div class="transaction-row ${clickable&&!isSaving?"clickable":""}" ${clickable&&!isSaving?`data-expense-id="${x.id}"`:""}>
    <div class="emoji">${c.emoji}</div>
    <div class="row-main"><strong>${escapeHtml(label)}</strong><small>${c.name} • ${date}</small></div>
    <div class="row-value ${isSaving?"positive":""}">${isSaving?"+ ":"- "}${fmt(x.amount)}</div>
  </div>`;
}
function escapeHtml(s=""){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

function renderExpenses(){
  const select=document.getElementById("filterCategory");
  const current=select.value;
  select.innerHTML=`<option value="">Toutes les catégories</option>`+state.categories.map(c=>`<option value="${c.id}">${c.emoji} ${c.name}</option>`).join("");
  select.value=current;
  filterExpenseList();
}

function filterExpenseList(){
  const q=(document.getElementById("searchExpense").value||"").toLowerCase();
  const cat=document.getElementById("filterCategory").value;
  const list=currentMonthExpenses()
    .filter(x=>(!cat||x.category===cat) && (!q||(x.label||"").toLowerCase().includes(q)||categoryInfo(x.category).name.toLowerCase().includes(q)))
    .sort((a,b)=>b.date.localeCompare(a.date));
  const el=document.getElementById("expenseList");
  if(!list.length){el.className="transaction-list empty-state";el.textContent="Aucune dépense enregistrée.";return;}
  el.className="transaction-list";
  el.innerHTML=list.map(x=>transactionHTML({...x,type:"expense"},true)).join("");
  el.querySelectorAll("[data-expense-id]").forEach(row=>row.addEventListener("click",()=>openExpense(row.dataset.expenseId)));
}


function renderFixedCategorySelects(){
  const options=state.fixedCategories.map(c=>`<option value="${c.id}">${c.emoji} ${c.name}</option>`).join("");
  document.getElementById("fixedCategory").innerHTML=options;
  const filter=document.getElementById("filterFixedCategory");
  const current=filter.value;
  filter.innerHTML=`<option value="">Toutes les catégories</option>`+options;
  filter.value=current;
}

function fixedChargeHTML(x){
  const c=fixedCategoryInfo(x.category);
  const installment=x.category==="paiement-plusieurs-fois" && x.installmentCount
    ? `<span class="installment-note">Échéance ${Number(x.installmentCurrent)||1}/${Number(x.installmentCount)}</span>`
    : "";
  const comment=x.comment?`<small class="comment-note">${escapeHtml(x.comment)}</small>`:"";
  return `<div class="transaction-row clickable" data-fixed-id="${x.id}">
    <div class="emoji">${c.emoji}</div>
    <div class="row-main"><strong>${escapeHtml(x.label)}</strong><small>${c.name}</small>${installment}${comment}</div>
    <div class="row-value">- ${fmt(x.amount)}</div>
  </div>`;
}

function renderFixed(){
  renderFixedCategorySelects();
  const total=fixedTotal();
  const subs=activeFixedCharges().filter(x=>["medias","abonnements","telephone"].includes(x.category)).reduce((s,x)=>s+Number(x.amount),0);
  const inst=activeFixedCharges().filter(x=>x.category==="paiement-plusieurs-fois").reduce((s,x)=>s+Number(x.amount),0);
  document.getElementById("fixedMonthlyTotal").textContent=fmt(total);
  document.getElementById("fixedSubscriptionsTotal").textContent=fmt(subs);
  document.getElementById("installmentsTotal").textContent=fmt(inst);
  filterFixedList();
}
function filterFixedList(){
  const q=(document.getElementById("searchFixed").value||"").toLowerCase();
  const cat=document.getElementById("filterFixedCategory").value;
  const list=activeFixedCharges()
    .filter(x=>(!cat||x.category===cat) && (!q||(x.label||"").toLowerCase().includes(q)||(x.comment||"").toLowerCase().includes(q)||fixedCategoryInfo(x.category).name.toLowerCase().includes(q)))
    .sort((a,b)=>fixedCategoryInfo(a.category).name.localeCompare(fixedCategoryInfo(b.category).name)||a.label.localeCompare(b.label));
  const el=document.getElementById("fixedList");
  if(!list.length){el.className="transaction-list empty-state";el.textContent="Aucune charge fixe enregistrée.";return;}
  el.className="transaction-list";
  el.innerHTML=list.map(fixedChargeHTML).join("");
  el.querySelectorAll("[data-fixed-id]").forEach(row=>row.addEventListener("click",()=>openFixed(row.dataset.fixedId)));
}

function renderAnalysis(){
  const exps=currentMonthExpenses();
  const t=totalsForMonth(monthKey());
  document.getElementById("analysisIncome").textContent=fmt(t.income);
  document.getElementById("analysisFixed").textContent=fmt(t.fixed);
  document.getElementById("analysisExpenses").textContent=fmt(t.expenses);
  document.getElementById("analysisSavings").textContent=fmt(t.savings);
  document.getElementById("analysisRemaining").textContent=fmt(t.remaining);

  const byCat={}; exps.forEach(x=>byCat[x.category]=(byCat[x.category]||0)+Number(x.amount));
  const sorted=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  const total=t.expenses||1;
  const el=document.getElementById("analysisCategories");
  if(!sorted.length){el.className="analysis-list empty-state";el.textContent="Pas encore assez de données.";}
  else{
    el.className="analysis-list";
    el.innerHTML=sorted.map(([id,val])=>{
      const c=categoryInfo(id); const pct=(val/total)*100;
      return `<div class="analysis-row">
        <div class="emoji">${c.emoji}</div>
        <div class="row-main"><strong>${c.name}</strong><small>${pct.toFixed(0)} % des dépenses</small><div class="bar-wrap"><div class="bar" style="width:${pct}%"></div></div></div>
        <div class="row-value">${fmt(val)}</div>
      </div>`;
    }).join("");
  }

  const keys=[...new Set([...state.expenses.map(x=>monthKey(x.date)),...state.savings.map(x=>monthKey(x.date))])].sort().reverse().slice(0,12);
  const hist=document.getElementById("historyList");
  if(!keys.length){hist.className="history-list empty-state";hist.textContent="L’historique apparaîtra après tes premiers mois d’utilisation.";}
  else{
    hist.className="history-list";
    hist.innerHTML=keys.map(k=>{
      const d=new Date(k+"-01T12:00:00");
      const label=new Intl.DateTimeFormat("fr-FR",{month:"long",year:"numeric"}).format(d);
      const exp=state.expenses.filter(x=>monthKey(x.date)===k).reduce((s,x)=>s+Number(x.amount),0);
      const sav=state.savings.filter(x=>monthKey(x.date)===k).reduce((s,x)=>s+Number(x.amount),0);
      return `<div class="history-row"><div><strong>${label.charAt(0).toUpperCase()+label.slice(1)}</strong><small>${fmt(sav)} épargnés</small></div><strong>${fmt(exp)}</strong></div>`;
    }).join("");
  }
}

function renderSavings(){
  const monthSav=currentMonthSavings().reduce((s,x)=>s+Number(x.amount),0);
  document.getElementById("savingMonthTotal").textContent=fmt(monthSav);
  const el=document.getElementById("goalList");
  if(!state.goals.length){el.className="goal-list empty-state";el.textContent="Crée ton premier objectif d’épargne.";}
  else{
    el.className="goal-list";
    el.innerHTML=state.goals.map(g=>{
      const total=state.savings.filter(x=>x.goalId===g.id).reduce((s,x)=>s+Number(x.amount),0);
      const pct=Math.min(100,(total/Number(g.target))*100);
      return `<div class="goal-card">
        <div class="goal-top">
          <div class="goal-title"><span class="goal-emoji">${g.emoji||"🎯"}</span><div><strong>${escapeHtml(g.name)}</strong><small>${pct.toFixed(0)} % atteint</small></div></div>
          <strong>${fmt(total)}</strong>
        </div>
        <div class="goal-progress">
          <div class="bar-wrap"><div class="bar" style="width:${pct}%"></div></div>
          <div class="meta"><span>${fmt(total)}</span><span>Objectif ${fmt(g.target)}</span></div>
        </div>
      </div>`;
    }).join("");
  }
  const sel=document.getElementById("savingGoal");
  sel.innerHTML=`<option value="">Épargne générale</option>`+state.goals.map(g=>`<option value="${g.id}">${g.emoji||"🎯"} ${escapeHtml(g.name)}</option>`).join("");
}

function renderCategorySelects(){
  document.getElementById("expenseCategory").innerHTML=state.categories.map(c=>`<option value="${c.id}">${c.emoji} ${c.name}</option>`).join("");
}
function renderSettings(){
  document.getElementById("monthlyIncome").value=state.settings.income||"";
  document.getElementById("payDay").value=state.settings.payDay||1;
}
function renderAll(){
  maybeArchiveFinishedInstallments(); setMonthTitle(); renderCategorySelects(); renderHome(); renderExpenses(); renderFixed(); renderAnalysis(); renderSavings(); renderSettings();
}

function navigate(view){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.getElementById(`${view}View`).classList.add("active");
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  window.scrollTo({top:0,behavior:"smooth"});
}

document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
document.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.nav)));

const expenseDialog=document.getElementById("expenseDialog");
function openExpense(id=null){
  document.getElementById("expenseForm").reset();
  document.getElementById("expenseId").value="";
  document.getElementById("expenseDate").value=todayISO();
  document.getElementById("expenseDialogTitle").textContent="Ajouter une dépense";
  document.getElementById("deleteExpenseBtn").classList.add("hidden");
  if(id){
    const x=state.expenses.find(e=>e.id===id); if(!x)return;
    document.getElementById("expenseId").value=x.id;
    document.getElementById("expenseAmount").value=x.amount;
    document.getElementById("expenseCategory").value=x.category;
    document.getElementById("expenseLabel").value=x.label||"";
    document.getElementById("expenseDate").value=x.date;
    document.getElementById("expenseDialogTitle").textContent="Modifier la dépense";
    document.getElementById("deleteExpenseBtn").classList.remove("hidden");
  }
  openDialog(expenseDialog);
}
["fabAddExpense","addExpenseTop"].forEach(id=>document.getElementById(id).addEventListener("click",()=>openExpense()));

document.getElementById("expenseForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=document.getElementById("expenseId").value;
  const item={id:id||uid(),amount:Number(document.getElementById("expenseAmount").value),category:document.getElementById("expenseCategory").value,label:document.getElementById("expenseLabel").value.trim(),date:document.getElementById("expenseDate").value};
  if(id) state.expenses=state.expenses.map(x=>x.id===id?item:x); else state.expenses.push(item);
  saveState(); closeDialog(expenseDialog);
});
document.getElementById("deleteExpenseBtn").addEventListener("click",()=>{
  const id=document.getElementById("expenseId").value;
  if(id && confirm("Supprimer cette dépense ?")){state.expenses=state.expenses.filter(x=>x.id!==id);saveState();closeDialog(expenseDialog);}
});


const fixedDialog=document.getElementById("fixedDialog");
function toggleInstallmentFields(){
  const isInst=document.getElementById("fixedCategory").value==="paiement-plusieurs-fois";
  document.getElementById("installmentFields").classList.toggle("hidden",!isInst);
}
function openFixed(id=null){
  document.getElementById("fixedForm").reset();
  document.getElementById("fixedId").value="";
  document.getElementById("fixedDialogTitle").textContent="Ajouter une charge";
  document.getElementById("deleteFixedBtn").classList.add("hidden");
  renderFixedCategorySelects();
  if(id){
    const x=state.fixedCharges.find(e=>e.id===id); if(!x)return;
    document.getElementById("fixedId").value=x.id;
    document.getElementById("fixedLabel").value=x.label||"";
    document.getElementById("fixedCategory").value=x.category;
    document.getElementById("fixedAmount").value=x.amount;
    document.getElementById("fixedComment").value=x.comment||"";
    document.getElementById("installmentCount").value=x.installmentCount||"";
    document.getElementById("installmentCurrent").value=x.installmentCurrent||"";
    document.getElementById("installmentNextDate").value=x.installmentNextDate||"";
    document.getElementById("installmentAutoEnd").checked=x.autoEnd!==false;
    document.getElementById("fixedDialogTitle").textContent="Modifier la charge";
    document.getElementById("deleteFixedBtn").classList.remove("hidden");
  }
  toggleInstallmentFields();
  openDialog(fixedDialog);
}
document.getElementById("addFixedBtn").addEventListener("click",()=>openFixed());
document.getElementById("fixedCategory").addEventListener("change",toggleInstallmentFields);
document.getElementById("fixedForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=document.getElementById("fixedId").value;
  const category=document.getElementById("fixedCategory").value;
  const item={
    id:id||uid(),
    label:document.getElementById("fixedLabel").value.trim(),
    category,
    amount:Number(document.getElementById("fixedAmount").value),
    comment:document.getElementById("fixedComment").value.trim(),
    archived:false
  };
  if(category==="paiement-plusieurs-fois"){
    item.installmentCount=Number(document.getElementById("installmentCount").value)||null;
    item.installmentCurrent=Number(document.getElementById("installmentCurrent").value)||1;
    item.installmentNextDate=document.getElementById("installmentNextDate").value||null;
    item.autoEnd=document.getElementById("installmentAutoEnd").checked;
  }
  if(id){
    const previous=state.fixedCharges.find(x=>x.id===id);
    if(previous?.archived) item.archived=previous.archived;
    state.fixedCharges=state.fixedCharges.map(x=>x.id===id?item:x);
  }else state.fixedCharges.push(item);
  saveState();closeDialog(fixedDialog);
});
document.getElementById("deleteFixedBtn").addEventListener("click",()=>{
  const id=document.getElementById("fixedId").value;
  if(id && confirm("Supprimer cette charge fixe ?")){state.fixedCharges=state.fixedCharges.filter(x=>x.id!==id);saveState();closeDialog(fixedDialog);}
});
document.getElementById("searchFixed").addEventListener("input",filterFixedList);
document.getElementById("filterFixedCategory").addEventListener("change",filterFixedList);

document.getElementById("addFixedCategoryBtn").addEventListener("click",()=>{
  document.getElementById("fixedCategoryForm").reset();
  openDialog(document.getElementById("fixedCategoryDialog"));
});
document.getElementById("fixedCategoryForm").addEventListener("submit",e=>{
  e.preventDefault();
  const name=document.getElementById("newFixedCategoryName").value.trim();
  const emoji=document.getElementById("newFixedCategoryEmoji").value.trim()||"📌";
  const id=`custom-${Date.now()}`;
  state.fixedCategories.push({id,name,emoji});
  saveState();
  closeDialog(document.getElementById("fixedCategoryDialog"));
});

document.getElementById("settingsBtn").addEventListener("click",()=>{renderSettings();openDialog(document.getElementById("settingsDialog"));});
document.getElementById("settingsForm").addEventListener("submit",e=>{
  e.preventDefault();
  state.settings.income=Number(document.getElementById("monthlyIncome").value)||0;
  state.settings.payDay=Math.min(31,Math.max(1,Number(document.getElementById("payDay").value)||1));
  saveState();closeDialog(document.getElementById("settingsDialog"));
});

document.getElementById("addSavingBtn").addEventListener("click",()=>{
  document.getElementById("savingForm").reset();document.getElementById("savingDate").value=todayISO();renderSavings();openDialog(document.getElementById("savingDialog"));
});
document.getElementById("savingForm").addEventListener("submit",e=>{
  e.preventDefault();
  state.savings.push({id:uid(),amount:Number(document.getElementById("savingAmount").value),goalId:document.getElementById("savingGoal").value||null,date:document.getElementById("savingDate").value});
  saveState();closeDialog(document.getElementById("savingDialog"));
});

document.getElementById("addGoalBtn").addEventListener("click",()=>{
  document.getElementById("goalForm").reset();openDialog(document.getElementById("goalDialog"));
});
document.getElementById("goalForm").addEventListener("submit",e=>{
  e.preventDefault();
  state.goals.push({id:uid(),name:document.getElementById("goalName").value.trim(),target:Number(document.getElementById("goalTarget").value),emoji:document.getElementById("goalEmoji").value.trim()||"🎯"});
  saveState();closeDialog(document.getElementById("goalDialog"));
});

document.getElementById("searchExpense").addEventListener("input",filterExpenseList);
document.getElementById("filterCategory").addEventListener("change",filterExpenseList);

document.getElementById("exportBtn").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a");
  a.href=url;a.download=`tirelire-${todayISO()}.json`;a.click();URL.revokeObjectURL(url);
});
document.getElementById("importInput").addEventListener("change",async e=>{
  const file=e.target.files?.[0]; if(!file)return;
  try{
    const data=JSON.parse(await file.text());
    state={...defaultState(),...data};
    saveState();alert("Données importées.");
  }catch(err){alert("Le fichier n’est pas valide.");}
  e.target.value="";
});
document.getElementById("resetBtn").addEventListener("click",()=>{
  if(confirm("Tout effacer ? Cette action est irréversible.")){state=defaultState();saveState();closeDialog(document.getElementById("settingsDialog"));}
});

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
renderAll();

document.querySelectorAll('dialog .icon-btn[value="cancel"]').forEach(btn=>{
  btn.addEventListener("click",e=>{
    const dlg=btn.closest("dialog");
    if(dlg?.classList.contains("fallback-open")){
      e.preventDefault();
      closeDialog(dlg);
    }
  });
});
