var app = readFile('tests/app.js').replace("'use strict';",'');
app += ';globalThis.__=({get S(){return S},set S(v){S=v}});'+
 'globalThis.addDays=addDays;globalThis.isoOf=isoOf;globalThis.dateOf=dateOf;globalThis.dowOf=dowOf;'+
 'globalThis.todayISO=todayISO;globalThis.markKey=markKey;globalThis.t2m=t2m;globalThis.m2t=m2t;'+
 'globalThis.normalise=normalise;globalThis.dayBlocks=dayBlocks;globalThis.dayOptions=dayOptions;'+
 'globalThis.absenceRange=absenceRange;globalThis.pctOf=pctOf;globalThis.longestSafeLeave=longestSafeLeave;'+
 'globalThis.morningStatus=morningStatus;globalThis.nextClassDay=nextClassDay;'+
 'globalThis.offlineReport=offlineReport;globalThis.subById=subById;globalThis.attFor=attFor;';
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

/* Settings is collapsed by default now — open every group so these
   checks can still see the controls inside. */
function openAllGroups(){ __.S.openGroups=['look','term','att','plan','term2','subs','off','data']; }

var TMR=addDays(new Date(),1), TISO=isoOf(TMR), DOW=dowOf(TMR);
var TODAY=todayISO(), TDOW=dowOf(new Date());

/* 8-9 in person, 9-10 ONLINE, 12-1 in person.  The online class sits in the
   middle: it must not count as a gap, because you take it from home. */
function mixed(day, dow){
  __.S=normalise({
    subs:[{id:'a',name:'Cost Accounting',code:'CA',ci:0},
          {id:'b',name:'Indian Economy',code:'IE',ci:1},
          {id:'c',name:'Intl Business',code:'IB',ci:2}],
    slots:[{id:'s1',subId:'a',day:dow,kind:'th',start:'08:00',end:'09:00'},
           {id:'s2',subId:'b',day:dow,kind:'th',start:'09:00',end:'10:00',online:true},
           {id:'s3',subId:'c',day:dow,kind:'th',start:'12:00',end:'13:00'}],
    planner:true,readyMin:15,readyMax:30,travelAM:40,travelMid:60,travelPM:50,
    thr:67, att:{a:{thp:20,tha:6},b:{thp:20,tha:6},c:{thp:20,tha:6}}});
}

print('— online classes never invent campus gaps —');
t('campus blocks ignore online classes entirely', function(){
  mixed(TISO,DOW);
  var b=dayBlocks(TISO);
  if(b.length!==2) throw 'expected 2 campus blocks, got '+b.length;
  var ids=[].concat.apply([],b.map(function(x){return x.slots.map(function(s){return s.id;});}));
  if(ids.indexOf('s2')>=0) throw 'the online class was put on campus';
});
t('dead time counts only real waiting on campus', function(){
  mixed(TISO,DOW);
  var full=dayOptions(TISO).opts.filter(function(o){return o.count===3;})[0];
  if(!full) throw 'no option attends all three';
  if(full.onCampus!==300) throw 'onCampus '+full.onCampus+', expected 8am-1pm = 300';
  /* 8-9 and 12-1 on campus = 120 contact; the 9-10 online hour is at home,
     so the wait is 3 hours, not 2. */
  if(full.dead!==180) throw 'dead '+full.dead+', expected 180';
  if(full.contact!==180) throw 'contact '+full.contact+', expected all 3 hours taught';
});
t('an option exists that stays home and still takes the online class', function(){
  mixed(TISO,DOW);
  var labels=dayOptions(TISO).opts.map(function(o){return o.label;});
  if(labels.indexOf('Stay home — online only')<0)
    throw 'no stay-home option: '+labels.join(' | ');
  var home=dayOptions(TISO).opts.filter(function(o){return o.label==='Stay home — online only';})[0];
  if(home.count!==1) throw 'stay-home should still attend the 1 online class';
  if(home.travel!==0) throw 'stay-home asks you to travel';
  if(home.dead!==0) throw 'stay-home has dead time';
  if(!home.allOnline) throw 'allOnline not set';
});
t('skipping everything is offered and is the only zero-count option', function(){
  mixed(TISO,DOW);
  var opts=dayOptions(TISO).opts;
  var zero=opts.filter(function(o){return o.count===0;});
  if(zero.length!==1) throw zero.length+' zero-count options';
  if(zero[0].label!=='Skip everything') throw 'labelled "'+zero[0].label+'"';
  if(zero[0].skipped.length!==3) throw 'skipping all should cost 3 classes';
});
t('a part-day label describes the campus hours you are actually there for', function(){
  mixed(TISO,DOW);
  var parts=dayOptions(TISO).opts.filter(function(o){
    return /on campus/.test(o.label); });
  if(parts.length!==2) throw 'expected 2 part-day options, got '+parts.length;
  var late=parts.filter(function(o){
    return o.onsite.length===1 && o.onsite[0].id==='s3'; })[0];
  if(!late) throw 'no option for just the afternoon class';
  if(late.label!=='12pm–1pm on campus') throw 'labelled "'+late.label+'"';
  /* it still picks up the 9am online class from home, and that class must
     not stretch the campus window backwards */
  if(late.count!==2) throw 'the online class was dropped: count '+late.count;
  if(late.onCampus!==60) throw 'onCampus '+late.onCampus+', expected one hour';
  if(late.dead!==0) throw 'invented '+late.dead+' minutes of waiting';
});
t('every option is distinct and none is undefined', function(){
  mixed(TISO,DOW);
  var seen={}, opts=dayOptions(TISO).opts;
  opts.forEach(function(o){
    if(o.label===undefined||/undefined/.test(o.label)) throw 'bad label '+o.label;
    var k=o.ids.slice().sort().join(',');
    if(seen[k]) throw 'duplicate option: '+o.label+' == '+seen[k];
    seen[k]=o.label;
  });
});

