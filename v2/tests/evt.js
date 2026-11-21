const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync((process.env.GAME || require('path').join(__dirname, '.build', 'index.html')),'utf8');
const code=html.split('<script>').pop().split('</script>')[0];
const mkCtx=()=>new Proxy({}, {get(t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});if(k==='measureText')return()=>({width:30});if(k in t)return t[k];return()=>{};},set(t,k,v){t[k]=v;return true;}});
const ctx=mkCtx();
const sb={document:{createElement:()=>({getContext:()=>mkCtx(),width:0,height:0}),getElementById:()=>({getContext:()=>ctx,addEventListener(){},focus(){}})},navigator:{getGamepads:()=>[]},performance:{now:()=>0},requestAnimationFrame:()=>{},addEventListener:()=>{},setTimeout:()=>{},Math,console,Set,Object,Array,Number,String};
sb.window=sb;vm.createContext(sb);vm.runInContext(code,sb);const D=sb.__dbg;
for(const [lv,w] of [[1,4],[2,4],[3,3],[5,3],[8,3],[9,4]]){
 D.ev('startLevel='+lv);D.start(1,['costaud']);D.step(30);
 D.ev('PS[0].inv=99999;PS[0].hp=9999;PS[0].maxhp=9999');
 const ex=D.ev('LV.waves.length');
 // fast forward: set waveI and cam
 D.ev('waveI='+w+';cam=LV.waves['+w+'].cam-320;PS[0].x=cam+100;E=[]');
 let seen=null,err=null,ticks=0,bad=0;
 D.keys['ArrowRight']=true;
 for(let i=0;i<1500;i++){D.step(1);ticks++;try{D.ev('render()')}catch(e){err=e.message;break}
  if(D.ev('EV')&&!seen)seen=i; if(seen&&!D.ev('EV')&&D.ev('HZ.length')===0){break;}
  D.ev('PS[0].hp=9999');}
 D.keys['ArrowRight']=false;
 console.log('lvl',lv,'len',ex,'event start',seen,'ended',ticks,'err',err,'waveI',D.ev('waveI'),'cam',D.ev('cam|0'));
}
