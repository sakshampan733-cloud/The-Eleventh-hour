var app=readFile('tests/app.js').replace("'use strict';",'');
app+=';globalThis.__=({get S(){return S},set S(v){S=v}});'+
 'globalThis.addDays=addDays;globalThis.isoOf=isoOf;globalThis.dowOf=dowOf;globalThis.todayISO=todayISO;'+
 'globalThis.markKey=markKey;globalThis.normalise=normalise;globalThis.morningStatus=morningStatus;globalThis.onCampusNow=onCampusNow;'+
 'globalThis.m2t=m2t;globalThis.t2m=t2m;globalThis.subById=subById;';
var REAL_DATE=Date;
function setClock(mins){ function D(a,b,c,d,e,f){
  if(arguments.length===0){var x=new REAL_DATE();x.setHours(Math.floor(mins/60),mins%60,0,0);return x;}
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

var TODAY=todayISO(), DOW=dowOf(new Date());
function scene(){
  __.S=normalise({
    subs:[{id:'a',name:'Cost Accounting',code:'CA',ci:0},{id:'b',name:'Stats',code:'BS',ci:1}],
    slots:[{id:'t1',subId:'a',day:DOW,kind:'th',start:'08:00',end:'09:00',room:'B'},
           {id:'t2',subId:'b',day:DOW,kind:'th',start:'12:00',end:'13:00',room:'B'}],
    att:{a:{thp:20,tha:10},b:{thp:20,tha:10}},
    planner:true,readyMin:15,readyMax:30,travelAM:40,travelMid:60,travelPM:50,thr:67
  });
}
var mark=function(id,v){ var sl=__.S.slots.filter(function(x){return x.id===id;})[0];
  __.S.marks[markKey(TODAY,sl)]=v; };

print('— marking present must stop the travel nagging —');
t('before marking, it tells you you are late', function(){
  scene(); setClock(8*60+30);          // 8:30, class 8-9, should have left at 7:20
  var m=morningStatus();
  if(!m) throw 'no commute card at all';
  if(m.level!=='late') throw 'expected late, got '+m.level;
});
t('marking PRESENT stops it nagging about that class', function(){
  scene(); setClock(8*60+30); mark('t1','p');
  var m=morningStatus();
  if(m && m.p.first.id==='t1') throw 'still telling you to travel to a class you attended';
});
t('marking ABSENT stops it too', function(){
  scene(); setClock(8*60+30); mark('t1','a');
  var m=morningStatus();
  if(m && m.p.first.id==='t1') throw 'still nagging about a class you recorded absent';
});
t('cancelled behaves the same as present/absent', function(){
  scene(); setClock(8*60+30);
  ['p','a','c'].forEach(function(v){
    scene(); setClock(8*60+30); mark('t1',v);
    var m=morningStatus();
    if(m && m.p.first.id==='t1') throw v+' did not settle the class';
  });
});

print('— but it must move on to the NEXT unmarked class —');
t('marking the 8am present ends the commute — you are already there', function(){
  scene(); setClock(8*60+30); mark('t1','p');
  /* You were in that room. There is no second journey to a 12pm on the
     same campus, and asking "are you on your way?" from a seat in college
     is the app arguing with something you just told it. */
  if(!onCampusNow()) throw 'marking present did not put you on campus';
  if(morningStatus()) throw 'still giving travel advice from campus';
});
t('what is next takes over from the countdown', function(){
  scene(); setClock(8*60+30); mark('t1','p'); renderHome();
  var h=document.querySelector('#heroWrap').innerHTML;
  if(/Getting to college|on my way/i.test(h)) throw 'still asking about the commute';
  if(!/Next up/.test(h)) throw 'lost track of the 12pm entirely';
  if(!/Stats/.test(h)) throw 'the next class is not named';
});
t('an absent mark does not put you on campus', function(){
  scene(); setClock(8*60+30); mark('t1','a');
  if(onCampusNow()) throw 'a class you missed put you in the building';
  if(!morningStatus()) throw 'lost the commute advice for the 12pm';
});
t('a cancelled class does not put you on campus', function(){
  scene(); setClock(8*60+30); mark('t1','c');
  if(onCampusNow()) throw 'a cancelled class put you in the building';
});
t('a class marked present before it starts does not count yet', function(){
  scene(); setClock(6*60); mark('t1','p');       /* marked ahead, from bed */
  if(onCampusNow()) throw 'marked at 6am for an 8am and called you on campus';
  if(!morningStatus()) throw 'should still be telling you when to leave';
});

print('— once everything is marked, it stops completely —');
t('marking both classes clears the commute card', function(){
  scene(); setClock(8*60+30); mark('t1','p'); mark('t2','p');
  if(morningStatus()!==null) throw 'still showing travel advice with nothing left to attend';
});
t('Today then reads as done, the same as when cancelled', function(){
  scene(); setClock(8*60+30); mark('t1','p'); mark('t2','p'); renderHome();
  var h=document.querySelector('#heroWrap').innerHTML;
  if(/Getting to college|Leave in|Late by/.test(h)) throw 'travel card still on screen';
  if(!/Done for the day|complete|lot|survived/i.test(h)) throw 'no completion state: '+h.slice(0,200);
});
t('cancelling both gives the same result as marking both', function(){
  scene(); setClock(8*60+30); mark('t1','c'); mark('t2','c');
  if(morningStatus()!==null) throw 'cancelled everything but still nagging';
});

print('— "Next up" must not point at a marked class —');
t('after marking the 8am, Next up is the 12pm', function(){
  scene(); setClock(6*60); mark('t1','p'); renderHome();
  var h=document.querySelector('#heroWrap').innerHTML;
  if(/Cost Accounting/.test(h)) throw 'Next up still shows the class you marked';
});
t('an unmarked class is still surfaced normally', function(){
  scene(); setClock(6*60); renderHome();
  if(!/Cost Accounting/.test(document.querySelector('#heroWrap').innerHTML))
    throw 'lost the unmarked class';
});
t('nothing leaked', function(){ if(LOG.length) throw LOG.length+' leak(s): '+LOG[0]; });

print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
