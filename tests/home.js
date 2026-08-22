var app=readFile('tests/app.js').replace("'use strict';",'');
app+=';globalThis.__=({get S(){return S},set S(v){S=v}});globalThis.addDays=addDays;globalThis.isoOf=isoOf;'+
 'globalThis.dowOf=dowOf;globalThis.todayISO=todayISO;globalThis.normalise=normalise;globalThis.markKey=markKey;'+
 'globalThis.morningStatus=morningStatus;globalThis.homewardStatus=homewardStatus;globalThis.t2m=t2m;globalThis.m2t=m2t;';
var REAL_DATE=Date;
function setClock(m){ function D(a,b,c,d,e,f){
  if(arguments.length===0){var x=new REAL_DATE();x.setHours(Math.floor(m/60),m%60,0,0);return x;}
  if(arguments.length===1) return new REAL_DATE(a); return new REAL_DATE(a,b,c,d,e,f); }
  D.now=REAL_DATE.now;D.parse=REAL_DATE.parse;D.UTC=REAL_DATE.UTC;D.prototype=REAL_DATE.prototype;
  globalThis.Date=D; }
function realClock(){ globalThis.Date=REAL_DATE; }
var ok=0,fail=0;
function t(n,f){ try{ f(); print('  PASS  '+n); ok++; }catch(e){ print('  FAIL  '+n+' :: '+e); fail++; } finally{ realClock(); } }
(0,eval)(app);
var TD=dowOf(new Date()), TI=todayISO();
function mk(slots,extra){ __.S=normalise(Object.assign({
  subs:[{id:'a',name:'Cost Accounting',code:'CA',ci:0}],
  slots:slots, planner:true,readyMin:15,readyMax:30,
  travelAM:40,travelMid:60,travelPM:50,commute:'driver',
  thr:67,att:{a:{thp:20,tha:6}},termEnd:isoOf(addDays(new Date(),90))},extra||{})); }
function hero(){ return document.querySelector('#heroWrap').innerHTML; }
function txt(){ return hero().replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); }
var ONE=[{id:'s1',subId:'a',day:TD,kind:'th',start:'15:00',end:'16:00',room:'B-12'}];

print('— an online class is not a journey —');
t('no departure time is invented for a class taken at home', function(){
  mk([{id:'o1',subId:'a',day:TD,kind:'th',start:'16:00',end:'17:00',online:true}]);
  setClock(15*60); renderHome();
  var h=txt();
  if(/Getting to college/.test(h)) throw 'told to travel to an online class';
  if(/leave by/.test(h)) throw 'gave a leave-by time for a class at home';
  if(!/From home/.test(h)) throw 'no at-home card';
  if(!/no travel/.test(h)) throw 'does not say there is no travel';
});
t('the online card still lets you mark it', function(){
  mk([{id:'o1',subId:'a',day:TD,kind:'th',start:'16:00',end:'17:00',online:true}]);
  setClock(15*60); renderHome();
  if(!/mkSeg/.test(hero())) throw 'cannot mark the class from the hero';
  if(!/heroGo/.test(hero())===false) throw 'offered "I am on my way" for an online class';
});
t('an in-person class still gets its departure', function(){
  mk(ONE); setClock(13*60); renderHome();
  var h=txt();
  if(!/Getting to college/.test(h)) throw 'lost the travel card';
  if(!/leave by/.test(h)) throw 'lost the leave time';
  if(/From home/.test(h)) throw 'in-person class treated as online';
});

