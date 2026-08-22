var app=readFile('tests/app.js').replace("'use strict';",'');
app+=';globalThis.__=({get S(){return S},set S(v){S=v}});'+
 'globalThis.addDays=addDays;globalThis.isoOf=isoOf;globalThis.dateOf=dateOf;globalThis.dowOf=dowOf;'+
 'globalThis.todayISO=todayISO;globalThis.markKey=markKey;globalThis.normalise=normalise;'+
 'globalThis.setPlan=setPlan;globalThis.nextClassDay=nextClassDay;globalThis.m2t=m2t;globalThis.t2m=t2m;'+
 'globalThis.subById=subById;globalThis.dayPlan=dayPlan;';
var REAL_DATE=Date;
function setClock(mins,dayOff){ dayOff=dayOff||0;
  function D(a,b,c,d,e,f){
    if(arguments.length===0){var x=new REAL_DATE();x.setDate(x.getDate()+dayOff);
      x.setHours(Math.floor(mins/60),mins%60,0,0);return x;}
    if(arguments.length===1) return new REAL_DATE(a); return new REAL_DATE(a,b,c,d,e,f); }
  D.now=REAL_DATE.now;D.parse=REAL_DATE.parse;D.UTC=REAL_DATE.UTC;D.prototype=REAL_DATE.prototype;
  globalThis.Date=D; }
function realClock(){ globalThis.Date=REAL_DATE; }
var ok=0,fail=0;
function t(n,f){ var snap=__.S;
  try{ f(); print('  PASS  '+n); ok++; }
  catch(e){ print('  FAIL  '+n+' :: '+e); fail++; __.S=snap; }
  finally{ realClock(); } }
(0,eval)(app);

var TODAY=todayISO(), DOW_T=dowOf(new Date());
var TMR=addDays(new Date(),1), TISO=isoOf(TMR), DOW_M=dowOf(TMR);
function scene(){
  __.S=normalise({
    subs:[{id:'a',name:'Cost Accounting',code:'CA',ci:0},{id:'b',name:'Stats',code:'BS',ci:1}],
    slots:[{id:'t1',subId:'a',day:DOW_T,kind:'th',start:'08:00',end:'09:00',room:'B'},
           {id:'t2',subId:'b',day:DOW_T,kind:'th',start:'12:00',end:'13:00',room:'B'},
           {id:'m1',subId:'a',day:DOW_M,kind:'th',start:'08:00',end:'09:00',room:'B'},
           {id:'m2',subId:'b',day:DOW_M,kind:'th',start:'12:00',end:'13:00',room:'B'}],
    att:{a:{thp:20,tha:10},b:{thp:20,tha:10}},
    planner:true,readyMin:15,readyMax:30,travelAM:40,travelMid:60,travelPM:50,
    remindAt:'18:00',commute:'driver',thr:67
  });
}

print('— 1. "Worth going?" must be on the home screen, not hidden —');
t('a prominent row sits near the top of Today', function(){
  scene(); setClock(10*60); renderHome();
  var top=document.querySelector('#homeTiles').innerHTML;
  if(!/homeWorthRow/.test(top)) throw 'no Worth-going row near the top';
  if(!/Worth going /.test(top)) throw 'row has no label';
});
t('it previews the answer instead of making you tap to find out', function(){
  scene(); setClock(10*60); renderHome();
  var h=document.querySelector('#homeTiles').innerHTML;
  if(!/waiting|back to back|Planned/.test(h)) throw 'no preview of the day: '+h.slice(0,200);
});
t('it also appears on the next-day card under today’s classes', function(){
  scene(); setClock(10*60); renderHome();
  if(!/nextWorth/.test(document.querySelector('#homeNext').innerHTML))
    throw 'missing from the next-day card';
});
t('the next-day card sits under the classes, not at the bottom', function(){
  var src=readFile('index.html');
  var iC=src.indexOf('id="homeClasses"'), iN=src.indexOf('id="homeNext"'),
      iD=src.indexOf('id="homeDue"'), iW=src.indexOf('id="homeWeek"');
  if(!(iC<iN && iN<iD && iD<iW)) throw 'wrong order on the page';
});

