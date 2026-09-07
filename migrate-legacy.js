/* Money data restore tool.
   Reads older localStorage versions on THIS browser/device and safely merges them
   into money_v3. It never deletes the source data. */
(function(){
  const V3='money_v3';

  function read(key){
    try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}
  }

  function normalizeDb(x){
    if(!x || typeof x!=='object') return null;
    const hasData = Array.isArray(x.transactions) || Array.isArray(x.debts) || Array.isArray(x.fixed) || x.salary || x.group || x.savingGoal!=null;
    return hasData ? x : null;
  }

  function mergeAll(showMessage){
    const current=normalizeDb(read(V3)) || {
      currency:'JOD', salary:{base:0,actual:{}}, fixed:[], transactions:[], savingGoal:0, debts:[]
    };
    current.salary=current.salary||{base:0,actual:{}};
    current.salary.actual=current.salary.actual||{};
    current.fixed=Array.isArray(current.fixed)?current.fixed:[];
    current.transactions=Array.isArray(current.transactions)?current.transactions:[];
    current.debts=Array.isArray(current.debts)?current.debts:[];

    let sources=0, txAdded=0, debtAdded=0, fixedAdded=0, salaryRestored=false, goalRestored=false;
    const txIds=new Set(current.transactions.map(t=>String(t.id)));
    const debtIds=new Set(current.debts.map(d=>String(d.id)));
    const fixedIds=new Set(current.fixed.map(f=>String(f.id)));

    // Look through every old Money key, not just money_v1.
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(!key || key===V3 || !/^money(_v\d+)?$/i.test(key)) continue;
      const old=normalizeDb(read(key));
      if(!old) continue;
      sources++;

      if(old.currency && !current.currency) current.currency=old.currency;
      if(Number(old.salary?.base)>0 && Number(current.salary.base||0)<=0){current.salary.base=Number(old.salary.base);salaryRestored=true}
      if(old.salary?.actual && typeof old.salary.actual==='object'){
        Object.entries(old.salary.actual).forEach(([m,v])=>{
          if(Number(v)>0 && !current.salary.actual[m]){current.salary.actual[m]=Number(v);salaryRestored=true}
        });
      }
      if(Number(old.savingGoal)>0 && Number(current.savingGoal||0)<=0){current.savingGoal=Number(old.savingGoal);goalRestored=true}

      (old.transactions||[]).forEach(t=>{
        if(!t || t.amount==null) return;
        const id=String(t.id ?? (t.date+'-'+t.name+'-'+t.amount));
        if(txIds.has(id)) return;
        current.transactions.push({
          id:t.id ?? id,
          type:t.type||'expense',
          amount:Number(t.amount)||0,
          name:t.name||'حركة مسترجعة',
          category:t.category||(t.type==='income'?'دخل':'أخرى'),
          date:t.date||new Date().toISOString(),
          icon:t.icon||(t.type==='income'?'💵':'🧾'),
          ...(t.auto?{auto:t.auto}:{}),
          ...(t.month?{month:t.month}:{}),
          ...(t.debtId?{debtId:t.debtId}:{})
        });
        txIds.add(id);txAdded++;
      });

      (old.fixed||[]).forEach(f=>{
        if(!f || f.amount==null) return;
        const id=String(f.id ?? (f.name+'-'+f.amount));
        if(fixedIds.has(id)) return;
        current.fixed.push({id:f.id??id,name:f.name||'مصروف ثابت مسترجع',amount:Number(f.amount)||0,category:f.category||'أخرى'});
        fixedIds.add(id);fixedAdded++;
      });

      (old.debts||[]).forEach(d=>{
        if(!d || d.name==null) return;
        const id=String(d.id ?? (d.name+'-'+d.total+'-'+d.remaining));
        if(debtIds.has(id)) return;
        current.debts.push({
          id:d.id??id,
          name:d.name,
          total:Number(d.total)||0,
          remaining:Number(d.remaining ?? d.total)||0,
          monthly:Number(d.monthly)||0,
          active:d.active!==false
        });
        debtIds.add(id);debtAdded++;
      });

      // Older versions sometimes stored the association as group instead of fixed/transactions.
      if(old.group && Number(old.group.monthly)>0){
        const gid='legacy-group';
        if(!fixedIds.has(gid)){
          current.fixed.push({id:gid,name:'الجمعية',amount:Number(old.group.monthly),category:'الجمعية'});
          fixedIds.add(gid);fixedAdded++;
        }
      }
    }

    localStorage.setItem(V3,JSON.stringify(current));
    const total=txAdded+debtAdded+fixedAdded+(salaryRestored?1:0)+(goalRestored?1:0);
    if(showMessage){
      alert(total
        ? `تم استرجاع البيانات بنجاح ✅\n\nالحركات: ${txAdded}\nالديون: ${debtAdded}\nالمصاريف الثابتة: ${fixedAdded}${salaryRestored?'\nالراتب: تم استرجاعه':''}${goalRestored?'\nهدف الادخار: تم استرجاعه':''}\n\nلم يتم حذف أي بيانات قديمة.`
        : 'لم نجد نسخة قديمة فيها بيانات على هذا المتصفح.\n\nإذا كانت البيانات ظهرت في المتصفح/الجهاز القديم، افتح هذا الموقع من نفس الجهاز والمتصفح واضغط الزر مرة ثانية.');
      location.reload();
    }
    return {sources,txAdded,debtAdded,fixedAdded,salaryRestored,goalRestored};
  }

  // Automatic restore once, plus a visible manual button for recovery.
  try{mergeAll(false)}catch(e){console.warn('[Money] automatic restore failed',e)}

  document.addEventListener('DOMContentLoaded',function(){
    if(document.getElementById('restoreOldDataBtn')) return;
    const btn=document.createElement('button');
    btn.id='restoreOldDataBtn';
    btn.type='button';
    btn.textContent='↩️ استرجاع بياناتي القديمة';
    btn.title='استرجاع الحركات والديون والمصاريف والراتب من نسخ Money السابقة الموجودة على هذا الجهاز';
    btn.style.cssText='position:fixed;left:12px;bottom:84px;z-index:20;background:#18253a;color:#fff;border:1px solid #3a5275;border-radius:14px;padding:11px 13px;font-size:11px;font-weight:800;box-shadow:0 8px 25px rgba(0,0,0,.35)';
    btn.onclick=function(){
      if(confirm('استرجاع كل بيانات Money القديمة الموجودة على هذا الجهاز؟\n\nسيتم دمج الحركات والديون والمصاريف الثابتة والراتب، ولن يتم حذف البيانات القديمة.')) mergeAll(true);
    };
    document.body.appendChild(btn);
  });
})();