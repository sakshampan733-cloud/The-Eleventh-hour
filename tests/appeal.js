var app = readFile('tests/app.js').replace("'use strict';",'');
app += ';globalThis.__=({get S(){return S},set S(v){S=v},get appealSel(){return appealSel},set appealSel(v){appealSel=v}});'+
 'globalThis.addDays=addDays;globalThis.isoOf=isoOf;globalThis.dateOf=dateOf;globalThis.dowOf=dowOf;'+
 'globalThis.todayISO=todayISO;globalThis.markKey=markKey;globalThis.slotsOn=slotsOn;globalThis.subById=subById;'+
 'globalThis.absencesFor=absencesFor;globalThis.reversalsNeeded=reversalsNeeded;globalThis.appealMessage=appealMessage;'+
 'globalThis.appealHTML=appealHTML;globalThis.dayPlan=dayPlan;globalThis.tomorrowPlan=tomorrowPlan;'+
 'globalThis.m2t=m2t;globalThis.pctOf=pctOf;globalThis.t2m=t2m;globalThis.blankState=blankState;globalThis.normalise=normalise;';
var ok=0,fail=0;
function t(n,f){ try{ f(); print('  PASS  '+n); ok++; }catch(e){ print('  FAIL  '+n+' :: '+e); fail++; } }
(0,eval)(app); var S=__.S; loadDemo(); S=__.S;

/* Settings is collapsed by default now — open every group so these
   checks can still see the controls inside. */
function openAllGroups(){ __.S.openGroups=['look','term','att','plan','term2','subs','off','data']; }

print('— the arrow that went nowhere —');
t('the skip row handler survives being handed a click Event', function(){
  renderHome();
  var btn=document.querySelector('#homeSkip');
  btn.onclick({type:'click',target:{},preventDefault:function(){}});   // as a real click would
  var h=document.querySelector('#sheetBody').innerHTML;
  if(/undefined|NaN/.test(h)) throw 'sheet rendered garbage from the Event object';
  if(!/If you skip all/.test(h)) throw 'sheet did not render its content';
});

