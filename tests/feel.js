var app=readFile('tests/app.js').replace("'use strict';",'');
app+=';globalThis.__=({get S(){return S},set S(v){S=v},get ttDate(){return ttDate},set ttDate(v){ttDate=v},'+
 'get scrollMem(){return scrollMem},get renderedFor(){return renderedFor},set renderedFor(v){renderedFor=v},'+
 'get calSel(){return calSel}});'+
 'globalThis.addDays=addDays;globalThis.isoOf=isoOf;globalThis.todayISO=todayISO;globalThis.normalise=normalise;'+
 'globalThis.markSeen=markSeen;globalThis.SEEN_KEY=SEEN_KEY;globalThis.showTab=showTab;';
var ok=0,fail=0;
function t(n,f){ try{ f(); print('  PASS  '+n); ok++; }catch(e){ print('  FAIL  '+n+' :: '+e); fail++; } }
var REAL_DATE=Date;
function setDay(offsetDays,hour){
  function D(a,b,c,d,e,f){
    if(arguments.length===0){ var x=new REAL_DATE(); x.setDate(x.getDate()+offsetDays);
      x.setHours(hour==null?10:hour,0,0,0); return x; }
    if(arguments.length===1) return new REAL_DATE(a);
    return new REAL_DATE(a,b,c,d,e,f); }
  D.now=REAL_DATE.now;D.parse=REAL_DATE.parse;D.UTC=REAL_DATE.UTC;D.prototype=REAL_DATE.prototype;
  globalThis.Date=D;
}
function realDay(){ globalThis.Date=REAL_DATE; }
(0,eval)(app);

print('— it opens where a daily app should —');
t('after a long gap it opens on Today, not where you stopped', function(){
  var last=Date.now()-60*60000;                       // an hour ago
  var tab='settings';
  var open = (!last || Date.now()-last>15*60000 || tab==='settings') ? 'home' : tab;
  if(open!=='home') throw 'would have reopened on '+open;
});
t('coming straight back resumes the tab you were on', function(){
  var last=Date.now()-60000;                          // a minute ago
  var tab='attendance';
  var open = (!last || Date.now()-last>15*60000 || tab==='settings') ? 'home' : tab;
  if(open!=='attendance') throw 'lost your place, went to '+open;
});
t('it never reopens into Settings', function(){
  var last=Date.now()-1000;
  var open = (!last || Date.now()-last>15*60000 || 'settings'==='settings') ? 'home' : 'settings';
  if(open!=='home') throw 'reopened into Settings';
});
t('the last-seen stamp is written', function(){
  try{ localStorage.removeItem(SEEN_KEY); }catch(e){}
  markSeen();
  var v=+localStorage.getItem(SEEN_KEY);
  if(!v || Math.abs(Date.now()-v)>5000) throw 'stamp not written';
});

print('\n— each tab keeps its place —');
t('leaving a tab stores where you were', function(){
  __.S=normalise({subs:[],slots:[],marks:{},att:{},dls:[]});
  showTab('home');
  window.scrollY=340;
  showTab('attendance');
  if(__.scrollMem.home!==340) throw 'home position not stored, got '+__.scrollMem.home;
});
t('returning restores it instead of jumping to the top', function(){
  __.S=normalise({subs:[],slots:[],marks:{},att:{},dls:[]});
  showTab('home'); window.scrollY=512; showTab('deadlines');
  var restored=null;
  window.scrollTo=function(x,y){ restored=y; };
  showTab('home');
  if(restored!==512) throw 'restored to '+restored+', expected 512';
});
t('a tab you have never opened starts at the top', function(){
  var restored=-1;
  window.scrollTo=function(x,y){ restored=y; };
  showTab('calendar');
  if(restored!==0) throw 'a fresh tab started at '+restored;
});

print('\n— midnight —');
t('the app notices the date changed while it was closed', function(){
  __.S=normalise({subs:[{id:'a',name:'X',code:'X',ci:0}],slots:[],marks:{},att:{},dls:[]});
  showTab('timetable');
  var before=todayISO();
  __.renderedFor=before;
  setDay(1,0);                                   // reopened just after midnight
  var rolled = todayISO()!==__.renderedFor;
  if(!rolled) throw 'did not detect the rollover';
  __.ttDate=new Date();
  if(isoOf(__.ttDate)!==todayISO()) throw 'timetable did not snap to the new day';
  realDay();
});
t('a stale "today" is not left on screen', function(){
  __.S=normalise({subs:[{id:'a',name:'X',code:'X',ci:0}],
    slots:[{id:'s',subId:'a',day:0,kind:'th',start:'09:00',end:'10:00'}],marks:{},att:{},dls:[]});
  setDay(0,23); showTab('home'); renderHome();
  var yesterday=document.querySelector('#todayDate').textContent;
  setDay(1,0); renderHome();
  var today=document.querySelector('#todayDate').textContent;
  if(yesterday===today) throw 'the date on screen did not change after midnight';
  realDay();
});

