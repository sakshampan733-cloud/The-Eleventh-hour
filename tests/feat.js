var app = readFile('tests/app.js').replace("'use strict';",'');
app += ';globalThis.__=({get S(){return S},set S(v){S=v},get ttDate(){return ttDate},set ttDate(v){ttDate=v}});'+
 'globalThis.addDays=addDays;globalThis.isoOf=isoOf;globalThis.dateOf=dateOf;globalThis.dowOf=dowOf;'+
 'globalThis.todayISO=todayISO;globalThis.markKey=markKey;globalThis.slotsOn=slotsOn;globalThis.subById=subById;'+
 'globalThis.monthEntries=monthEntries;globalThis.monthHTML=monthHTML;'+
 'globalThis.pctOf=pctOf;globalThis.mustAttend=mustAttend;globalThis.uid=uid;';
var ok=0,fail=0;
function t(n,f){ var snap=__.S;
  try{ f(); print('  PASS  '+n); ok++; }
  catch(e){ print('  FAIL  '+n+' :: '+e); fail++; __.S=snap; }  // don't leak a fixture
  finally{ S=__.S; }   // re-sync the local alias (loadDemo swaps the object)
}
(0,eval)(app); var S=__.S; loadDemo(); S=__.S;

/* give "today" some unmarked classes whatever weekday the test runs on */
function seedToday(nSubs){
  var dow=dowOf(new Date());
  S.slots=S.slots.filter(function(s){return s.id.indexOf('tst')!==0;});
  for(var i=0;i<nSubs;i++)
    S.slots.push({id:'tst'+i,subId:S.subs[i].id,day:dow,kind:'th',start:'09:00',end:'10:00',room:'R'});
}

print('— skip-today: the maths must be honest —');
t('returns null when there is nothing left to skip', function(){
  S.slots=S.slots.filter(function(s){return s.id.indexOf('tst')!==0;});
  var iso=todayISO(), dow=dowOf(new Date());
  slotsOn(dow,iso).forEach(function(sl){ S.marks[markKey(iso,sl)]='p'; });
  if(skipDayImpact(todayISO())!==null) throw 'should be null when all of today is marked';
  slotsOn(dow,iso).forEach(function(sl){ delete S.marks[markKey(iso,sl)]; });
});
t('the projected % equals attended/(total+skipped)', function(){
  seedToday(2);
  var x=skipDayImpact(todayISO());
  x.rows.forEach(function(r){
    var A=attFor(r.sub.id);
    var expect=pctOf(A.p, A.t + r.n);
    if(Math.abs(r.after-expect)>1e-9) throw r.sub.code+': got '+r.after+' expected '+expect;
  });
});
t('skipping never raises a percentage', function(){
  seedToday(3);
  skipDayImpact(todayISO()).rows.forEach(function(r){
    if(r.had && r.after > r.now + 1e-9) throw r.sub.code+' went UP after skipping';
  });
});
t('"safe" genuinely means still at or above the threshold', function(){
  seedToday(4);
  var x=skipDayImpact(todayISO());
  x.rows.forEach(function(r){
    if(!r.had) return;
    if(r.safe && r.after < S.thr) throw r.sub.code+' marked safe at '+r.after+'%';
    if(!r.safe && r.after >= S.thr) throw r.sub.code+' marked unsafe at '+r.after+'%';
  });
});
t('the recovery number actually reaches the threshold', function(){
  seedToday(4);
  var x=skipDayImpact(todayISO());
  x.rows.forEach(function(r){
    if(!r.recover || !isFinite(r.recover)) return;
    var A=attFor(r.sub.id), p=A.p, tot=A.t+r.n, n=r.recover;
    if((p+n)/(tot+n)*100 < S.thr-1e-9) throw r.sub.code+': '+n+' classes does not reach '+S.thr+'%';
    if(n>1 && (p+n-1)/(tot+n-1)*100 >= S.thr) throw r.sub.code+': overshoots by one';
  });
});
t('verdict is "don\'t" when a safe subject is pushed under', function(){
  var keep=__.S;
  __.S={subs:[{id:'a',name:'Edge',code:'ED',ci:0}],
        slots:[{id:'s1',subId:'a',day:dowOf(new Date()),kind:'th',start:'09:00',end:'10:00'}],
        marks:{}, att:{a:{thp:67,tha:33}},          // exactly 67% of 100
        dls:[],cats:[],thr:67,theme:'auto',tone:'plain',tab:'home'};
  var x=skipDayImpact(todayISO());
  if(x.verdict!=='no') throw 'expected "no", got "'+x.verdict+'" (after='+x.rows[0].after+'%)';
  if(!x.breaks.length && !x.already.length) throw 'not flagged in either list';
  __.S=keep;
});
t('verdict is "safe" with a comfortable buffer', function(){
  var keep=__.S;
  __.S={subs:[{id:'a',name:'Comfy',code:'CF',ci:0}],
        slots:[{id:'s1',subId:'a',day:dowOf(new Date()),kind:'th',start:'09:00',end:'10:00'}],
        marks:{}, att:{a:{thp:95,tha:5}},           // 95%
        dls:[],cats:[],thr:67,theme:'auto',tone:'plain',tab:'home'};
  var x=skipDayImpact(todayISO());
  if(x.verdict!=='ok') throw 'expected "ok", got "'+x.verdict+'"';
  __.S=keep;
});
t('a subject already below the line is flagged, not called safe', function(){
  var keep=__.S;
  __.S={subs:[{id:'a',name:'Behind',code:'BH',ci:0}],
        slots:[{id:'s1',subId:'a',day:dowOf(new Date()),kind:'th',start:'09:00',end:'10:00'}],
        marks:{}, att:{a:{thp:40,tha:60}},          // 40%
        dls:[],cats:[],thr:67,theme:'auto',tone:'plain',tab:'home'};
  var x=skipDayImpact(todayISO());
  if(x.verdict!=='no') throw 'expected "no", got "'+x.verdict+'"';
  if(!x.already.length) throw 'should be in the already-below list';
  __.S=keep;
});
t('a brand-new subject with no history does not show a scary 0%', function(){
  var keep=__.S;
  __.S={subs:[{id:'a',name:'Fresh',code:'FR',ci:0}],
        slots:[{id:'s1',subId:'a',day:dowOf(new Date()),kind:'th',start:'09:00',end:'10:00'}],
        marks:{},att:{},dls:[],cats:[],thr:67,theme:'auto',tone:'plain',tab:'home'};
  var x=skipDayImpact(todayISO());
  if(x.rows[0].had!==0) throw 'should report no history';
  sheetSkipToday();
  var h=document.querySelector('#sheetBody').innerHTML;
  if(!/No classes recorded yet/.test(h)) throw 'did not say there is no history';
  __.S=keep;
});
t('"Mark today absent" marks exactly today\'s pending classes', function(){
  seedToday(2);
  var x=skipDayImpact(todayISO()), before=Object.keys(S.marks).length;
  x.pending.forEach(function(sl){ S.marks[markKey(todayISO(),sl)]='a'; });
  if(Object.keys(S.marks).length!==before+x.count) throw 'wrong number of marks written';
  if(skipDayImpact(todayISO())!==null) throw 'still reports pending classes after marking';
  x.pending.forEach(function(sl){ delete S.marks[markKey(todayISO(),sl)]; });
});
t('the sheet renders in all four tones', function(){
  seedToday(3);
  ['pro','plain','friendly','snark'].forEach(function(tone){ S.tone=tone; sheetSkipToday(); });
  S.tone='friendly';
});
t('the Today row appears and is wired up', function(){
  seedToday(2); renderHome();
  var h=document.querySelector('#homeTiles').innerHTML;
  if(!/homeSkip/.test(h)) throw 'skip row missing from Today';
  if(!/Skip today\?/.test(h)) throw 'row label missing';
});

