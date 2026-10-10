import {WEAPONS,ARMORS,equipWeapon,equipArmor,weaponUsable,useWeapon} from './equipment.js';
export const SPECIES={deer:{name:'Rusa',tier:1,passive:true,health:35,attack:6,defense:4,speed:55,meat:8},wolf:{name:'Serigala',tier:2,health:70,attack:40,defense:20,speed:65,meat:10},boar:{name:'Babi hutan',tier:2,health:90,attack:45,defense:35,speed:40,meat:16},bear:{name:'Beruang',tier:3,health:150,attack:75,defense:55,speed:45,meat:30}};
const root=s=>s._context?.root||s,civ=s=>s._context?.civ||s.world?.settlements[0];
const rng=s=>{let n=s.rng>>>0;n^=n<<13;n^=n>>>17;n^=n<<5;s.rng=n>>>0;return s.rng/4294967296;};
const hash=(seed,id)=>(Math.imul(seed^Math.imul(id,2654435761),2246822507)>>>0);
export function initWildlands(r){
 const w=r.world;if(!w.wilderness||w.wildlands.length)return;
 for(let planet=0;planet<3;planet++)for(const [i,x]of [1400,2700].entries()){
  const id=w.wildlands.length+1,area={id,planet,x,y:1000,radius:250,prey:true,name:i?'Pegunungan Logam':'Hutan Lebat',seenBy:[]};w.wildlands.push(area);
  const forests=[[-160,0],[160,0],[0,-160],[0,160],[-160,-160],[-160,160],[160,-160],[160,160]].filter(([dx,dy])=>w.settlements.filter(c=>c.planet===planet).every(c=>Math.hypot(c.x-x-dx,c.y-1000-dy)>=350)).slice(0,4).map(([dx,dy])=>['wood',dx,dy]);
  const stones=[[-140,-140],[140,-140],[-140,140],[140,140],[0,220],[0,-220]].filter(([dx,dy])=>w.settlements.filter(c=>c.planet===planet).every(c=>Math.hypot(c.x-x-dx,c.y-1000-dy)>=350)).slice(0,2).map(([dx,dy])=>['stone',dx,dy]);
  for(const [kind,dx,dy]of [['wood',0,0],...forests,...stones,['food',-200,-150],['ore',100,200]]){const nodeId=w.nodes.length+1,capacity=kind==='wood'?2*(4000+hash(r.seed,nodeId)%3001):kind==='stone'?2*(2000+hash(r.seed,nodeId)%2001):kind==='ore'?2000+hash(r.seed,nodeId)%3001:1000+hash(r.seed,nodeId)%2001;w.nodes.push({id:nodeId,planet,kind,x:x+dx,y:1000+dy,stock:capacity,capacity,renewal:kind==='food'?.8:kind==='wood'?.16:0,owner:null,seenBy:[],tier:'wild',wildland:id});}
  for(let j=0;j<6;j++)spawn(r,area,j);for(const n of w.nodes)if(n.planet===planet&&Math.hypot(n.x-area.x,n.y-area.y)<=area.radius){n.wildland=id;n.tier='wild';if(n.capacity<1000)n.stock=n.capacity=1000+hash(r.seed,n.id)%2001;}
 }
}
// Prey ranges near grassland food patches; predators stay in the marked territory.
export function animalPosition(r,b){const z=r.world.wildlands.find(z=>z.id===b.area);return {x:b.x??z.x,y:b.y??z.y};}
function preyPosition(r,area,index){
 const villages=r.world.settlements.filter(c=>c.planet===area.planet),slot=((area.id-1)%2)*2+index%2,c=villages[slot%villages.length];
 const node=c&&r.world.nodes.filter(n=>n.planet===c.planet&&n.kind==='food'&&!n.wildland).sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y))[0];
 return {x:node?.x??Math.max(0,area.x-area.radius-100),y:node?.y??area.y};
}
function spawn(r,area,index,species=['deer','deer','wolf','wolf','boar','bear'][index%6]){
 const id=r.world.nextBeastId++,spec=SPECIES[species],beast={id,area:area.id,species,health:spec.health,attack:spec.attack,defense:spec.defense,speed:spec.speed,meat:spec.meat};
 if(spec.passive)Object.assign(beast,preyPosition(r,area,index));
 r.world.beasts.push(beast);
}
export function wildlifeDay(r){
 if(!r.world.wilderness||r.day%120)return;
 for(const area of r.world.wildlands){
  const living=r.world.beasts.filter(b=>b.area===area.id&&b.health>0);
  if(living.length<2||living.length>=6)continue;
  const deer=living.filter(b=>b.species==='deer'),prey=area.prey&&deer.length<2,first=preyPosition(r,area,0),index=deer.some(b=>b.x===first.x&&b.y===first.y)?1:0;
  spawn(r,area,prey?index:2+r.day%4,prey?'deer':['wolf','boar','bear'][hash(r.seed,r.day+area.id)%3]);
 }
 // Dead animals do not leave an unbounded archive; IDs never repeat.
 if(r.world.beasts.length>128)r.world.beasts=r.world.beasts.filter(b=>b.health>0||r.world.settlements.some(c=>(c.id===1?r:c.state).agents.some(a=>a.journey?.encounter===b.id||a.journey?.source==='animal'&&a.journey.node===b.id)));
}
export function combatStats(s,a){
 const weapon=s.weapons.find(w=>w.id===a.equipment.weapon&&w.owner===a.id&&w.condition>0),armor=s.armors.find(w=>w.id===a.equipment.armor&&w.owner===a.id&&w.condition>0),body=.4+.6*a.health/100,practice=Math.min(30,Math.sqrt(a.skills.defend||0)*2),hunting=Math.min(20,Math.sqrt(a.skills.hunt||0)*2);
 return {attack:(a.attributes.strength*.6+practice+hunting+(weaponUsable(weapon)?(WEAPONS[weapon.type].power*20+Math.min(10,Math.sqrt(a.weaponPractice?.[weapon.type]||0)*2))*weapon.condition/100:0))*body,defense:(a.attributes.endurance*.4+a.attributes.discipline*.2+practice+(armor?ARMORS[armor.type].defense*armor.condition/100:0))*body,speed:Math.max(5,(a.attributes.endurance*.4+a.energy*.3+Math.min(15,Math.sqrt(a.skills.flee||0)*2)-(armor?ARMORS[armor.type].weight:0)-(weapon?WEAPONS[weapon.type].weight:0))*body)};
}
export function huntTarget(s,a){
 const r=root(s),c=civ(s);if(!c||!r.world)return null;
 return r.world.beasts.filter(b=>{const z=r.world.wildlands.find(z=>z.id===b.area),pos=animalPosition(r,b);return b.health>0&&z.planet===c.planet&&(z.seenBy.includes(c.id)||SPECIES[b.species].passive&&Math.hypot(pos.x-c.x,pos.y-c.y)<=350)&&(!a||safeOpponent(s,a,b)&&!routeThreat(s,a,pos));}).sort((a,b)=>{const x=animalPosition(r,a),y=animalPosition(r,b);return (a.attack+a.defense)*10+Math.hypot(x.x-c.x,x.y-c.y)-(b.attack+b.defense)*10-Math.hypot(y.x-c.x,y.y-c.y);})[0]||null;
}
export function safeOpponent(s,a,b){
 const stats=combatStats(s,a),rounds=Math.ceil(b.health/Math.max(3,stats.attack*.8-b.defense*.55)),damage=Math.max(3,b.attack*1.2-stats.defense*.6),weapon=s.weapons.find(w=>w.id===a.equipment.weapon&&w.owner===a.id&&w.condition>0);
 return a.health>=(SPECIES[b.species].passive?45:75)&&a.energy>=25&&weaponUsable(weapon)&&(!WEAPONS[weapon.type].ammoCapacity||weapon.ammo>=rounds)&&(SPECIES[b.species].passive||!!s.armors.find(w=>w.id===a.equipment.armor&&w.owner===a.id&&w.condition>0))&&rounds*damage*1.5<a.health*.55;
}
export function routeThreat(s,a,to,from=civ(s)){
 const r=root(s),c=civ(s);if(!c||!r.world)return false;const dx=to.x-from.x,dy=to.y-from.y,length=dx*dx+dy*dy;
 return r.world.wildlands.some(z=>{if(z.planet!==c.planet||!z.seenBy.includes(c.id)||!r.world.beasts.some(b=>b.area===z.id&&b.health>0&&!SPECIES[b.species].passive&&(!a||!safeOpponent(s,a,b))))return false;const t=length?Math.max(0,Math.min(1,((z.x-from.x)*dx+(z.y-from.y)*dy)/length)):0;return Math.hypot(from.x+dx*t-z.x,from.y+dy*t-z.y)<=z.radius;});
}
export function revealWildlands(r,c,pos,radius){for(const z of r.world.wildlands)if(z.planet===c.planet&&Math.hypot(z.x-pos.x,z.y-pos.y)<=radius+z.radius&&!z.seenBy.includes(c.id))z.seenBy.push(c.id);}
export function encounterOnRoute(s,a,from,to){
 const r=root(s),c=civ(s),j=a.journey;if(!j||!r.world||j.encounter)return;
 if(j.wildCooldown>0){j.wildCooldown--;return;}
 const dx=to.x-from.x,dy=to.y-from.y,length=dx*dx+dy*dy;
 const area=r.world.wildlands.find(z=>{if(z.planet!==c.planet)return false;const t=length?Math.max(0,Math.min(1,((z.x-from.x)*dx+(z.y-from.y)*dy)/length)):0;return Math.hypot(from.x+dx*t-z.x,from.y+dy*t-z.y)<=z.radius;});
 if(!area)return;const beasts=r.world.beasts.filter(b=>b.area===area.id&&b.health>0&&!SPECIES[b.species].passive);if(!beasts.length)return;
 if(rng(s)<.3){j.encounter=beasts[Math.floor(rng(s)*beasts.length)].id;}
}
function wear(s,a,category,slot,specs){const item=s[category].find(w=>w.id===a.equipment[slot]&&w.owner===a.id&&w.condition>0);if(!item)return;item.uses++;item.condition=Math.max(0,item.condition-100/specs[item.type].durability);if(!item.condition){item.owner=null;delete a.equipment[slot];}}
export function wildlifeCombat(s,a,key,log){
 const r=root(s),j=a.journey,beast=r.world.beasts.find(b=>b.id===j?.encounter);if(!j||!beast||beast.health<=0){if(j)j.encounter=null;return {reward:-1,energy:1};}
 equipWeapon(s,a);equipArmor(s,a);const stats=combatStats(s,a),name=SPECIES[beast.species].name;
 if(key==='flee'&&rng(s)<Math.max(.1,Math.min(.9,.5+(stats.speed-beast.speed)/100))){j.encounter=null;delete j.combatTarget;delete j.combatDistance;j.wildCooldown=3;return {reward:2,energy:7,retreat:true,note:'Lolos dari '+name};}
 const bite=()=>{const damage=Math.max(3,beast.attack*(.8+rng(s)*.4)-stats.defense*.6);a.health=Math.max(0,a.health-damage);wear(s,a,'armors','armor',ARMORS);return damage;};
 let damage=0;if(key==='flee'){damage=bite();return {reward:-damage*.2,energy:8,note:'Gagal melarikan diri dari '+name};}
 const strike=()=>{if(useWeapon(s,a))a.skills.hunt++;beast.health=Math.max(0,beast.health-Math.max(3,stats.attack*(.8+rng(s)*.4)-beast.defense*.55));};
 const weapon=s.weapons.find(w=>w.id===a.equipment.weapon&&w.owner===a.id),spec=weapon&&WEAPONS[weapon.type];if(j.combatTarget!==beast.id){j.combatTarget=beast.id;j.combatDistance=weaponUsable(weapon)?spec.range:0;}const ranged=weaponUsable(weapon)&&spec.range>2&&j.combatDistance>2;j.combatDistance=Math.max(0,j.combatDistance-beast.speed/5);
 if(ranged||SPECIES[beast.species].passive||stats.speed>=beast.speed){strike();if(beast.health>0&&!ranged)damage=bite();}else{damage=bite();if(a.health>0)strike();}
 if(beast.health<=0){const room=Math.max(0,(s.vehicles.find(v=>v.id===j.vehicle)?.capacity||16)-Object.entries(j.cargo).filter(([k])=>['food','wood','stone','ore','custom'].includes(k)).reduce((sum,[,n])=>sum+n,0));const meat=Math.min(room,beast.meat);j.cargo.food=(j.cargo.food||0)+meat;j.cargo.bone=(j.cargo.bone||0)+meat*.1;j.encounter=null;delete j.combatTarget;delete j.combatDistance;j.wildCooldown=3;log(s,a.name+' mengalahkan '+name+' dan membawa '+Math.round(meat)+' pangan.');return {reward:3-damage*.2,energy:8,retreat:j.kind==='hunt',note:'Berhasil berburu '+name};}
 log(s,a.name+' terluka '+Math.round(damage)+' saat menghadapi '+name+'.');return {reward:-damage*.2,energy:8,note:'Bertarung dengan '+name};
}
export function validateWildlife(r,finite){
 const w=r.world,ids=new Set(w.settlements.map(c=>c.id));if(typeof w.wilderness!=='boolean'||!Array.isArray(w.wildlands)||w.wildlands.length>6||!Array.isArray(w.beasts)||w.beasts.length>256||!Number.isInteger(w.nextBeastId)||!finite(w.nextBeastId,1,1e9))throw Error('Satwa liar tidak valid.');
 const areas=new Set();for(const z of w.wildlands){if(!Number.isInteger(z.id)||z.id<1||areas.has(z.id)||!Number.isInteger(z.planet)||!w.planets[z.planet]||!finite(z.x,0,3200)||!finite(z.y,0,2000)||!finite(z.radius,1,500)||z.prey!==undefined&&typeof z.prey!=='boolean'||typeof z.name!=='string'||z.name.length>60||!Array.isArray(z.seenBy)||new Set(z.seenBy).size!==z.seenBy.length||z.seenBy.some(id=>!ids.has(id)))throw Error('Area berbahaya tidak valid.');areas.add(z.id);}
 const beasts=new Set();for(const b of w.beasts){const spec=SPECIES[b.species];if(!spec||!Number.isInteger(b.id)||b.id<1||b.id>=w.nextBeastId||beasts.has(b.id)||!areas.has(b.area)||(b.x!==undefined||b.y!==undefined)&&(!finite(b.x,0,3200)||!finite(b.y,0,2000))||!finite(b.health,0,spec.health)||['attack','defense','speed','meat'].some(k=>b[k]!==spec[k]))throw Error('Hewan buas tidak valid.');beasts.add(b.id);}
 for(const n of w.nodes)if(n.wildland!==undefined&&!areas.has(n.wildland))throw Error('Resource area berbahaya tidak valid.');
 for(const c of w.settlements)for(const a of (c.id===1?r:c.state).agents){const j=a.journey;if(j?.encounter!==undefined&&j.encounter!==null&&!w.beasts.some(b=>b.id===j.encounter&&w.wildlands.some(z=>z.id===b.area&&z.planet===c.planet))||j?.kind==='hunt'&&!w.beasts.some(b=>b.id===j.node&&w.wildlands.some(z=>z.id===b.area&&z.planet===c.planet)))throw Error('Pertemuan satwa tidak valid.');if(j?.combatDistance!==undefined&&!finite(j.combatDistance,0,120)||j?.combatTarget!==undefined&&(!Number.isInteger(j.combatTarget)||!w.beasts.some(b=>b.id===j.combatTarget)))throw Error('Jarak pertempuran tidak valid.');if(j?.wildCooldown!==undefined&&(!Number.isInteger(j.wildCooldown)||!finite(j.wildCooldown,0,3)))throw Error('Jeda pertemuan tidak valid.');}
}
