var app=readFile('tests/app.js').replace("'use strict';",'');
app+=';globalThis.__=({get S(){return S},set S(v){S=v}});'+
 'globalThis.addDays=addDays;globalThis.isoOf=isoOf;globalThis.dateOf=dateOf;globalThis.dowOf=dowOf;'+
 'globalThis.todayISO=todayISO;globalThis.markKey=markKey;globalThis.t2m=t2m;globalThis.m2t=m2t;'+
 'globalThis.normalise=normalise;globalThis.dayOptions=dayOptions;globalThis.pctOf=pctOf;'+
 'globalThis.remainingBySub=remainingBySub;globalThis.slackFor=slackFor;globalThis.runwayVerdict=runwayVerdict;'+
 'globalThis.skipDayImpact=skipDayImpact;globalThis.termWeeksLeft=termWeeksLeft;globalThis.subById=subById;';
var ok=0,fail=0;
var S;
function t(n,f){ var snap=__.S;
  try{ f(); print('  PASS  '+n); ok++; }
  catch(e){ print('  FAIL  '+n+' :: '+e); fail++; __.S=snap; }
  finally{ S=__.S; }
}
(0,eval)(app);

var TMR=addDays(new Date(),1), TISO=isoOf(TMR), DOW=dowOf(TMR);
/* YOUR situation: everyone under 67%, 8-9 and 12-1 live, 9-11 cancelled */
function sem(endInDays){
  var marks={};
  marks[TISO+'|s2|b|th']='c'; marks[TISO+'|s3|c|th']='c';
  __.S=normalise({
    subs:[{id:'a',name:'Cost Accounting',code:'CA',ci:0},
          {id:'b',name:'Indian Economy',code:'IE',ci:1},
          {id:'c',name:'Intl Business',code:'IB',ci:2},
          {id:'d',name:'Business Stats',code:'BS',ci:3}],
    slots:[{id:'s1',subId:'a',day:DOW,kind:'th',start:'08:00',end:'09:00'},
           {id:'s2',subId:'b',day:DOW,kind:'th',start:'09:00',end:'10:00'},
           {id:'s3',subId:'c',day:DOW,kind:'th',start:'10:00',end:'11:00'},
           {id:'s4',subId:'d',day:DOW,kind:'th',start:'12:00',end:'13:00'},
           /* each subject meets twice more per week, as a real timetable does */
           {id:'x1',subId:'a',day:(DOW+2)%7,kind:'th',start:'08:00',end:'09:00'},
           {id:'x2',subId:'b',day:(DOW+2)%7,kind:'th',start:'09:00',end:'10:00'},
           {id:'x3',subId:'c',day:(DOW+2)%7,kind:'th',start:'10:00',end:'11:00'},
           {id:'x4',subId:'d',day:(DOW+2)%7,kind:'th',start:'12:00',end:'13:00'},
           {id:'y1',subId:'a',day:(DOW+4)%7,kind:'th',start:'08:00',end:'09:00'},
           {id:'y2',subId:'b',day:(DOW+4)%7,kind:'th',start:'09:00',end:'10:00'},
           {id:'y3',subId:'c',day:(DOW+4)%7,kind:'th',start:'10:00',end:'11:00'},
           {id:'y4',subId:'d',day:(DOW+4)%7,kind:'th',start:'12:00',end:'13:00'}],
    marks:marks,
    /* all four sitting at 50% — under the line, exactly your position */
    att:{a:{thp:20,tha:20},b:{thp:20,tha:20},c:{thp:20,tha:20},d:{thp:20,tha:20}},
    thr:67,
    termEnd: endInDays==null ? '' : isoOf(addDays(new Date(),endInDays))
  });
  return dayOptions(TISO);
}

