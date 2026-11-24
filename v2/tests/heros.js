const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync((process.env.GAME || require('path').join(__dirname, '.build', 'index.html')),'utf8');
const code=html.split('<script>').pop().split('</script>')[0];
const mkCtx=()=>new Proxy({}, {get(t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});if(k==='measureText')return()=>({width:30});if(k in t)return t[k];return()=>{};},set(t,k,v){t[k]=v;return true;}});
const ctx=mkCtx();
const sb={document:{createElement:()=>({getContext:()=>mkCtx(),width:0,height:0}),getElementById:()=>({getContext:()=>ctx,addEventListener(){},focus(){}})},navigator:{getGamepads:()=>[]},performance:{now:()=>0},requestAnimationFrame:()=>{},addEventListener:()=>{},setTimeout:()=>{},Math,console,Set,Object,Array,Number,String};
sb.window=sb;vm.createContext(sb);vm.runInContext(code,sb);const D=sb.__dbg;
/* chaque nouveau héros : spécial (dégâts sur des voisins, aucune exception), attaques, puis une partie courte sans erreur */
for (const h of ['enedis','pompier','policier','plombier','cuistot']) {
  D.ev('startLevel=0;introT=0;storyOn=false');D.start(1,[h]);
  D.ev('introT=0;storyOn=false;E.length=0');
  D.ev('for(let i=0;i<4;i++)E.push(mkEnemy("thug",PS[0].x+(i%2?-1:1)*(50+i*18),PS[0].y+(i-2)*8))');
  const hp0=D.ev('E.map(e=>e.hp).join(",")');
  let err=null;
  try{
    D.ev("PS[0].sp=PS[0].sp+999;PS[0].st='special';PS[0].t=0;PS[0].hit=new Set()");
    for(let i=0;i<75;i++)D.step();
    console.log('  apres special',D.ev('E.map(e=>e.hp+(e.dying?"x":"")+"@"+Math.round(e.x-PS[0].x)).join(" ")'));
    D.ev("PS[0].st='free';PS[0].face=1");
    for(let i=0;i<40;i++){ D.keys&&0; D.step(); }
    D.ev("PS[0].hp=PS[0].maxhp");
    for(let i=0;i<600;i++)D.step();
  }catch(e){err=e.message}
  console.log(h,'err',err,'hp',hp0,'->',D.ev('E.map(e=>e.hp+(e.dying?"x":"")).join(",")'),'st',D.ev('PS[0].st'),'vivant',D.ev('!PS[0].dying'));
}
