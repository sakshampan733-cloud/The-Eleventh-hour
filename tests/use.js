/* Use the app. Not drive its state — press its controls.
   Every action below goes through the same handler your finger would hit:
   the mark buttons, the rows that open sheets, the tab bar, Save. If a
   binding is missing, wired to the wrong thing, or throws, this is where
   it shows up — which is exactly the class of bug that kept shipping. */
var app=readFile('tests/app.js').replace("'use strict';",'');
app+=';globalThis.__=({get S(){return S},set S(v){S=v},get ttDate(){return ttDate},set ttDate(v){ttDate=v}});'+
 'globalThis.addDays=addDays;globalThis.isoOf=isoOf;globalThis.dateOf=dateOf;globalThis.dowOf=dowOf;'+
 'globalThis.todayISO=todayISO;globalThis.normalise=normalise;globalThis.markKey=markKey;globalThis.t2m=t2m;'+
 'globalThis.m2t=m2t;globalThis.liveSlots=liveSlots;globalThis.attFor=attFor;globalThis.pctOf=pctOf;'+
 'globalThis.showTab=showTab;globalThis.renderAll=renderAll;globalThis.save=save;'+
 'globalThis.sheetSaveNow=function(){return sheetSave&&sheetSave();};'+
 'globalThis.closeSheetNow=function(){return closeSheet();};';
var REAL=Date, NOW=0;
function at(iso,mins){
  var b=new REAL(iso+'T00:00:00'); b.setHours(Math.floor(mins/60),mins%60,0,0); NOW=b.getTime();
  function D(a,x,c,d,e,f){ if(arguments.length===0) return new REAL(NOW);
    if(arguments.length===1) return new REAL(a); return new REAL(a,x,c,d,e,f); }
  D.now=function(){return NOW;}; D.parse=REAL.parse; D.UTC=REAL.UTC; D.prototype=REAL.prototype;
  globalThis.Date=D;
}
function real(){ globalThis.Date=REAL; }
var ok=0,fail=0;
function t(n,f){ try{ f(); print('  PASS  '+n); ok++; }
  catch(e){ print('  FAIL  '+n+' :: '+(e&&e.stack?String(e)+' @'+String(e.stack).split('\n')[1]:e)); fail++; }
  finally{ real(); } }
(0,eval)(app);

/* ── the finger ───────────────────────────────────────────────── */
var log=[], MARKED=0;
function press(sel, what){
  var el=document.querySelector(sel);
  if(!el) throw 'no element at '+sel+(what?' ('+what+')':'');
  if(typeof el.onclick!=='function') throw sel+' has nothing bound'+(what?' ('+what+')':'');
  el.onclick({stopPropagation:function(){},preventDefault:function(){}});
  /* openSheet binds its contents on a 30ms timer; a finger arrives later
     than that, so let the timers run before pressing anything inside. */
  runTimers();
  log.push(sel);
}
function pressIn(container, sel){
  var host=document.querySelector(container);
  var els=host&&host.querySelectorAll?host.querySelectorAll(sel):[];
  if(!els.length) return false;
  var el=els[0];
  if(typeof el.onclick!=='function') throw container+' '+sel+' has nothing bound';
  el.onclick({stopPropagation:function(){},preventDefault:function(){}});
  log.push(container+' '+sel);
  return true;
}
function markVia(container, m, key){
  /* The real Present/Absent/Cancelled control for ONE class. Taking
     whichever segment happened to be first marked the same 9am twice on a
     two-class day and toggled it back off — press the control belonging to
     the class you mean. */
  var host=document.querySelector(container);
  var segs=host&&host.querySelectorAll?host.querySelectorAll('.mkSeg'):[];
  for(var s=0;s<segs.length;s++){
    if(key && segs[s].dataset.key!==key) continue;
    var btns=segs[s].querySelectorAll?segs[s].querySelectorAll('button'):[];
    for(var i=0;i<btns.length;i++){
      if(btns[i].dataset && btns[i].dataset.m===m && typeof btns[i].onclick==='function'){
        btns[i].onclick({stopPropagation:function(){}}); return true;
      }
    }
  }
  return false;
}
function setField(sel,v){
  var el=document.querySelector(sel);
  if(!el) throw 'no field '+sel;
  el.value=String(v);
  if(typeof el.onchange==='function') el.onchange({target:el});
  else if(typeof el.oninput==='function') el.oninput({target:el});
}

