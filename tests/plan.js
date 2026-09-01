var app = readFile('tests/app.js').replace("'use strict';",'');
app += ';globalThis.__=({get S(){return S},set S(v){S=v}});'+
 'globalThis.addDays=addDays;globalThis.isoOf=isoOf;globalThis.dateOf=dateOf;globalThis.dowOf=dowOf;'+
 'globalThis.todayISO=todayISO;globalThis.t2m=t2m;globalThis.m2t=m2t;globalThis.normalise=normalise;'+
 'globalThis.blankState=blankState;globalThis.travelFor=travelFor;globalThis.dayPlan=dayPlan;'+
 'globalThis.morningStatus=morningStatus;globalThis.plannerReady=plannerReady;globalThis.nowMin=nowMin;';
var REAL_DATE=Date;
/* Only the zero-arg form is faked; new Date(x) must still work or addDays breaks */
function setClock(mins){
  function D(a,b,c,d,e,f){
    if(arguments.length===0){ var x=new REAL_DATE(); x.setHours(Math.floor(mins/60),mins%60,0,0); return x; }
    if(arguments.length===1) return new REAL_DATE(a);
    return new REAL_DATE(a,b,c,d,e,f);
  }
  D.now=REAL_DATE.now; D.parse=REAL_DATE.parse; D.UTC=REAL_DATE.UTC; D.prototype=REAL_DATE.prototype;
  globalThis.Date=D;
}
function realClock(){ globalThis.Date=REAL_DATE; }
var ok=0,fail=0;
function t(n,f){ try{ f(); print('  PASS  '+n); ok++; }catch(e){ print('  FAIL  '+n+' :: '+e); fail++; } }
(0,eval)(app);

/* Settings is collapsed by default now — open every group so these
   checks can still see the controls inside. */
function openAllGroups(){ __.S.openGroups=['look','term','att','plan','term2','subs','off','data']; }

/* build a state whose FIRST class today starts at `start`, with a fixed clock */
function scene(start,opts){
  opts=opts||{};
  var today=new Date();
  __.S=normalise(Object.assign({
    subs:[{id:'a',name:'Cost Accounting',code:'CA',ci:0}],
    slots:[{id:'s',subId:'a',day:dowOf(today),kind:'th',start:start,end:'23:59',
            room:'B-12',online:!!opts.online}],
    planner:true, readyMin:15, readyMax:30,
    travelAM:40, travelMid:60, travelPM:50, driverHr:17
  },opts.state||{}));
  if(opts.now!=null) setClock(opts.now);
  return dayPlan(todayISO());
}

print('— travel varies by time of day (the whole point) —');
t('an 8am class uses the morning band', function(){
  var p=scene('08:00');
  if(p.travel!==40) throw 'got '+p.travel+', expected the 40-min morning band';
  if(m2t(p.leaveAt)!=='7:20am') throw 'leave time '+m2t(p.leaveAt)+', expected 7:20am';
});
t('a noon class uses the slower midday band', function(){
  var p=scene('12:00');
  if(p.travel!==60) throw 'got '+p.travel+', expected the 60-min midday band';
  if(m2t(p.leaveAt)!=='11am') throw 'leave time '+m2t(p.leaveAt);
});
t('an evening class uses the third band', function(){
  var p=scene('16:00');
  if(p.travel!==50) throw 'got '+p.travel+', expected the 50-min evening band';
});
t('band boundaries land on the right side', function(){
  scene('08:00'); 
  if(travelFor(t2m('08:59'))!==40) throw '8:59 should still be the morning band';
  if(travelFor(t2m('09:00'))!==60) throw '9:00 should be midday';
  if(travelFor(t2m('14:59'))!==60) throw '14:59 should be midday';
  if(travelFor(t2m('15:00'))!==50) throw '15:00 should be evening';
});
t('an online first class needs no commute at all', function(){
  var tmr=addDays(new Date(),1);
  __.S=normalise({subs:[{id:'a',name:'X',code:'X',ci:0}],
    slots:[{id:'s',subId:'a',day:dowOf(tmr),kind:'th',start:'08:00',end:'09:00',online:true}],
    planner:true,readyMin:15,readyMax:30,travelAM:40,travelMid:60,travelPM:50});
  var p=dayPlan(isoOf(tmr));
  if(p.travel!==0) throw 'travel '+p.travel+' for a class taken at home';
  if(p.leaveAt!==null) throw 'leave time '+m2t(p.leaveAt)+' for a class at home';
  if(p.wakeAt!==null) throw 'wake time '+m2t(p.wakeAt)+' for a class at home';
});
t('a day that mixes online and campus travels for the campus one', function(){
  var tmr=addDays(new Date(),1);
  __.S=normalise({subs:[{id:'a',name:'X',code:'X',ci:0}],
    slots:[{id:'s1',subId:'a',day:dowOf(tmr),kind:'th',start:'08:00',end:'09:00',online:true},
           {id:'s2',subId:'a',day:dowOf(tmr),kind:'th',start:'11:00',end:'12:00'}],
    planner:true,readyMin:15,readyMax:30,travelAM:40,travelMid:60,travelPM:50});
  var p=dayPlan(isoOf(tmr));
  if(!p.firstOnsite||p.firstOnsite.id!=='s2') throw 'wrong first campus class';
  if(p.travel!==60) throw 'travel '+p.travel+' — 11am is the midday band';
  if(m2t(p.leaveAt)!=='10am') throw 'leave '+m2t(p.leaveAt);
  if(m2t(p.wakeAt)!=='9:30am') throw 'wake '+m2t(p.wakeAt);
});

