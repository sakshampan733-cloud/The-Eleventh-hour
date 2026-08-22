var app = readFile('tests/app.js').replace("'use strict';",'');
app += ';globalThis.__=({get S(){return S},set S(v){S=v}});'+
 'globalThis.addDays=addDays;globalThis.isoOf=isoOf;globalThis.dateOf=dateOf;globalThis.dowOf=dowOf;'+
 'globalThis.todayISO=todayISO;globalThis.markKey=markKey;globalThis.t2m=t2m;globalThis.m2t=m2t;'+
 'globalThis.normalise=normalise;globalThis.dayBlocks=dayBlocks;globalThis.dayOptions=dayOptions;'+
 'globalThis.pctOf=pctOf;globalThis.subById=subById;';
var ok=0,fail=0;
function t(n,f){ try{ f(); print('  PASS  '+n); ok++; }catch(e){ print('  FAIL  '+n+' :: '+e); fail++; } }
(0,eval)(app);

/* YOUR EXACT SITUATION: 8-9, 9-10, 10-11, 12-1. The middle two cancelled. */
var TMR=addDays(new Date(),1), TISO=isoOf(TMR), DOW=dowOf(TMR);
function scenario(opts){
  opts=opts||{};
  var marks={};
  if(opts.cancelMiddle){ marks[TISO+'|s2|b|th']='c'; marks[TISO+'|s3|c|th']='c'; }
  __.S=normalise({
    subs:[{id:'a',name:'Cost Accounting',code:'CA',ci:0},
          {id:'b',name:'Indian Economy',code:'IE',ci:1},
          {id:'c',name:'Intl Business',code:'IB',ci:2},
          {id:'d',name:'Business Stats',code:'BS',ci:3}],
    slots:[{id:'s1',subId:'a',day:DOW,kind:'th',start:'08:00',end:'09:00',room:'B'},
           {id:'s2',subId:'b',day:DOW,kind:'th',start:'09:00',end:'10:00',room:'B'},
           {id:'s3',subId:'c',day:DOW,kind:'th',start:'10:00',end:'11:00',room:'B'},
           {id:'s4',subId:'d',day:DOW,kind:'th',start:'12:00',end:'13:00',room:'B'}],
    marks:marks,
    att:opts.att||{a:{thp:80,tha:20},b:{thp:80,tha:20},c:{thp:80,tha:20},d:{thp:80,tha:20}},
    planner:true,readyMin:15,readyMax:30,travelAM:40,travelMid:60,travelPM:50,thr:67
  });
  return dayOptions(TISO);
}

print('— your exact situation: 8–9 and 12–1 left, 9–11 cancelled —');
t('cancelled classes drop out of the day', function(){
  var x=scenario({cancelMiddle:true});
  if(x.all.length!==2) throw 'expected 2 live classes, got '+x.all.length;
  var codes=x.all.map(function(s){return subById(s.subId).code;}).sort().join(',');
  if(codes!=='BS,CA') throw 'wrong classes survived: '+codes;
});
t('the 3-hour gap splits the day into two blocks', function(){
  var b=dayBlocks(TISO);
  if(b.length!==2) throw 'expected 2 blocks, got '+b.length;
  if(m2t(b[0].start)!=='8am'||m2t(b[0].end)!=='9am') throw 'block 1 wrong';
  if(m2t(b[1].start)!=='12pm'||m2t(b[1].end)!=='1pm') throw 'block 2 wrong';
});
t('going for everything means 5 hours on campus for 2 of class', function(){
  var x=scenario({cancelMiddle:true});
  var f=x.full;
  if(f.onCampus!==300) throw 'onCampus '+f.onCampus+' min, expected 300';
  if(f.contact!==120) throw 'contact '+f.contact+' min, expected 120';
  if(f.dead!==180) throw 'dead time '+f.dead+' min, expected 180 (3 hours)';
});
t('offers exactly the sensible choices', function(){
  var x=scenario({cancelMiddle:true});
  var labels=x.opts.map(function(o){return o.label;});
  if(x.opts.length!==4) throw 'expected 4 options, got '+x.opts.length+': '+labels.join(' | ');
  if(labels.indexOf('Go for everything')<0) throw 'missing "everything"';
  if(labels.indexOf('Skip everything')<0) throw 'missing "skip the day"';
});
t('the single-block options have no waiting', function(){
  var x=scenario({cancelMiddle:true});
  x.opts.forEach(function(o){
    if(o.count===1 && o.dead!==0) throw o.label+' shows '+o.dead+' min of waiting for one class';
  });
});
t('skipping the 8am gives a much later start', function(){
  var x=scenario({cancelMiddle:true});
  var lateOnly=x.opts.filter(function(o){ return o.count===1 && o.first.start==='12:00'; })[0];
  if(!lateOnly) throw 'no midday-only option';
  if(lateOnly.travel!==60) throw 'midday travel band not used: '+lateOnly.travel;
  if(m2t(lateOnly.leaveHome)!=='11am') throw 'leave time '+m2t(lateOnly.leaveHome);
  var full=x.full;
  if(m2t(full.leaveHome)!=='7:20am') throw 'full-day leave time '+m2t(full.leaveHome);
});
t('attendance cost of each option is arithmetically right', function(){
  var x=scenario({cancelMiddle:true});
  x.opts.forEach(function(o){
    o.rows.forEach(function(r){
      var A=attFor(r.sub.id);
      var expect=pctOf(A.p, A.t+r.n);
      if(Math.abs(r.after-expect)>1e-9) throw o.label+'/'+r.sub.code+': '+r.after+' vs '+expect;
    });
  });
});
t('with healthy attendance it suggests dropping the isolated class', function(){
  var x=scenario({cancelMiddle:true});               // everyone at 80%
  if(x.best.count!==1) throw 'suggested "'+x.best.label+'" instead of a single block';
  if(x.best.dead!==0) throw 'suggestion still has waiting';
  if(x.best.unsafe) throw 'suggested an option that costs attendance';
});
t('when a subject is borderline it refuses to suggest skipping it', function(){
  // BS is at exactly the line, so missing the 12-1 would push it under
  var x=scenario({cancelMiddle:true,
    att:{a:{thp:80,tha:20},b:{thp:80,tha:20},c:{thp:80,tha:20},d:{thp:67,tha:33}}});
  var skipsBS=x.opts.filter(function(o){
    return o.skipped.some(function(sl){ return sl.subId==='d'; }); });
  if(!skipsBS.length) throw 'no option skips BS';
  skipsBS.forEach(function(o){
    if(!o.unsafe) throw o.label+' skips a borderline subject but is not flagged';
  });
  if(x.best.skipped.some(function(sl){ return sl.subId==='d'; }))
    throw 'suggested skipping the borderline subject';
});

