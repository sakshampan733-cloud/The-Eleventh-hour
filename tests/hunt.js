var app=readFile('tests/app.js').replace("'use strict';",'');
app+=';globalThis.__=({get S(){return S},set S(v){S=v},get ttDate(){return ttDate},set ttDate(v){ttDate=v}});'+
 'globalThis.addDays=addDays;globalThis.isoOf=isoOf;globalThis.dateOf=dateOf;globalThis.dowOf=dowOf;'+
 'globalThis.todayISO=todayISO;globalThis.markKey=markKey;globalThis.t2m=t2m;globalThis.m2t=m2t;'+
 'globalThis.normalise=normalise;globalThis.dayPlan=dayPlan;globalThis.dayOptions=dayOptions;'+
 'globalThis.setPlan=setPlan;globalThis.planFor=planFor;globalThis.subById=subById;globalThis.slotsOn=slotsOn;'+
 'globalThis.tomorrowPlan=tomorrowPlan;globalThis.remainingBySub=remainingBySub;globalThis.slackFor=slackFor;'+
 'globalThis.attFor=attFor;globalThis.fmtDur=fmtDur;globalThis.liveSlots=liveSlots;globalThis.uid=uid;globalThis.renderMonths=renderMonths;';
var found=0, checked=0;
function bug(area,msg){ found++; print('  ⚠ BUG  ['+area+'] '+msg); }
function chk(area,f){ checked++; try{ f(); }catch(e){ bug(area,'threw: '+e); } }
(0,eval)(app);

/* Settings is collapsed by default now — open every group so these
   checks can still see the controls inside. */
function openAllGroups(){ __.S.openGroups=['look','term','att','plan','term2','subs','off','data']; }
var TMR=addDays(new Date(),1), TISO=isoOf(TMR), DOW=dowOf(TMR);

function base(extra){
  __.S=normalise(Object.assign({
    subs:[{id:'a',name:'Cost Accounting',code:'CA',ci:0},{id:'b',name:'Stats',code:'BS',ci:1}],
    slots:[{id:'s1',subId:'a',day:DOW,kind:'th',start:'08:00',end:'09:00'},
           {id:'s2',subId:'b',day:DOW,kind:'th',start:'12:00',end:'13:00'}],
    att:{a:{thp:20,tha:10},b:{thp:20,tha:10}},
    planner:true,readyMin:15,readyMax:30,travelAM:40,travelMid:60,travelPM:50,thr:67
  },extra||{}));
}

print('— plans vs a changing timetable —');
chk('plan/delete-slot',function(){
  base(); setPlan(TISO,['s2']);
  __.S.slots=__.S.slots.filter(function(s){return s.id!=='s2';});   // that class is removed
  var p=tomorrowPlan();
  if(p.skippingAll && p.list.length)
    bug('plan/delete-slot','plan pointed at a deleted class, so the app thinks you are skipping the day');
  renderHome();
});
chk('plan/delete-subject',function(){
  base(); setPlan(TISO,['s2']);
  __.S.subs=__.S.subs.filter(function(x){return x.id!=='b';});
  __.S.slots=__.S.slots.filter(function(s){return s.subId!=='b';});
  var p=tomorrowPlan();
  if(p.skippingAll && p.list.length)
    bug('plan/delete-subject','deleting a subject silently turned the plan into "not going"');
  renderHome(); renderAtt();
});
chk('plan/cancel-planned-class',function(){
  base(); setPlan(TISO,['s2']);
  __.S.marks[TISO+'|s2|b|th']='c';        // the class you planned for gets cancelled
  var p=tomorrowPlan();
  if(p.skippingAll && p.list.length)
    bug('plan/cancel','cancelling the planned class leaves you "not going" with other classes still on');
  renderHome();
});
chk('plan/stale-ids',function(){
  base(); setPlan(TISO,['ghost-1','ghost-2']);
  var p=tomorrowPlan();
  if(p.skippingAll) bug('plan/stale','a stale plan stranded you as "not going"');
  if(p.going.length!==p.list.length) bug('plan/stale','did not fall back to the whole day');
  if(p.planned) bug('plan/stale','still claims a plan is active');
  renderHome();
});

print('\n— term end at the edges —');
chk('term/past',function(){
  base({termEnd:isoOf(addDays(new Date(),-30))});
  var r=remainingBySub(TISO);
  if(r===null) bug('term/past','no runway object with a past term end');
  renderAtt(); sheetWorthGoing(TISO);
  var h=document.querySelector('#sheetBody').innerHTML;
  if(/undefined|NaN/.test(h)) bug('term/past','sheet leaked undefined/NaN with a finished term');
});
chk('term/today',function(){
  base({termEnd:todayISO()});
  renderAtt(); renderHome(); sheetWorthGoing(TISO);
  if(/undefined|NaN/.test(document.querySelector('#sheetBody').innerHTML))
    bug('term/today','leaked with the term ending today');
});
chk('term/far-future',function(){
  base({termEnd:'2099-12-31'});
  var t0=Date.now(); remainingBySub(TISO); var ms=Date.now()-t0;
  if(ms>500) bug('term/far-future','runway scan took '+ms+'ms — unbounded loop?');
  renderAtt();
});

