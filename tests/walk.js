/* Drive the app through whole days, minute by minute, on a timetable shaped
   like the real one, and assert the screen never contradicts itself. */
var app=readFile('tests/app.js').replace("'use strict';",'');
app+=';globalThis.__=({get S(){return S},set S(v){S=v}});globalThis.addDays=addDays;globalThis.isoOf=isoOf;'+
 'globalThis.dowOf=dowOf;globalThis.todayISO=todayISO;globalThis.normalise=normalise;globalThis.markKey=markKey;'+
 'globalThis.morningStatus=morningStatus;globalThis.homewardStatus=homewardStatus;globalThis.dayPlan=dayPlan;'+
 'globalThis.t2m=t2m;globalThis.m2t=m2t;globalThis.setPlan=setPlan;globalThis.showTab=showTab;'+
 'globalThis.renderAll=renderAll;globalThis.nextClassDay=nextClassDay;globalThis.setMark=setMark;globalThis.setMark=setMark;';
var REAL_DATE=Date;
function setClock(m){ function D(a,b,c,d,e,f){
  if(arguments.length===0){var x=new REAL_DATE();x.setHours(Math.floor(m/60),m%60,0,0);return x;}
  if(arguments.length===1) return new REAL_DATE(a); return new REAL_DATE(a,b,c,d,e,f); }
  D.now=REAL_DATE.now;D.parse=REAL_DATE.parse;D.UTC=REAL_DATE.UTC;D.prototype=REAL_DATE.prototype;
  globalThis.Date=D; }
function realClock(){ globalThis.Date=REAL_DATE; }
var ok=0,fail=0,seen={};
function t(n,f){ try{ f(); print('  PASS  '+n); ok++; }
  catch(e){ print('  FAIL  '+n+' :: '+e); fail++; } finally{ realClock(); } }
(0,eval)(app);

var TD=dowOf(new Date()), TI=todayISO();
/* the real shape: 6 classes, a practical, a tutorial, one of them online */
function realDay(extra){
  __.S=normalise(Object.assign({
    subs:[{id:'ma',name:'management accounting',code:'MA',ci:0},
          {id:'au',name:'auditing',code:'AU',ci:1},
          {id:'eco',name:'basic development economics',code:'ECO',ci:2},
          {id:'fa',name:'finance for everyone',code:'FA',ci:3}],
    slots:[{id:'a1',subId:'ma',day:TD,kind:'pr',start:'08:00',end:'09:00',room:'LAB'},
           {id:'a2',subId:'ma',day:TD,kind:'th',start:'09:00',end:'10:00',room:'B-12'},
           {id:'a3',subId:'au',day:TD,kind:'th',start:'12:00',end:'13:00',room:'B-12'},
           {id:'a4',subId:'eco',day:TD,kind:'tu',start:'16:00',end:'17:00',online:true},
           {id:'b1',subId:'fa',day:(TD+1)%7,kind:'th',start:'10:00',end:'11:00',room:'C-3'}],
    planner:true,readyMin:15,readyMax:30,travelAM:40,travelMid:60,travelPM:50,commute:'driver',
    thr:67, att:{ma:{thp:8,tha:12},au:{thp:6,tha:10},eco:{thp:1,tha:0},fa:{thp:2,tha:8}},
    termEnd:isoOf(addDays(new Date(),110))},extra||{}));
}
function screen(){
  var ids=['heroWrap','homeTiles','homeClasses','homeNext','homeDue','homeWeek'];
  return ids.map(function(i){var e=document.querySelector('#'+i);return e?e.innerHTML:'';}).join('\n');
}
function plain(h){ return h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); }

/* every headline (.hN) on the Today screen — one per card */
function headlines(h){
  var out=[],re=/class="hN"[^>]*>([\s\S]*?)<\/div>/g,m;
  while((m=re.exec(h))) out.push(plain(m[1]));
  return out;
}
function kickers(h){
  var out=[],re=/class="hK"[^>]*>([\s\S]*?)<\/div>/g,m;
  while((m=re.exec(h))) out.push(plain(m[1]));
  return out;
}