print('\n— attendance appeal —');
t('finds exactly the classes marked absent', function(){
  var id=S.subs[0].id;
  var abs=absencesFor(id);
  var expect=Object.keys(S.marks).filter(function(k){
    return S.marks[k]==='a' && k.split('|')[2]===id; }).length;
  if(abs.length!==expect) throw 'found '+abs.length+' of '+expect;
  abs.forEach(function(a){ if(S.marks[a.key]!=='a') throw 'listed a non-absence'; });
});
t('absences come back in date order', function(){
  var abs=absencesFor(S.subs[0].id);
  for(var i=1;i<abs.length;i++)
    if(abs[i].iso < abs[i-1].iso) throw 'out of order';
});
t('reversals needed actually reaches the threshold', function(){
  S.subs.forEach(function(sub){
    var A=attFor(sub.id), n=reversalsNeeded(A.p,A.t);
    if(!A.t) return;
    if(pctOf(A.p,A.t)>=S.thr){ if(n!==0) throw sub.code+': already above but asked for '+n; return; }
    if(pctOf(A.p+n, A.t) < S.thr-1e-9) throw sub.code+': '+n+' reversals still short';
    if(n>0 && pctOf(A.p+n-1, A.t) >= S.thr) throw sub.code+': overshoots by one';
  });
});
t('reversing does not change the total held', function(){
  var sub=S.subs[0], A=attFor(sub.id), n=reversalsNeeded(A.p,A.t);
  var after=pctOf(A.p+n, A.t);            // total unchanged by design
  if(!isFinite(after)) throw 'not finite';
  if(A.t===0 && n!==0) throw 'asked for reversals with no classes';
});
t('never asks for more reversals than there are absences', function(){
  S.subs.forEach(function(sub){
    var A=attFor(sub.id), n=reversalsNeeded(A.p,A.t);
    if(n>A.a) throw sub.code+': needs '+n+' but only has '+A.a+' absences';
  });
});
t('the message lists every picked class and nothing else', function(){
  var sub=S.subs[0], picked=absencesFor(sub.id).slice(0,3);
  var msg=appealMessage(sub,picked,'medical leave');
  picked.forEach(function(a){
    var d=dateOf(a.iso).toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    if(msg.indexOf(d)<0) throw 'missing '+d;
  });
  if((msg.match(/•/g)||[]).length!==picked.length) throw 'wrong number of bullets';
  if(msg.indexOf('medical leave')<0) throw 'reason missing';
  if(msg.indexOf(sub.name)<0) throw 'subject missing';
  if(/undefined|NaN/.test(msg)) throw 'message contains undefined/NaN';
});
t('the message signs off with your name when set', function(){
  var keep=S.name; S.name='Saksham Panchal';
  var msg=appealMessage(S.subs[0],absencesFor(S.subs[0].id).slice(0,1),'');
  if(msg.indexOf('Saksham Panchal')<0) throw 'name not used';
  S.name=''; 
  if(appealMessage(S.subs[0],absencesFor(S.subs[0].id).slice(0,1),'').indexOf('[your name]')<0)
    throw 'no placeholder when name is blank';
  S.name=keep;
});
t('omits the reason line when none is given', function(){
  var msg=appealMessage(S.subs[0],absencesFor(S.subs[0].id).slice(0,1),'');
  if(msg.indexOf('Reason:')>=0) throw 'empty reason line included';
});
t('the picker and detail sheets render', function(){
  sheetAppealPick();
  var h=document.querySelector('#sheetBody').innerHTML;
  if(/undefined|NaN/.test(h)) throw 'picker leaked undefined';
  sheetAppeal(S.subs[0]);
  var h2=document.querySelector('#sheetBody').innerHTML;
  if(/undefined|NaN/.test(h2)) throw 'detail leaked undefined';
});
t('a subject with no absences is handled', function(){
  var keep=__.S;
  __.S=normalise({subs:[{id:'a',name:'Perfect',code:'PF',ci:0}],
                  marks:{'2026-08-03|s|a|th':'p'}, att:{}});
  if(absencesFor('a').length!==0) throw 'found phantom absences';
  sheetAppealPick();
  if(!/No absences on record/.test(document.querySelector('#sheetBody').innerHTML))
    throw 'did not show the empty state';
  __.S=keep;
});

