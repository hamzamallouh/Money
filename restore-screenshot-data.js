/* One-time restore of the movements/settings visible in the user's Money screenshots.
   Runs only when the page is opened with ?restoreScreens=1.
   It merges data into money_v3 and never deletes existing data. */
(function(){
  const params=new URLSearchParams(location.search);
  if(params.get('restoreScreens')!=='1') return;

  const KEY='money_v3';
  let db;
  try{db=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){db=null}
  db=db&&typeof db==='object'?db:{currency:'JOD',salary:{base:0,actual:{}},fixed:[],transactions:[],savingGoal:0,debts:[]};
  db.currency=db.currency||'JOD';
  db.salary=db.salary||{base:0,actual:{}};
  db.salary.actual=db.salary.actual||{};
  db.fixed=Array.isArray(db.fixed)?db.fixed:[];
  db.transactions=Array.isArray(db.transactions)?db.transactions:[];
  db.debts=Array.isArray(db.debts)?db.debts:[];

  // Screenshot settings: base salary 850, actual September salary 940, association 600/month.
  if(Number(db.salary.base||0)<=0) db.salary.base=850;
  if(!Number(db.salary.actual['2026-09'])) db.salary.actual['2026-09']=940;

  const fixedId='screenshot-fixed-group-2026-09';
  if(!db.fixed.some(f=>String(f.id)===fixedId)){
    db.fixed.push({id:fixedId,name:'الجمعية',amount:600,category:'الجمعية'});
  }

  const tx=[
    {id:'screenshot-salary-2026-09',type:'income',amount:940,name:'راتب الشهر',category:'راتب',date:'2026-09-01T09:00:00+03:00',icon:'💵',auto:'salary',month:'2026-09'},
    {id:'screenshot-income-27-2026-09-07',type:'income',amount:27,name:'سابق',category:'دخل خارجي',date:'2026-09-07T09:00:00+03:00',icon:'💰'},
    {id:'screenshot-income-90-2026-09-07',type:'income',amount:90,name:'Overtime',category:'دخل خارجي',date:'2026-09-07T10:00:00+03:00',icon:'💰'},
    {id:'screenshot-income-150-2026-09-07',type:'income',amount:150,name:'فريلانس',category:'دخل خارجي',date:'2026-09-07T11:00:00+03:00',icon:'💰'},
    {id:'screenshot-expense-173-2026-09-07',type:'expense',amount:173,name:'دين مهند فيزا',category:'فواتير',date:'2026-09-07T12:00:00+03:00',icon:'🧾'},
    {id:'screenshot-expense-2-2026-09-07',type:'expense',amount:2,name:'كريج',category:'أكل',date:'2026-09-07T13:00:00+03:00',icon:'🧾'},
    {id:'screenshot-debt-250-2026-09-07',type:'debtPayment',amount:250,name:'سداد مطبخ',category:'سداد ديون',date:'2026-09-07T14:00:00+03:00',icon:'💳'},
    {id:'screenshot-expense-50-2026-09-07',type:'expense',amount:50,name:'مصروف بيان',category:'البيت',date:'2026-09-07T15:00:00+03:00',icon:'🧾'},
    {id:'screenshot-expense-3-2026-09-06',type:'expense',amount:3,name:'مي و قهوة مع بيان',category:'أكل',date:'2026-09-06T12:00:00+03:00',icon:'🧾'},
    {id:'screenshot-expense-11-2026-09-06',type:'expense',amount:11,name:'شاورما بيان',category:'أكل',date:'2026-09-06T13:00:00+03:00',icon:'🧾'},
    {id:'screenshot-expense-8-2026-09-06',type:'expense',amount:8,name:'ورد بيان',category:'البيت',date:'2026-09-06T14:00:00+03:00',icon:'🧾'},
    {id:'screenshot-expense-20-2026-09-06',type:'expense',amount:20,name:'نقوط عدوي',category:'شخصي',date:'2026-09-06T15:00:00+03:00',icon:'🧾'},
    {id:'screenshot-fixed-group-2026-09',type:'expense',amount:600,name:'جمعية',category:'الجمعية',date:'2026-09-07T16:00:00+03:00',icon:'👥',auto:'fixed-'+fixedId,month:'2026-09'}
  ];

  const ids=new Set(db.transactions.map(t=>String(t.id)));
  const sameDay=(a,b)=>String(a||'').slice(0,10)===String(b||'').slice(0,10);
  const equivalent=t=>db.transactions.some(x=>String(x.type)===String(t.type)&&Number(x.amount)===Number(t.amount)&&String(x.name).trim()===String(t.name).trim()&&sameDay(x.date,t.date));
  let added=0;
  tx.forEach(t=>{
    if(ids.has(t.id)||equivalent(t)) return;
    db.transactions.push(t);ids.add(t.id);added++;
  });

  localStorage.setItem(KEY,JSON.stringify(db));
  alert('تم إدخال كل البيانات الظاهرة بالصور ✅\n\nتمت إضافة '+added+' حركة، مع الراتب الأساسي 850 والفعلي 940 والجمعية 600 شهريًا.\n\nلم يتم حذف أو تعديل أي حركة موجودة.');
  history.replaceState({},'',location.pathname+'?restored=1');
  location.reload();
})();