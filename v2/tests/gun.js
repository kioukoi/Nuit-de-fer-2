const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('/home/claude/game/index.html','utf8');
const code=html.split('<script>').pop().split('</script>')[0];
const mkCtx=()=>new Proxy({}, {get(t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});if(k==='measureText')return()=>({width:30});if(k in t)return t[k];return()=>{};},set(t,k,v){t[k]=v;return true;}});
const ctx=mkCtx();
const sb={document:{createElement:()=>({getContext:()=>mkCtx(),width:0,height:0}),getElementById:()=>({getContext:()=>ctx,addEventListener(){},focus(){}})},navigator:{getGamepads:()=>[]},performance:{now:()=>0},requestAnimationFrame:()=>{},addEventListener:()=>{},setTimeout:()=>{},Math,console,Set,Object,Array,Number,String};
sb.window=sb;vm.createContext(sb);vm.runInContext(code,sb);const D=sb.__dbg;
function run(name,setup){
 D.ev('startLevel=6;introT=0;storyOn=false');D.start(1,['costaud']);D.step(10);D.ev('introT=0;storyOn=false;E.length=0;PS[0].inv=0;PS[0].hp=PS[0].maxhp=999');
 D.ev(setup);let shots=0,nades=0,minhp=999;
 for(let i=0;i<500;i++){D.step();shots=Math.max(shots,D.ev('PJ.filter(b=>b.bullet).length'));nades=Math.max(nades,D.ev('PJ.filter(b=>b.nade).length'));try{D.ev('render()')}catch(e){console.log('ERR',e.message);break}}
 console.log(name,'balles max',shots,'grenades max',nades,'hp joueur',D.ev('PS[0].hp'));
}
run('tireur','E.push(mkEnemy("tireur",PS[0].x+180,PS[0].y))');
run('voyou+pistolet','var q=mkEnemy("thug",PS[0].x+180,PS[0].y);q.weapon="pistolet";q.wd=8;E.push(q)');
run('voyou+mitraillette','var q=mkEnemy("thug",PS[0].x+180,PS[0].y);q.weapon="mitraillette";q.wd=24;E.push(q)');
run('voyou+grenade','var q=mkEnemy("thug",PS[0].x+180,PS[0].y);q.weapon="grenade";q.wd=2;E.push(q)');