print('\n— I’m on my way —');
function enrouteDay(){
  mixed(TODAY,TDOW);
  __.S.commute='driver';
}
t('before you leave it counts down; it does not call you late', function(){
  enrouteDay(); setClock(7*60);          /* 8am class, 40min travel */
  var ms=morningStatus();
  if(!ms) throw 'no morning status';
  if(ms.level==='late') throw 'called late 20 minutes before leaving';
  if(ms.untilLeave!==20) throw 'untilLeave '+ms.untilLeave;
});
t('past the leave time, with no word from you, it says late', function(){
  enrouteDay(); setClock(7*60+40);
  if(morningStatus().level!=='late') throw 'not flagged late at 7:40 for an 8am';
});
t('saying you are on your way replaces "late" with an arrival time', function(){
  enrouteDay(); setClock(7*60+40);
  __.S.enroute={iso:TODAY, at:7*60+40};
  var ms=morningStatus();
  if(ms.level!=='enroute') throw 'still level '+ms.level;
  if(ms.arriveAt!==7*60+40+40) throw 'arriveAt '+m2t(ms.arriveAt)+', expected 8:20';
  if(ms.lateBy!==20) throw 'lateBy '+ms.lateBy+', expected 20';
});
t('leaving on time while en route means you are not late at all', function(){
  enrouteDay(); setClock(7*60+15);
  __.S.enroute={iso:TODAY, at:7*60+15};
  var ms=morningStatus();
  if(ms.level!=='enroute') throw 'level '+ms.level;
  if(ms.lateBy!==0) throw 'lateBy '+ms.lateBy+' when arriving 5 min early';
});
t('yesterday’s "on my way" does not leak into today', function(){
  enrouteDay(); setClock(7*60+40);
  __.S.enroute={iso:isoOf(addDays(new Date(),-1)), at:7*60};
  var ms=morningStatus();
  if(ms.level==='enroute') throw 'a stale en-route from yesterday was honoured';
});
t('en route is not offered when the next class is online', function(){
  enrouteDay(); setClock(8*60+10);
  __.S.enroute={iso:TODAY, at:8*60};
  __.S.marks[markKey(TODAY,__.S.slots[0])]='p';   /* 8am done; 9am is online */
  /* You marked the 8am present, so you are on campus and the commute is
     settled either way — what must never happen is an arrival time for a
     class you take from home. */
  var ms=morningStatus();
  if(ms && ms.level==='enroute') throw 'told you are arriving somewhere for an online class';
  if(ms && ms.p.travel!==0) throw 'asked you to travel to an online class';
  renderHome();
  var h=document.querySelector('#heroWrap').innerHTML;
  if(/Arriving|on my way/i.test(h)) throw 'still routing you somewhere';
});
t('marking every class off ends the day entirely', function(){
  enrouteDay(); setClock(8*60+10);
  __.S.enroute={iso:TODAY, at:8*60};
  __.S.slots.forEach(function(sl){ __.S.marks[markKey(TODAY,sl)]='p'; });
  if(morningStatus()) throw 'still giving travel advice after every class was marked';
  var nd=nextClassDay();
  if(nd && nd.offset===0) throw 'today still counted as the next class day';
});

