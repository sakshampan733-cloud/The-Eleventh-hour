/* The seven mechanisms from bar.md, as checks that run every time.
   A design system that is only enforced by eye drifts back within a week;
   these are the parts that can be measured from the stylesheet itself. */
var SRC=readFile('index.html');
/* every <style> block, not just the first — the embedded @font-face lives
   in its own block ahead of the real stylesheet */
var CSS=(SRC.match(/<style>[\s\S]*?<\/style>/g)||[]).join('\n');
var flat=CSS.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ');
var ok=0,fail=0;
function t(n,f){ try{ f(); print('  PASS  '+n); ok++; }catch(e){ print('  FAIL  '+n+' :: '+e); fail++; } }

print('— 1. radius is 0 or a full pill, nothing between —');
t('no corner sits between 1px and 74px', function(){
  var bad=[];
  (flat.match(/border-radius:[^;}]+/g)||[]).forEach(function(d){
    (d.match(/(\d+(?:\.\d+)?)px/g)||[]).forEach(function(v){
      var n=parseFloat(v);
      if(n>=1 && n<75) bad.push(d.trim());
    });
  });
  if(bad.length) throw bad.length+' rounded corner(s): '+bad.slice(0,3).join(' | ');
});

print('\n— 2. no shadow anywhere —');
t('there is no box-shadow in the stylesheet', function(){
  var sh=(flat.match(/box-shadow:\s*(?!none)[^;}]+/g)||[]);
  if(sh.length) throw sh.length+' shadow(s): '+sh.slice(0,2).join(' | ');
});
t('blur appears only on chrome that floats over the field', function(){
  /* Blur is allowed exactly where something floats over the live backdrop:
     the tab pill, the command bar and its button. Anything opaque in those
     places cuts a hole in the ground. Blur anywhere else — on a card, a
     row, a panel that sits in the flow — is elevation, and elevation is not
     in this system. */
  var blurred=[];
  flat.replace(/([#.][\w-]+)\{([^}]*)\}/g,function(_,sel,body){
    if(/backdrop-filter:\s*(?!none)/.test(body)) blurred.push(sel);
    return _;
  });
  var allowed={'#tabs':1,'#cmd':1,'#cmdOpen':1};
  var stray=blurred.filter(function(sel){ return !allowed[sel]; });
  if(stray.length) throw 'blur outside the pill: '+stray.join(', ');
});

print('\n— 3. one curve, nothing under half a second —');
t('exactly one easing function is used', function(){
  var curves={};
  (flat.match(/cubic-bezier\([^)]*\)/g)||[]).forEach(function(c){
    curves[c.replace(/\s+/g,'')]=1; });
  var list=Object.keys(curves);
  if(list.length>1) throw list.length+' curves: '+list.join(' | ');
  /* .19 and 0.19 are the same curve written two ways */
  var norm=(list[0]||'').replace(/0\./g,'.');
  if(list.length && norm!=='cubic-bezier(.19,1,.22,1)') throw 'wrong curve: '+list[0];
});
t('motion sits in the band: nothing snaps, nothing is a wait', function(){
  var bad=[];
  /* delays are stagger offsets, not durations — only durations are capped */
  (flat.match(/(?:transition|animation)(?!-delay)[^;}]*/g)||[]).forEach(function(d){
    /* The floor used to be 0.5s, taken from the reference. The reference
       is a site you look at; this is an app opened for ten seconds
       between classes, and at half a second a press does not read as
       considered, it reads as late. The rule is now a band: fast enough
       to be an answer, slow enough to be movement, and never so long
       that using the thing means waiting for it. */
    /* In CSS shorthand the first time in each comma-separated segment is
       the duration and the second is the delay. A delay is not motion —
       staggering three things by 100ms apiece is the opposite of a snap —
       so only the duration is judged. */
    d.split(',').forEach(function(seg){
      var times=seg.match(/(?:^|[^\d.])(\d*\.?\d+)s/g)||[];
      if(!times.length) return;
      var n=parseFloat(times[0].replace(/[^\d.]/g,''));
      if(n>0 && n<0.15 && !/\.01s/.test(times[0])) bad.push('too fast: '+seg.trim().slice(0,50));
      /* An ambient loop is not UI motion — the field breathes on a
         minute-long cycle by design and is never something you wait for. */
      if(n>1.4 && !/infinite/.test(seg)) bad.push('too slow: '+seg.trim().slice(0,50));
    });
  });
  if(bad.length) throw bad.length+' fast: '+bad.slice(0,2).join(' | ');
});

