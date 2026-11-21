const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('/home/claude/game/index.html','utf8');
const code=html.split('<script>').pop().split('</script>')[0];
const mkCtx=()=>new Proxy({}, {get(t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});if(k==='measureText')return()=>({width:30});if(k in t)return t[k];return()=>{};},set(t,k,v){t[k]=v;return true;}});
const ctx=mkCtx();
const store={};const sb={document:{createElement:()=>({getContext:()=>mkCtx(),width:0,height:0}),getElementById:()=>({getContext:()=>ctx,addEventListener(){},focus(){}})},navigator:{getGamepads:()=>[]},performance:{now:()=>0},requestAnimationFrame:()=>{},addEventListener(){},localStorage:{getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v)}},setTimeout,clearTimeout,setInterval,console,Math,Date,JSON};
sb.window=sb;vm.createContext(sb);vm.runInContext(code,sb);const D=sb.__dbg;
let s=12345;const R=()=>(s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff;
D.ev('GMODE=0;startLevel=0;introT=0;storyOn=false');D.start(1,['gitan']);D.ev('introT=0;storyOn=false');
const ks=['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','KeyJ','Space','KeyK','KeyL'];
const N=2500;
for(let i=0;i<N;i++){ if(i%7===0){for(const k of ks)D.keys[k]=R()<0.35;} D.step(); }
for(const k of ks)D.keys[k]=false;
const h1=D.ev('stateHash()'),sc=D.ev('PS[0].score'),n1=D.ev('RECL.length');
D.ev("endGame('over')");D.step();
console.log('enregistre',n1,'images, score',sc,'hash',h1,'ls',Object.keys(store).join(','),'taille',(store.nfer_rep_last||'').length);
D.ev("toTitle()");
console.log('repPlay',D.ev("repPlay('nfer_rep_best')"));
D.ev('introT=0;storyOn=false');
for(let i=0;i<N;i++){D.step();}
console.log('replay images',D.ev('REPI'),'hash',D.ev('stateHash()'),'score',D.ev('PS[0].score'),'ident',D.ev('stateHash()')===h1);
for(let i=0;i<5;i++)D.step();
console.log('etat apres fin',D.ev('state'),'REP',D.ev('REP===null'));
