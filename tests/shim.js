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
  /* supports compound class selectors like ".dChip.on" */
  var last=String(sel||'').split(/\s+/).pop();
  var need=last.split('.').filter(function(c){return c;});
  return (this._kids||[]).filter(function(k){
    return need.every(function(c){ return k.classList.contains(c); });
  });
};
El.prototype.querySelector=function(sel){ return this.querySelectorAll(sel)[0]||null; };
El.prototype.scrollIntoView=function(){};
El.prototype.focus=function(){};
El.prototype.getContext=function(){return null;};
El.prototype.toDataURL=function(){return '';};
El.prototype._parseKids=function(html){
  var kids=[], btn=/<button\b([^>]*)>/g, m, i=0;
  while((m=btn.exec(html))){
    var attrs=m[1];
    var dd=(attrs.match(/data-d="([^"]*)"/)||[])[1];
    if(dd===undefined) continue;
    var cls=(attrs.match(/class="([^"]*)"/)||[])[1]||'';
    var el=new El('button');
    cls.split(/\s+/).forEach(function(c){ if(c) el.classList.add(c); });
    el.dataset.d=dd;
    el._left=i*57+20; el._w=50; i++;      // synthetic layout: 50px chip + 7px gap
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
