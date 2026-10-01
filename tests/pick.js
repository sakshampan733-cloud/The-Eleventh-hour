var app=readFile('tests/app.js').replace("'use strict';",'');
app+=';globalThis.__=({get S(){return S},set S(v){S=v},get pickSel(){return pickSel},set pickSel(v){pickSel=v}});'+
 'globalThis.addDays=addDays;globalThis.isoOf=isoOf;globalThis.dateOf=dateOf;globalThis.dowOf=dowOf;'+
 'globalThis.todayISO=todayISO;globalThis.markKey=markKey;globalThis.t2m=t2m;globalThis.m2t=m2t;'+
 'globalThis.normalise=normalise;globalThis.planImpact=planImpact;globalThis.dayOptions=dayOptions;'+
 'globalThis.sheetPickDay=sheetPickDay;globalThis.pickHTML=pickHTML;globalThis.planFor=planFor;'+
 'globalThis.setPlan=setPlan;globalThis.liveSlots=liveSlots;globalThis.sheetWorthGoing=sheetWorthGoing;globalThis.doSave=function(){return sheetSave&&sheetSave();};';
var ok=0,fail=0;
function t(n,f){ try{ f(); print('  PASS  '+n); ok++; }catch(e){ print('  FAIL  '+n+' :: '+e); fail++; } }
(0,eval)(app);

var TMR=addDays(new Date(),1), TISO=isoOf(TMR), DOW=dowOf(TMR);
/* the exact day described: one campus class, one online, plus two more */
function day(){
  __.S=normalise({
    subs:[{id:'a',name:'Cost Accounting',code:'CA',ci:0},
          {id:'b',name:'Indian Economy',code:'IE',ci:1},
          {id:'c',name:'Intl Business',code:'IB',ci:2}],
    slots:[{id:'s1',subId:'a',day:DOW,kind:'th',start:'08:00',end:'09:00',room:'B-12'},
           {id:'s2',subId:'b',day:DOW,kind:'th',start:'09:00',end:'10:00',online:true},
           {id:'s3',subId:'c',day:DOW,kind:'pr',start:'12:00',end:'13:00',room:'Lab'},
           {id:'s4',subId:'a',day:DOW,kind:'tu',start:'15:00',end:'16:00',room:'B-12'}],
    planner:true,readyMin:15,readyMax:30,travelAM:40,travelMid:60,travelPM:50,
    thr:67, att:{a:{thp:20,tha:6},b:{thp:20,tha:6},c:{thp:20,tha:6}},
    termEnd: isoOf(addDays(new Date(),90))});
}

print('— any combination at all, not just whole blocks —');
t('the campus class + the online one is expressible', function(){
  day();
  var o=planImpact(TISO,['s1','s2']);
  if(o.count!==2) throw 'count '+o.count;
  if(o.onCampus!==60) throw 'onCampus '+o.onCampus+', expected just the 8-9';
  if(o.dead!==0) throw 'invented '+o.dead+' minutes of waiting';
  if(o.onlineCount!==1) throw 'onlineCount '+o.onlineCount;
  if(o.skipped.length!==2) throw 'skipped '+o.skipped.length;
});
t('a pick the presets cannot express is still judged properly', function(){
  day();
  /* blocks are [8-9] [12-1] [3-4]; presets only ever offer contiguous runs,
     so first-and-last-but-not-the-middle has no preset */
  var want=['s1','s2','s4'].join();
  var hit=dayOptions(TISO).opts.filter(function(o){
    return o.ids.slice().sort().join()===want; });
  if(hit.length) throw 'assumed unreachable, but a preset covers it';
  var o=planImpact(TISO,['s1','s2','s4']);
  if(o.count!==3) throw 'count '+o.count;
  if(o.skipped.length!==1||o.skipped[0].id!=='s3') throw 'wrong class counted as skipped';
});
t('dropping just the online class is expressible', function(){
  day();
  var want=['s1'].join();
  var hit=dayOptions(TISO).opts.filter(function(o){
    return o.ids.slice().sort().join()===want; });
  if(hit.length) throw 'a preset already drops the online class';
  var o=planImpact(TISO,['s1']);
  if(o.onlineCount!==0) throw 'online class crept in';
  if(!o.skipped.some(function(sl){return sl.id==='s2';}))
    throw 'skipping the online class was not counted against you';
});
t('a non-contiguous pick is judged, not rejected', function(){
  day();
  var o=planImpact(TISO,['s1','s4']);       /* 8-9 and 3-4, nothing between */
  if(o.count!==2) throw 'count '+o.count;
  if(o.onCampus!==480) throw 'onCampus '+o.onCampus+', expected 8am-4pm';
  if(o.dead!==360) throw 'dead '+o.dead+', expected 6 hours of waiting';
});
t('picking nothing is staying home', function(){
  day();
  var o=planImpact(TISO,[]);
  if(o.count!==0||o.onCampus!==0||o.travel!==0) throw 'not a clean stay-home';
  if(o.skipped.length!==4) throw 'skipped '+o.skipped.length;
});
t('picking only online means no travel and no campus time', function(){
  day();
  var o=planImpact(TISO,['s2']);
  if(!o.allOnline) throw 'allOnline not set';
  if(o.travel!==0||o.onCampus!==0) throw 'asked to travel for an online class';
  if(o.leaveHome!==null) throw 'gave a leave-home time for a day at home';
});
t('wake and leave follow the first campus class you picked, not the first class', function(){
  day();
  var o=planImpact(TISO,['s2','s3']);      /* online 9am, campus noon */
  if(o.first.id!=='s3') throw 'first is '+o.first.id;
  if(o.leaveHome!==t2m('12:00')-60) throw 'leaveHome '+m2t(o.leaveHome)+' (midday band is 60)';
  if(o.wakeAt!==t2m('12:00')-60-30) throw 'wakeAt '+m2t(o.wakeAt);
});
t('classes already marked are not counted as skipped', function(){
  day();
  __.S.marks[markKey(TISO,__.S.slots[0])]='p';   /* attended the 8am */
  var o=planImpact(TISO,['s2']);
  if(o.skipped.some(function(sl){return sl.id==='s1';}))
    throw 'a class you attended was counted as a skip';
});