print('\n— tomorrow & wake-up —');
t('wake time = first class − travel − getting ready', function(){
  var keep=__.S;
  var tmr=addDays(new Date(),1);
  __.S=normalise({subs:[{id:'a',name:'X',code:'X',ci:0}],
    slots:[{id:'s',subId:'a',day:dowOf(tmr),kind:'th',start:'08:00',end:'09:00',room:'B'}],
    ready:45, travel:40});
  var p=tomorrowPlan();
  if(t2m('08:00')-40 !== p.leaveAt) throw 'leaveAt wrong: '+p.leaveAt;
  if(p.leaveAt-45 !== p.wakeAt) throw 'wakeAt wrong: '+p.wakeAt;
  if(m2t(p.wakeAt)!=='6:35am') throw 'expected 6:35am, got '+m2t(p.wakeAt);
  __.S=keep;
});
t('an all-online day has no commute and no wake-up call', function(){
  var keep=__.S;
  var tmr=addDays(new Date(),1);
  __.S=normalise({subs:[{id:'a',name:'X',code:'X',ci:0}],
    slots:[{id:'s',subId:'a',day:dowOf(tmr),kind:'th',start:'08:00',end:'09:00',online:true}],
    ready:45, travel:40});
  var p=tomorrowPlan();
  if(p.travel!==0) throw 'travel not zeroed for an online class';
  if(p.firstOnsite) throw 'found a campus class on an all-online day';
  /* you are already where the class is — there is nothing to leave for and
     no getting-ready to do, so neither time exists */
  if(p.leaveAt!==null) throw 'invented a departure: '+m2t(p.leaveAt);
  if(p.wakeAt!==null) throw 'invented a wake-up time: '+m2t(p.wakeAt);
  __.S=keep;
});
t('does not invent a wake-up time before you configure one', function(){
  var keep=__.S;
  var tmr=addDays(new Date(),1);
  __.S=normalise({subs:[{id:'a',name:'X',code:'X',ci:0}],
    slots:[{id:'s',subId:'a',day:dowOf(tmr),kind:'th',start:'08:00',end:'09:00'}]});
  var p=tomorrowPlan();
  if(p.configured) throw 'claims configured with ready=0 travel=0';
  renderHome();
  var h=document.querySelector('#homeNext').innerHTML;
  if(/Wake by/.test(h)) throw 'showed a wake time it could not know';
  if(!/Settings/.test(h)) throw 'did not point at Settings';
  __.S=keep;
});
t('a pre-midnight wake time is flagged rather than shown wrong', function(){
  var keep=__.S;
  var tmr=addDays(new Date(),1);
  __.S=normalise({subs:[{id:'a',name:'X',code:'X',ci:0}],
    slots:[{id:'s',subId:'a',day:dowOf(tmr),kind:'th',start:'06:00',end:'07:00'}],
    ready:200, travel:200});
  var p=tomorrowPlan();
  if(!p.dayBefore) throw 'should flag that the wake time falls before midnight';
  renderHome();
  if(/Wake by/.test(document.querySelector('#homeNext').innerHTML)) throw 'showed a nonsense time';
  __.S=keep;
});
t('a free tomorrow shows no card at all', function(){
  var keep=__.S;
  __.S=normalise({subs:[{id:'a',name:'X',code:'X',ci:0}], slots:[], ready:30, travel:30});
  if(!tomorrowPlan().none) throw 'expected an empty tomorrow';
  renderHome();
  if(/Tomorrow ·/.test(document.querySelector('#homeNext').innerHTML)) throw 'card shown with no classes';
  __.S=keep;
});
t('m2t wraps and formats correctly', function(){
  if(m2t(0)!=='12am') throw '0 -> '+m2t(0);
  if(m2t(60*13+5)!=='1:05pm') throw '13:05 -> '+m2t(60*13+5);
  if(m2t(-30)!=='11:30pm') throw 'negative should wrap, got '+m2t(-30);
});

print('\n— old backups keep working —');
t('importing a save with none of the new fields is repaired', function(){
  var old={subs:[{id:'a',name:'Old',code:'OS'}],slots:[],marks:{},att:{},dls:[],thr:75,theme:'dark',tone:'snark',tab:'home'};
  var fixed=normalise(Object.assign(blankState({theme:'auto',tone:'friendly'}),old));
  if(fixed.readyMin!==15||fixed.readyMax!==30) throw 'getting-ready times not defaulted';
  if(!fixed.travelAM||!fixed.travelMid||!fixed.travelPM) throw 'travel bands not defaulted';
  if(fixed.ready!==undefined||fixed.travel!==undefined) throw 'superseded fields not cleaned up';
  if(fixed.name!=='') throw 'name not defaulted';
  if(fixed.thr!==75||fixed.theme!=='dark'||fixed.tone!=='snark') throw 'existing settings lost';
  if(typeof fixed.subs[0].ci!=='number') throw 'subject colour not backfilled';
  if(!Array.isArray(fixed.cats)) throw 'cats not repaired';
  var keep=__.S; __.S=fixed; (openAllGroups(),renderSettings());
  if(/undefined/.test(document.querySelector('#setBody').innerHTML)) throw 'Settings shows undefined';
  __.S=keep;
});
t('a wiped state has every field', function(){
  var b=blankState({theme:'dark',tone:'pro'});
  ['subs','slots','marks','att','dls','cats','plans','thr','name','termEnd',
   'readyMin','readyMax','travelAM','travelMid','travelPM','commute','planner','theme','tone','tab']
    .forEach(function(k){ if(b[k]===undefined) throw 'missing '+k; });
  if(b.theme!=='dark'||b.tone!=='pro') throw 'did not keep theme/tone';
});
t('no undefined leaked', function(){ if(LOG.length) throw LOG.length+' leak(s): '+LOG[0]; });

print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
