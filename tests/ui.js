var app=readFile('tests/app.js').replace("'use strict';",'');
app+=';globalThis.__=({get S(){return S},set S(v){S=v},get ttDate(){return ttDate},set ttDate(v){ttDate=v}});'+
 'globalThis.addDays=addDays;globalThis.isoOf=isoOf;globalThis.dateOf=dateOf;globalThis.dowOf=dowOf;'+
 'globalThis.todayISO=todayISO;globalThis.markKey=markKey;globalThis.slotsOn=slotsOn;globalThis.subById=subById;'+
 'globalThis.normalise=normalise;globalThis.COMMUTE=COMMUTE;globalThis.commute=commute;globalThis.t2m=t2m;'+
 'globalThis.m2t=m2t;globalThis.dayOptions=dayOptions;';
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
function setup(extra){
  __.S=normalise(Object.assign({
    subs:[{id:'a',name:'Cost Accounting',code:'CA',ci:0}],
    slots:[{id:'s1',subId:'a',day:DOW,kind:'th',start:'08:00',end:'09:00',room:'B-12'}],
    planner:true,readyMin:15,readyMax:30,travelAM:40,travelMid:60,travelPM:50,
    thr:67, att:{a:{thp:20,tha:10}}
  },extra||{}));
}

print('— cancelling a class before it happens —');
t('a future class can be cancelled', function(){
  setup(); __.ttDate=TMR; renderTT();
  var h=document.querySelector('#ttBody').innerHTML;
  if(/data-m="p"/.test(h)) throw 'future day offers Present';
  if(!/data-m="c"/.test(h)) throw 'future day cannot be cancelled';
});
t('cancelling ahead does not touch attendance', function(){
  setup();
  var sl=__.S.slots[0], before=attFor('a');
  __.S.marks[markKey(TISO,sl)]='c';
  var after=attFor('a');
  if(after.t!==before.t||after.p!==before.p) throw 'a future cancellation changed the totals';
});
t('a cancelled class drops out of the day analysis', function(){
  setup({slots:[
    {id:'s1',subId:'a',day:DOW,kind:'th',start:'08:00',end:'09:00'},
    {id:'s2',subId:'a',day:DOW,kind:'th',start:'12:00',end:'13:00'}]});
  if(dayOptions(TISO).all.length!==2) throw 'expected 2 live classes';
  __.S.marks[TISO+'|s1|a|th']='c';
  var x=dayOptions(TISO);
  if(x.all.length!==1) throw 'cancelled class still counted';
  if(x.blocks.length!==1) throw 'should collapse to one block';
});
t('the class menu offers cancel and can undo it', function(){
  setup();
  slotActions('s1',TISO);
  var h=document.querySelector('#act').innerHTML;
  if(!/Cancel just this day/.test(h)) throw 'no cancel action in the menu';
  __.S.marks[markKey(TISO,__.S.slots[0])]='c';
  slotActions('s1',TISO);
  if(!/Un-cancel for this day/.test(document.querySelector('#act').innerHTML))
    throw 'no way to undo the cancellation';
});

