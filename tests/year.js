/* Use the app for a year.
   Not "call every function once" — live a term in it: wake up, look at
   Today, mark what happens, plan a day off, take leave, set a goal, drift,
   recover. Every screen is rendered at every step and every invariant is
   checked, so a contradiction anywhere shows up as the day it appeared. */
var app=readFile('tests/app.js').replace("'use strict';",'');
app+=';globalThis.__=({get S(){return S},set S(v){S=v},get ttDate(){return ttDate},set ttDate(v){ttDate=v}});'+
 'globalThis.addDays=addDays;globalThis.isoOf=isoOf;globalThis.dateOf=dateOf;globalThis.dowOf=dowOf;'+
 'globalThis.todayISO=todayISO;globalThis.normalise=normalise;globalThis.markKey=markKey;globalThis.t2m=t2m;'+
 'globalThis.m2t=m2t;globalThis.liveSlots=liveSlots;globalThis.attFor=attFor;globalThis.pctOf=pctOf;'+
 'globalThis.showTab=showTab;globalThis.renderAll=renderAll;globalThis.morningStatus=morningStatus;'+
 'globalThis.homewardStatus=homewardStatus;globalThis.goalOverall=goalOverall;globalThis.weekPlan=weekPlan;'+
 'globalThis.runShortcut=runShortcut;globalThis.absenceRange=absenceRange;globalThis.setPlan=setPlan;'+
 'globalThis.dayOptions=dayOptions;globalThis.earliestGoalDate=earliestGoalDate;'+
 'globalThis.sheetWorthGoing=sheetWorthGoing;globalThis.sheetLeave=sheetLeave;globalThis.sheetGoal=sheetGoal;'+
 'globalThis.sheetWeekPlan=sheetWeekPlan;globalThis.sheetPickDay=sheetPickDay;globalThis.sheetCatchUp=sheetCatchUp;'+
 'globalThis.leaveApplication=leaveApplication;globalThis.nowMin=nowMin;';
var REAL=Date, FAKE=null;
function at(iso,mins){
  var base=new REAL(iso+'T00:00:00');
  base.setHours(Math.floor(mins/60), mins%60, 0, 0);
  FAKE=base.getTime();
  function D(a,b,c,d,e,f){
    if(arguments.length===0) return new REAL(FAKE);
    if(arguments.length===1) return new REAL(a);
    return new REAL(a,b,c,d,e,f); }
  D.now=function(){return FAKE;};
  D.parse=REAL.parse; D.UTC=REAL.UTC; D.prototype=REAL.prototype;
  globalThis.Date=D;
}
function real(){ globalThis.Date=REAL; }
var ok=0,fail=0;
function t(n,f){ try{ f(); print('  PASS  '+n); ok++; }
  catch(e){ print('  FAIL  '+n+' :: '+e); fail++; } finally{ real(); } }
(0,eval)(app);

/* a real-shaped timetable: 5 subjects, 14 classes a week, one online */
var SUBS=[['ma','management accounting','MA'],['au','auditing','AU'],
          ['eco','development economics','ECO'],['fa','finance for everyone','FA'],
          ['tl','tax law','TL']];
var GRID=[[1,'ma','09:00'],[1,'au','12:00'],[1,'fa','14:00'],
          [2,'ma','08:00'],[2,'eco','10:00'],[2,'tl','12:00'],
          [3,'au','09:00'],[3,'fa','11:00'],[3,'eco','16:00',true],
          [4,'tl','09:00'],[4,'ma','11:00'],[4,'au','13:00'],
          [5,'eco','10:00'],[5,'fa','12:00']];
