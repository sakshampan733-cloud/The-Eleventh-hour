var app=readFile('tests/app.js').replace("'use strict';",'');
app+=';globalThis.__=({get S(){return S},set S(v){S=v}});globalThis.addDays=addDays;globalThis.isoOf=isoOf;'+
 'globalThis.dowOf=dowOf;globalThis.todayISO=todayISO;globalThis.normalise=normalise;globalThis.markKey=markKey;'+
 'globalThis.goalFor=goalFor;globalThis.goalOverall=goalOverall;globalThis.bestFraction=bestFraction;'+
 'globalThis.goalCardHTML=goalCardHTML;globalThis.marginHTML=marginHTML;globalThis.sheetGoal=sheetGoal;globalThis.pctOf=pctOf;'+
 'globalThis.attFor=attFor;globalThis.remainingBySub=remainingBySub;globalThis.doSave=function(){return sheetSave&&sheetSave();};';
var ok=0,fail=0;
function t(n,f){ try{ f(); print('  PASS  '+n); ok++; }catch(e){ print('  FAIL  '+n+' :: '+e); fail++; } }
(0,eval)(app);
var TD=dowOf(new Date());
/* one class a day, every day — makes the arithmetic checkable by hand */
function setup(att, goal, weeks){
  __.S=normalise({
    subs:[{id:'a',name:'Cost Accounting',code:'CA',ci:0}],
    slots:[0,1,2,3,4,5,6].map(function(d){
      return {id:'w'+d,subId:'a',day:d,kind:'th',start:'10:00',end:'11:00'};}),
    thr:67, goal:goal||0, att:{a:att},
    termEnd:isoOf(addDays(new Date(),(weeks||10)*7-1))});
}

print('— the rhythm that holds a number still —');
t('75% is three of every four', function(){
  var f=bestFraction(0.75,8);
  if(f.n!==3||f.d!==4) throw 'got '+f.n+' of '+f.d;
});
t('two thirds is two of every three', function(){
  var f=bestFraction(2/3,8);
  if(f.n!==2||f.d!==3) throw 'got '+f.n+' of '+f.d;
});
t('80% is four of five', function(){
  var f=bestFraction(0.8,8);
  if(f.n!==4||f.d!==5) throw 'got '+f.n+' of '+f.d;
});
t('it never suggests "all of them" or "none of them"', function(){
  [0.02,0.05,0.97,0.99].forEach(function(x){
    var f=bestFraction(x,8);
    if(f && (f.n===0||f.n===f.d)) throw x+' gave '+f.n+' of '+f.d;
  });
});
t('the rhythm actually holds the number still', function(){
  /* attend n of every d, d classes at a time, and the percentage must not move */
  var p=60,t0=80;                       /* 75% */
  var f=bestFraction(p/t0,8);
  var before=pctOf(p,t0);
  for(var i=0;i<10;i++){ p+=f.n; t0+=f.d; }
  var after=pctOf(p,t0);
  if(Math.abs(after-before)>0.001) throw before+'% drifted to '+after+'%';
});