print('\n— 4. three sizes, and nothing in the dead zone —');
t('no font-size lands between 20px and 40px', function(){
  var bad=[];
  (SRC.match(/font-size:\s*(\d+(?:\.\d+)?)px/g)||[]).forEach(function(d){
    var n=parseFloat(d.replace(/[^\d.]/g,''));
    if(n>=20 && n<=40) bad.push(d);
  });
  if(bad.length) throw bad.length+' in the dead zone: '+bad.slice(0,4).join(', ');
});
t('the ramp jumps by at least 3x from body to statement', function(){
  var lab=parseFloat((flat.match(/--t-label:\s*(\d+)px/)||[])[1]);
  var body=parseFloat((flat.match(/--t-body:\s*(\d+)px/)||[])[1]);
  var st=parseFloat((flat.match(/--t-statement:\s*(\d+)px/)||[])[1]);
  if(!lab||!body||!st) throw 'the ramp tokens are missing';
  if(st/body < 2.9) throw 'statement is only '+(st/body).toFixed(1)+'x body';
  if(body/lab < 1.3) throw 'body is only '+(body/lab).toFixed(1)+'x the label';
});

print('\n— 5. large type whispers —');
t('nothing above 40px is bolder than weight 400', function(){
  var bad=[];
  /* every rule that sets a size at or above the statement step */
  (flat.match(/\{[^}]*font-size:\s*(?:var\(--t-statement\)|[4-9]\dpx|\d{3}px)[^}]*\}/g)||[])
    .forEach(function(r){
      var w=(r.match(/font-weight:\s*(\d+)/)||[])[1];
      if(w && +w>400) bad.push(r.slice(0,70));
    });
  if(bad.length) throw bad.join(' | ');
});
t('statement type has locked-up leading', function(){
  var m=flat.match(/\.statement\{[^}]*\}/);
  if(!m) throw 'no statement rule';
  var lh=(m[0].match(/line-height:\s*(\.?\d*\.?\d+)/)||[])[1];
  if(!lh || parseFloat(lh)>=0.9) throw 'line-height is '+lh;
  var w=(m[0].match(/font-weight:\s*(\d+)/)||[])[1];
  if(!w || +w>300) throw 'statement weight is '+w+', should whisper at 300';
});
t('nothing anywhere is bold', function(){
  var heavy=(flat.match(/font-weight:\s*(\d{3})/g)||[])
    .map(function(x){return parseInt(x.replace(/\D/g,''));})
    .filter(function(n){return n>500;});
  if(heavy.length) throw heavy.length+' weight(s) above 500: '+heavy.slice(0,3).join(', ');
});

print('\n— 6. monochrome interface, colour only as a verdict —');
t('there is no accent colour at all', function(){
  /* The reference has no CTA colour: an action is a pill outline. An
     accent token existing at all is the temptation that starts the drift. */
  if(/--accent:/.test(flat)) throw 'an accent token survives';
  if(!/\.pill\{[^}]*background:none/.test(flat)) throw 'the pill has a fill';
  if(!/\.pill\{[^}]*border:1px solid/.test(flat)) throw 'the pill has no hairline';
});
t('there are no containers', function(){
  /* mechanism 1: a card, a list and a tile were the whole old vocabulary */
  ['.card{','.list{','.tile{','.setG{'].forEach(function(sel){
    if(flat.indexOf(sel)>=0) throw 'the container vocabulary survives: '+sel;
  });
  if(!/\.item\{[^}]*border-top:1px solid/.test(flat))
    throw 'rows are not separated by a hairline';
});
t('the verdict colours come from the hero gradient', function(){
  var g=(flat.match(/--sage:\s*([^;]+);/)||[])[1];
  var o=(flat.match(/--amber:\s*([^;]+);/)||[])[1];
  var r=(flat.match(/--oxblood:\s*([^;]+);/)||[])[1];
  if(!/A0E0AB/i.test(g||'')) throw 'sage is '+g;
  if(!/FFAC2E/i.test(o||'')) throw 'amber is '+o;
  if(!/A52D25/i.test(r||'')) throw 'oxblood is '+r;
  if(!/\.v-ok\{color:var\(--sage\)\}/.test(flat)) throw 'verdicts do not use the gradient';
});