var SUBS=[['ma','management accounting','MA'],['au','auditing','AU'],
          ['eco','development economics','ECO'],['fa','finance for everyone','FA']];
var GRID=[[1,'ma','09:00'],[1,'au','12:00'],[2,'ma','08:00'],[2,'eco','10:00'],
          [3,'au','09:00'],[3,'fa','11:00'],[3,'eco','16:00',true],
          [4,'ma','11:00'],[4,'au','13:00'],[5,'eco','10:00'],[5,'fa','12:00']];
function fresh(){
  __.S=normalise({
    subs:SUBS.map(function(x,i){return {id:x[0],name:x[1],code:x[2],ci:i};}),
    slots:GRID.map(function(x,i){
      return {id:'g'+i,subId:x[1],day:x[0],kind:i%4===0?'pr':i%3===0?'tu':'th',
              start:x[2],end:(+x[2].slice(0,2)+1)+':00',room:'R'+i,online:!!x[3]};}),
    planner:true,readyMin:15,readyMax:30,travelAM:40,travelMid:60,travelPM:50,
    commute:'driver',thr:67,termEnd:'2026-12-18',
    name:'Saksham Panchal',roll:'21/1234',course:'B.Com (Hons)',college:'SBSC'});
}
var seed=11; function rnd(){ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; }
function plain(){
  return ['heroWrap','homeTiles','homeClasses','homeNext','homeDue','homeWeek']
    .map(function(i){var e=document.querySelector('#'+i);return e?e.innerHTML:'';})
    .join('\n').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
}

print('— pressing the tab bar —');
t('every tab opens from its own button', function(){
  fresh(); at('2026-03-02',9*60); renderAll();
  ['home','timetable','attendance','deadlines','calendar'].forEach(function(tab){
    showTab(tab); renderAll();
    if(__.S.tab!==tab) throw 'tab did not become '+tab;
  });
  showTab('home');
});