print('\n— climbing to a goal —');
t('it says how many of the remaining classes you must attend', function(){
  setup({thp:30,tha:20}, 75, 10);        /* 60%, 30/50 */
  var g=goalOverall();
  if(g.phase!=='climb') throw 'phase '+g.phase;
  var k=g.remaining;
  /* need x where (30+x)/(50+k) >= 0.75 */
  var want=Math.ceil(0.75*(50+k)-30-1e-9);
  if(g.need!==want) throw 'need '+g.need+', expected '+want;
  if(g.slack!==k-want) throw 'slack '+g.slack;
});
t('attending exactly that many lands you on the goal', function(){
  setup({thp:30,tha:20}, 75, 10);
  var g=goalOverall();
  var end=pctOf(30+g.need, 50+g.remaining);
  if(end<75) throw 'attending '+g.need+' lands at '+end+'%';
  if(g.need>0 && pctOf(30+g.need-1, 50+g.remaining)>=75)
    throw 'one fewer would have done — need is not minimal';
});
t('an impossible goal is called impossible, with the best you can do', function(){
  setup({thp:5,tha:95}, 90, 4);          /* 5%, only 4 weeks left */
  var g=goalOverall();
  if(g.reachable) throw 'claimed 90% was reachable from 5%';
  if(g.best===undefined) throw 'no best-case figure';
  if(g.best>=90) throw 'best '+g.best+' contradicts unreachable';
});
t('a goal you have already passed flips to holding', function(){
  setup({thp:45,tha:5}, 75, 10);         /* 90% */
  var g=goalOverall();
  if(g.phase!=='hold') throw 'phase '+g.phase+' at 90% with a 75% goal';
  if(!g.rhythm) throw 'no rhythm to hold by';
});
t('holding tells you how many you may miss', function(){
  setup({thp:45,tha:5}, 75, 10);
  var g=goalOverall();
  var k=g.remaining;
  var want=k-Math.max(0,Math.ceil(0.75*(50+k)-45-1e-9));
  if(g.slack!==want) throw 'slack '+g.slack+', expected '+want;
  /* and spending exactly that many still leaves you at the goal */
  if(pctOf(45, 50+k)<75 && g.slack===k) throw 'slack lets you fall below';
});
t('missing one more than the slack does drop you below', function(){
  setup({thp:45,tha:5}, 75, 10);
  var g=goalOverall(), k=g.remaining;
  var atLimit=pctOf(45+(k-g.slack), 50+k);
  var overLimit=pctOf(45+(k-g.slack-1), 50+k);
  if(atLimit<75) throw 'spending the whole slack already drops you: '+atLimit;
  if(g.slack<k && overLimit>=75) throw 'the slack is understated';
});

print('\n— no goal, no noise —');
t('with no goal set nothing is computed', function(){
  setup({thp:30,tha:20}, 0, 10);
  if(goalOverall()!==null) throw 'computed a goal when none was set';
  if(goalFor('a',10)!==null) throw 'per-subject goal computed with none set';
  if(goalCardHTML()!=='') throw 'drew a card with no goal';
});
t('with no term date it says so instead of guessing', function(){
  setup({thp:30,tha:20}, 75, 10);
  __.S.termEnd='';
  var g=goalOverall();
  if(!g.unknown) throw 'not flagged unknown';
  if(g.need!==undefined) throw 'invented a class count with no term date';
  var h=goalCardHTML();
  if(!/term end date/.test(h)) throw 'card does not say what is missing';
});