print('\n— the picker itself —');
t('it opens pre-filled with the whole day', function(){
  day(); sheetPickDay(TISO);
  var n=Object.keys(__.pickSel).filter(function(k){return __.pickSel[k];}).length;
  if(n!==4) throw 'started with '+n+' of 4 selected';
});
t('it opens pre-filled with an existing plan instead', function(){
  day(); setPlan(TISO,['s1','s2']); sheetPickDay(TISO);
  var sel=Object.keys(__.pickSel).filter(function(k){return __.pickSel[k];}).sort();
  if(sel.join()!=='s1,s2') throw 'started with '+sel.join();
});
t('the running summary reflects what is ticked', function(){
  day(); sheetPickDay(TISO);
  __.pickSel={s1:true,s2:true};
  var h=pickHTML(TISO);
  if(!/2<\/span>/.test(h.replace(/\s+/g,''))&&!/>2</.test(h)) throw 'count not shown';
  if(!/of 4 class/.test(h)) throw 'total not shown';
  if(/undefined|NaN/.test(h)) throw 'leaked undefined/NaN';
});
t('online classes are labelled so you know what needs travel', function(){
  day(); sheetPickDay(TISO);
  var h=pickHTML(TISO);
  if((h.match(/tag online/g)||[]).length!==1) throw 'online tag count wrong';
});
t('saving writes exactly what you ticked', function(){
  day(); sheetPickDay(TISO);
  __.pickSel={s1:true,s3:true};
  doSave();
  var pl=planFor(TISO);
  if(!pl||pl.slice().sort().join()!=='s1,s3') throw 'saved '+(pl?pl.join():'nothing');
});
t('ticking everything clears the plan rather than storing a redundant one', function(){
  day(); setPlan(TISO,['s1']); sheetPickDay(TISO);
  __.pickSel={s1:true,s2:true,s3:true,s4:true};
  doSave();
  if(planFor(TISO)) throw 'stored a plan identical to the default day';
});
t('saving nothing is a real "not going", not a cleared plan', function(){
  day(); sheetPickDay(TISO);
  __.pickSel={};
  doSave();
  var pl=planFor(TISO);
  if(!pl) throw 'a deliberate full skip was thrown away';
  if(pl.length) throw 'saved '+pl.length+' classes for a full skip';
});
t('Worth going offers the way in', function(){
  day(); sheetWorthGoing(TISO);
  var h=document.querySelector('#sheetBody').innerHTML;
  if(!/wgPick/.test(h)) throw 'no hand-pick entry point';
  if(!/Pick classes by hand/.test(h)) throw 'not labelled';
});
print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