print('— the same day, judged differently depending on time left —');
t('August (4 months left): skipping is recoverable, so it is allowed', function(){
  var x=sem(120);
  if(x.weeksLeft<15) throw 'expected a long runway, got '+x.weeksLeft+' weeks';
  var single=x.opts.filter(function(o){return o.count===1;});
  if(!single.length) throw 'no single-block option';
  if(single.every(function(o){return o.gone;}))
    throw 'every single-block option marked unrecoverable despite months left';
  if(x.best.count!==1) throw 'suggested "'+x.best.label+'" — should suggest dropping a block';
  if(x.best.dead!==0) throw 'suggestion still has a 3-hour gap';
});
t('December (2 weeks left): the same skip is no longer recoverable', function(){
  var x=sem(14);
  if(x.weeksLeft>3) throw 'expected a short runway, got '+x.weeksLeft;
  if(x.best.count!==2) throw 'suggested "'+x.best.label+'" — should now say go for everything';
  if(x.best.dead!==180) throw 'the suggestion should accept the 3-hour gap';
});
t('the crossover is driven purely by the maths, not a special case', function(){
  var firstGoDay=null;
  for(var d=7; d<=180; d+=7){
    var x=sem(d);
    if(x.best.count===2){ firstGoDay=d; }
    else break;
  }
  if(firstGoDay===null) throw 'never recommends going for everything, even at 1 week left';
  if(firstGoDay>=180) throw 'never relaxes, even with 6 months left';
});
t('slack is arithmetically correct', function(){
  sem(120);
  var rem=remainingBySub(TISO);
  Object.keys(rem).forEach(function(id){
    var A=attFor(id), k=rem[id], sl=slackFor(id,k);
    /* attending all but `sl` of the remaining must still clear the threshold */
    if(pctOf(A.p + (k-sl), A.t+k) < __.S.thr-1e-9)
      throw id+': missing '+sl+' leaves you short';
    /* one more than that must fail */
    if(sl+1<=k && pctOf(A.p + (k-sl-1), A.t+k) >= __.S.thr)
      throw id+': could afford one more than '+sl;
  });
});
t('slack shrinks as the term runs down', function(){
  var wide=sem(150), narrow=sem(21);
  var w=slackFor('a', remainingBySub(TISO)['a']||0);
  sem(150); var w2=slackFor('a', remainingBySub(TISO)['a']||0);
  sem(21);  var n2=slackFor('a', remainingBySub(TISO)['a']||0);
  if(!(w2>n2)) throw 'slack did not shrink: '+w2+' then '+n2;
});
t('once the threshold is unreachable it says so plainly', function(){
  var x=sem(7);
  var skipAll=x.opts[x.opts.length-1];
  if(!skipAll.gone) throw 'skipping everything with a week left should be unrecoverable';
  sheetWorthGoing(TISO);
  var h=document.querySelector('#sheetBody').innerHTML;
  if(!/can’t recover/.test(h)) throw 'sheet never says it cannot be recovered';
});
t('remaining count excludes classes already marked', function(){
  sem(60);
  var before=remainingBySub(TISO)['a']||0;
  var nextWeek=isoOf(addDays(TMR,7));
  __.S.marks[nextWeek+'|s1|a|th']='p';
  var after=remainingBySub(TISO)['a']||0;
  if(after!==before-1) throw 'expected '+(before-1)+', got '+after;
});
t('cancelled classes are not counted as remaining', function(){
  sem(60);
  var before=remainingBySub(TISO)['a']||0;
  var nextWeek=isoOf(addDays(TMR,7));
  __.S.marks[nextWeek+'|s1|a|th']='c';
  if((remainingBySub(TISO)['a']||0)!==before-1) throw 'a cancelled class still counted';
});

print('\n— with no term date it stays useful, and says why —');
t('falls back to the strict check and prompts for the date', function(){
  var x=sem(null);
  if(x.weeksLeft!==null) throw 'weeksLeft should be null with no term end';
  if(termWeeksLeft()!==null) throw 'termWeeksLeft should be null';
  sheetWorthGoing(TISO);
  var h=document.querySelector('#sheetBody').innerHTML;
  if(!/semester end date in Settings/.test(h)) throw 'does not prompt for the date';
  if(/undefined|NaN/.test(h)) throw 'leaked undefined';
});
t('skip-today also uses the runway', function(){
  sem(120);
  var near=skipDayImpact(TISO);
  sem(10);
  var far=skipDayImpact(TISO);
  if(!near||!far) throw 'no pending classes to judge';
  if(near.verdict==='no' && far.verdict==='no') throw 'verdict identical far and near — runway ignored';
  if(near.weeksLeft==null) throw 'skip-today missing weeksLeft';
});

print('\n— presentation —');
t('the sheet states how much term is left', function(){
  sem(120); sheetWorthGoing(TISO);
  var h=document.querySelector('#sheetBody').innerHTML;
  if(!/weeks of term left/.test(h)) throw 'runway not stated';
  if(!/spare/.test(h)) throw 'spare-class counts not shown';
});
t('attendance cards show the spare-class count', function(){
  sem(120); renderAtt();
  var h=document.querySelector('#attList').innerHTML;
  if(!/left this term/.test(h)) throw 'no runway on the attendance card';
  /* the spare count is now drawn as counted pips, not only stated */
  if(!/class="margin/.test(h)) throw 'no margin drawn on the attendance card';
  if(!/to spare/.test(h)) throw 'no spare count on the attendance card';
  if(!/you still finish at/.test(h)) throw 'does not say what it buys you';
});
t('Settings exposes the term end date', function(){
  sem(120); renderSettings();
  var h=document.querySelector('#setBody').innerHTML;
  if(!/setTermEnd/.test(h)) throw 'no term end field';
  if(!/weeks left/.test(h)) throw 'does not show weeks remaining';
});
t('renders in every tone with no leaks', function(){
  ['pro','plain','friendly','snark'].forEach(function(tone){
    sem(120); __.S.tone=tone;
    sheetWorthGoing(TISO); renderHome(); renderAtt();
    if(/undefined|NaN/.test(document.querySelector('#sheetBody').innerHTML)) throw tone;
  });
});
t('no undefined leaked', function(){ if(LOG.length) throw LOG.length+' leak(s): '+LOG[0]; });

print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
