var app=readFile('tests/app.js').replace("'use strict';",'');
app+=';globalThis.__=({get S(){return S},set S(v){S=v}});'+
 'globalThis.addDays=addDays;globalThis.isoOf=isoOf;globalThis.dateOf=dateOf;globalThis.dowOf=dowOf;'+
 'globalThis.todayISO=todayISO;globalThis.normalise=normalise;globalThis.markKey=markKey;'+
 'globalThis.leaveApplication=leaveApplication;globalThis.absenceRange=absenceRange;'+
 'globalThis.longestSafeLeave=longestSafeLeave;globalThis.sheetLeave=sheetLeave;'+
 'globalThis.sheetLeaveApp=sheetLeaveApp;globalThis.LEAVE_KINDS=LEAVE_KINDS;'+
 'globalThis.doSave=function(){return sheetSave&&sheetSave();};';
var ok=0,fail=0;
function t(n,f){ try{ f(); print('  PASS  '+n); ok++; }catch(e){ print('  FAIL  '+n+' :: '+e); fail++; } }
(0,eval)(app);

var FROM=todayISO(), TO=isoOf(addDays(new Date(),6));
function setup(extra){
  __.S=normalise(Object.assign({
    subs:[{id:'a',name:'Cost Accounting',code:'CA',ci:0},
          {id:'b',name:'Indian Economy',code:'IE',ci:1}],
    slots:[0,1,2,3,4,5,6].map(function(d){
      return {id:'w'+d,subId:d%2?'a':'b',day:d,kind:'th',start:'10:00',end:'11:00'};}),
    thr:67, att:{a:{thp:40,tha:8},b:{thp:40,tha:8}},
    termEnd:isoOf(addDays(new Date(),90)),
    name:'Saksham Panchal', roll:'21/1234', course:'B.Com (Hons)',
    college:'Shaheed Bhagat Singh College'
  },extra||{}));
}

print('— it writes a real application —');
t('every kind of leave produces a letter, not just medical', function(){
  setup();
  LEAVE_KINDS.forEach(function(k){
    var m=leaveApplication(FROM,TO,k.k,'',''); 
    if(!/Respected Sir/.test(m)) throw k.k+' has no salutation';
    if(/undefined|NaN|\[object/.test(m)) throw k.k+' leaked: '+m.slice(0,80);
    if(m.length<200) throw k.k+' produced a stub';
  });
});
t('the reason you type is what the letter says', function(){
  setup();
  var m=leaveApplication(FROM,TO,'med','typhoid','');
  if(m.indexOf('suffering from typhoid')<0) throw 'illness not stated';
  if(m.indexOf('medical certificate')<0) throw 'no certificate line for medical';
});
t('a wedding does not come out sounding medical', function(){
  setup();
  var m=leaveApplication(FROM,TO,'func','my sister’s wedding','');
  if(/suffering|doctor|medical certificate/.test(m)) throw 'medical wording in a wedding letter';
  if(m.indexOf('my sister’s wedding')<0) throw 'the reason is missing';
  if(m.indexOf('out of station')<0) throw 'no travel wording';
});
t('leaving the reason blank still gives a usable letter', function(){
  setup();
  var m=leaveApplication(FROM,TO,'fam','','');
  if(/ , |  |,\./.test(m)) throw 'ragged punctuation from the empty reason';
  if(m.indexOf('urgent family matter')<0) throw 'no fallback wording';
  if(/undefined/.test(m)) throw 'leaked undefined';
});
t('a trailing full stop in your reason is not doubled', function(){
  setup();
  var m=leaveApplication(FROM,TO,'med','dengue.','');
  if(m.indexOf('dengue..')>=0||m.indexOf('dengue. and')>=0) throw 'punctuation doubled';
});
t('the dates in the letter are the dates you picked', function(){
  setup();
  var m=leaveApplication(FROM,TO,'trav','a family trip','');
  var d1=dateOf(FROM).toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'});
  var d2=dateOf(TO).toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'});
  if(m.indexOf(d1)<0||m.indexOf(d2)<0) throw 'dates missing';
  if(m.indexOf('(7 days)')<0) throw 'day count wrong';
});
t('a single day reads "on", not "from X to X"', function(){
  setup();
  var m=leaveApplication(FROM,FROM,'med','fever','');
  if(/from .* to /.test(m)) throw 'a one-day leave was written as a range';
  if(m.indexOf('(1 day)')<0) throw 'said "1 days"';
});
t('it states the real cost, taken from your timetable', function(){
  setup();
  var r=absenceRange(FROM,TO);
  var m=leaveApplication(FROM,TO,'med','flu','');
  if(m.indexOf('missing '+r.total+' class')<0) throw 'class count missing or wrong';
});
t('your details sign it off', function(){
  setup();
  var m=leaveApplication(FROM,TO,'med','flu','');
  if(m.indexOf('Saksham Panchal')<0) throw 'no name';
  if(m.indexOf('21/1234')<0) throw 'no roll number';
  if(m.indexOf('B.Com (Hons)')<0) throw 'no course';
  if(m.indexOf('Shaheed Bhagat Singh College')<0) throw 'no college';
});
t('with no details saved it still produces a sendable letter', function(){
  setup({name:'',roll:'',course:'',college:''});
  var m=leaveApplication(FROM,TO,'med','flu','');
  if(/undefined|null/.test(m)) throw 'leaked: '+m;
  if(/\n\n\n/.test(m)) throw 'gaping holes where the details were';
  if(!/Yours sincerely/.test(m)) throw 'no sign-off';
});
t('you can address it to a specific person', function(){
  setup();
  var m=leaveApplication(FROM,TO,'med','flu','Dr. Meera Sharma');
  if(m.indexOf('Dr. Meera Sharma')<0) throw 'addressee ignored';
  if(m.indexOf('The Head of Department')>=0) throw 'still says HOD too';
});
t('it stays formal even on the snarkiest tone setting', function(){
  setup({tone:'snark'});
  var m=leaveApplication(FROM,TO,'med','flu','');
  if(!/Respected Sir|Yours sincerely/.test(m)) throw 'tone leaked into the letter';
});
t('a reason with markup cannot break out of the preview', function(){
  setup();
  sheetLeaveApp(FROM,TO);
  var d=document.querySelector('#lvDetail');
  if(!d) throw 'no reason field';
  var m=leaveApplication(FROM,TO,'oth','<img src=x onerror=alert(1)>','');
  if(m.indexOf('<img')<0) throw 'the text itself should be kept verbatim';
  var h=document.querySelector('#sheetBody').innerHTML;
  if(/onerror=/.test(h)) throw 'unescaped markup reached the DOM';
});

print('\n— the leave sheet —');
t('it offers the application', function(){
  setup(); sheetLeave();
  var h=document.querySelector('#sheetBody').innerHTML;
  if(!/lvWrite/.test(h)) throw 'no way to write one';
  if(!/Write a leave application/.test(h)) throw 'not labelled';
});
t('it still does the arithmetic it always did', function(){
  setup(); sheetLeave();
  var h=document.querySelector('#sheetBody').innerHTML;
  if(!/classes missed over/.test(h)) throw 'lost the cost summary';
  if(/undefined/.test(h)) throw 'leaked undefined';
});
t('the old trip wording is gone', function(){
  setup(); sheetLeave();
  var h=document.querySelector('#sheetBody').innerHTML;
  if(/longest trip|before you book/.test(h)) throw 'still framed as a trip';
});
print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