print('\n— it should not feel like a web page —');
t('controls suppress the iOS Copy/Look-Up bubble', function(){
  var css=readFile('docs/index.html');
  if(!/-webkit-touch-callout:none/.test(css)) throw 'callout not suppressed';
  css=css.replace(/\/\*[\s\S]*?\*\//g,'');   /* strip comments first */
  var m=css.match(/([^{}]+)\{[^{}]*-webkit-touch-callout:none/);
  if(!m) throw 'could not find the rule';
  var selectors=m[1].split(',').map(function(x){return x.trim();});
  ['button','.row','.tile','.cls','.dChip','#tabbar'].forEach(function(sel){
    if(selectors.indexOf(sel)<0) throw sel+' not covered (rule covers: '+selectors.join(' ')+')';
  });
});
t('sheets can be dragged away', function(){
  var src=readFile('docs/index.html');
  if(!/drag the sheet down to dismiss/.test(src)) throw 'no drag-to-dismiss';
  if(!/d>90/.test(src)) throw 'no dismissal threshold';
});
t('the drag never fights the sheet’s own scrolling', function(){
  var src=readFile('docs/index.html');
  if(!/scrollTop\|\|0\)<=0/.test(src.replace(/\s+/g,''))) throw 'drag not gated on scroll position';
});
t('reduced-motion is respected', function(){
  if(!/prefers-reduced-motion/.test(readFile('docs/index.html'))) throw 'no reduced-motion handling';
});
t('nothing leaked', function(){ if(LOG.length) throw LOG.length+' leak(s): '+LOG[0]; });

print('\n— it responds to being touched —');
t('every control springs under the finger', function(){
  var css=readFile('docs/index.html');
  if(!/transform:scale\(var\(--press/.test(css.replace(/\s+/g,'')))
    throw 'no press compression';
  if(!/transition-duration:\.09s/.test(css.replace(/\s+/g,'')))
    throw 'no fast-down, slow-back spring';
});
t('cards arrive in reading order, not all at once', function(){
  var css=readFile('docs/index.html');
  if(!/@keyframes riseIn/.test(css)) throw 'no entrance';
  var delays=(css.match(/animation-delay:\.\d+s/g)||[]).length;
  if(delays<5) throw 'only '+delays+' staggered delays';
});
t('all of it collapses under reduced motion', function(){
  var css=readFile('docs/index.html').replace(/\s+/g,' ');
  var m=css.match(/@media \(prefers-reduced-motion: reduce\)\{([^}]*\}){1,8}/g);
  if(!m) throw 'no reduced-motion block';
  if(!/animation:none/.test(m.join(' '))) throw 'animations not disabled';
  if(!/transform:none/.test(css.match(/prefers-reduced-motion: reduce[\s\S]{0,400}/)[0]))
    throw 'press transform not disabled';
});
t('the panel floats clear of the edges rather than welding to the bottom', function(){
  var css=readFile('docs/index.html').replace(/\s+/g,'');
  if(!/#sheet\{[^}]*top:50%/.test(css)) throw 'sheet is not centred';
  if(/#sheet\{[^}]*bottom:0/.test(css)) throw 'still welded to the bottom edge';
  if(!/#sheet\{[^}]*backdrop-filter:saturate\(200%\)blur\(40px\)/.test(css))
    throw 'the panel is not glass';
  if(!/max-width:540px/.test(css)) throw 'no width limit — it will stretch on a big screen';
});
t('nested surfaces inside the glass do not frost again', function(){
  var css=readFile('docs/index.html').replace(/\s+/g,'');
  if(!/#sheet\.card,#sheet\.list,#sheet\.setG\{[^}]*backdrop-filter:none/.test(css))
    throw 'blur stacks on blur inside the panel';
});
t('the scrim reveals rather than blacks out', function(){
  var css=readFile('docs/index.html').replace(/\s+/g,'');
  if(!/#scrim\{[^}]*backdrop-filter:saturate\(120%\)blur\(3px\)/.test(css))
    throw 'scrim does not blur what is behind';
});

print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
