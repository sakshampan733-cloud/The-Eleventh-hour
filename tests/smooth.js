var app = readFile('tests/app.js').replace("'use strict';",'');
app += ';globalThis.__=({get S(){return S},set S(v){S=v},get ttDate(){return ttDate},set ttDate(v){ttDate=v}});'+
 'globalThis.addDays=addDays;globalThis.isoOf=isoOf;globalThis.dateOf=dateOf;globalThis.dowOf=dowOf;'+
 'globalThis.todayISO=todayISO;globalThis.markKey=markKey;globalThis.slotsOn=slotsOn;globalThis.subById=subById;'+
 'globalThis.nextSkipDay=nextSkipDay;globalThis.skipDayImpact=skipDayImpact;globalThis.skipDayLabel=skipDayLabel;'+
 'globalThis.keepScroll=keepScroll;globalThis.pctOf=pctOf;';
var ok=0,fail=0;
function t(n,f){ try{ f(); print('  PASS  '+n); ok++; }catch(e){ print('  FAIL  '+n+' :: '+e); fail++; } }
(0,eval)(app); var S=__.S; loadDemo(); S=__.S;
function clearToday(){
  var iso=todayISO();
  slotsOn(dowOf(new Date()),iso).forEach(function(sl){ delete S.marks[markKey(iso,sl)]; });
}

print('— the skip feature is now always reachable —');
t('falls forward to the next class day when today is clear', function(){
  var iso=todayISO(), dow=dowOf(new Date());
  slotsOn(dow,iso).forEach(function(sl){ S.marks[markKey(iso,sl)]='p'; });   // today done
  if(skipDayImpact(iso)!==null) throw 'today should have nothing left';
  var x=nextSkipDay();
  if(!x) throw 'nothing found in the next 8 days';
  if(x.iso===iso) throw 'returned today even though today is fully marked';
  if(dateOf(x.iso)<=dateOf(iso)) throw 'returned a past day';
  clearToday();
});
t('prefers today when today still has classes', function(){
  clearToday();
  var x=nextSkipDay();
  if(!x) throw 'nothing found';
  var todays=slotsOn(dowOf(new Date()),todayISO()).filter(function(s){return subById(s.subId);});
  if(todays.length && x.iso!==todayISO()) throw 'skipped past today';
});
t('labels the day in plain language', function(){
  if(skipDayLabel(todayISO())!=='today') throw 'today';
  if(skipDayLabel(isoOf(addDays(new Date(),1)))!=='tomorrow') throw 'tomorrow';
  var far=skipDayLabel(isoOf(addDays(new Date(),4)));
  if(far==='today'||far==='tomorrow') throw 'a distant day should be named by weekday, got '+far;
});
t('the sheet marks the right day, not blindly today', function(){
  clearToday();
  var iso=todayISO(), dow=dowOf(new Date());
  slotsOn(dow,iso).forEach(function(sl){ S.marks[markKey(iso,sl)]='p'; });   // today done
  var x=nextSkipDay();
  var before={}; Object.keys(S.marks).forEach(function(k){ before[k]=1; });
  x.pending.forEach(function(sl){ S.marks[markKey(x.iso,sl)]='a'; });
  var added=Object.keys(S.marks).filter(function(k){ return !before[k]; });
  added.forEach(function(k){
    if(k.slice(0,10)!==x.iso) throw 'marked the wrong date: '+k;
  });
  if(added.length!==x.count) throw 'wrote '+added.length+' marks, expected '+x.count;
  x.pending.forEach(function(sl){ delete S.marks[markKey(x.iso,sl)]; });
  clearToday();
});
t('the Today row appears even with nothing left today', function(){
  var iso=todayISO(), dow=dowOf(new Date());
  slotsOn(dow,iso).forEach(function(sl){ S.marks[markKey(iso,sl)]='p'; });
  renderHome();
  var h=document.querySelector('#homeTiles').innerHTML;
  if(!/homeSkip/.test(h)) throw 'skip row vanished when today was fully marked';
  if(!/Skip /.test(h)) throw 'label missing';
  clearToday();
});
t('the sheet still opens and renders for a future day', function(){
  var x=skipDayImpact(isoOf(addDays(new Date(),3)))||nextSkipDay();
  if(x) sheetSkipToday(x);
});

print('— smoothness: marking must not move the page —');
t('keepScroll restores the scroll position', function(){
  window.scrollY=420;
  var moved=false;
  window.scrollTo=function(x,y){ if(y===420) moved=true; };
  keepScroll(function(){ /* pretend a re-render happened */ });
  if(!moved) throw 'scroll position was not restored';
});
t('marking a class keeps the page where it was', function(){
  clearToday();
  var iso=todayISO(), sl=slotsOn(dowOf(new Date()),iso).filter(function(s){return subById(s.subId);})[0];
  if(!sl) return;
  window.scrollY=300; var restored=0;
  window.scrollTo=function(x,y){ restored=y; };
  setMark(markKey(iso,sl),'p');
  if(restored!==300) throw 'page jumped (restored to '+restored+')';
  delete S.marks[markKey(iso,sl)];
});
t('centreRail retries instead of giving up when layout is not ready', function(){
  var rail=document.querySelector('#dayStrip');
  __.ttDate=new Date(); renderTT();
  var asked=0;
  globalThis.requestAnimationFrame=function(fn){ asked++; };
  rail._cw=0;                       // simulate the tab still being hidden
  centreRail(rail);
  if(!asked) throw 'gave up without scheduling a retry';
  rail._cw=375;
  globalThis.requestAnimationFrame=undefined;
});

print('— offline —');
t('no code path reaches the network', function(){
  var src=readFile('tests/app.js');
  ['fetch(','XMLHttpRequest','WebSocket','EventSource','sendBeacon','http://','https://']
    .forEach(function(bad){ if(src.indexOf(bad)>=0) throw 'found "'+bad+'" in the app code'; });
});
t('state survives a full save/reload cycle with no network', function(){
  loadDemo(); S=__.S;
  save();
  var raw=localStorage.getItem('sem5plan');
  var back=JSON.parse(raw);
  if(back.subs.length!==S.subs.length) throw 'subjects lost';
  if(Object.keys(back.marks).length!==Object.keys(S.marks).length) throw 'marks lost';
  if(back.thr!==S.thr||back.tone!==S.tone||back.theme!==S.theme) throw 'settings lost';
});
t('no undefined leaked', function(){ if(LOG.length) throw LOG.length+' leak(s): '+LOG[0]; });

print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
