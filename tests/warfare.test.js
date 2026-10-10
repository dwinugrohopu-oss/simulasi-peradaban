import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,tick,act,log,validateSave,resolveDeaths,worldPopulation} from '../engine.js';
import {campaignPlan,startSettlementWar,annexSettlement} from '../warfare.js';
import {tickWorld,stateOf} from '../world.js';
import {journeyWork,returnHome} from '../frontier.js';
import {settlementGroups} from '../menu-groups.js';
import {classifyNotice} from '../notifications.js';
function scenario(mode='raid'){
 const s=newGame(41,0),a=s.world.settlements[0],b=s.world.settlements[2];s.day=200;for(const c of s.world.settlements)stateOf(s,c).day=s.day;
 a.contacts=[b.id];b.contacts=[a.id];a.relations[b.id]=b.relations[a.id]=-90;
 for(const c of [a,b]){const t=stateOf(s,c);t.food=200;t.wood=t.stone=0;t.harmony=60;t.buildings.hut=2;t.buildings.warehouse=1;for(const p of t.agents){p.traits=['careful','frugal'];p.health=100;p.energy=90;p.hunger=15;p.grievance=0;}}
 b.state.wood=80;b.state.stone=90;
 const soldiers=s.agents.slice(0,2);for(const p of soldiers){p.traits=mode==='conquest'?['aggressive','careful']:['greedy','careful'];p.attributes.strength=p.attributes.endurance=p.attributes.discipline=100;p.skills.defend=mode==='conquest'?400:0;const id=s.nextWeaponId++;s.weapons.push({id,type:mode==='conquest'?'laser':'spear',condition:100,uses:0,owner:p.id,...(mode==='conquest'?{ammo:20}:{})});p.equipment.weapon=id;}
 for(const p of b.state.agents)p.attributes.strength=p.attributes.endurance=p.attributes.discipline=20;
 return {s,a,b,soldiers};
}
function step(s,work=()=>{}){tickWorld(s,{tick:t=>{for(const p of t.agents.filter(p=>p.alive)){p.hunger=15;p.energy=90;}work(t);},newGame,log,resolveDeaths});}
function launch(v){assert.ok(startSettlementWar(v.s,v.a,v.b,log));assert.equal(v.a.war.mode,v.mode||'raid');}
function arrive(v){for(const p of v.soldiers){while(p.journey.phase==='outbound')journeyWork(v.s,p,log);assert.equal(p.journey.phase,'camp');}}
function defend(t){for(const p of t.agents.filter(p=>p.alive))act(t,p,'defend');}
const materialTotals=v=>['food','wood','stone','ore','fiber','bone'].map(k=>[k,stateOf(v.s,v.a)[k]+stateOf(v.s,v.b)[k]+[...v.s.agents,...v.b.state.agents].reduce((n,p)=>n+(p.stash[k]||0)+(p.journey?.cargo[k]||0),0)]);
test('automatic campaigns require hostile known rivals, motivation, armed strength, provisions and home workers',()=>{
 const v=scenario(),{s,a,b}=v;const plan=campaignPlan(s,a,b);assert.equal(plan.mode,'raid');assert.equal(plan.squad.length,2);assert.equal(s.agents.length-plan.squad.length,3);assert.equal(Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/100),15);
 for(const change of [v=>v.a.contacts=[],v=>v.a.relations[v.b.id]=0,v=>v.b.planet=1,v=>v.b.polityId=v.a.polityId,v=>v.s.food=1,v=>v.s.weapons=[],v=>v.soldiers.forEach(p=>p.traits=['careful','frugal']),v=>v.soldiers.forEach(p=>p.health=40),v=>v.s.agents=v.s.agents.slice(0,3),v=>v.a.lastWar=v.s.day]){const blocked=scenario();change(blocked);assert.equal(campaignPlan(blocked.s,blocked.a,blocked.b),null);}
 const gun=scenario();gun.s.weapons.forEach(w=>{w.type='pistol';w.ammo=0;});assert.equal(campaignPlan(gun.s,gun.a,gun.b),null);
});
test('world diplomacy automatically launches a distant raid, preserves an expedition save and never attacks before arrival',()=>{
 const v=scenario();step(v.s);assert.equal(v.a.war.mode,'raid');assert.ok(v.soldiers.every(p=>p.journey.source==='settlement'&&p.journey.remaining===15));const health=v.b.state.agents.map(p=>p.health),wood=v.b.state.wood,ammo=v.s.weapons.map(w=>w.uses);
 step(v.s,defend);assert.deepEqual(v.b.state.agents.map(p=>p.health),health);assert.equal(v.b.state.wood,wood);assert.deepEqual(v.s.weapons.map(w=>w.uses),ammo);
 const save=validateSave(JSON.parse(JSON.stringify(v.s)));assert.equal(save.agents[0].journey.source,'settlement');assert.equal(save.world.settlements[0].war.squad.length,2);
 const bad=structuredClone(v.s);bad.agents[0].journey.source='object';assert.throws(()=>validateSave(bad));
});
test('successful raiders carry finite spoils, return physically, and deposit only at home without duplicating stocks',()=>{
 const v=scenario();launch(v);arrive(v);const wood=v.s.wood,stock=v.b.state.wood;step(v.s,t=>{if(t===v.s)defend(t);});assert.equal(v.a.war,null);assert.ok(v.soldiers.every(p=>p.journey.phase==='return'));const stolen=v.soldiers.reduce((n,p)=>n+Object.values(p.journey.cargo).reduce((m,x)=>m+x,0),0);assert.equal(stolen,32);assert.equal(v.s.wood,wood);assert.equal(v.b.state.wood,stock-32);
 const total=new Map(materialTotals(v));for(const p of v.soldiers){assert.ok(p.journey.total===15);while(p.journey)journeyWork(v.s,p,log);}
 assert.equal(v.s.wood+v.soldiers.reduce((n,p)=>n+p.stash.wood,0),32);assert.equal(new Map(materialTotals(v)).get('wood'),total.get('wood'));validateSave(v.s);
});
test('defending a town uses weapon ammunition only once the invaders have arrived',()=>{
 const v=scenario();launch(v);const p=v.b.state.agents[0],id=v.b.state.nextWeaponId++;v.b.state.weapons.push({id,type:'pistol',condition:100,uses:0,ammo:12,owner:p.id});p.equipment.weapon=id;
 step(v.s,t=>{if(t===v.b.state)defend(t);});assert.equal(v.b.state.weapons[0].ammo,12);arrive(v);step(v.s,defend);assert.equal(v.b.state.weapons[0].ammo,11);assert.ok(p.weaponPractice.pistol>=1);
});
test('conquest requires ten days of superiority at the target, keeps buildings, citizens and research, and regroups the menu',()=>{
 const v=scenario('conquest');v.mode='conquest';launch(v);const pop=worldPopulation(v.s),snapshot=structuredClone({buildings:v.b.state.buildings,agents:v.b.state.agents.map(p=>p.id),language:v.b.language,discoveries:v.b.discoveries,position:[v.b.x,v.b.y]});
 step(v.s,defend);assert.equal(v.a.war.control,0);assert.equal(v.b.polityId,v.b.id);arrive(v);
 for(let day=0;day<9;day++){step(v.s,t=>{if(t===v.s)defend(t);});assert.equal(v.b.polityId,v.b.id);}
 step(v.s,t=>{if(t===v.s)defend(t);});assert.equal(v.b.polityId,v.a.polityId);assert.equal(v.a.war,null);assert.equal(v.b.war,null);assert.equal(worldPopulation(v.s),pop);assert.deepEqual(v.b.state.buildings,snapshot.buildings);assert.deepEqual(v.b.state.agents.map(p=>p.id),snapshot.agents);assert.deepEqual(v.b.discoveries,snapshot.discoveries);assert.deepEqual(v.b.language.lexicon,snapshot.language.lexicon);assert.deepEqual([v.b.x,v.b.y],snapshot.position);assert.ok(settlementGroups(v.s).find(g=>g.id===v.a.id).members.includes(v.b));assert.ok(v.soldiers.every(p=>p.journey.phase==='return'));validateSave(v.s);
});
test('capturing a capital acquires that settlement and leaves its other towns with their own valid capital',()=>{
 const v=scenario(),colony=v.s.world.settlements[3];colony.polityId=v.b.id;const buildings=structuredClone(v.b.state.buildings),people=v.b.state.agents.slice(),stocks=materialTotals(v);annexSettlement(v.s,v.a,v.b,log);assert.equal(v.b.polityId,v.a.id);assert.equal(colony.polityId,colony.id);assert.deepEqual(v.b.state.buildings,buildings);assert.deepEqual(v.b.state.agents,people);assert.deepEqual(materialTotals(v),stocks);validateSave(v.s);
});
test('strong defenders prevent capture, retreat cancels campaigns, and dead carriers do not deposit their loot',()=>{
 const v=scenario('conquest');v.mode='conquest';launch(v);arrive(v);for(const p of v.b.state.agents){p.attributes.endurance=p.attributes.discipline=p.attributes.strength=100;p.skills.defend=10000;}
 step(v.s,defend);assert.equal(v.b.polityId,v.b.id);assert.equal(v.a.war.control,0);assert.ok(v.soldiers.some(p=>p.health<100));for(const p of v.soldiers)returnHome(v.s,p);step(v.s);assert.equal(v.a.war,null);
 const raided=scenario();launch(raided);arrive(raided);step(raided.s,t=>{if(t===raided.s)defend(t);});const p=raided.soldiers[0],stone=raided.s.stone;assert.ok(Object.values(p.journey.cargo).some(n=>n>0));p.health=0;resolveDeaths(raided.s);step(raided.s);assert.equal(p.journey,null);assert.equal(raided.s.stone,stone);
});
test('malformed or asymmetric settlement campaigns and false arrival positions are rejected',()=>{
 const v=scenario();launch(v);for(const change of [s=>s.world.settlements[0].war.mode='piracy',s=>s.world.settlements[0].war.squad=[1,1],s=>s.world.settlements[0].war.attacker=2,s=>s.world.settlements[2].war.control=5,s=>s.world.settlements[0].war.claim=1,s=>{s.agents[0].journey.phase='camp';}]){const bad=structuredClone(v.s);change(bad);assert.throws(()=>validateSave(bad));}validateSave(v.s);
 assert.equal(classifyNotice('Perampokan terhadap Lembah Timur dimulai.').title,'Perampokan dimulai');assert.equal(classifyNotice('Permukiman ditaklukkan: Lembah Timur.').title,'Permukiman ditaklukkan');
});
test('a foreign settlement can conquer the original village while keeping its root state and original buildings intact',()=>{
 const v=scenario(),r=v.s,target=v.a,winner=v.b,army=winner.state.agents.slice(0,2);r.weapons=[];for(const p of r.agents){delete p.equipment.weapon;p.traits=['careful','frugal'];p.attributes.strength=p.attributes.endurance=p.attributes.discipline=20;}
 for(const p of army){p.traits=['aggressive','careful'];p.attributes.strength=p.attributes.endurance=p.attributes.discipline=100;p.skills.defend=400;const id=winner.state.nextWeaponId++;winner.state.weapons.push({id,type:'laser',condition:100,uses:0,ammo:20,owner:p.id});p.equipment.weapon=id;}
 const buildings=structuredClone(r.buildings);assert.equal(campaignPlan(r,winner,target).mode,'conquest');assert.ok(startSettlementWar(r,target,winner,log));for(const p of army)while(p.journey.phase==='outbound')journeyWork(winner.state,p,log);
 for(let day=0;day<10;day++)step(r,t=>{if(t===winner.state)defend(t);});assert.equal(target.polityId,winner.id);assert.deepEqual(r.buildings,buildings);assert.ok(settlementGroups(r).find(g=>g.id===winner.id).members.includes(target));validateSave(r);
});
test('automatic travelers fight only after the full fifteen-day outbound journey and save correctly mid-campaign',()=>{
 const v=scenario();step(v.s);const before=v.b.state.agents.map(p=>p.health);
 for(let day=0;day<15;day++){step(v.s,t=>{if(t===v.s)for(const p of v.soldiers)act(t,p,'travel');});assert.deepEqual(v.b.state.agents.map(p=>p.health),before);if(day===7)validateSave(JSON.parse(JSON.stringify(v.s)));}
 assert.ok(v.soldiers.every(p=>p.journey.phase==='camp'));step(v.s,t=>{if(t===v.s)defend(t);});assert.ok(v.b.state.agents.some((p,i)=>p.health<before[i]));assert.ok(v.soldiers.every(p=>p.journey.phase==='return'));validateSave(v.s);
});

test('ordinary autonomous decisions complete both a raid and a conquest without scripted combat actions',()=>{
 for(const mode of ['raid','conquest']){const v=scenario(mode);for(let day=0;day<100;day++)tick(v.s);assert.equal(v.s.world.wars,1);assert.ok(v.s.logs.some(l=>mode==='raid'?/Perampokan .+ berhasil/.test(l.text):/Permukiman ditaklukkan:/.test(l.text)));assert.equal(v.b.polityId,mode==='conquest'?v.a.polityId:v.b.id);assert.ok(v.soldiers.every(p=>p.journey?.kind!=='campaign'));validateSave(v.s);}
});