var START='2026-01-05';                       /* a Monday */
var END  ='2026-12-18';
function fresh(){
  __.S=normalise({
    subs:SUBS.map(function(x,i){return {id:x[0],name:x[1],code:x[2],ci:i};}),
    slots:GRID.map(function(x,i){
      return {id:'g'+i, subId:x[1], day:x[0], kind:i%5===0?'pr':i%3===0?'tu':'th',
              start:x[2], end:(+x[2].slice(0,2)+1)+':00',
              room:'R-'+(i+1), online:!!x[3]}; }),
    planner:true, readyMin:15, readyMax:30,
    travelAM:40, travelMid:60, travelPM:50, commute:'driver',
    thr:67, goal:0, termEnd:END, name:'Saksham Panchal', roll:'21/1234',
    course:'B.Com (Hons)', college:'SBSC'});
}
/* a cheap deterministic dice, so a failure is reproducible */
var seed=7;
function rnd(){ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; }

function screens(){
  return ['heroWrap','homeTiles','homeClasses','homeNext','homeDue','homeWeek',
          'attTop','attList','attMonths','ttBody','dueBody','calBody','setBody']
    .map(function(i){var e=document.querySelector('#'+i);return e?e.innerHTML:'';}).join('\n');
}
function plain(h){ return h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); }