print('— a full day, every 15 minutes, nothing marked —');
t('no undefined, NaN or [object anywhere, all day', function(){
  realDay();
  for(var m=5*60;m<=23*60;m+=15){
    setClock(m); renderAll();
    var h=screen();
    var bad=h.match(/undefined|NaN|\[object|Infinity/);
    if(bad) throw 'at '+m2t(m)+': '+bad[0];
  }
});
t('a null time never renders as midnight', function(){
  realDay({slots:[{id:'o1',subId:'eco',day:TD,kind:'tu',start:'16:00',end:'17:00',online:true}]});
  for(var m=5*60;m<=23*60;m+=15){
    setClock(m); renderAll();
    var h=plain(screen());
    if(/(Pickup at|Leave by|Set off at|Wake by|leave by|wake by)\s*12am/.test(h))
      throw 'at '+m2t(m)+': a missing time printed as 12am';
  }
});
t('the same class is never the headline of two cards at once', function(){
  realDay();
  for(var m=5*60;m<=23*60;m+=15){
    setClock(m); renderAll();
    var hs=headlines(screen()).filter(function(x){return x;});
    var c={};
    for(var i=0;i<hs.length;i++){
      if(c[hs[i]]) throw 'at '+m2t(m)+': "'+hs[i]+'" headlines two cards';
      c[hs[i]]=1;
    }
  }
});
t('a pickup/wake time is never shown for a day with nothing to travel to', function(){
  realDay();
  for(var m=5*60;m<=23*60;m+=15){
    setClock(m); renderAll();
    var h=plain(screen());
    /* find any card claiming a departure */
    if(/Pickup at|Wake by|wake by|Set off at|Leave by/.test(h)){
      var nd=nextClassDay();
      var day = (morningStatus()? dayPlan(TI) : (nd?nd.plan:null));
      if(day && !day.skippingAll && !day.firstOnsite)
        throw 'at '+m2t(m)+': departure shown for an all-online day — '+h.slice(0,110);
    }
  }
});
t('a leave time is always earlier than the class it is for', function(){
  realDay();
  for(var m=5*60;m<=23*60;m+=15){
    setClock(m);
    var p=dayPlan(TI);
    if(p.leaveAt!=null && p.firstOnsite && p.travel>0){
      if(p.leaveAt>=t2m(p.firstOnsite.start))
        throw 'at '+m2t(m)+': leave '+m2t(p.leaveAt)+' for a '+p.firstOnsite.start+' class';
      if(p.wakeAt!=null && p.wakeAt>p.leaveAt)
        throw 'at '+m2t(m)+': wake after leaving';
    }
  }
});
t('never "done for the day" while a class is still to come', function(){
  realDay();
  for(var m=5*60;m<=23*60;m+=15){
    setClock(m); renderAll();
    var h=plain(screen());
    if(/Done for the day|That’s your day done/.test(h) && /Next up|Getting to college|Online in/.test(h))
      throw 'at '+m2t(m)+': done and pending at once';
  }
});

print('\n— the same day, marking classes as you go —');
t('marking each class in turn never breaks the screen', function(){
  realDay();
  var order=[['a1',9*60+2],['a2',10*60+2],['a3',13*60+2],['a4',17*60+2]];
  order.forEach(function(step){
    setClock(step[1]);
    var sl=__.S.slots.filter(function(x){return x.id===step[0];})[0];
    __.S.marks[markKey(TI,sl)]='p';
    renderAll();
    var h=screen();
    if(/undefined|NaN/.test(h)) throw 'after marking '+step[0]+': leak';
    var hs=headlines(h).filter(function(x){return x;}), c={};
    hs.forEach(function(x){ if(c[x]) throw 'after marking '+step[0]+': "'+x+'" twice'; c[x]=1; });
  });
});
t('after the last class is marked, it talks about going home — once', function(){
  realDay();
  ['a1','a2','a3'].forEach(function(id){
    var sl=__.S.slots.filter(function(x){return x.id===id;})[0];
    __.S.marks[markKey(TI,sl)]='p';
  });
  setClock(13*60+10); renderAll();
  var h=plain(screen());
  var n=(h.match(/Heading home/g)||[]).length;
  if(n!==1) throw '"Heading home" appears '+n+' times';
  if(/Getting to college/.test(h)) throw 'still routing you to college';
});
t('an all-online day never mentions travel at all', function(){
  realDay({slots:[{id:'o1',subId:'eco',day:TD,kind:'tu',start:'16:00',end:'17:00',online:true},
                  {id:'o2',subId:'ma',day:TD,kind:'th',start:'18:00',end:'19:00',online:true}]});
  for(var m=6*60;m<=20*60;m+=15){
    setClock(m); renderAll();
    var h=plain(screen());
    if(/Pickup at|Wake by|wake by|min travel|on the road|Heading home/.test(h))
      throw 'at '+m2t(m)+': '+h.match(/Pickup at|Wake by|wake by|min travel|on the road|Heading home/)[0];
  }
});
t('planning only the online class does not produce a pickup', function(){
  realDay();
  setPlan(TI,['a4']);                       /* the 4pm online tutorial only */
  for(var m=6*60;m<=15*60;m+=15){
    setClock(m); renderAll();
    var h=plain(screen());
    if(/Pickup at|Wake by/.test(h))
      throw 'at '+m2t(m)+': '+h.slice(h.search(/Pickup at|Wake by/),120);
  }
});

print('\n— you cannot be in two places at once —');
t('never travelling and in class at the same moment', function(){
  realDay();
  for(var m=5*60;m<=23*60;m+=5){
    setClock(m); renderAll();
    var h=plain(screen());
    if(/In class now/.test(h) && /On your way|Getting to college|Heading home|From home/.test(h))
      throw 'at '+m2t(m)+': in class AND '+
        h.match(/On your way|Getting to college|Heading home|From home/)[0];
  }
});
t('tapping "on my way" does not follow you into the classroom', function(){
  realDay();
  __.S.enroute={iso:TI, at:7*60+30};
  for(var m=8*60;m<=10*60;m+=5){
    setClock(m); renderAll();
    var h=plain(screen());
    if(/In class now/.test(h) && /On your way|Arriving/.test(h))
      throw 'at '+m2t(m)+': still "on your way" from a seat in the room';
  }
});
t('en route expires once you would have arrived', function(){
  realDay();
  __.S.enroute={iso:TI, at:7*60};
  setClock(9*60+30);
  var ms=morningStatus();
  if(ms && ms.level==='enroute') throw 'still en route two hours after arriving';
});
t('marking present clears the journey', function(){
  realDay();
  setClock(8*60+30);
  __.S.enroute={iso:TI, at:8*60};
  var sl=__.S.slots.filter(function(x){return x.id==='a1';})[0];
  setMark(markKey(TI,sl),'p');
  if(__.S.enroute) throw 'still travelling to a class you marked present';
});
t('the 9:18am case, exactly as reported', function(){
  realDay();
  setClock(9*60+18);
  __.S.enroute={iso:TI, at:8*60+18};
  renderAll();
  var h=plain(screen());
  if(!/In class now/.test(h)) throw 'lost the in-class card';
  if(/On your way|Arriving \d/.test(h)) throw 'still on your way: '+h.slice(0,130);
});

t('once you have marked a class present, the commute is never mentioned again', function(){
  realDay();
  var sl=__.S.slots.filter(function(x){return x.id==='a1';})[0];   /* the 8am */
  __.S.marks[markKey(TI,sl)]='p';
  for(var m=9*60;m<=23*60;m+=5){
    setClock(m); renderAll();
    var h=plain(screen());
    if(/Getting to college|On your way|I\u2019m on my way|Leave in|leave by/.test(h))
      throw 'at '+m2t(m)+': '+h.match(/Getting to college|On your way|I\u2019m on my way|Leave in|leave by/)[0]+
            ' \u2014 from campus';
  }
});
t('but a day you have not attended still gets its commute', function(){
  realDay();
  setClock(7*60); renderAll();
  if(!/Getting to college/.test(plain(screen())))
    throw 'lost the commute card on a normal morning';
});

print('\n— every tab, every hour —');
t('all five tabs render all day without leaking', function(){
  realDay();
  ['home','timetable','attendance','due','calendar'].forEach(function(tab){
    for(var m=6*60;m<=22*60;m+=60){
      setClock(m); showTab(tab); renderAll();
      var e=document.querySelector('#app')||document.querySelector('body');
      var h=e?e.innerHTML:'';
      if(/undefined|NaN|\[object/.test(h)) throw tab+' at '+m2t(m)+' leaked';
    }
  });
  showTab('home');
});
print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
