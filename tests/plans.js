var app=readFile('tests/app.js').replace("'use strict';",'');
app+=';globalThis.__=({get S(){return S},set S(v){S=v},get ttDate(){return ttDate},set ttDate(v){ttDate=v}});'+
 'globalThis.addDays=addDays;globalThis.isoOf=isoOf;globalThis.dateOf=dateOf;globalThis.dowOf=dowOf;'+
 'globalThis.todayISO=todayISO;globalThis.markKey=markKey;globalThis.t2m=t2m;globalThis.m2t=m2t;'+
 'globalThis.normalise=normalise;globalThis.dayPlan=dayPlan;globalThis.dayOptions=dayOptions;'+
 'globalThis.setPlan=setPlan;globalThis.planFor=planFor;'+
 'globalThis.liveSlots=liveSlots;globalThis.tomorrowPlan=tomorrowPlan;globalThis.subById=subById;globalThis.COMMUTE=COMMUTE;globalThis.fmtT=fmtT;globalThis.morningStatus=morningStatus;';
var REAL_DATE=Date;
function setClock(m){ function D(a,b,c,d,e,f){
  if(arguments.length===0){var x=new REAL_DATE();x.setHours(Math.floor(m/60),m%60,0,0);return x;}
  if(arguments.length===1) return new REAL_DATE(a); return new REAL_DATE(a,b,c,d,e,f); }
  D.now=REAL_DATE.now;D.parse=REAL_DATE.parse;D.UTC=REAL_DATE.UTC;D.prototype=REAL_DATE.prototype;
  globalThis.Date=D; }
function realClock(){ globalThis.Date=REAL_DATE; }
var ok=0,fail=0,S;
function t(n,f){ var snap=__.S;
  try{ f(); print('  PASS  '+n); ok++; }
  catch(e){ print('  FAIL  '+n+' :: '+e); fail++; __.S=snap; }
  finally{ S=__.S; realClock(); } }
(0,eval)(app); S=__.S;

var TMR=addDays(new Date(),1), TISO=isoOf(TMR), DOW=dowOf(TMR);
/* your day: 8-9 live, 9-11 cancelled, 12-1 live */
function setup(){
  var m={}; m[TISO+'|s2|b|th']='c'; m[TISO+'|s3|c|th']='c';
  __.S=normalise({
    subs:[{id:'a',name:'Cost Accounting',code:'CA',ci:0},
          {id:'b',name:'Indian Economy',code:'IE',ci:1},
          {id:'c',name:'Intl Business',code:'IB',ci:2},
          {id:'d',name:'Business Stats',code:'BS',ci:3}],
    slots:[{id:'s1',subId:'a',day:DOW,kind:'th',start:'08:00',end:'09:00',room:'B'},
           {id:'s2',subId:'b',day:DOW,kind:'th',start:'09:00',end:'10:00',room:'B'},
           {id:'s3',subId:'c',day:DOW,kind:'th',start:'10:00',end:'11:00',room:'B'},
           {id:'s4',subId:'d',day:DOW,kind:'th',start:'12:00',end:'13:00',room:'B'}],
    marks:m, att:{a:{thp:20,tha:10},d:{thp:20,tha:10}},
    planner:true, readyMin:15, readyMax:30,
    travelAM:40, travelMid:60, travelPM:50, remindAt:'18:00', commute:'driver', thr:67
  });
}