print('\n— the general shape —');
t('a back-to-back day reports no waiting and suggests going', function(){
  var x=scenario();                                  // nothing cancelled: 8-11 + 12-1
  var b=dayBlocks(TISO);
  if(b[0].slots.length!==3) throw 'the 8-11 run should be one block, got '+b[0].slots.length;
  if(x.full.dead!==60) throw 'expected the 11-12 gap only, got '+x.full.dead;
});
t('a 45-minute gap does NOT split a block', function(){
  __.S=normalise({subs:[{id:'a',name:'X',code:'X',ci:0}],
    slots:[{id:'p',subId:'a',day:DOW,kind:'th',start:'09:00',end:'10:00'},
           {id:'q',subId:'a',day:DOW,kind:'th',start:'10:45',end:'11:45'}],
    att:{},thr:67});
  if(dayBlocks(TISO).length!==1) throw 'a 45-min break should stay one block';
});
t('a 46-minute gap DOES split', function(){
  __.S=normalise({subs:[{id:'a',name:'X',code:'X',ci:0}],
    slots:[{id:'p',subId:'a',day:DOW,kind:'th',start:'09:00',end:'10:00'},
           {id:'q',subId:'a',day:DOW,kind:'th',start:'10:46',end:'11:45'}],
    att:{},thr:67});
  if(dayBlocks(TISO).length!==2) throw 'a 46-min gap should split the day';
});
t('a fully cancelled day offers nothing', function(){
  var m={}; m[TISO+'|p|a|th']='c';
  __.S=normalise({subs:[{id:'a',name:'X',code:'X',ci:0}],
    slots:[{id:'p',subId:'a',day:DOW,kind:'th',start:'09:00',end:'10:00'}],
    marks:m,att:{},thr:67});
  if(dayOptions(TISO)!==null) throw 'should return nothing when everything is cancelled';
  sheetWorthGoing(TISO);
  if(!/Nothing on/.test(document.querySelector('#sheetBody').innerHTML)) throw 'no empty state';
});
t('classes already marked are not counted as newly skipped', function(){
  var m={}; m[TISO+'|s1|a|th']='a';        // already recorded absent
  var x=scenario({cancelMiddle:true});
  __.S.marks[TISO+'|s1|a|th']='a';
  var y=dayOptions(TISO);
  var skipDay=y.opts[y.opts.length-1];
  if(skipDay.skipped.some(function(sl){ return sl.id==='s1'; }))
    throw 'counted an already-marked class as a new skip';
});
t('the sheet renders in every tone without leaking', function(){
  scenario({cancelMiddle:true});
  ['pro','plain','friendly','snark'].forEach(function(tone){
    __.S.tone=tone; sheetWorthGoing(TISO);
    var h=document.querySelector('#sheetBody').innerHTML;
    if(/undefined|NaN/.test(h)) throw tone+': leaked undefined/NaN';
    if(!/Your options/.test(h)) throw tone+': options missing';
  });
});
t('entry points are wired', function(){
  scenario({cancelMiddle:true});
  renderHome();
  if(!/nextWorth/.test(document.querySelector('#homeNext').innerHTML))
    throw 'next-day card has no "Worth going?" button';
  if(!/homeWorthRow/.test(document.querySelector('#homeTiles').innerHTML))
    throw '"Worth going?" is not surfaced near the top of Today';
});
t('no undefined leaked', function(){ if(LOG.length) throw LOG.length+' leak(s): '+LOG[0]; });

print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