var problems=[];
function audit(iso,mins,where){
  var h=screens();
  var bad=h.match(/undefined|NaN|\[object|Infinity|null%/);
  if(bad) problems.push(iso+' '+m2t(mins)+' '+where+': '+bad[0]);
  var p=plain(h);
  /* percentages must be inside the possible range */
  var pcts=p.match(/-?\d+(\.\d+)?%/g)||[];
  for(var i=0;i<pcts.length;i++){
    var v=parseFloat(pcts[i]);
    if(v<0||v>100) problems.push(iso+' '+where+': impossible percentage '+pcts[i]);
  }
  /* you cannot be travelling and in the room at once */
  if(/In class now/.test(p) && /Getting to college|On your way/.test(p))
    problems.push(iso+' '+m2t(mins)+': in class and travelling');
  /* nor be done and pending at once */
  if(/That’s your day done/.test(p) && /Next up|Online in/.test(p))
    problems.push(iso+' '+m2t(mins)+': done and pending');
}

print('— a year in the app —');
t('365 days, five screens a day, nothing contradicts itself', function(){
  fresh();
  var d=dateOf(START), days=0, marks=0;
  for(var i=0;i<365;i++){
    var iso=isoOf(d);
    var todays=liveSlots(iso);
    /* morning: check Today before leaving */
    at(iso, 7*60+10); renderAll(); audit(iso,7*60+10,'morning');
    if(todays.length){
      /* say you're on your way about a third of the time */
      if(rnd()<0.34) runShortcut('?do=enroute');
      at(iso, 8*60+30); renderAll(); audit(iso,8*60+30,'leaving');
      /* live the day: mark each class as it ends */
      todays.forEach(function(sl){
        var end=t2m(sl.end);
        at(iso, Math.min(end+5, 23*60+30));
        var r=rnd();
        var mark = r<0.72 ? 'p' : r<0.90 ? 'a' : 'c';
        __.S.marks[markKey(iso,sl)]=mark; marks++;
        if(mark==='p') __.S.enroute=null;
        renderAll(); audit(iso, Math.min(end+5,23*60+30), 'after marking');
      });
      at(iso, 18*60); renderAll(); audit(iso,18*60,'evening');
      days++;
    }
    /* once a fortnight, look at the other tabs properly */
    if(i%14===0){
      ['attendance','timetable','due','calendar','settings'].forEach(function(tab){
        at(iso, 20*60); showTab(tab); renderAll(); audit(iso,20*60,tab);
      });
      showTab('home');
    }
    d=addDays(d,1);
  }
  if(problems.length) throw problems.length+' problem(s), first: '+problems[0];
  if(days<180) throw 'only '+days+' teaching days in a year';
  /* 14 a week over 52 weeks is 728 — anything far below means the
     simulation stopped living the year somewhere */
  if(marks<700) throw 'only '+marks+' classes marked';
});

print('\n— the numbers still add up after a year —');
t('every subject total equals what was actually marked', function(){
  var tot=0;
  __.S.subs.forEach(function(sb){
    var A=attFor(sb.id);
    if(A.p+A.a!==A.t) throw sb.code+': '+A.p+'+'+A.a+' != '+A.t;
    if(A.t!==A.th.t+A.tu.t+A.pr.t) throw sb.code+': kinds do not sum to the total';
    tot+=A.t;
  });
  var counted=0;
  Object.keys(__.S.marks).forEach(function(k){ if(__.S.marks[k]!=='c') counted++; });
  if(tot!==counted) throw 'totals '+tot+' vs '+counted+' non-cancelled marks';
});
t('no percentage escaped its range across the whole year', function(){
  __.S.subs.forEach(function(sb){
    var A=attFor(sb.id), p=pctOf(A.p,A.t);
    if(p<0||p>100) throw sb.code+' sits at '+p+'%';
  });
});

print('\n— the features hold up mid-term —');
t('a goal set in March behaves all the way to December', function(){
  fresh();
  /* march: half a term of marks already on the record */
  var d=dateOf(START);
  for(var i=0;i<60;i++){
    var iso=isoOf(d);
    liveSlots(iso).forEach(function(sl){
      __.S.marks[markKey(iso,sl)]= rnd()<0.68?'p':'a'; });
    d=addDays(d,1);
  }
  at(isoOf(d), 9*60);
  __.S.goal=75;
  var g=goalOverall();
  if(!g) throw 'no goal status';
  var e=earliestGoalDate(75);
  if(g.phase==='climb' && !e.iso && e.need>0 && !e.never)
    throw 'climbing to a goal with no date it can land on';
  var w=weekPlan();
  if(!w) throw 'no week plan';
  if(w.endsAt < (w.reachable?74.9:0)) throw 'the plan does not reach the goal';
  var att=0, cls=0;
  w.weeks.forEach(function(x){ att+=x.attend||0; cls+=x.classes; });
  if(att+ (w.misses) !== cls) throw 'week arithmetic drifted over a term';
});
t('a week off in October is costed correctly', function(){
  var from='2026-10-05', to='2026-10-11';
  var r=absenceRange(from,to);
  if(!r) throw 'no range';
  var manual=0, d=dateOf(from);
  while(d<=dateOf(to)){ var iso=isoOf(d);
    manual+=liveSlots(iso).filter(function(sl){return !__.S.marks[markKey(iso,sl)];}).length;
    d=addDays(d,1); }
  if(r.total!==manual) throw 'counted '+r.total+', actually '+manual;
  if(r.overallAfter>r.overallNow) throw 'missing classes raised the percentage';
});
t('the leave letter still comes out clean after a year of data', function(){
  var m=leaveApplication('2026-10-05','2026-10-11','med','typhoid','');
  if(/undefined|NaN|\[object/.test(m)) throw 'leaked into the letter';
  if(m.indexOf('Saksham Panchal')<0) throw 'unsigned';
  if(m.length<300) throw 'stub letter';
});
t('every sheet opens on a year-old state', function(){
  at('2026-10-06', 9*60);
  [['worth going',function(){sheetWorthGoing(todayISO());}],
   ['leave',      function(){sheetLeave();}],
   ['goal',       function(){sheetGoal();}],
   ['weeks',      function(){sheetWeekPlan();}],
   ['pick a day', function(){sheetPickDay(todayISO());}],
   ['catch up',   function(){sheetCatchUp();}]].forEach(function(x){
    x[1]();
    var h=document.querySelector('#sheetBody').innerHTML;
    if(!h||h.length<40) throw x[0]+' opened empty';
    if(/undefined|NaN|\[object/.test(h)) throw x[0]+' leaked: '+
      h.match(/undefined|NaN|\[object/)[0];
  });
});
t('worth-going options stay coherent on a real day', function(){
  at('2026-10-06', 7*60);
  var x=dayOptions(todayISO());
  if(x){
    x.opts.forEach(function(o){
      if(o.dead<0) throw 'negative waiting time';
      if(o.onCampus<o.contact-o.onlineCount*60-1) throw 'contact exceeds time on campus';
      if(o.count>x.all.length) throw 'attending more classes than exist';
    });
  }
});
print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