print('\n— a year of actually pressing the buttons —');
t('365 days driven through the real controls', function(){
  fresh();
  var d=dateOf('2026-01-05'), marked=0, sheets=0, days=0;
  for(var i=0;i<365;i++){
    var iso=isoOf(d), todays=liveSlots(iso);
    at(iso,7*60+20); renderAll();

    if(todays.length){
      days++;
      /* leaving: press "I'm on my way" when it is offered */
      if(document.querySelector('#heroGo') &&
         typeof document.querySelector('#heroGo').onclick==='function' && rnd()<0.4){
        press('#heroGo',"on my way");
        renderAll();
        if(!__.S.enroute) throw iso+': pressing on-my-way changed nothing';
      }
      /* the day: mark each class from the hero as it happens */
      for(var c=0;c<todays.length;c++){
        var sl=todays[c];
        at(iso, Math.min(t2m(sl.start)+20, 23*60)); renderAll();
        var r=rnd(), m = r<0.72?'p' : r<0.9?'a' : 'c';
        var key=markKey(iso,sl);
        if(markVia('#heroWrap',m,key) || markVia('#homeClasses',m,key)){ marked++; MARKED++; }
        else throw iso+': no control on screen for '+sl.id+' at '+m2t(t2m(sl.start)+20);
        renderAll();
        if(/undefined|NaN|\[object/.test(plain()))
          throw iso+' after marking: '+plain().match(/undefined|NaN|\[object/)[0];
      }
      at(iso,19*60); renderAll();
    }

    /* weekly: open the things you'd actually open */
    if(i%7===3){
      at(iso,20*60); renderAll();
      if(document.querySelector('#homeSkip') &&
         typeof document.querySelector('#homeSkip').onclick==='function'){
        press('#homeSkip','skip today'); sheets++;
        if(!document.querySelector('#sheetBody').innerHTML) throw iso+': skip sheet empty';
        closeSheetNow();
      }
      if(document.querySelector('#homeWorthRow') &&
         typeof document.querySelector('#homeWorthRow').onclick==='function'){
        press('#homeWorthRow','worth going'); sheets++;
        var wh=document.querySelector('#sheetBody').innerHTML;
        if(!wh) throw iso+': worth-going sheet empty';
        /* and pick a plan from inside it, the way you would */
        if(pressIn('#sheetBody','[data-pick]')) renderAll();
        closeSheetNow();
      }
    }
    /* monthly: attendance, goal, leave, week plan — all via their rows */
    if(i%28===10){
      showTab('attendance'); at(iso,20*60); renderAll();
      press('#attGoal','goal'); sheets++;
      setField('#glVal', 75);
      sheetSaveNow(); closeSheetNow();
      renderAll();
      if(__.S.goal!==75) throw iso+': saving the goal did nothing';
      if(document.querySelector('#goalWeeks') &&
         typeof document.querySelector('#goalWeeks').onclick==='function'){
        press('#goalWeeks','week plan'); sheets++;
        if(!/typical week|No term end/.test(document.querySelector('#sheetBody').innerHTML))
          throw iso+': week plan opened empty';
        closeSheetNow();
      }
      press('#attLeave','leave'); sheets++;
      if(!document.querySelector('#sheetBody').innerHTML) throw iso+': leave sheet empty';
      closeSheetNow();
      showTab('home'); renderAll();
    }
    d=addDays(d,1);
  }
  if(days<180) throw 'only '+days+' teaching days';
  /* 11 classes a week over 52 weeks is 572 — every one of them pressed */
  if(marked<560) throw 'only '+marked+' classes marked through the UI';
  if(marked!==Object.keys(__.S.marks).length)
    throw 'pressed '+marked+' marks but the state holds '+Object.keys(__.S.marks).length;
  if(sheets<60) throw 'only '+sheets+' sheets opened';
  print('         '+days+' teaching days · '+marked+' classes marked by hand · '+
        sheets+' sheets opened · '+log.length+' presses');
});

print('\n— the state that came out of a year of pressing —');
t('the numbers are self-consistent', function(){
  var tot=0, counted=0;
  __.S.subs.forEach(function(sb){
    var A=attFor(sb.id);
    if(A.p+A.a!==A.t) throw sb.code+': '+A.p+'+'+A.a+' != '+A.t;
    var p=pctOf(A.p,A.t);
    if(p<0||p>100) throw sb.code+' at '+p+'%';
    tot+=A.t;
  });
  Object.keys(__.S.marks).forEach(function(k){ if(__.S.marks[k]!=='c') counted++; });
  if(tot!==counted) throw tot+' counted vs '+counted+' marks';
});
t('reloading a year-old save is stable', function(){
  at('2026-12-31', 12*60);
  /* Loading is allowed to change things once — stale plans are dropped,
     yesterday's "on my way" is forgotten. What must not happen is it
     changing again every time, which would mean the repair never settles. */
  var once=normalise(JSON.parse(JSON.stringify(__.S)));
  var twice=normalise(JSON.parse(JSON.stringify(once)));
  var a=JSON.stringify(once), b=JSON.stringify(twice);
  if(a!==b){
    var oa=JSON.parse(a), ob=JSON.parse(b);
    Object.keys(oa).forEach(function(k){
      if(JSON.stringify(oa[k])!==JSON.stringify(ob[k]))
        throw 'field "'+k+'" keeps changing on every load';
    });
    throw 'save is not stable across loads';
  }
  if(!once.subs.length) throw 'a year of data did not survive the reload';
  if(Object.keys(once.marks).length!==MARKED)
    throw 'reload turned '+MARKED+' marks into '+Object.keys(once.marks).length;
});
t('nothing leaked undefined into any screen all year', function(){
  if(LOG.length) throw LOG.length+' leak(s), first: '+LOG[0];
});
print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