print('\n— the morning question —');
t('plenty of time = full shower', function(){
  scene('08:00',{now:t2m('06:00')});          // leave 7:20, so 80 min spare
  var m=morningStatus();
  if(m.level!=='relaxed') throw 'level '+m.level;
  if(m.untilLeave!==80) throw 'untilLeave '+m.untilLeave;
  if(!/shower|full/i.test(morningLine(m))) throw 'line did not mention the full routine';
});
t('some time = quick version only', function(){
  scene('08:00',{now:t2m('07:00')});          // 20 min until leave; quick=15 full=30
  var m=morningStatus();
  if(m.level!=='quick') throw 'level '+m.level+' (untilLeave '+m.untilLeave+')';
});
t('barely any time = go now', function(){
  scene('08:00',{now:t2m('07:12')});          // 8 min until leave, under the 15 min minimum
  var m=morningStatus();
  if(m.level!=='tight') throw 'level '+m.level;
});
t('past the leave time = late, with an honest arrival estimate', function(){
  scene('08:00',{now:t2m('07:40')});          // 20 min past leaving
  var m=morningStatus();
  if(m.level!=='late') throw 'level '+m.level;
  if(m.untilLeave!==-20) throw 'untilLeave '+m.untilLeave;
  if(m2t(m.arriveAt)!=='8:20am') throw 'arrival '+m2t(m.arriveAt)+', expected 8:20am';
});
t('countdown to class is correct', function(){
  scene('08:00',{now:t2m('06:30')});
  var m=morningStatus();
  if(m.untilClass!==90) throw 'untilClass '+m.untilClass;
});
t('stops showing once the first class has ended', function(){
  __.S=normalise({subs:[{id:'a',name:'X',code:'X',ci:0}],
    slots:[{id:'s',subId:'a',day:dowOf(new Date()),kind:'th',start:'08:00',end:'09:00'}],
    planner:true,readyMin:15,readyMax:30,travelAM:40,travelMid:60,travelPM:50});
  setClock(t2m('10:00'));
  if(morningStatus()!==null) throw 'still showing after the class ended';
});

