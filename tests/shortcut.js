var app=readFile('tests/app.js').replace("'use strict';",'');
app+=';globalThis.__=({get S(){return S},set S(v){S=v}});globalThis.addDays=addDays;globalThis.isoOf=isoOf;'+
 'globalThis.dowOf=dowOf;globalThis.todayISO=todayISO;globalThis.normalise=normalise;globalThis.markKey=markKey;'+
 'globalThis.runShortcut=runShortcut;globalThis.shortcutTarget=shortcutTarget;globalThis.t2m=t2m;'+
 'globalThis.SHORTCUT_HELP=SHORTCUT_HELP;globalThis.morningStatus=morningStatus;globalThis.m2t=m2t;'+
 'globalThis.liveSlots=liveSlots;globalThis.attFor=attFor;';
var REAL_DATE=Date;
function setClock(m){ function D(a,b,c,d,e,f){
  if(arguments.length===0){var x=new REAL_DATE();x.setHours(Math.floor(m/60),m%60,0,0);return x;}
  if(arguments.length===1) return new REAL_DATE(a); return new REAL_DATE(a,b,c,d,e,f); }
  D.now=REAL_DATE.now;D.parse=REAL_DATE.parse;D.UTC=REAL_DATE.UTC;D.prototype=REAL_DATE.prototype;
  globalThis.Date=D; }
function realClock(){ globalThis.Date=REAL_DATE; }
var ok=0,fail=0;
function t(n,f){ try{ f(); print('  PASS  '+n); ok++; }
  catch(e){ print('  FAIL  '+n+' :: '+e); fail++; } finally{ realClock(); } }
(0,eval)(app);
var TD=dowOf(new Date()), TI=todayISO();
function day(){
  __.S=normalise({
    subs:[{id:'ma',name:'management accounting',code:'MA',ci:0},
          {id:'au',name:'auditing',code:'AU',ci:1}],
    slots:[{id:'a1',subId:'ma',day:TD,kind:'th',start:'09:00',end:'10:00',room:'F-3'},
           {id:'a2',subId:'au',day:TD,kind:'th',start:'12:00',end:'13:00',room:'B-1'}],
    planner:true,readyMin:15,readyMax:30,travelAM:40,travelMid:60,travelPM:50,commute:'driver',
    thr:67, att:{ma:{thp:10,tha:5},au:{thp:10,tha:5}},
    termEnd:isoOf(addDays(new Date(),60))});
}

print('— leaving the house —');
t('?do=enroute starts the arrival countdown', function(){
  day(); setClock(8*60+10);
  var r=runShortcut('?do=enroute');
  if(!__.S.enroute) throw 'nothing recorded';
  if(__.S.enroute.iso!==TI) throw 'recorded against '+__.S.enroute.iso;
  if(__.S.enroute.at!==8*60+10) throw 'recorded at '+m2t(__.S.enroute.at);
  if(!/on your way/i.test(r.msg)) throw 'said "'+r.msg+'"';
});
t('it reports the arrival time it worked out', function(){
  day(); setClock(8*60+10);
  var r=runShortcut('?do=enroute');
  var ms=morningStatus();
  if(ms && !new RegExp(m2t(ms.arriveAt)).test(r.msg))
    throw 'message does not name the arrival: '+r.msg;
});
t('?do=home undoes it', function(){
  day(); setClock(8*60+10); runShortcut('?do=enroute');
  runShortcut('?do=home');
  if(__.S.enroute) throw 'still on the way';
});