print('\n— the card —');
t('climbing reads as climbing', function(){
  setup({thp:30,tha:20}, 75, 10);
  var h=goalCardHTML();
  if(!/climbing/.test(h)) throw 'not labelled climbing';
  if(/holding/.test(h)) throw 'says holding while below the goal';
  if(!/Attend <b[^>]*>\d+<\/b> of the/.test(h)) throw 'no count of what it takes';
  if(/undefined|NaN/.test(h)) throw 'leaked';
});
t('holding reads as holding and names the rhythm', function(){
  setup({thp:45,tha:5}, 75, 10);
  var h=goalCardHTML();
  if(!/holding/.test(h)) throw 'not labelled holding';
  if(!/of every/.test(h)) throw 'no rhythm given';
  /* the sentence became the instrument: pips you can spend, and a count */
  if(!/class="margin/.test(h)) throw 'no margin drawn';
  if(!/to spare/.test(h)) throw 'does not say how much you can miss';
  if(/undefined|NaN/.test(h)) throw 'leaked';
});
t('the margin is counted, not a proportion', function(){
  setup({thp:45,tha:5}, 75, 10);
  var g=goalOverall(), h=goalCardHTML();
  var pips=(h.match(/<i[ >]/g)||[]).length;
  if(!pips) throw 'no pips drawn';
  if(pips>14) throw pips+' pips — should be capped';
  var spent=(h.match(/class="spent"/g)||[]).length;
  if(spent>pips) throw 'more spent than drawn';
  if(!new RegExp('>'+g.slack+' to spare').test(h))
    throw 'the count does not match the slack ('+g.slack+')';
});
t('no margin to spend is drawn as none, in red', function(){
  setup({thp:30,tha:20}, 75, 10);       /* climbing, needs everything */
  var g=goalOverall();
  var h=marginHTML(0, 10, 'var(--red)');
  if(!/none to spare/.test(h)) throw 'does not say none';
  if(!/margin none/.test(h)) throw 'not flagged as none';
  if(/(?<!class="spent")<i>/.test(h.replace(/class="spent"/g,'X'))) {}
});
t('an unreachable goal says so plainly', function(){
  setup({thp:5,tha:95}, 90, 4);
  var h=goalCardHTML();
  if(!/out of reach/.test(h)) throw 'not flagged';
  if(!/attending every one/.test(h)) throw 'does not say what the best case is';
});
t('the goal never overrides the minimum', function(){
  setup({thp:5,tha:95}, 90, 4);
  var h=goalCardHTML();
  if(!new RegExp(__.S.thr+'%').test(h)) throw 'the real minimum is not mentioned';
});

print('\n— setting it —');
t('"hold me here" pins the goal to where you are', function(){
  setup({thp:45,tha:5}, 0, 10);          /* 90%, no goal */
  sheetGoal(); runTimers();                 /* sheet bindings land on a timer */
  var nw=document.querySelector('#glNow');
  if(!nw) throw 'no hold-me-here shortcut';
  if(typeof nw.onclick!=='function') throw 'the shortcut is not wired';
  nw.onclick();
  document.querySelector('#glVal').value=document.querySelector('#glVal').value;
  doSave();
  if(__.S.goal!==90) throw 'goal set to '+__.S.goal+', expected 90';
  if(goalOverall().phase!=='hold') throw 'not holding straight after pinning';
});
t('pinning where you are means you may still miss some', function(){
  setup({thp:45,tha:5}, 90, 10);
  var g=goalOverall();
  if(g.slack<0) throw 'negative slack';
  if(g.phase!=='hold') throw 'phase '+g.phase;
});
t('zero clears it', function(){
  setup({thp:45,tha:5}, 80, 10);
  sheetGoal(); runTimers();
  document.querySelector('#glVal').value='0';
  doSave();
  if(__.S.goal!==0) throw 'goal is '+__.S.goal;
  if(goalOverall()!==null) throw 'still computing after being cleared';
});
t('an out-of-range number is clamped, not accepted', function(){
  setup({thp:45,tha:5}, 0, 10);
  sheetGoal(); runTimers();
  document.querySelector('#glVal').value='250';
  doSave();
  if(__.S.goal>100) throw 'accepted '+__.S.goal;
});
t('a saved goal survives a reload', function(){
  setup({thp:45,tha:5}, 82, 10);
  var f=normalise(JSON.parse(JSON.stringify(__.S)));
  if(f.goal!==82) throw 'goal came back as '+f.goal;
});
t('an old save with no goal defaults to none', function(){
  var f=normalise({subs:[],slots:[],marks:{},att:{},dls:[],thr:67});
  if(f.goal!==0) throw 'goal defaulted to '+f.goal;
});

print('\n— per subject, because that is what gets checked —');
t('subjects behind the goal are named', function(){
  __.S=normalise({
    subs:[{id:'a',name:'A',code:'AA',ci:0},{id:'b',name:'B',code:'BB',ci:1}],
    slots:[{id:'s1',subId:'a',day:TD,kind:'th',start:'10:00',end:'11:00'},
           {id:'s2',subId:'b',day:TD,kind:'th',start:'11:00',end:'12:00'}],
    thr:67, goal:75, att:{a:{thp:45,tha:5}, b:{thp:10,tha:40}},
    termEnd:isoOf(addDays(new Date(),70))});
  var g=goalOverall();
  if(!g.blocking.length) throw 'the 20% subject was not flagged';
  if(g.blocking[0].sub.code!=='BB') throw 'flagged '+g.blocking[0].sub.code;
  var h=goalCardHTML();
  if(!/BB/.test(h)) throw 'not shown on the card';
  if(!/per subject/.test(h)) throw 'does not explain why it matters';
});
print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