print('\n— time off —');
function tripSetup(){
  __.S=normalise({
    subs:[{id:'a',name:'Cost Accounting',code:'CA',ci:0}],
    slots:[0,1,2,3,4,5,6].map(function(d,i){
      return {id:'w'+d,subId:'a',day:d,kind:'th',start:'10:00',end:'11:00'}; }),
    thr:67, att:{a:{thp:60,tha:10}},
    termEnd: isoOf(addDays(new Date(),120))});
}
t('a range with no classes in it costs nothing', function(){
  __.S=normalise({subs:[{id:'a',name:'X',code:'X',ci:0}],slots:[],thr:67});
  var r=absenceRange(todayISO(), isoOf(addDays(new Date(),6)));
  if(r.total!==0) throw 'found '+r.total+' classes in an empty timetable';
  if(r.verdict!=='ok') throw 'verdict '+r.verdict+' for a free week';
});
t('seven days off counts exactly the classes in those seven days', function(){
  tripSetup();
  var r=absenceRange(todayISO(), isoOf(addDays(new Date(),6)));
  if(r.days!==7) throw 'days '+r.days;
  if(r.total!==7) throw 'total '+r.total+', expected one a day';
  if(r.byDay.length!==7) throw 'byDay '+r.byDay.length;
});
t('the arithmetic on the new percentage is right', function(){
  tripSetup();
  var r=absenceRange(todayISO(), isoOf(addDays(new Date(),6)));
  var row=r.rows[0];
  if(row.now!==pctOf(60,70)) throw 'now '+row.now+', expected '+pctOf(60,70);
  if(row.after!==pctOf(60,77)) throw 'after '+row.after+', expected '+pctOf(60,77);
  if(!(row.after<row.now)) throw 'missing a week did not lower the percentage';
});
t('dates given backwards are swapped, not rejected', function(){
  tripSetup();
  var a=absenceRange(isoOf(addDays(new Date(),6)), todayISO());
  var b=absenceRange(todayISO(), isoOf(addDays(new Date(),6)));
  if(a.total!==b.total) throw 'backwards range gave '+a.total+' vs '+b.total;
});
t('classes you already marked are not double-counted as missed', function(){
  tripSetup();
  var iso=todayISO();
  var sl=__.S.slots.filter(function(s){return s.day===dowOf(new Date());})[0];
  var before=absenceRange(iso, isoOf(addDays(new Date(),6))).total;
  __.S.marks[markKey(iso,sl)]='p';
  var after=absenceRange(iso, isoOf(addDays(new Date(),6))).total;
  if(after!==before-1) throw 'marked class still counted: '+before+' -> '+after;
});
t('a long enough absence is called unrecoverable', function(){
  tripSetup();
  var r=absenceRange(todayISO(), isoOf(addDays(new Date(),59)));
  if(r.verdict!=='gone') throw 'two months off is only "'+r.verdict+'"';
});
t('the longest safe leave is safe, and one day more is not', function(){
  tripSetup();
  var n=longestSafeLeave(todayISO(), 45);
  if(n<1) throw 'no safe trip at all from 86% attendance';
  var safe=absenceRange(todayISO(), isoOf(addDays(new Date(),n-1)));
  if(safe.worst>=2) throw 'the "safe" length is not safe';
  var over=absenceRange(todayISO(), isoOf(addDays(new Date(),n)));
  if(n<45 && over.worst<2) throw 'stopped short: '+n+' days was not the limit';
});
t('with the term nearly over, no trip is safe', function(){
  tripSetup();
  __.S.att={a:{thp:30,tha:40}};                  /* 43%, well under 67 */
  __.S.termEnd=isoOf(addDays(new Date(),10));    /* no room left to recover */
  if(longestSafeLeave(todayISO(),45)!==0)
    throw 'offered a safe trip with 10 days left at 43%';
});
t('the same attendance early in the term still allows a trip', function(){
  tripSetup();
  __.S.att={a:{thp:30,tha:40}};
  __.S.termEnd=isoOf(addDays(new Date(),120));   /* months to claw it back */
  if(longestSafeLeave(todayISO(),45)===0)
    throw 'refused any trip in August, when there is time to recover';
});

