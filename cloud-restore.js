/* Persistent baseline restore.
   GitHub Pages is static, so the browser cannot write new transactions back to GitHub
   without exposing a GitHub credential. This safely restores the GitHub backup whenever
   this browser has not initialized Money before. */
(async function(){
  const KEY='money_v3';
  const MARK='money_cloud_initialized_v1';
  if(localStorage.getItem(MARK)==='1') return;
  try{
    const r=await fetch('money-cloud-backup.json?v=20260907',{cache:'no-store'});
    if(!r.ok) return;
    const cloud=await r.json();
    let local=null;
    try{local=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
    if(!local || !Array.isArray(local.transactions) || local.transactions.length===0){
      local={currency:cloud.currency||'JOD',salary:cloud.salary||{base:0,actual:{}},fixed:cloud.fixed||[],transactions:cloud.transactions||[],savingGoal:cloud.savingGoal||0,debts:cloud.debts||[]};
      localStorage.setItem(KEY,JSON.stringify(local));
    }
    localStorage.setItem(MARK,'1');
  }catch(e){console.warn('Money cloud restore failed',e)}
})();