print('\n— the commute is no longer driver-only —');
t('every mode has its own wording', function(){
  ['self','driver','cab','transit','walk'].forEach(function(k){
    setup({commute:k});
    var c=commute();
    if(!c.head||!c.verb||!c.label) throw k+' is missing wording';
    if(c.msg && typeof c.text!=='function') throw k+' claims a message but has none';
  });
});
t('metro users get "Leave for the metro" and no message to copy', function(){
  setup({commute:'transit'});
  setClock(19*60); renderHome();
  var h=document.querySelector('#heroWrap').innerHTML;
  if(!/Leave for the metro/.test(h)) throw 'wrong wording: '+h.slice(0,160);
  if(/heroCopy/.test(h)) throw 'offered a message to copy for a metro commute';
  if(!/Leave by 7:20am/.test(h)) throw 'departure time missing';
});
t('cab users get a booking message', function(){
  setup({commute:'cab'});
  setClock(19*60); renderHome();
  var h=document.querySelector('#heroWrap').innerHTML;
  if(!/Book your cab/.test(h)) throw 'wrong wording';
  if(!/heroCopy/.test(h)) throw 'no copy button for a cab booking';
  if(!/Book for 7:20am/.test(h)) throw 'booking time missing';
});
t('driver users keep their message', function(){
  setup({commute:'driver'});
  setClock(19*60); renderHome();
  var h=document.querySelector('#heroWrap').innerHTML;
  if(!/Tell your driver/.test(h)) throw 'wrong wording';
  if(!/heroCopy/.test(h)) throw 'no copy button';
});
t('a save carrying the retired reminder hour still loads', function(){
  var f=normalise({subs:[],slots:[],marks:{},att:{},dls:[],driverHr:19,remindAt:'19:00'});
  if(f.remindAt!==undefined) throw 'the retired setting survived: '+f.remindAt;
  if(f.driverHr!==undefined) throw 'driverHr survived';
  if(!COMMUTE[f.commute]) throw 'invalid commute mode after migration';
});
t('Settings asks for nothing it can work out itself', function(){
  setup(); renderSettings();
  var h=document.querySelector('#setBody').innerHTML;
  if(!/setCommute/.test(h)) throw 'no commute picker';
  if(/setRemindAt|Show from|Plan the evening before/.test(h))
    throw 'still asking for a reminder time';
  if(!/no timer to set/.test(h)) throw 'does not explain the automatic switch';
  if(/undefined/.test(h)) throw 'leaked undefined';
});
t('Settings shows offline readiness', function(){
  setup(); renderSettings();
  var h=document.querySelector('#setBody').innerHTML;
  if(!/Ready to use offline/.test(h)) throw 'no offline status';
  if(!/no server, no account/.test(h)) throw 'does not state what it does not do';
  if(!/Saves to this device/.test(h)) throw 'no storage check';
});
t('offlineReport reflects reality, not a hardcoded yes', function(){
  var r=offlineReport();
  if(r.storage!=='working') throw 'storage probe says '+r.storage;
  if(r.ready!==true) throw 'not ready with storage working';
});

print('\n— what you need is at the top —');
t('in the evening the hero is tomorrow’s departure', function(){
  setup({commute:'driver'});
  setClock(19*60); renderHome();
  var h=document.querySelector('#heroWrap').innerHTML;
  var firstCard=h.slice(0,400);
  if(!/Tell your driver/.test(firstCard)) throw 'departure is not the first thing shown';
  if(!/wake by/.test(h)) throw 'wake time not in the hero';
});
t('the departure prompt is not duplicated further down', function(){
  setup({commute:'driver'});
  setClock(19*60); renderHome();
  var below=document.querySelector('#homeWeek').innerHTML;
  if(/Tell your driver/.test(below)) throw 'still duplicated below the fold';
});
t('in the morning the hero is the leave countdown instead', function(){
  setup(); setClock(6*60);
  var todayIso=todayISO();
  __.S.slots=[{id:'t1',subId:'a',day:dowOf(new Date()),kind:'th',start:'08:00',end:'09:00'}];
  renderHome();
  var h=document.querySelector('#heroWrap').innerHTML;
  if(!/Getting to college/.test(h)) throw 'morning countdown missing';
  if(/Tell your driver/.test(h)) throw 'evening prompt shown in the morning';
});
t('while today still has class, tomorrow stays out of the way', function(){
  setup({commute:'driver'});
  __.S.slots.push({id:'td',subId:'a',day:dowOf(new Date()),kind:'th',
                   start:'14:00',end:'15:00',room:'B-12'});
  setClock(11*60); renderHome();
  if(/Tell your driver/.test(document.querySelector('#heroWrap').innerHTML))
    throw 'jumped to tomorrow while a 2pm class was still ahead';
});
t('the moment today is finished, tomorrow takes over — no clock setting', function(){
  setup({commute:'driver'});
  __.S.slots.push({id:'td',subId:'a',day:dowOf(new Date()),kind:'th',
                   start:'14:00',end:'15:00',room:'B-12'});
  setClock(15*60+5); renderHome();
  var h=document.querySelector('#heroWrap').innerHTML;
  if(!/Tell your driver/.test(h)) throw 'still nothing about tomorrow at 3:05pm';
  if(!/7:20am/.test(h)) throw 'pickup time wrong';
});
t('marking the last class off also hands over to tomorrow', function(){
  setup({commute:'driver'});
  var sl={id:'td',subId:'a',day:dowOf(new Date()),kind:'th',
          start:'14:00',end:'15:00',room:'B-12'};
  __.S.slots.push(sl);
  setClock(14*60+30);
  __.S.marks[markKey(todayISO(),sl)]='p';
  renderHome();
  if(!/Tell your driver/.test(document.querySelector('#heroWrap').innerHTML))
    throw 'attended the last class but tomorrow never appeared';
});

t('no undefined leaked', function(){ if(LOG.length) throw LOG.length+' leak(s): '+LOG[0]; });

print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
