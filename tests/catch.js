var app = readFile('tests/app.js').replace("'use strict';",'');
app += ';globalThis.__=({get S(){return S},set S(v){S=v},get ttDate(){return ttDate},set ttDate(v){ttDate=v},get catchBack(){return catchBack},set catchBack(v){catchBack=v}});'+
  'globalThis.addDays=addDays;globalThis.isoOf=isoOf;globalThis.dateOf=dateOf;globalThis.dowOf=dowOf;'+
  'globalThis.todayISO=todayISO;globalThis.markKey=markKey;globalThis.slotsOn=slotsOn;globalThis.t2m=t2m;'+'globalThis.unmarkedCount=unmarkedCount;globalThis.subById=subById;';
var ok=0, fail=0;
function t(n,f){ try{ f(); print('  PASS  '+n); ok++; }catch(e){ print('  FAIL  '+n+' :: '+e); fail++; } }
(0,eval)(app);
var S=__.S;
loadDemo(); S=__.S;

print('— catch-up: finding unmarked past classes —');
t('unmarkedPast returns groups newest-first', function(){
  var g=unmarkedPast(21);
  if(!g.length) throw 'demo data should leave past classes unmarked';
  for(var i=1;i<g.length;i++)
    if(g[i].iso >= g[i-1].iso) throw 'not newest-first: '+g[i-1].iso+' then '+g[i].iso;
});
t('never includes future dates', function(){
  unmarkedPast(21).forEach(function(g){
    if(g.iso > todayISO()) throw 'future date leaked in: '+g.iso;
  });
});
t('never includes already-marked classes', function(){
  var g=unmarkedPast(21);
  g.forEach(function(day){ day.slots.forEach(function(sl){
    if(S.marks[markKey(day.iso,sl)]) throw 'marked class listed as unmarked';
  }); });
});
t('marking a past class removes it from the list', function(){
  var before=unmarkedCount(21);
  if(!before) throw 'need unmarked classes for this test';
  var g=unmarkedPast(21)[0], sl=g.slots[0];
  S.marks[markKey(g.iso,sl)]='p';
  var after=unmarkedCount(21);
  if(after!==before-1) throw 'expected '+(before-1)+', got '+after;
  delete S.marks[markKey(g.iso,sl)];
  if(unmarkedCount(21)!==before) throw 'unmark did not restore';
});
t('looking back further finds at least as many', function(){
  var near=unmarkedCount(7), far=unmarkedCount(28);
  if(far<near) throw 'wider window found fewer: '+far+' < '+near;
});
t('today only counts classes that have already ended', function(){
  var iso=todayISO(), d=dowOf(new Date());
  var mins=new Date().getHours()*60+new Date().getMinutes();
  var listed=unmarkedPast(0)[0];
  if(listed) listed.slots.forEach(function(sl){
    if(t2m(sl.end)>mins) throw 'a class that has not ended yet was listed: ends '+sl.end;
  });
});

print('\n— catch-up: marking actually counts —');
t('marking a 3-week-old class raises the percentage', function(){
  var old=null, slots=[];
  for(var i=14;i<=27 && !slots.length;i++){
    old=isoOf(addDays(new Date(),-i));
    slots=slotsOn(dowOf(dateOf(old)), old).filter(function(s){return subById(s.subId);});
  }
  if(!slots.length) throw 'no class in weeks 2-4 back to test with';
  var sub=slots[0].subId, before=attFor(sub);
  S.marks[markKey(old,slots[0])]='p';
  var after=attFor(sub);
  if(after.p!==before.p+1) throw 'present count did not rise';
  if(after.t!==before.t+1) throw 'total did not rise';
  delete S.marks[markKey(old,slots[0])];
  if(attFor(sub).p!==before.p) throw 'undo failed';
});
t('marking absent lowers the percentage', function(){
  var old=null, slots=[];
  for(var i=8;i<=14 && !slots.length;i++){
    old=isoOf(addDays(new Date(),-i));
    slots=slotsOn(dowOf(dateOf(old)), old).filter(function(s){return subById(s.subId);});
  }
  if(!slots.length) throw 'no class in week 2 back';
  var sub=slots[0].subId, before=attFor(sub);
  var beforePct=before.t?before.p/before.t:1;
  S.marks[markKey(old,slots[0])]='a';
  var a=attFor(sub);
  if(a.a!==before.a+1) throw 'absent count did not rise';
  if(a.p/a.t >= beforePct) throw 'percentage should have dropped';
  delete S.marks[markKey(old,slots[0])];
});

print('\n— catch-up: rendering —');
t('catchUpHTML renders with data', function(){
  var h=catchUpHTML();
  if(!h || h.length<50) throw 'suspiciously empty';
  if(/undefined|NaN/.test(h)) throw 'leaked undefined/NaN: '+h.slice(0,200);
});
t('catchUpHTML renders the empty state cleanly', function(){
  var keep=S.marks, keepSlots=S.slots;
  S.slots=[];
  var h=catchUpHTML();
  if(!/caught up|Nothing outstanding/i.test(h)) throw 'no empty state: '+h.slice(0,150);
  S.slots=keepSlots;
});
t('sheetCatchUp opens without error', function(){ sheetCatchUp(); });

print('\n— week navigation —');
t('jumping back 3 weeks renders', function(){
  __.ttDate=addDays(new Date(),-21); renderTT();
});
t('a 2-week-old weekday still offers marking', function(){
  var back=addDays(new Date(),-14);
  __.ttDate=back; renderTT();
  var iso=isoOf(back);
  var hasClasses=slotsOn(dowOf(back),iso).filter(function(s){return subById(s.subId);}).length;
  var html=document.querySelector('#ttBody').innerHTML;
  if(hasClasses && /Marking opens on the day/.test(html)) throw 'past day wrongly locked';
});
t('future days lock present/absent but allow cancelling', function(){
  var fwd=addDays(new Date(),3);
  __.ttDate=fwd; renderTT();
  var iso=isoOf(fwd);
  var hasClasses=slotsOn(dowOf(fwd),iso).filter(function(s){return subById(s.subId);}).length;
  var html=document.querySelector('#ttBody').innerHTML;
  if(hasClasses && /data-m="p"/.test(html)) throw 'future day offers Present — it should not';
  if(hasClasses && /data-m="a"/.test(html)) throw 'future day offers Absent — it should not';
  if(hasClasses && !/data-m="c"/.test(html)) throw 'future day should still allow cancelling';
  if(hasClasses && !/opens on the day/.test(html)) throw 'no explanation of the lock';
  __.ttDate=new Date();
});
t('week nav across a month boundary works', function(){
  __.ttDate=new Date(2026,0,3); renderTT();   // Jan 3 -> back a week into Dec
  __.ttDate=addDays(__.ttDate,-7); renderTT();
  if(isoOf(__.ttDate).slice(0,7)!=='2025-12') throw 'expected Dec 2025, got '+isoOf(__.ttDate);
  __.ttDate=new Date();
});

print('\n— entry points render —');
t('Today shows the catch-up row', function(){
  renderHome();
  var h=document.querySelector('#homeTiles').innerHTML;
  if(unmarkedCount(21)>0 && !/homeCatch/.test(h)) throw 'catch-up row missing from Today';
});
t('Attendance shows the catch-up row', function(){
  renderAtt();
  var h=document.querySelector('#attTop').innerHTML;
  if(unmarkedCount(21)>0 && !/attCatch/.test(h)) throw 'catch-up row missing from Attendance';
});
t('no leaks anywhere', function(){ if(LOG.length) throw LOG.length+' leak(s): '+LOG[0]; });

print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