print('— pickup follows the class you are ACTUALLY going to —');
t('with no plan it assumes the 8am and a 7:20 pickup', function(){
  setup();
  var p=tomorrowPlan();
  if(p.first.id!=='s1') throw 'first class should be the 8am';
  if(p.travel!==40) throw 'should use the morning band, got '+p.travel;
  if(m2t(p.leaveAt)!=='7:20am') throw 'pickup '+m2t(p.leaveAt);
  if(m2t(p.wakeAt)!=='6:50am') throw 'wake '+m2t(p.wakeAt);
});
t('planning the midday class moves pickup to 11:00', function(){
  setup();
  setPlan(TISO,['s4']);                       // only the 12-1
  var p=tomorrowPlan();
  if(p.first.id!=='s4') throw 'first planned class should be the 12pm, got '+p.first.id;
  if(p.travel!==60) throw 'should switch to the midday band, got '+p.travel;
  if(m2t(p.leaveAt)!=='11am') throw 'pickup '+m2t(p.leaveAt)+', expected 11am';
  if(m2t(p.wakeAt)!=='10:30am') throw 'wake '+m2t(p.wakeAt)+', expected 10:30am';
});
t('the evening hero shows the planned pickup, not the 8am one', function(){
  setup(); setPlan(TISO,['s4']);
  setClock(19*60); renderHome();
  var h=document.querySelector('#heroWrap').innerHTML;
  if(!/Pickup at 11am/.test(h)) throw 'hero shows the wrong pickup: '+(h.match(/Pickup at [^<]*/)||['none'])[0];
  if(/7:20am/.test(h)) throw 'still showing the 8am departure';
  if(!/planned/.test(h)) throw 'does not say the time comes from your plan';
});
t('the copied message carries the planned time', function(){
  setup(); setPlan(TISO,['s4']);
  var p=tomorrowPlan(), c=COMMUTE.driver;
  var msg=c.text(m2t(p.leaveAt), fmtT(p.first.start));
  if(msg.indexOf('11am')<0) throw 'message has the wrong pickup: '+msg;
  if(msg.indexOf('12pm')<0) throw 'message has the wrong class time: '+msg;
});
t('planning the morning block keeps the 7:20 pickup', function(){
  setup(); setPlan(TISO,['s1']);
  var p=tomorrowPlan();
  if(m2t(p.leaveAt)!=='7:20am') throw 'pickup '+m2t(p.leaveAt);
  if(p.going.length!==1||p.going[0].id!=='s1') throw 'wrong planned set';
});
t('planning not to go removes the departure entirely', function(){
  setup(); setPlan(TISO,[]);
  var p=tomorrowPlan();
  if(!p.skippingAll) throw 'should report skipping the whole day';
  if(p.leaveAt!==null) throw 'still produced a departure time';
  setClock(19*60); renderHome();
  var h=document.querySelector('#heroWrap').innerHTML;
  if(!/Not going in/.test(h)) throw 'hero does not say you are not going';
  if(/Pickup at/.test(h)) throw 'still showing a pickup time';
});
t('clearing the plan restores the default', function(){
  setup(); setPlan(TISO,['s4']);
  if(m2t(tomorrowPlan().leaveAt)!=='11am') throw 'plan not applied';
  setPlan(TISO,null);
  if(planFor(TISO)!==null) throw 'plan not cleared';
  if(m2t(tomorrowPlan().leaveAt)!=='7:20am') throw 'did not fall back to the full day';
});

print('\n— choosing from the sheet —');
t('every option offers a way to pick it', function(){
  setup(); sheetWorthGoing(TISO);
  var h=document.querySelector('#sheetBody').innerHTML;
  var picks=(h.match(/data-pick="/g)||[]).length;
  if(picks<3) throw 'only '+picks+' choosable options';
  if(!/This is your plan/.test(h)) throw 'current plan not marked';
});
t('the chosen option is marked as the plan', function(){
  setup(); setPlan(TISO,['s4']); sheetWorthGoing(TISO);
  var h=document.querySelector('#sheetBody').innerHTML;
  if(!/✓ This is your plan/.test(h)) throw 'plan marker missing';
  if((h.match(/This is your plan/g)||[]).length!==1) throw 'more than one option marked';
});
t('options carry the right slot ids', function(){
  setup();
  var x=dayOptions(TISO);
  x.opts.forEach(function(o){
    if(o.ids.length!==o.attend.length) throw o.label+': id count mismatch';
    o.ids.forEach(function(id){
      if(!o.attend.some(function(sl){return sl.id===id;})) throw o.label+': stray id '+id;
    });
  });
  var full=x.opts.filter(function(o){return o.label==='Go for everything';})[0];
  if(full.ids.length!==2) throw 'full day should cover both live classes';
});

print('\n— housekeeping —');
t('the morning countdown respects a skip-the-day plan', function(){
  setup();
  var todayIso=todayISO();
  __.S.slots=[{id:'z1',subId:'a',day:dowOf(new Date()),kind:'th',start:'08:00',end:'09:00'}];
  setClock(6*60);
  if(!morningStatus()) throw 'expected a countdown with no plan';
  setPlan(todayIso,[]);
  if(morningStatus()!==null) throw 'still counting down to a class you planned to skip';
});
t('plans for past days are pruned on load', function(){
  var old=isoOf(addDays(new Date(),-3));
  var f=normalise({subs:[],slots:[],marks:{},att:{},dls:[],
    plans:{}});
  f.plans[old]=['x']; f.plans[TISO]=['s4'];
  var g=normalise(f);
  if(g.plans[old]) throw 'a stale plan survived';
  if(!g.plans[TISO]) throw 'a future plan was wrongly dropped';
});
t('a malformed plan is discarded, not crashed on', function(){
  var f=normalise({subs:[],slots:[],marks:{},att:{},dls:[],
    plans:{'not-a-date':['x'], '2099-01-01':'nope'}});
  if(Object.keys(f.plans).length) throw 'kept junk: '+JSON.stringify(f.plans);
  renderHome();
});
t('long press is gone', function(){
  setup(); renderHome();
  var h=document.querySelector('#homeTiles').innerHTML+document.querySelector('#heroWrap').innerHTML;
  if(/data-lp/.test(h)) throw 'long-press hooks still present';
  if(typeof globalThis.bindLongPress==='function') throw 'bindLongPress still defined';
});
t('no undefined leaked', function(){ if(LOG.length) throw LOG.length+' leak(s): '+LOG[0]; });

print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