print('\n— marking without opening the app —');
t('during a class it marks that class', function(){
  day(); setClock(9*60+20);
  var r=runShortcut('?do=mark&as=p');
  if(__.S.marks[markKey(TI,__.S.slots[0])]!=='p') throw 'the 9am was not marked';
  if(!/management accounting/.test(r.msg)) throw 'does not name what it marked: '+r.msg;
});
t('between classes it marks the next one', function(){
  day(); setClock(11*60);
  runShortcut('?do=mark&as=p');
  if(__.S.marks[markKey(TI,__.S.slots[1])]!=='p') throw 'the noon class was not marked';
  if(__.S.marks[markKey(TI,__.S.slots[0])]) throw 'reached back and marked the 9am';
});
t('absent and cancelled work the same way', function(){
  day(); setClock(9*60+20); runShortcut('?do=mark&as=a');
  if(__.S.marks[markKey(TI,__.S.slots[0])]!=='a') throw 'absent did not stick';
  day(); setClock(9*60+20); runShortcut('?do=mark&as=c');
  if(__.S.marks[markKey(TI,__.S.slots[0])]!=='c') throw 'cancelled did not stick';
});
t('the whole day at once', function(){
  day(); setClock(18*60);
  var r=runShortcut('?do=mark&as=p&when=all');
  if(Object.keys(__.S.marks).length!==2) throw 'marked '+Object.keys(__.S.marks).length;
  if(!/2 classes/.test(r.msg)) throw r.msg;
});
t('marking present also ends the journey', function(){
  day(); setClock(9*60+20);
  __.S.enroute={iso:TI, at:8*60};
  runShortcut('?do=mark&as=p');
  if(__.S.enroute) throw 'still travelling to a class you just attended';
});
t('it changes the attendance it claims to', function(){
  day(); setClock(9*60+20);
  var before=attFor('ma');
  runShortcut('?do=mark&as=p');
  var after=attFor('ma');
  if(after.p!==before.p+1||after.t!==before.t+1) throw 'the numbers did not move';
});
t('nothing to mark says so rather than guessing', function(){
  day(); setClock(23*60);
  __.S.marks[markKey(TI,__.S.slots[0])]='p';
  __.S.marks[markKey(TI,__.S.slots[1])]='p';
  var r=runShortcut('?do=mark&as=p');
  if(!r.bad) throw 'not flagged as a failure';
  if(Object.keys(__.S.marks).length!==2) throw 'marked something anyway';
});
t('a nonsense mark is refused, not guessed at', function(){
  day(); setClock(9*60+20);
  var r=runShortcut('?do=mark&as=zzz');
  if(!r.bad) throw 'accepted it';
  if(Object.keys(__.S.marks).length) throw 'marked something';
});
t('a nonsense command is refused', function(){
  day();
  var r=runShortcut('?do=selfdestruct');
  if(!r||!r.bad) throw 'not refused';
});
t('no command at all does nothing', function(){
  day();
  if(runShortcut('?tab=home')!==null) throw 'acted without a do=';
  if(runShortcut('')!==null) throw 'acted on an empty query';
});

print('\n— opening a tab —');
t('?do=open&tab=attendance switches tab', function(){
  day();
  var r=runShortcut('?do=open&tab=attendance');
  if(!r||r.tab!=='attendance') throw 'did not switch';
});
t('an unknown tab is ignored rather than blanking the app', function(){
  day(); __.S.tab='home';
  var r=runShortcut('?do=open&tab=nowhere');
  if(r&&r.tab) throw 'switched to '+r.tab;
});

print('\n— it cannot fire twice —');
t('the command is stripped from the address bar', function(){
  var src=readFile('index.html');
  if(!/history\.replaceState/.test(src)) throw 'never cleans the URL';
  var i=src.indexOf("indexOf('do=')");
  var j=src.indexOf('history.replaceState', i);
  if(i<0||j<0||j-i>1400) throw 'the URL is not cleared right after the command runs';
});
t('running the same command twice does not double-mark', function(){
  day(); setClock(9*60+20);
  runShortcut('?do=mark&as=p');
  var after1=attFor('ma').p;
  runShortcut('?do=mark&as=p');          /* would hit the NEXT class, not the same one */
  if(attFor('ma').p!==after1) throw 'the same class was counted twice';
});

print('\n— what Settings offers —');
t('every documented command actually works', function(){
  SHORTCUT_HELP.forEach(function(r){
    day(); setClock(9*60+20);
    var q=r[0];
    var out=runShortcut(q);
    if(out===null && q.indexOf('do=')>=0) throw q+' does nothing';
    if(out && out.bad) throw q+' fails: '+out.msg;
  });
});
t('the list is honest about what each does', function(){
  SHORTCUT_HELP.forEach(function(r){
    if(!r[0] || r[0].indexOf('?do=')!==0) throw 'bad url: '+r[0];
    if(!r[1]) throw 'no label for '+r[0];
  });
});
print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
