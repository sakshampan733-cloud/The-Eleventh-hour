/* minimal DOM shim so the app can actually run under jsc */
var LOG=[];
function El(tag){
  this.tagName=(tag||'div').toUpperCase();
  this._html=''; this.textContent=''; this.value=''; this.href='';
  this.style=new Proxy({},{get:(t,k)=>t[k]||'',set:(t,k,v)=>{t[k]=v;return true;}});
  this.dataset={}; this.children=[]; this.files=null;
  var cls=[];
  this.classList={
    add:function(){for(var i=0;i<arguments.length;i++)if(cls.indexOf(arguments[i])<0)cls.push(arguments[i]);},
    remove:function(){for(var i=0;i<arguments.length;i++){var j=cls.indexOf(arguments[i]);if(j>=0)cls.splice(j,1);}},
    toggle:function(c,on){ on?this.add(c):this.remove(c); },
    contains:function(c){return cls.indexOf(c)>=0;}
  };
}
El.prototype.appendChild=function(c){this.children.push(c);return c;};
El.prototype.remove=function(){};
El.prototype.setAttribute=function(k,v){this[k]=v;};
El.prototype.getAttribute=function(k){return this[k];};
El.prototype.removeAttribute=function(k){delete this[k];};
El.prototype.addEventListener=function(t,fn){ (this._ev=this._ev||{}); (this._ev[t]=this._ev[t]||[]).push(fn); };
El.prototype.dispatch=function(t,evt){ ((this._ev||{})[t]||[]).forEach(function(fn){ fn(evt); }); };
El.prototype.querySelectorAll=function(sel){
  /* ".dChip.on", "#id", "[data-pk]", and combinations of them */
  var last=String(sel||'').split(/\s+/).pop();
  var attr=(last.match(/\[data-([a-z0-9-]+)\]/)||[])[1];
  if(attr) attr=attr.replace(/-([a-z])/g,function(_,c){return c.toUpperCase();});
  var idm=(last.match(/#([\w-]+)/)||[])[1];
  var rest=last.replace(/\[[^\]]*\]/g,'').replace(/#[\w-]+/,'');
  /* a bare tag name, e.g. the app's own seg.querySelectorAll('button') */
  var tagName=(rest.match(/^([a-zA-Z]+)/)||[])[1];
  var need=rest.replace(/^[a-zA-Z]+/,'').split('.').filter(function(c){return c;});
  return (this._kids||[]).filter(function(k){
    if(idm && k.id!==idm) return false;
    if(attr && k.dataset[attr]===undefined) return false;
    if(tagName && k.tagName!==tagName.toUpperCase()) return false;
    return need.every(function(c){ return k.classList.contains(c); });
  });
};
El.prototype.querySelector=function(sel){ return this.querySelectorAll(sel)[0]||null; };
El.prototype.scrollIntoView=function(){};
El.prototype.focus=function(){};
El.prototype.getContext=function(){return null;};
El.prototype.toDataURL=function(){return '';};
/* Parse every control the app might bind a handler to, not just the date
   chips — any <button> or <label> carrying an id or a data-* attribute.
   Without this, `$$('#sheetBody [data-pk]')` finds nothing and a test that
   claims to "use" the app is really just calling functions behind it. */
/* the inner HTML of the element whose open tag ends at `from`, counting
   nesting of the same tag so a button inside a div closes the right one */
function innerOf(html, tag, from){
  var re=new RegExp('<'+tag+'\\b|</'+tag+'>','g');
  re.lastIndex=from;
  var depth=1, m;
  while((m=re.exec(html))){
    if(m[0].charAt(1)==='/'){ if(!--depth) return html.slice(from, m.index); }
    else depth++;
  }
  return '';
}
El.prototype._parseKids=function(html){
  var kids=[], tag=/<(button|label|input|select|div)\b([^>]*)>/g, m, i=0;
  while((m=tag.exec(html))){
    var attrs=m[2];
    var id=(attrs.match(/\bid="([^"]*)"/)||[])[1];
    var data={}, da=/data-([a-z0-9-]+)="([^"]*)"/g, d;
    while((d=da.exec(attrs))) data[d[1].replace(/-([a-z])/g,function(_,c){return c.toUpperCase();})]=d[2];
    var keys=Object.keys(data);
    if(!id && !keys.length) continue;
    var cls=(attrs.match(/class="([^"]*)"/)||[])[1]||'';
    var el=new El(m[1]);
    cls.split(/\s+/).forEach(function(c){ if(c) el.classList.add(c); });
    keys.forEach(function(k){ el.dataset[k]=data[k]; });
    if(id) el.id=id;
    var val=(attrs.match(/\bvalue="([^"]*)"/)||[])[1];
    if(val!==undefined) el.value=val;
    if(data.d!==undefined){ el._left=i*57+20; el._w=50; i++; }
    /* Give it its own subtree. The app binds marks with
       seg.querySelectorAll('button') — a flat parse finds the .mkSeg but
       none of its buttons, so those handlers were never really bound in
       tests and every marking test was quietly bypassing the control it
       claimed to press. */
    if(m[1]!=='input' && m[1]!=='select' && (El._depth||0)<6){
      El._depth=(El._depth||0)+1;
      try{ el.innerHTML=innerOf(html, m[1], tag.lastIndex); }catch(e){}
      El._depth--;
    }
    kids.push(el);
  }
  return kids;
};
Object.defineProperty(El.prototype,'innerHTML',{
  get:function(){return this._html;},
  set:function(v){ if(v===undefined||/undefined/.test(String(v))) LOG.push('UNDEFINED IN HTML: '+String(v).slice(0,160));
    this._html=String(v); this._kids=this._parseKids(this._html); }
});
Object.defineProperty(El.prototype,'offsetLeft',{get:function(){return this._left||0;}});
Object.defineProperty(El.prototype,'offsetWidth',{get:function(){return this._w||0;}});
Object.defineProperty(El.prototype,'clientWidth',{get:function(){return this._cw===undefined?375:this._cw;}});

var _cache={};
var document={
  documentElement:new El('html'),
  head:new El('head'),
  body:new El('body'),
  hidden:false,
  readyState:'complete',
  createElement:function(t){return new El(t);},
  querySelector:function(s){ return _cache[s]||(_cache[s]=new El()); },
  querySelectorAll:function(sel){
    var s=String(sel||'');
    if(s.indexOf(' ')>0){
      var i=s.lastIndexOf(' ');
      var host=document.querySelector(s.slice(0,i).trim());
      return host&&host.querySelectorAll? host.querySelectorAll(s.slice(i+1).trim()) : [];
    }
    return [];
  },
  addEventListener:function(){},
  getElementById:function(id){ return document.querySelector('#'+id); }
};
var _store={};
var localStorage={
  getItem:function(k){return k in _store?_store[k]:null;},
  setItem:function(k,v){_store[k]=String(v);},
  removeItem:function(k){delete _store[k];}
};
var window={
  scrollY:0, scrollTo:function(){}, addEventListener:function(){},
  matchMedia:function(){return {matches:false,addEventListener:function(){},addListener:function(){}};},
  dispatchEvent:function(){}, Event:function(){}
};
var navigator={};
var _timers=[];
var _pending=[];
function setTimeout(f,t){ _pending.push(f); return _pending.length; }
function clearTimeout(id){ }
function runTimers(){ var q=_pending; _pending=[]; q.forEach(function(f){ try{f();}catch(e){} }); }
function setInterval(){return 0;}
function URL(){}
URL.createObjectURL=function(){return 'blob:x';};
URL.revokeObjectURL=function(){};
function Blob(){}
function FileReader(){}
