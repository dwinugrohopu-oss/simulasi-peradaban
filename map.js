import {BUILDINGS} from './rules.js';
import {territory} from './civics.js';
import {population} from './engine.js';
import {stateOf,stageName} from './world.js';
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export function camera(width=920,height=480){return {x:1600,y:1000,zoom:.24,width,height,planet:0,layer:'planet'};}
export function project(c,x,y){return {x:(x-c.x)*c.zoom+c.width/2,y:(y-c.y)*c.zoom+c.height/2};}
export function unproject(c,x,y){return {x:(x-c.width/2)/c.zoom+c.x,y:(y-c.height/2)/c.zoom+c.y};}
export function pan(c,dx,dy){c.x=clamp(c.x-dx/c.zoom,-500,3700);c.y=clamp(c.y-dy/c.zoom,-500,2500);}
export function zoom(c,factor,x=c.width/2,y=c.height/2){const before=unproject(c,x,y);c.zoom=clamp(c.zoom*factor,.18,2.5);const after=unproject(c,x,y);c.x=clamp(c.x+before.x-after.x,-500,3700);c.y=clamp(c.y+before.y-after.y,-500,2500);}
export function focus(c,civ){c.layer='planet';c.planet=civ.planet;c.x=civ.x;c.y=civ.y;c.zoom=.85;}
export function hit(root,c,x,y){const p=unproject(c,x,y);if(c.layer==='space')return root.world.planets.find(o=>Math.hypot(o.x-p.x,o.y-p.y)<Math.max(100,28/c.zoom));return root.world.settlements.find(o=>o.planet===c.planet&&Math.hypot(o.x-p.x,o.y-p.y)<Math.max(80,25/c.zoom));}
export function drawWorld(root,c,canvas,selected,time){
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;c.width=w;c.height=h;ctx.clearRect(0,0,w,h);ctx.fillStyle=c.layer==='space'?'#081326':'#152e25';ctx.fillRect(0,0,w,h);
 const point=(x,y)=>project(c,x,y),circle=(x,y,r,color)=>{const p=point(x,y);ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(2,r*c.zoom),0,Math.PI*2);ctx.fill();},label=(x,y,text,color='#d7e9d4',size=12)=>{const p=point(x,y);ctx.fillStyle=color;ctx.font=size+'px system-ui';ctx.fillText(text,p.x,p.y);},line=(x1,y1,x2,y2,color,dashed=false)=>{const a=point(x1,y1),b=point(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash(dashed?[6,5]:[]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);};
 if(c.layer==='space'){
  for(let i=0;i<120;i++)circle((i*197)%3200,(i*389)%2000,2,'#8097bb');circle(1450,1000,65,'#dfb663');label(1370,1130,'Bintang Aruna');
  for(const p of root.world.planets){line(1450,1000,p.x,p.y,'#344154',true);circle(p.x,p.y,55,p.id===0?'#6daf92':p.id===1?'#aa8ed2':'#ad9a7a');label(p.x-70,p.y+95,p.name);const civs=root.world.settlements.filter(o=>o.planet===p.id);label(p.x-80,p.y+145,civs.length+' peradaban · '+civs.reduce((n,o)=>n+population(stateOf(root,o)).length,0)+' warga','#a2b4cb',10);}
  for(const civ of root.world.settlements)if(civ.flight){const from=root.world.planets[civ.planet],to=root.world.planets[civ.flight.destination],t=civ.flight.phase==='return'?civ.flight.remaining/40:1-civ.flight.remaining/40;line(from.x,from.y,to.x,to.y,'#dcc69a');circle(from.x+(to.x-from.x)*t,from.y+(to.y-from.y)*t,12,'#f2dba3');}return;
 }
 // A stable, continuous landscape; no simulation RNG is consumed while drawing.
 for(let y=0;y<2000;y+=120)for(let x=0;x<3200;x+=120){const p=point(x,y);ctx.fillStyle=(x/120*7+y/120*11+c.planet)%5===0?'#203d2e':'#183327';ctx.fillRect(p.x,p.y,120*c.zoom+1,120*c.zoom+1);}
 line(2400,0,2350,2000,'#316a70');
 for(const source of root.world.sources.filter(o=>o.planet===c.planet)){circle(source.x,source.y,30,'#8273b7');label(source.x+35,source.y,'Sumber mana','#c0a8e4',10);}
 const civs=root.world.settlements.filter(o=>o.planet===c.planet);
 for(const civ of civs){const s=stateOf(root,civ);for(const id of civ.contacts){const other=civs.find(o=>o.id===id);if(!other||civ.id>id)continue;const war=civ.war?.against===id;line(civ.x,civ.y,other.x,other.y,war?'#dd8271':(civ.relations[id]||0)<0?'#947265':'#6b9879',!war);}
  circle(civ.x,civ.y,115,civ.id===selected?'#375b3d':civ.species==='alien'?'#493a60':'#2c4736');circle(civ.x,civ.y,30,civ.species==='alien'?'#c2a0e1':'#e1bc75');label(civ.x-95,civ.y-135,civ.name,civ.id===selected?'#f6e4b7':'#deead7');label(civ.x-95,civ.y-100,territory(root,civ).form+' · '+stageName(civ)+' · '+population(s).length+' warga','#b6c5af',10);
  if(civ.war)label(civ.x-95,civ.y+155,'PERANG','#ed9f8d',11);else if(civ.magic)label(civ.x-95,civ.y+155,'Sihir dipahami','#c5a8ed',10);
  const nodes=buildingNodes(s,civ);const countKinds=Object.entries(s.buildings).filter(([key,count])=>count>0);
  if(c.zoom>.3){for(const node of nodes){const p=point(node.x,node.y),z=c.zoom;
   if(node.kind==='farm'){ctx.fillStyle='#b6a75f';ctx.fillRect(p.x-10*z,p.y-8*z,20*z,16*z);for(let row=0;row<3;row++){ctx.fillStyle='#4f6b35';ctx.fillRect(p.x-8*z,p.y+(-5+row*5)*z,16*z,2*z);}}
   else if(node.kind==='hut'||node.kind==='habitat'){ctx.fillStyle=node.kind==='habitat'?'#96c9d0':civ.stage>=4?'#c3c5b1':'#bf9c70';ctx.fillRect(p.x-8*z,p.y-5*z,16*z,14*z);ctx.fillStyle='#705d49';ctx.beginPath();ctx.moveTo(p.x-11*z,p.y-5*z);ctx.lineTo(p.x,p.y-14*z);ctx.lineTo(p.x+11*z,p.y-5*z);ctx.fill();}
   else{const colors={well:'#7dc3d7',school:'#bbc5d4',furnace:'#e69c60',workshop:'#c5b89a',generator:'#ebcf78',observatory:'#b6a2df',shipyard:'#8fd2cc'};circle(node.x,node.y,8,colors[node.kind]||'#a1b39e');}}
  }
  for(const [key,count]of countKinds){const node=nodes.find(n=>n.kind===key);if(node)label(node.x-15,node.y-24,BUILDINGS[key].name+' ×'+count,key==='farm'?'#e4d589':'#d2dfc7',9);}
  if(c.zoom>.45){
   for(const a of population(s)){const phase=time/900+a.id*2.2,areas={forage:[-180,80],wood:[-160,-100],stone:[155,100],farm:[-65,90],research:[90,40],build:[60,-80],fish:[190,50],craft:[140,0],smelt:[120,-60],fuel:[120,-60],alloy:[140,0],generate:[100,100],observe:[0,-100],assembleShip:[-130,50],defend:[0,140],heal:[90,40],studyMagic:[60,40],channel:[60,40],enchantBuild:[60,-80],teach:[90,40],extract:[155,100],useResource:[140,0]},spot=areas[a.action]||[0,10];circle(civ.x+spot[0]+(a.id%4)*12+Math.sin(phase)*6,civ.y+spot[1]+Math.cos(phase)*6,5,civ.species==='alien'?'#b7a0de':'#c5dba2');}
   for(const r of s.customResources){const x=civ.x+(r.x-50)*5,y=civ.y+(r.y-50)*5;circle(x,y,12,'#e3c886');label(x+16,y,r.name,'#e3c886',9);}
   for(const o of s.objects){const x=civ.x+(o.descriptor.x-50)*5,y=civ.y+(o.descriptor.y-50)*5;circle(x,y,12,'#80b8ae');label(x+16,y,o.descriptor.name,'#a5ccc2',9);}
  }
 }
 if(!civs.length)label(1200,900,'Planet belum dihuni. Koloni membutuhkan ekspedisi dan habitat.');
}

export function buildingNodes(s,civ){const bases={hut:[-90,-50],farm:[-100,75],well:[0,135],school:[65,55],furnace:[125,-60],workshop:[150,0],generator:[120,100],observatory:[0,-110],shipyard:[-140,-100],habitat:[-30,10]},nodes=[];for(const [kind,count]of Object.entries(s.buildings)){const cols=Math.ceil(Math.sqrt(Math.max(1,count))),[x,y]=bases[kind]||[0,0];for(let i=0;i<count;i++)nodes.push({kind,index:i,x:civ.x+x+(i%cols-(cols-1)/2)*24,y:civ.y+y+(Math.floor(i/cols)-(Math.ceil(count/cols)-1)/2)*23});}return nodes;}