print('\n— offline —');
t('the report is a live probe, not a constant', function(){
  var r=offlineReport();
  if(typeof r.ready!=='boolean') throw 'ready is '+typeof r.ready;
  if(r.storage!=='working') throw 'storage '+r.storage;
  if(r.bytes<0) throw 'negative bytes';
});
t('a file on the device is the only unconditional yes', function(){
  var _loc=globalThis.location; globalThis.location=undefined;
  var r=offlineReport(); globalThis.location=_loc;
  if(r.level!=='local') throw 'level '+r.level+' for a local file';
});
t('a hosted page with the worker in charge is a green light', function(){
  var _loc=globalThis.location,_nav=globalThis.navigator;
  globalThis.location={protocol:'https:'};
  globalThis.navigator={serviceWorker:{controller:{}}, onLine:true};
  var r=offlineReport(); (openAllGroups(),renderSettings());
  var h=document.querySelector('#setBody').innerHTML;
  globalThis.location=_loc; globalThis.navigator=_nav;
  if(r.level!=='cached') throw 'level '+r.level+' with the worker controlling';
  if(!/Ready to use offline/.test(h)) throw 'still hedging with the app cached';
  if(!/stored itself on this phone/.test(h)) throw 'does not say what changed';
});
t('a hosted page whose worker has not taken over yet says "reopen once"', function(){
  var _loc=globalThis.location,_nav=globalThis.navigator;
  globalThis.location={protocol:'https:'};
  globalThis.navigator={serviceWorker:{controller:null}, onLine:true};
  var r=offlineReport(); (openAllGroups(),renderSettings());
  var h=document.querySelector('#setBody').innerHTML;
  globalThis.location=_loc; globalThis.navigator=_nav;
  if(r.level!=='pending') throw 'level '+r.level+' before the worker takes over';
  if(/Ready to use offline/.test(h)) throw 'claimed ready before it was';
  if(!/reopen once|Open it once more/i.test(h)) throw 'no instruction to reopen';
});
t('a local file ignores the worker entirely', function(){
  var _loc=globalThis.location,_nav=globalThis.navigator;
  globalThis.location=undefined;
  globalThis.navigator={serviceWorker:{controller:{}}, onLine:true};
  var r=offlineReport();
  globalThis.location=_loc; globalThis.navigator=_nav;
  if(r.level!=='local') throw 'level '+r.level+' for a local file';
  if(r.sw!=='none') throw 'sw '+r.sw+' — a file: page cannot have one';
});
t('served from a URL with no worker it says so instead of promising', function(){
  var _loc=globalThis.location,_nav=globalThis.navigator;
  globalThis.location={protocol:'https:'};
  globalThis.navigator={onLine:true};          /* no serviceWorker at all */
  var r=offlineReport();
  globalThis.location=_loc; globalThis.navigator=_nav;
  if(r.level!=='hosted') throw 'level '+r.level+' when served over https';
  if(r.local) throw 'claimed to be a local file';
});
t('the hosted wording does not overpromise', function(){
  var _loc=globalThis.location,_nav=globalThis.navigator;
  globalThis.location={protocol:'https:'};
  globalThis.navigator={onLine:true};
  (openAllGroups(),renderSettings());
  var h=document.querySelector('#setBody').innerHTML;
  globalThis.location=_loc; globalThis.navigator=_nav;
  if(/Ready to use offline/.test(h)) throw 'promised offline from a web address';
  if(!/not guaranteed/.test(h)) throw 'no caveat shown';
  if(!/put sw\.js next to index\.html/.test(h)) throw 'does not name the fix';
  if(!/save the file to/.test(h)) throw 'no fallback offered';
});
t('blocked storage outranks everything else', function(){
  var real=globalThis.localStorage;
  globalThis.localStorage={setItem:function(){throw 'quota';},
    getItem:function(){return null;},removeItem:function(){}};
  var r=offlineReport();
  globalThis.localStorage=real;
  if(r.level!=='blocked') throw 'level '+r.level+' with storage throwing';
  if(r.ready) throw 'ready:true with no storage';
});

print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
