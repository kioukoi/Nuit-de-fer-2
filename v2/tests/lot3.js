const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync((process.env.GAME || require('path').join(__dirname, '.build', 'index.html')),'utf8');
const code=html.split('<script>').pop().split('</script>')[0];
const mkCtx=()=>new Proxy({}, {get(t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});if(k==='measureText')return()=>({width:30});if(k in t)return t[k];return()=>{};},set(t,k,v){t[k]=v;return true;}});
const ctx=mkCtx();
const sb={document:{createElement:()=>({getContext:()=>mkCtx(),width:0,height:0}),getElementById:()=>({getContext:()=>ctx,addEventListener(){},focus(){}})},navigator:{getGamepads:()=>[]},performance:{now:()=>0},requestAnimationFrame:()=>{},addEventListener:()=>{},setTimeout:()=>{},Math,console,Set,Object,Array,Number,String};
sb.window=sb;vm.createContext(sb);vm.runInContext(code,sb);const D=sb.__dbg;
// ROGUE : niveau 1 -> fin du niveau doit donner un bonus
D.ev('GMODE=5;startLevel=0;introT=0;storyOn=false');D.start(1,['costaud']);D.ev('introT=0;storyOn=false');
console.log('rogue vies',D.ev('PS[0].lives'));
D.ev('nextLevel()');console.log('rogue bonus',D.ev('PS[0].rb'),'mods',D.ev('JSON.stringify(PS[0].mods)'),'maxhp',D.ev('PS[0].maxhp'),'niveau',D.ev('levelIdx+1'));
// CUSTOM : code -> vagues, fin de partie
D.ev("GMODE=7;CUSTOM='3B:thug*2;brute*1,tireur*1';startLevel=0;introT=0;storyOn=false");D.start(1,['costaud']);D.ev('introT=0;storyOn=false;PS[0].hp=PS[0].maxhp=99999');
console.log('custom vagues',D.ev('LV.waves.length'),'decor',D.ev('LV.name'),'boss',D.ev('LV.waves.map(w=>!!w.boss).join()'));
D.keys['ArrowRight']=true;let st='';
for(let i=0;i<9000&&D.ev('state')==='play';i++){D.step();D.ev('introT=0');if(D.ev('E.length')>0){D.ev('E.forEach(e=>{if(e.hp>0)hurt(e,PS[0],{dmg:9999,kd:true},1)})');}}
D.keys['ArrowRight']=false;
console.log('custom etat final',D.ev('state'),'vague',D.ev('waveI'));
// parsing robuste
console.log('parse junk',D.ev("JSON.stringify(parseCustom('xx;;**'))"),D.ev("JSON.stringify(parseCustom('99:thug*999'))").slice(0,60));
// VERSUS offline a 2 joueurs (clavier local) : les coups se font mal, dernier debout
D.ev('GMODE=6;startLevel=0;introT=0;storyOn=false');D.start(2,['costaud','boxeur']);D.ev('introT=0;storyOn=false');
console.log('versus pos',D.ev('PS.map(p=>Math.round(p.x)+","+Math.round(p.y)).join(" ")'),'ennemis',D.ev('E.length'),'camLimit',D.ev('camLimit'));
D.ev('PS[1].x=PS[0].x+20;PS[1].y=PS[0].y;PS[1].hp=3;PS[0].face=1;PS[1].inv=0;PS[0].inv=0');
for(let i=0;i<10;i++)D.step();
D.ev("PS[0].st='attack';PS[0].t=0;PS[0].hit=new Set();strike(PS[0],{reach:30,dmg:40,kd:true,zr:40})");
for(let i=0;i<400;i++){D.step();}
console.log('versus hp joueur2',D.ev('PS[1].hp'),'out',D.ev('PS[1].out'),'dying',D.ev('PS[1].dying'),'VSW',D.ev('VSW'),'etat',D.ev('state'));