print('\n— corrupt or hostile data —');
chk('data/backwards-slot',function(){
  base({slots:[{id:'z',subId:'a',day:DOW,kind:'th',start:'14:00',end:'09:00'}]});
  var d=fmtDur(t2m('09:00')-t2m('14:00'));
  if(/-/.test(d)) bug('data/backwards-slot','negative duration rendered as "'+d+'"');
  __.ttDate=TMR; renderTT(); renderHome();
});
chk('data/no-code',function(){
  base({subs:[{id:'a',name:'No Code Subject',ci:0}]});
  renderAtt(); (openAllGroups(),renderSettings());
  if(/undefined/.test(document.querySelector('#attList').innerHTML))
    bug('data/no-code','subject without a code leaked undefined');
});
chk('data/malformed-marks',function(){
  base();
  __.S.marks['garbage']='p';
  __.S.marks['2026-01-01|x']='a';
  __.S.marks['|||']='c';
  renderAtt(); renderHome(); renderMonths();
  sheetCatchUp();
});
chk('data/huge',function(){
  var subs=[],slots=[];
  for(var i=0;i<40;i++){
    subs.push({id:'s'+i,name:'Subject '+i,code:'S'+i,ci:i%8});
    for(var d=0;d<5;d++) slots.push({id:'sl'+i+'-'+d,subId:'s'+i,day:d,kind:'th',
      start:'09:00',end:'10:00'});
  }
  base({subs:subs,slots:slots,termEnd:isoOf(addDays(new Date(),120))});
  var t0=Date.now(); renderAtt(); renderHome(); var ms=Date.now()-t0;
  if(ms>2000) bug('data/huge','40 subjects x 200 slots took '+ms+'ms to render');
});

print('\n— threshold extremes —');
[1,50,67,99,100].forEach(function(v){
  chk('thr/'+v,function(){
    base({thr:v,termEnd:isoOf(addDays(new Date(),60))});
    renderAtt(); renderHome(); sheetWorthGoing(TISO); sheetSkipToday();
    var h=document.querySelector('#sheetBody').innerHTML+document.querySelector('#attList').innerHTML;
    if(/undefined|NaN|Infinity/.test(h)) bug('thr/'+v,'leaked undefined/NaN/Infinity at threshold '+v);
  });
});

print('\n— empty and first-run states —');
chk('empty/all-sheets',function(){
  __.S=normalise({subs:[],slots:[],marks:{},att:{},dls:[]});
  ['home','timetable','attendance','deadlines','calendar','settings'].forEach(showTab);
  sheetCatchUp(); sheetAppealPick(); sheetWorthGoing(TISO); sheetSkipToday();
  renderMonths();
});
chk('empty/no-subjects-add-class',function(){
  __.S=normalise({subs:[],slots:[],marks:{},att:{},dls:[]});
  sheetClass(null);      // must not crash with zero subjects
});

print('\n— every sheet, with real data, in every tone —');
['pro','plain','friendly','snark'].forEach(function(tone){
  chk('tone/'+tone,function(){
    base({tone:tone,termEnd:isoOf(addDays(new Date(),60))});
    [function(){sheetWorthGoing(TISO);},function(){sheetSkipToday();},
     function(){sheetCatchUp();},function(){sheetAppealPick();},
     function(){sheetAppeal(__.S.subs[0]);},function(){sheetBackfill(__.S.subs[0]);},
     function(){sheetClass(null);},function(){sheetSubject(null);},
     function(){sheetDeadline(null);}].forEach(function(open){
      open();
      var h=document.querySelector('#sheetBody').innerHTML;
      if(/undefined|NaN/.test(h)) bug('tone/'+tone,'a sheet leaked undefined/NaN');
    });
  });
});

print('\n— save / restore integrity —');
chk('persist/roundtrip',function(){
  base({termEnd:isoOf(addDays(new Date(),60)),name:'Test',commute:'cab'});
  setPlan(TISO,['s2']);
  save();
  var back=normalise(JSON.parse(localStorage.getItem('sem5plan')));
  ['thr','termEnd','name','commute','remindAt','readyMin','readyMax','travelAM','planner']
    .forEach(function(k){
      if(String(back[k])!==String(__.S[k])) bug('persist','field "'+k+'" changed across save/load');
    });
  if(JSON.stringify(back.plans)!==JSON.stringify(__.S.plans)) bug('persist','plans lost on reload');
});
chk('persist/export-import',function(){
  base({termEnd:isoOf(addDays(new Date(),60))});
  var dump=JSON.stringify(__.S);
  var re=normalise(JSON.parse(dump));
  if(re.subs.length!==__.S.subs.length) bug('persist','subjects lost through export/import');
  __.S=re; renderAll();
});

print('\n═══ '+checked+' areas checked · '+found+' bug'+(found===1?'':'s')+' found ═══');