realClock();
print('\n— it stays out of the way unless you turn it on —');
t('nothing when the planner is off', function(){
  scene('08:00',{now:t2m('06:00'),state:{planner:false}});
  if(plannerReady()) throw 'planner reports ready while off';
  if(morningStatus()!==null) throw 'morning card shown with the planner off';
  var p=dayPlan(todayISO());
  if(p.leaveAt!==null||p.wakeAt!==null) throw 'invented times with the planner off';
});
t('nothing when it is on but no times are entered', function(){
  scene('08:00',{now:t2m('06:00'),
    state:{planner:true,readyMin:0,readyMax:0,travelAM:0,travelMid:0,travelPM:0}});
  if(plannerReady()) throw 'reports ready with nothing filled in';
  if(morningStatus()!==null) throw 'showed a card with no data';
});
t('Today has no planner card when it is off', function(){
  scene('08:00',{now:t2m('06:00'),state:{planner:false}});
  renderHome();
  var h=document.querySelector('#heroWrap').innerHTML;
  if(/Getting to college|Leave in/.test(h)) throw 'planner card leaked in while off';
});
t('Today shows the planner card when it is on', function(){
  scene('08:00',{now:t2m('06:00')});
  renderHome();
  var h=document.querySelector('#heroWrap').innerHTML;
  if(!/Getting to college/.test(h)) throw 'planner card missing while on';
  if(!/7:20am/.test(h)) throw 'leave time not shown';
  if(/undefined|NaN/.test(h)) throw 'card leaked undefined/NaN';
});
t('Settings hides the detail fields until enabled', function(){
  scene('08:00',{state:{planner:false}});
  (openAllGroups(),renderSettings());
  var off=document.querySelector('#setBody').innerHTML;
  if(/Leaving before 9am/.test(off)) throw 'travel bands visible while off';
  __.S.planner=true; (openAllGroups(),renderSettings());
  var on=document.querySelector('#setBody').innerHTML;
  if(!/Leaving before 9am/.test(on)) throw 'travel bands missing while on';
  if(!/Leaving 9am – 3pm/.test(on)) throw 'midday band missing';
  if(/undefined/.test(on)) throw 'Settings leaked undefined';
});

print('\n— driver prompt —');
t('waits for today to finish, whatever the hour', function(){
  var tmr=addDays(new Date(),1);
  __.S=normalise({subs:[{id:'a',name:'X',code:'X',ci:0}],
    slots:[{id:'s',subId:'a',day:dowOf(tmr),kind:'th',start:'08:00',end:'09:00',room:'B'},
           {id:'n',subId:'a',day:dowOf(new Date()),kind:'th',start:'16:00',end:'17:00',room:'B'}],
    planner:true,readyMin:15,readyMax:30,travelAM:40,travelMid:60,travelPM:50});
  __.S.commute='driver';
  setClock(9*60);  renderHome();
  var morning=document.querySelector('#heroWrap').innerHTML;
  setClock(17*60+10); renderHome();
  var after=document.querySelector('#heroWrap').innerHTML;
  realClock();
  if(/Tell your driver/.test(morning)) throw 'departure prompt shown at 9am';
  if(!/Tell your driver/.test(after)) throw 'departure prompt missing once today ended';
  if(!/7:20am/.test(after)) throw 'pickup time wrong';
});
t('a free day promotes the next class day straight away', function(){
  var tmr=addDays(new Date(),1);
  __.S=normalise({subs:[{id:'a',name:'X',code:'X',ci:0}],
    slots:[{id:'s',subId:'a',day:dowOf(tmr),kind:'th',start:'08:00',end:'09:00',room:'B'}],
    planner:true,readyMin:15,readyMax:30,travelAM:40,travelMid:60,travelPM:50});
  __.S.commute='driver';
  setClock(9*60); renderHome();
  var h=document.querySelector('#heroWrap').innerHTML;
  realClock();
  if(!/Tell your driver/.test(h)) throw 'nothing today, yet tomorrow was not promoted';
});

print('\n— old saves —');
t('a save from before the toggle keeps working', function(){
  var old={subs:[{id:'a',name:'Old',code:'OS'}],slots:[],marks:{},att:{},dls:[],
           thr:67,theme:'auto',tone:'friendly',tab:'home', ready:45, travel:40};
  var f=normalise(old);
  if(f.planner!==true) throw 'planner not auto-enabled for someone who had set it up';
  if(f.readyMax!==45) throw 'readyMax '+f.readyMax+', expected the saved 45';
  if(f.travelAM!==40||f.travelMid!==40||f.travelPM!==40) throw 'travel not seeded into all bands';
});
t('a save with no morning data leaves the planner off', function(){
  var f=normalise({subs:[],slots:[],marks:{},att:{},dls:[],thr:67});
  if(f.planner!==false) throw 'planner switched itself on unprompted';
});
t('no undefined leaked', function(){ if(LOG.length) throw LOG.length+' leak(s): '+LOG[0]; });

print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