print('\n— the way home —');
t('nothing about home while a class is still to come', function(){
  mk(ONE); setClock(14*60); renderHome();
  if(homewardStatus()) throw 'sent you home before the class';
  if(/Heading home/.test(txt())) throw 'home card shown too early';
});
t('nothing about home while you are sitting in the class', function(){
  mk(ONE); setClock(15*60+20); renderHome();
  if(homewardStatus()) throw 'sent you home mid-class';
});
t('once the last class ends, it tells you when you are home', function(){
  mk(ONE); setClock(16*60+5); renderHome();
  var w=homewardStatus();
  if(!w) throw 'no homeward status after the day ended';
  if(w.travel!==50) throw 'travel '+w.travel+' — should use the after-3pm band';
  if(w.homeBy!==16*60+5+50) throw 'homeBy '+m2t(w.homeBy);
  if(!/Heading home/.test(txt())) throw 'no home card';
});
t('marking the class present ends the day early — it does not wait for the bell', function(){
  mk(ONE);
  __.S.marks[markKey(TI,__.S.slots[0])]='p';
  setClock(15*60+40); renderHome();
  var w=homewardStatus();
  if(!w) throw 'marked present but still not on the way home';
  if(!w.early) throw 'not flagged as an early finish';
  if(w.leaveAt!==15*60+40) throw 'leaveAt '+m2t(w.leaveAt);
  if(w.homeBy!==15*60+40+50) throw 'homeBy '+m2t(w.homeBy);
  var h=txt();
  if(/Getting to college/.test(h)) throw 'STILL says getting to college';
});
t('an absent class does not put you on campus', function(){
  mk(ONE);
  __.S.marks[markKey(TI,__.S.slots[0])]='a';
  setClock(16*60+5); renderHome();
  if(homewardStatus()) throw 'routed you home from a class you never attended';
});
t('a cancelled class does not put you on campus', function(){
  mk(ONE);
  __.S.marks[markKey(TI,__.S.slots[0])]='c';
  setClock(16*60+5); renderHome();
  if(homewardStatus()) throw 'routed you home from a cancelled class';
});
t('an online-only day never sends you home', function(){
  mk([{id:'o1',subId:'a',day:TD,kind:'th',start:'15:00',end:'16:00',online:true}]);
  __.S.marks[markKey(TI,__.S.slots[0])]='p';
  setClock(16*60+5); renderHome();
  if(homewardStatus()) throw 'came home from your own bedroom';
});
t('it stops once you would already be home', function(){
  mk(ONE); setClock(17*60+40); renderHome();   /* 16:00 + 50 + 45 grace = 17:35 */
  if(homewardStatus()) throw 'still talking about the journey home at 5:40pm';
});
t('the driver gets a pickup time, not a wake time', function(){
  mk(ONE); setClock(16*60+5); renderHome();
  var h=txt();
  if(!/Tell your driver 4:05pm/.test(h)) throw 'no pickup time: '+h.slice(0,120);
  if(!/heroHomeCopy/.test(hero())) throw 'no copy button';
});
t('someone who makes their own way is not told to message anyone', function(){
  mk(ONE,{commute:'self'}); setClock(16*60+5); renderHome();
  var h=txt();
  if(/Tell your/.test(h.split('Heading home')[1]||'')) throw 'told to message a driver they do not have';
  if(!/Heading home/.test(h)) throw 'no home card';
});
t('the home card comes before tomorrow, and a pending class comes before both', function(){
  mk([{id:'s1',subId:'a',day:TD,kind:'th',start:'09:00',end:'10:00'},
      {id:'s2',subId:'a',day:TD,kind:'th',start:'15:00',end:'16:00'}]);
  __.S.marks[markKey(TI,__.S.slots[0])]='p';
  setClock(13*60); renderHome();
  var h=txt();
  if(h.indexOf('Getting to college')<0) throw 'the 3pm class was not promoted';
  if(h.indexOf('Heading home')>=0) throw 'sent home with a class still to come';
  setClock(16*60+10); renderHome();
  var h2=txt();
  if(h2.indexOf('Heading home')<0) throw 'no home card once done';
  if(h2.indexOf('Tell your driver')>=0 &&
     h2.indexOf('Heading home')>h2.indexOf('Pickup at')) throw 'tomorrow outranked going home';
});
t('no undefined or NaN in any of it', function(){
  [[13*60],[16*60+5],[15*60+40]].forEach(function(c){
    mk(ONE); setClock(c[0]); renderHome();
    if(/undefined|NaN/.test(hero())) throw 'leaked at '+m2t(c[0]);
  });
});
print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
