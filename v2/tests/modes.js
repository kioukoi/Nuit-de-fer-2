const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('/home/claude/game/index.html','utf8');
const code=html.split('<script>').pop().split('</script>')[0];
const mkCtx=()=>new Proxy({}, {get(t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});if(k==='measureText')return()=>({width:30});if(k in t)return t[k];return()=>{};},set(t,k,v){t[k]=v;return true;}});
const ctx=mkCtx();
const sb={document:{createElement:()=>({getContext:()=>mkCtx(),width:0,height:0}),getElementById:()=>({getContext:()=>ctx,addEventListener(){},focus(){}})},navigator:{getGamepads:()=>[]},performance:{now:()=>0},requestAnimationFrame:()=>{},addEventListener:()=>{},setTimeout:()=>{},Math,console,Set,Object,Array,Number,String};
sb.window=sb;vm.createContext(sb);vm.runInContext(code,sb);const D=sb.__dbg;
for(const m of [1,2,3]){
 for(const lv of [0,3,9]){
 D.ev('GMODE='+m+';startLevel='+lv+';introT=0;storyOn=false');D.start(1,['costaud']);D.ev('introT=0;storyOn=false;PS[0].hp=PS[0].maxhp=99999;PS[0].inv=999999');
 let err=null;const ev={};D.keys['ArrowRight']=true;
 for(let i=0;i<3200;i++){try{D.step();if(i%4===0)D.ev('render()')}catch(e){err=e.message;break}
  if(i%200===0)D.ev('introT=0;PS[0].hp=99999');
  const k=D.ev('CHK');if(k>=0)ev['c'+k]=1;
  const mu=D.ev('E.filter(e=>e.type==="boss"&&e.mut>=0).map(e=>e.mut).join("")');if(mu)ev['m'+mu[0]]=1;}
 D.keys['ArrowRight']=false;
 console.log('mode',m,'niv',lv+1,'err',err,'daym',D.ev('DAYM'),'enn',D.ev('E.length'),'vus',Object.keys(ev).join(','),'vague',D.ev('waveI'),'/',D.ev('LV.waves.length'),'niveau',D.ev('levelIdx+1'));
 }}