print('\n— month drill-down —');
t('a month groups its marks by day', function(){
  S.slots=S.slots.filter(function(s){return s.id.indexOf('tst')!==0;});
  loadDemo(); S=__.S;
  var mo=Object.keys(S.marks).map(function(k){return k.slice(0,7);}).sort()[0];
  var d=monthEntries(mo);
  var days=Object.keys(d);
  if(!days.length) throw 'no days found for '+mo;
  days.forEach(function(iso){ if(iso.slice(0,7)!==mo) throw 'wrong month leaked in: '+iso; });
});
t('every mark in the month appears exactly once', function(){
  var mo=Object.keys(S.marks).map(function(k){return k.slice(0,7);}).sort()[0];
  var inMonth=Object.keys(S.marks).filter(function(k){
    return k.slice(0,7)===mo && subById(k.split('|')[2]);
  }).length;
  var d=monthEntries(mo), count=0;
  Object.keys(d).forEach(function(iso){ count+=d[iso].length; });
  if(count!==inMonth) throw 'listed '+count+' of '+inMonth;
});
t('month totals match the summary row', function(){
  var mo=Object.keys(S.marks).map(function(k){return k.slice(0,7);}).sort()[0];
  var d=monthEntries(mo), P=0,A=0;
  Object.keys(d).forEach(function(iso){ d[iso].forEach(function(e){
    if(e.mark==='p') P++; else if(e.mark==='a') A++; }); });
  var h=monthHTML(mo);
  if(h.indexOf(P+' present · '+A+' absent')<0) throw 'summary does not match: expected '+P+'/'+A;
});
t('cancelled classes are excluded from the month percentage', function(){
  var mo=Object.keys(S.marks).map(function(k){return k.slice(0,7);}).sort()[0];
  var day=Object.keys(monthEntries(mo))[0];
  var probe=day+'|zzz|'+S.subs[0].id+'|th';
  S.marks[probe]='c';
  var h=monthHTML(mo);
  if(!/cancelled/.test(h)) throw 'cancelled not shown';
  var d=monthEntries(mo), P=0,A=0;
  Object.keys(d).forEach(function(iso){ d[iso].forEach(function(e){
    if(e.mark==='p') P++; else if(e.mark==='a') A++; }); });
  if(h.indexOf(P+' present · '+A+' absent')<0) throw 'cancelled leaked into present/absent';
  delete S.marks[probe];
});
t('a mark whose class was deleted still shows', function(){
  var mo=Object.keys(S.marks).map(function(k){return k.slice(0,7);}).sort()[0];
  var day=Object.keys(monthEntries(mo))[0];
  var probe=day+'|gone-forever|'+S.subs[0].id+'|pr';
  S.marks[probe]='p';
  var h=monthHTML(mo);
  if(!/class since removed/.test(h)) throw 'orphaned mark not surfaced';
  delete S.marks[probe];
});
t('a mark for a deleted subject is skipped, not crashed on', function(){
  var mo=Object.keys(S.marks).map(function(k){return k.slice(0,7);}).sort()[0];
  var day=Object.keys(monthEntries(mo))[0];
  S.marks[day+'|x|no-such-subject|th']='p';
  monthHTML(mo);          // must not throw
  sheetMonth(mo);
  delete S.marks[day+'|x|no-such-subject|th'];
});
t('month rows are tappable', function(){
  renderAtt();
  var h=document.querySelector('#attMonths').innerHTML;
  if(!/data-mo="/.test(h)) throw 'no month is tappable';
});
t('no undefined leaked', function(){ if(LOG.length) throw LOG.length+' leak(s): '+LOG[0]; });

print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
