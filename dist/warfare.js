/* Settlement campaigns use real journeys; spoils stay with their carriers until home. */
import {combatStats} from './wildlife.js';
import {weaponUsable,ARMORS} from './equipment.js';
import {startCampaign,returnHome} from './frontier.js';
const state=(r,c)=>c.id===1?r:c.state;
const adults=s=>s.agents.filter(a=>a.alive&&!a.away&&a.age>=16);
const home=s=>adults(s).filter(a=>!a.journey);
const armed=(s,a)=>weaponUsable(s.weapons.find(w=>w.id===a.equipment.weapon&&w.owner===a.id));
const strength=(s,people)=>people.reduce((v,a)=>{const t=combatStats(s,a);return v+t.attack+t.defense*.6+t.speed*.1;},0);
const hostile=a=>a.traits.some(t=>['aggressive','cruel','greedy','vengeful'].includes(t));
export function campaignPlan(r,c,target){
 const s=state(r,c),other=state(r,target),people=home(s),days=Math.max(1,Math.ceil(Math.hypot(c.x-target.x,c.y-target.y)/100));
 if(c.planet!==target.planet||c.polityId===target.polityId||c.war||target.war||!c.contacts.includes(target.id)||(c.relations[target.id]||0)>-60||r.day-Math.max(c.lastWar,target.lastWar)<120||people.length<4||!adults(other).length)return null;
 const need=['food','wood','stone'].some(k=>s[k]<other[k]&&s[k]<people.length*(k==='food'?6:20));
 const ambition=people.filter(a=>a.traits.some(t=>['aggressive','cruel'].includes(t))).length>=2;
 if(!need&&!ambition)return null;
 const ready=people.filter(a=>armed(s,a)&&a.health>=65&&a.energy>=40&&a.hunger<45).sort((a,b)=>Number(hostile(b))-Number(hostile(a))||strength(s,[b])-strength(s,[a]));
 const squad=ready.slice(0,Math.min(6,Math.floor(people.length/2)));if(squad.length<2||!squad.some(hostile))return null;
 const provisions=(days*2+32)*.35*squad.length;
 if(s.food<provisions+s.agents.filter(p=>p.alive&&!p.away).length*3)return null;
 const power=strength(s,squad),resistance=strength(other,home(other));if(power<resistance*.65)return null;
 const mode=ambition&&power>resistance*1.4?'conquest':'raid';
 if(mode==='raid'&&!['food','wood','stone','ore','fiber','bone'].some(k=>other[k]>=1))return null;
 return {mode,attacker:c.id,target:target.id,control:0,squad:squad.map(a=>a.id),remaining:90};
}
export function startSettlementWar(r,a,b,log){
 const choices=[a,b].map(c=>({c,target:c===a?b:a,plan:campaignPlan(r,c,c===a?b:a)})).filter(x=>x.plan);
 if(!choices.length)return false;
 const {c,target,plan}=choices.sort((x,y)=>strength(state(r,y.c),home(state(r,y.c)))-strength(state(r,x.c),home(state(r,x.c))))[0];
 c.war={...plan,against:target.id};target.war={...plan,squad:[...plan.squad],against:c.id};r.world.wars++;
 for(const id of plan.squad)startCampaign(state(r,c),state(r,c).agents.find(a=>a.id===id),log);
 log(state(r,c),(plan.mode==='raid'?'Perampokan':'Penaklukan')+' terhadap '+target.name+' dimulai. Pasukan membawa bekal dan menempuh perjalanan.');
 log(state(r,target),(plan.mode==='raid'?'Perampokan':'Penaklukan')+' oleh '+c.name+' dimulai. Warga dapat mempertahankan permukiman.');return true;
}
export function enemyAtSettlement(s){const r=s._context?.root||s,c=s._context?.civ||r.world.settlements[0],enemy=r.world.settlements.find(t=>t.id===c.war.attacker);return !!enemy&&state(r,enemy).agents.some(p=>p.alive&&p.health>0&&p.journey?.source==='settlement'&&p.journey.node===c.id&&p.journey.phase==='camp'&&!p.journey.encounter);}
export function recallCampaigns(r,a,b){for(const c of [a,b])for(const p of state(r,c).agents)if(p.alive&&p.journey?.kind==='campaign'&&p.journey.opponent===(c===a?b.id:a.id)&&p.journey.phase!=='return')returnHome(state(r,c),p);}
export function annexSettlement(r,winner,target,log){
 const old=target.polityId,remaining=r.world.settlements.filter(c=>c!==target&&c.polityId===old);
 if(old===target.id&&remaining.length){const capital=remaining[0].id;for(const c of remaining)c.polityId=capital;}
 target.polityId=winner.polityId;target.grievance=Math.min(100,target.grievance+15);state(r,target).harmony=Math.max(0,state(r,target).harmony-10);
 log(state(r,winner),'Permukiman ditaklukkan: '+target.name+'. Warga, persediaan dan bangunan tetap di tempat, bergabung ke pemerintahan '+winner.name+'.');
 log(state(r,target),'Permukiman ditaklukkan oleh '+winner.name+'. Warga dan bangunan tetap di lokasi semula.');
}
const active=(s,filter)=>adults(s).filter(a=>a.health>0&&filter(a)&&s._turn?.combat?.has(a.id)&&s._turn?.records.some(t=>t.id===a.id&&t.action==='defend'));
const stats=(s,a)=>s._turn?.combat?.get(a.id)||combatStats(s,a);
function hit(s,a,other,victim){const attack=stats(s,a),defense=combatStats(other,victim),damage=Math.max(1,Math.min(15,(attack.attack-defense.defense*.65)*.12));victim.health=Math.max(0,victim.health-damage);victim.mood=Math.max(0,victim.mood-3);victim.grievance=Math.min(100,victim.grievance+1);const armor=other.armors.find(w=>w.id===victim.equipment.armor&&w.owner===victim.id&&w.condition>0);if(armor){armor.uses++;armor.condition=Math.max(0,armor.condition-100/ARMORS[armor.type].durability);if(!armor.condition){armor.owner=null;delete victim.equipment.armor;}}}
export function settlementWarRound(r,a,b,log,endWar){
 const w=a.war,attacker=w.attacker===a.id?a:b,target=attacker===a?b:a,s=state(r,attacker),other=state(r,target);
 const atTarget=p=>p.journey?.kind==='campaign'&&p.journey.source==='settlement'&&p.journey.node===target.id&&p.journey.phase==='camp'&&!p.journey.encounter&&Math.hypot(p.journey.position.x-target.x,p.journey.position.y-target.y)<1;
 const arrived=adults(s).filter(p=>p.health>0&&atTarget(p)),fighters=active(s,atTarget),defenders=active(other,p=>!p.journey),residents=home(other).filter(p=>p.health>0);
 const power=fighters.reduce((n,p)=>n+stats(s,p).attack+stats(s,p).defense*.6,0),resistance=residents.reduce((n,p)=>n+combatStats(other,p).defense*.7,0)+defenders.reduce((n,p)=>n+stats(other,p).attack,0);
 for(const [own,force,enemy,victims]of [[s,fighters,other,defenders.length?defenders:residents],[other,defenders,s,arrived]])for(const [i,p]of force.entries()){const alive=victims.filter(v=>v.health>0);if(alive.length){const victim=alive[(r.day+i)%alive.length];hit(own,p,enemy,victim);if(victim.health===0)log(enemy,victim.name+' gugur dalam perang.');}}
 const survivors=fighters.filter(p=>p.health>0);
 if(survivors.length>=2&&power>resistance){
  if(w.mode==='raid'){
   let loot=0;const keys=['food','wood','stone','ore','fiber','bone'].sort((a,b)=>s[a]/Math.max(1,other[a])-s[b]/Math.max(1,other[b]));
   for(const p of survivors){const j=p.journey,capacity=s.vehicles.find(v=>v.id===j.vehicle)?.capacity||16;let room=Math.max(0,capacity-Object.values(j.cargo).reduce((n,v)=>n+v,0));for(const k of keys){const n=Math.min(room,other[k]);other[k]-=n;j.cargo[k]=(j.cargo[k]||0)+n;room-=n;loot+=n;}}
   log(s,'Perampokan '+target.name+' berhasil: '+Math.floor(loot)+' persediaan dibawa pasukan. Hasil masuk setelah mereka pulang.');endWar(r,a,b,log,'pasukan pulang membawa rampasan');return;
  }
  a.war.control++;b.war.control=a.war.control;
  if(a.war.control>=10){annexSettlement(r,attacker,target,log);endWar(r,a,b,log,'permukiman bergabung ke pemerintahan penakluk');return;}
 }else if(arrived.length&&power<=resistance){a.war.control=Math.max(0,a.war.control-1);b.war.control=a.war.control;}
 const remainingSquad=s.agents.filter(p=>p.alive&&p.health>0&&w.squad.includes(p.id)&&p.journey?.kind==='campaign'&&p.journey.phase!=='return');
 a.war.remaining--;b.war.remaining=a.war.remaining;
 if(remainingSquad.length<2||a.war.remaining<=0||attacker.polityId===target.polityId)endWar(r,a,b,log,'pasukan mundur atau masa kampanye berakhir');
}
export function validateSettlementWar(r,c,finite){const w=c.war;if(w?.mode===undefined)return;const rival=r.world.settlements.find(o=>o.id===w.against),attacker=r.world.settlements.find(o=>o.id===w.attacker);if(!['raid','conquest'].includes(w.mode)||w.claim!==undefined||!attacker||![c.id,w.against].includes(w.attacker)||w.target===(w.attacker)||![c.id,w.against].includes(w.target)||!Number.isInteger(w.control)||!finite(w.control,0,9)||!Array.isArray(w.squad)||w.squad.length<2||w.squad.length>6||new Set(w.squad).size!==w.squad.length||w.squad.some(id=>!Number.isInteger(id)||id<1||id>=state(r,attacker).nextId)||!rival?.war||['mode','attacker','target','control'].some(k=>rival.war[k]!==w[k])||JSON.stringify(rival.war.squad)!==JSON.stringify(w.squad))throw Error('Kampanye permukiman tidak valid.');}
