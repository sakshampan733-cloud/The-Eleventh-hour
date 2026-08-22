var app=readFile('tests/app.js').replace("'use strict';",'');
app+=';globalThis.__=({get S(){return S},set S(v){S=v}});globalThis.normalise=normalise;'+
 'globalThis.addDays=addDays;globalThis.isoOf=isoOf;globalThis.remainingBySub=remainingBySub;';
(0,eval)(app);
function build(nSub,perWeek){
  var subs=[],slots=[];
  for(var i=0;i<nSub;i++){
    subs.push({id:'s'+i,name:'Subject '+i,code:'S'+i,ci:i%8});
    for(var d=0;d<perWeek;d++)
      slots.push({id:'sl'+i+'-'+d,subId:'s'+i,day:d,kind:'th',start:(8+d)+':00',end:(9+d)+':00'});
  }
  __.S=normalise({subs:subs,slots:slots,att:{},thr:67,planner:true,readyMin:15,readyMax:30,
    travelAM:40,travelMid:60,travelPM:50,termEnd:isoOf(addDays(new Date(),120))});
}
function time(label,f){ var t=Date.now(); for(var i=0;i<5;i++) f(); print('  '+label+': '+((Date.now()-t)/5).toFixed(1)+' ms/render'); }
print('realistic (6 subjects, 3 classes/week each, 4-month term):');
build(6,3); time('  renderHome', renderHome);
print('heavy (20 subjects, 5 classes/week each):');
build(20,5); time('  renderHome', renderHome);
print('no term date set (runway scan skipped entirely):');
build(6,3); __.S.termEnd=''; time('  renderHome', renderHome);