print('\n— 2. "Next up" must follow the plan, not the timetable —');
t('with no plan it points at the 8am', function(){
  scene(); setClock(6*60); renderHome();
  var h=document.querySelector('#heroWrap').innerHTML;
  if(!/Cost Accounting/.test(h)) throw 'not showing the 8am class';
});
t('planning to skip the 8am makes "Next up" the 12pm', function(){
  scene(); setPlan(TODAY,['t2']); setClock(6*60); renderHome();
  var h=document.querySelector('#heroWrap').innerHTML;
  if(/Cost Accounting/.test(h)) throw 'still pointing at the class you planned to skip';
  if(!/Stats/.test(h)) throw 'not showing the planned class';
});
t('the skipped class is still listed, but marked as skipped', function(){
  scene(); setPlan(TODAY,['t2']); setClock(6*60); renderHome();
  var h=document.querySelector('#homeClasses').innerHTML;
  if(!/Cost Accounting/.test(h)) throw 'skipped class vanished from the list';
  if(!/skipping by plan/.test(h)) throw 'not labelled as skipped';
});

print('\n— 3. the wake-up time, for the right day —');
t('tomorrow’s card shows a wake time with the day named', function(){
  scene(); setClock(20*60); renderHome();      /* today is finished */
  var h=document.querySelector('#homeNext').innerHTML;
  if(!/Wake by/.test(h)) throw 'no wake time for tomorrow';
  if(!/Tomorrow ·/.test(h)) throw 'the day is not named';
});
t('today’s card never shows a wake time for a class that has been and gone', function(){
  scene(); setClock(10*60); renderHome();      /* the 8am is history */
  var h=document.querySelector('#homeNext').innerHTML;
  if(/Wake by|Pickup at/.test(h))
    throw 'stale departure shown at 10am: '+h.replace(/<[^>]+>/g,' ').slice(0,90);
  if(!/Later today/.test(h)) throw 'today’s card vanished entirely';
  if(!/nextWorth/.test(h)) throw 'lost the buttons';
});
t('later today counts as today, not tomorrow', function(){
  scene(); setClock(6*60);                 // before both of today's classes
  var nd=nextClassDay();
  if(nd.offset!==0) throw 'skipped past today (offset '+nd.offset+')';
  renderHome();
  if(!/Later today/.test(document.querySelector('#homeNext').innerHTML))
    throw 'not labelled as today';
});
t('once today is over it moves to tomorrow and says so', function(){
  scene(); setClock(20*60);                // after both of today's classes
  var nd=nextClassDay();
  if(nd.offset!==1) throw 'expected tomorrow, got offset '+nd.offset;
  renderHome();
  var h=document.querySelector('#homeNext').innerHTML;
  if(!/Tomorrow ·/.test(h)) throw 'not labelled as tomorrow';
  if(!/Wake by/.test(h)) throw 'no wake time for tomorrow';
});
t('the wake time matches the planned class, not the first one', function(){
  scene(); setPlan(TISO,['m2']); setClock(20*60);
  var nd=nextClassDay(), p=nd.plan;
  if(m2t(p.leaveAt)!=='11am') throw 'leave '+m2t(p.leaveAt)+', expected 11am';
  if(m2t(p.wakeAt)!=='10:30am') throw 'wake '+m2t(p.wakeAt)+', expected 10:30am';
  renderHome();
  var h=document.querySelector('#homeNext').innerHTML;
  if(!/10:30am/.test(h)) throw 'card shows the wrong wake time';
});
t('it skips a free day and finds the real next class day', function(){
  scene();
  __.S.slots=__.S.slots.filter(function(s){return s.day!==DOW_M;});  // nothing tomorrow
  setClock(20*60);
  var nd=nextClassDay();
  if(!nd) throw 'found no upcoming class day';
  if(nd.offset<2) throw 'did not skip the empty day';
  renderHome();
  if(!/Wake by|First class/.test(document.querySelector('#homeNext').innerHTML))
    throw 'card empty for a later day';
});
t('no card at all when there is genuinely nothing coming', function(){
  __.S=normalise({subs:[{id:'a',name:'X',code:'X',ci:0}],slots:[],att:{},planner:true,
    readyMin:15,readyMax:30,travelAM:40});
  renderHome();
  if(document.querySelector('#homeNext').innerHTML) throw 'card shown with no classes at all';
});
t('nothing leaked', function(){ if(LOG.length) throw LOG.length+' leak(s): '+LOG[0]; });

print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