print('\n— 7. one typeface —');
t('there is no second family', function(){
  if(/--mono:/.test(flat)) throw 'a mono token survives — this system has one face';
  var fams=(flat.match(/font-family:[^;}]+/g)||[]).filter(function(f){
    return !/var\(--font\)/.test(f) && !/'Inter'/.test(f); });
  if(fams.length) throw 'a second family: '+fams[0];
});
t('the face is embedded, not fetched', function(){
  if(!/@font-face/.test(CSS)) throw 'no embedded face';
  if(!/src:url\(data:font\/woff2;base64,/.test(flat.replace(/\s+/g,''))) throw 'the font is not inlined';
  if(/fonts\.googleapis|fonts\.gstatic/.test(SRC)) throw 'the file reaches out for a font';
});

print('\n— 8. what is hidden can be shown again —');
t('the reveal un-hide rules outrank the rule that hides them', function(){
  /* This one shipped broken. "html.revealing .reveal>span" is (0,2,2);
     ".in .reveal>span" and ".reveal.in>span" are (0,2,1), so the hiding
     rule won and every masked line in the app — the page titles, every
     statement — stayed translated 105% behind its own overflow:hidden.
     Nothing about the page looked wrong; the words were simply absent.
     Specificity is countable, so count it. */
  function spec(sel){
    var ids=(sel.match(/#[\w-]+/g)||[]).length;
    var cls=(sel.match(/\.[\w-]+/g)||[]).length;
    var els=(sel.replace(/[#.][\w-]+/g,'').match(/\b[a-z]+\b/g)||[]).length;
    return ids*10000+cls*100+els;
  }
  /* The reduced-motion block carries its own ".reveal>span{transform:none}",
     and it never competes: the script only adds html.revealing when reduced
     motion is off. Cut that block out before counting. */
  var scan=(function(){
    var out=flat, guard=0;
    while(guard++<20){
      var i=out.indexOf('@media (prefers-reduced-motion: reduce)');
      if(i<0) break;
      var d=0, k=out.indexOf('{',i);
      for(;k<out.length;k++){
        if(out[k]==='{') d++;
        else if(out[k]==='}'){ d--; if(!d){ k++; break; } }
      }
      out=out.slice(0,i)+out.slice(k);
    }
    return out;
  })();
  var hide=null, show=[];
  scan.replace(/([^{}]+)\{([^}]*)\}/g,function(_,sel,body){
    if(!/\.reveal\s*>\s*span/.test(sel)) return _;
    if(/transform:translateY\(105%\)/.test(body.replace(/\s+/g,'')))
      hide=sel.trim();
    else if(/transform:none/.test(body.replace(/\s+/g,'')))
      sel.split(',').forEach(function(x){ if(/\.reveal\s*>\s*span/.test(x)) show.push(x.trim()); });
    return _;
  });
  if(!hide) throw 'no rule hides .reveal>span — has the mechanism gone?';
  if(!show.length) throw 'nothing ever un-hides .reveal>span';
  var h=spec(hide);
  show.forEach(function(sel){
    if(spec(sel)<=h)
      throw '"'+sel+'" ('+spec(sel)+') cannot beat "'+hide+'" ('+h+') — the line stays hidden';
  });
});

print('\n═══ '+ok+' passed, '+fail+' failed ═══');
if(fail) throw new Error(fail+' failures');
