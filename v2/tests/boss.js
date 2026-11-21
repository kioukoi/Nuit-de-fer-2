const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('/home/claude/game/index.html','utf8');
const code=html.split('<script>').pop().split('</script>')[0];
const mkCtx=()=>new Proxy({}, {get(t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});if(k==='measureText')return()=>({width:30});if(k in t)return t[k];return()=>{};},set(t,k,v){t[k]=v;return true;}});
const ctx=mkCtx();
const sb={document:{createElement:()=>({getContext:()=>mkCtx(),width:0,height:0}),getElementById:()=>({getContext:()=>ctx,addEventListener(){},focus(){}})},navigator:{getGamepads:()=>[]},performance:{now:()=>0},requestAnimationFrame:()=>{},addEventListener:()=>{},setTimeout:()=>{},Math,console,Set,Object,Array,Number,String};
sb.window=sb;vm.createContext(sb);vm.runInContext(code,sb);const D=sb.__dbg;
for(let lv=0;lv<10;lv++){
  D.ev('startLevel='+lv);D.start(1,['costaud']);D.ev('introT=0;storyOn=false');
  for(let i=0;i<20;i++)D.step();
  D.ev('waveI=LV.waves.length-1;cam=LV.waves[waveI].cam;PS[0].x=cam+200;E=[]');
  const seen={};let err=null,dead=false,hpmin=1e9;
  for(let i=0;i<2600;i++){
    D.keys['KeyJ']=(i%7)<3;D.keys['ArrowRight']=(i%200)<80;D.keys['ArrowLeft']=(i%200)>=100&&(i%200)<180;
    D.ev('PS[0].hp=PS[0].maxhp;PS[0].lives=3');
    try{D.step();if(i%5===0)D.ev('render()');}catch(e){err=e.message+' f'+i;break}
    const sk=D.ev("(function(){var b=E.find(function(x){return x.type==='boss'});return b&&b.st==='bspec'?b.sk:''})()");
    if(sk)seen[sk]=(seen[sk]||0)+1;
    if(D.ev('E.filter(function(x){return x.type==="boss"&&!x.gone}).length')===0&&i>50){dead=true;break;}
  }
  console.log('niv',lv+1,D.ev('LV.bossName'),'err',err,'attaques vues',JSON.stringify(seen),dead?'boss vaincu':'');
}
