/* Restore transactions from the original Money version (money_v1) into money_v3.
   This runs before app.js so old localStorage data is recovered automatically.
   It never deletes the old data and never overwrites newer v3 transactions. */
(function(){
  const V1='money_v1', V3='money_v3', FLAG='money_v1_migrated_v3';
  try{
    const legacy=JSON.parse(localStorage.getItem(V1)||'null');
    if(!legacy || !Array.isArray(legacy.transactions) || !legacy.transactions.length) return;

    const current=JSON.parse(localStorage.getItem(V3)||'null') || {
      currency: legacy.currency || 'JOD',
      salary:{base:0,actual:{}},
      fixed:[], transactions:[], savingGoal:0, debts:[]
    };
    current.salary=current.salary||{base:0,actual:{}};
    current.fixed=Array.isArray(current.fixed)?current.fixed:[];
    current.transactions=Array.isArray(current.transactions)?current.transactions:[];
    current.debts=Array.isArray(current.debts)?current.debts:[];

    const existing=new Set(current.transactions.map(t=>String(t.id)));
    let added=0;
    legacy.transactions.forEach(t=>{
      const id=String(t.id);
      if(existing.has(id)) return;
      current.transactions.push({
        id:t.id,
        type:t.type,
        amount:Number(t.amount)||0,
        name:t.name||'حركة قديمة',
        category:t.category|| (t.type==='income'?'دخل':'أخرى'),
        date:t.date||new Date().toISOString(),
        icon:t.icon || (t.type==='income'?'💵':'🧾')
      });
      existing.add(id); added++;
    });

    if(legacy.currency && !current.currency) current.currency=legacy.currency;
    if(legacy.savingGoal && !current.savingGoal) current.savingGoal=legacy.savingGoal;

    localStorage.setItem(V3,JSON.stringify(current));
    localStorage.setItem(FLAG,'1');
    console.info('[Money] Restored '+added+' old transactions from money_v1.');
  }catch(err){ console.warn('[Money] Legacy migration skipped:',err); }
})();
