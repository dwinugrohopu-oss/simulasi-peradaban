import {legacyWorld} from './fixtures.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,tick,validateSave,available,observation,resolveDeaths} from '../engine.js';
import {stateOf} from '../world.js';
import {combatStats,encounterOnRoute,wildlifeCombat,huntTarget,SPECIES,routeThreat,wildlifeDay,animalPosition} from '../wildlife.js';
import {startGather,startHunt,journeyWork} from '../frontier.js';
import {equipWeapon,equipArmor,ARMORS,equipmentWork} from '../equipment.js';
import {storageDay,equipmentStorage} from '../storage.js';
import {governmentScores,updateCulture} from '../civics.js';
function trained(s,a){for(const k of Object.keys(a.attributes))a.attributes[k]=90;a.health=100;a.energy=100;a.skills.defend=a.skills.hunt=a.skills.flee=100;s.weapons.push({id:s.nextWeaponId++,type:'ballistic',condition:100,uses:0,owner:null,ammo:20});s.armors.push({id:s.nextArmorId++,type:'alloy',condition:100,uses:0,owner:null});equipWeapon(s,a);equipArmor(s,a);}
function contact(s){const c=s.world.settlements[0],z=s.world.wildlands[0];z.seenBy.push(c.id);return z;}
function face(s,a,species='bear'){const c=s.world.settlements[0],z=s.world.wildlands[0];const n=s.world.nodes.find(n=>n.wildland===z.id&&n.kind==='wood');startGather(s,a,'wood',12,()=>{});a.journey.target={x:z.x,y:z.y};a.journey.position={x:z.x,y:z.y};a.journey.node=n.id;const beast=s.world.beasts.find(b=>b.area===z.id&&b.species===species)||s.world.beasts.find(b=>b.area===z.id);beast.species=species;Object.assign(beast,SPECIES[species]);delete beast.name;a.journey.encounter=beast.id;return beast;}
test('new worlds space human villages15–22 days apart with independent languages and rich territorial resources',()=>{
 for(const seed of [1,2,42,101]){const s=newGame(seed,0),villages=s.world.settlements.filter(c=>c.species==='human');assert.equal(new Set(villages.map(c=>c.language.family)).size,4);assert.equal(new Set(villages.map(c=>c.language.name)).size,4);for(const a of villages)for(const b of villages)if(a!==b){const days=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/100);assert.ok(days>=15&&days<=25);}
  assert.equal(s.world.wildlands.length,6);assert.equal(s.world.beasts.length,36);for(const z of s.world.wildlands){assert.ok(s.world.settlements.every(c=>c.planet!==z.planet||Math.hypot(c.x-z.x,c.y-z.y)>z.radius));const nodes=s.world.nodes.filter(n=>n.wildland===z.id);for(const kind of ['food','wood','ore'])assert.ok(nodes.some(n=>n.kind===kind&&n.capacity>=1000));for(const n of nodes.filter(n=>n.kind==='ore'))assert.equal(n.renewal,0);}validateSave(s);
 }
});
test('entering territory can trigger an encounter, outside travel and village residents are safe',()=>{
 const s=newGame(1,0),a=s.agents[0],z=s.world.wildlands[0];startGather(s,a,'wood',12,()=>{});const original={...a.journey.position};encounterOnRoute(s,a,{x:100,y:100},{x:200,y:100});assert.ok(!a.journey.encounter);for(let i=0;i<100&&!a.journey.encounter;i++)encounterOnRoute(s,a,{x:z.x-300,y:z.y},{x:z.x+300,y:z.y});assert.ok(a.journey.encounter);assert.deepEqual(a.journey.position,original);assert.ok(s.agents.slice(1).every(b=>b.health===100));assert.deepEqual(available(s,a),['defend','flee']);assert.ok(observation(s,a).startsWith('battle:'));
});
test('weapons, armor, wear, health, energy and practice change combat statistics; owners cannot share gear',()=>{
 const s=newGame(2,0),a=s.agents[0],bare=combatStats(s,a);trained(s,a);const ready=combatStats(s,a);assert.ok(ready.attack>bare.attack);assert.ok(ready.defense>bare.defense);s.weapons[0].condition=5;s.armors[0].condition=5;assert.ok(combatStats(s,a).attack<ready.attack);assert.ok(combatStats(s,a).defense<ready.defense);a.health=20;a.energy=0;assert.ok(combatStats(s,a).speed<ready.speed);assert.equal(equipArmor(s,s.agents[1]),null);assert.equal(equipWeapon(s,s.agents[1]),null);
});
test('untrained citizens can be severely injured and killed; death releases armor and weapon ownership',()=>{
 const s=newGame(3,0),a=s.agents[0];face(s,a);a.health=8;const reward=act(s,a,'defend');assert.equal(a.alive,false);assert.equal(a.health,0);assert.ok(reward<0);assert.ok(s.logs.some(l=>l.text.includes('serangan hewan buas')));resolveDeaths(s);validateSave(s);
});
test('trained equipped hunters kill a finite animal, wear gear and return its meat once',()=>{
 const s=newGame(4,0),a=s.agents[0];trained(s,a);contact(s);s.food=100;assert.ok(huntTarget(s,a));startHunt(s,a,()=>{});assert.ok(a.journey);const beast=s.world.beasts.find(b=>b.id===a.journey.node);a.journey.position={...a.journey.target};a.journey.encounter=beast.id;const before=s.food;let turns=0;while(a.journey?.encounter&&turns++<20)act(s,a,'defend');assert.equal(beast.health,0);assert.ok(a.journey.cargo.food>0);assert.ok(s.weapons[0].condition<100);assert.ok(s.armors[0].condition<=100);assert.ok(a.skills.defend>100);const meat=a.journey.cargo.food;for(const b of s.world.beasts)b.health=0;while(a.journey)journeyWork(s,a,()=>{});assert.ok(s.food+a.stash.food>=before+meat);const received=s.food+a.stash.food;assert.equal(journeyWork(s,a,()=>{}).reward,-1);assert.equal(s.food+a.stash.food,received);validateSave(s);
});
test('fleeing compares speed and successful retreat preserves a return journey',()=>{
 const s=newGame(5,0),a=s.agents[0];trained(s,a);face(s,a,'wolf');let escaped=false;for(let i=0;i<30&&!escaped;i++){a.health=100;act(s,a,'flee');escaped=!a.journey.encounter;}assert.ok(escaped);assert.equal(a.journey.encounter,null);assert.equal(a.journey.wildCooldown,3);assert.equal(a.journey.phase,'return');
});
test('known threatening routes and deliberate hunts require preparation, not free starter equipment',()=>{
 const s=newGame(6,0),a=s.agents[0],z=contact(s);assert.equal(huntTarget(s,a),null);assert.ok(routeThreat(s,a,z));assert.ok(!available(s,a).includes('hunt'));assert.equal(s.weapons.length+s.armors.length,0);trained(s,a);assert.ok(huntTarget(s,a));assert.ok(available(s,a).includes('hunt'));
});
test('armor is manufactured from real materials, stored or carried, decays and releases a broken slot',()=>{
 const s=newGame(7,0),a=s.agents[0];s.buildings.warehouse=1;s.wood=20;s.fiber=20;s.bone=10;const cost=ARMORS.hide.cost;equipmentWork(s,a,'forgeArmor',1,()=>{});assert.equal(s.wood,20-cost.wood);assert.equal(s.fiber,20-cost.fiber);assert.equal(s.bone,10-cost.bone);assert.equal(a.equipment.armor,s.armors[0].id);assert.ok(equipmentStorage(s).stored.armors.has(s.armors[0].id));a.action='defend';assert.ok(equipmentStorage(s).carried.armors.has(s.armors[0].id));s.armors[0].condition=.000001;storageDay(s,()=>{});assert.equal(a.equipment.armor,undefined);assert.equal(s.armors[0].owner,null);validateSave(s);
});
test('being poor does not force communist habits, distinct choices produce different government scores',()=>{
 const s=newGame(8,0),c=s.world.settlements[0];for(const a of s.agents){a.stash={food:0,wood:0,stone:0};a.ideology.commons=0;a.ideology.liberty=100;a.ideology.authority=0;}for(let i=0;i<300;i++){s.day++;s.lastTurn={day:s.day,records:[]};updateCulture(s,c,()=>{});}assert.ok(c.government.habits.commons<.05);assert.equal(c.government.type,'liberal');for(const a of s.agents)a.ideology.commons=100;c.government.habits.commons=1;c.government.habits.private=0;c.government.habits.diversity=0;const scores=governmentScores(s,c);assert.ok(scores.communist>scores.capitalist);
});
test('old version9 saves keep map positions, languages, resources and journeys without new wildlands',()=>{
 const s=legacyWorld(9,0);startGather(s,s.agents[0],'wood',12,()=>{});const snapshot=structuredClone(s);for(const c of s.world.settlements){const st=stateOf(s,c);st.version=9;delete st.armors;delete st.nextArmorId;for(const a of st.agents)for(const action of ['hunt','flee','forgeArmor']){delete a.skills[action];for(const r of Object.values(a.q))delete r[action];}}for(const field of ['wilderness','wildlands','beasts','nextBeastId'])delete s.world[field];const restored=validateSave(s);
 assert.equal(restored.world.wildlands.length,0);assert.equal(restored.world.beasts.length,0);assert.deepEqual(restored.world.nodes,snapshot.world.nodes);for(const c of restored.world.settlements){const old=snapshot.world.settlements.find(x=>x.id===c.id);assert.equal(c.x,old.x);assert.equal(c.y,old.y);assert.deepEqual(c.language,old.language);const st=stateOf(restored,c),before=stateOf(snapshot,old);for(const field of ['food','wood','stone'])assert.equal(st[field],before[field]);assert.deepEqual(st.agents[0].journey,before.agents[0].journey);assert.deepEqual(st.armors,[]);}assert.deepEqual(validateSave(restored),restored);
});
test('wildlife and armor save data reject malformed statistics, ownership and encounter IDs',()=>{
 const s=newGame(10,0);for(const edit of [s=>s.world.beasts[0].attack=-1,s=>s.world.beasts[0].health=10000,s=>s.world.wildlands[0].radius=-1,s=>s.armors=[{id:1,type:'hide',condition:100,uses:0,owner:999}],s=>s.world.nodes.find(n=>n.wildland).wildland=999]){const bad=structuredClone(s);edit(bad);assert.throws(()=>validateSave(bad));}
});

test('stone weapons hunt nearby deer without armor; departure is not practice and each strike wears the weapon',()=>{
 const s=newGame(91,0),a=s.agents[0];s.buildings.warehouse=1;s.wood=6;s.stone=3;s.food=20;
 assert.equal(huntTarget(s,a),null);equipmentWork(s,a,'forgeWeapon',1,()=>{});
 assert.equal(s.wood,0);assert.equal(s.stone,0);assert.equal(s.weapons[0].type,'stone');assert.equal(a.equipment.armor,undefined);
 const deer=huntTarget(s,a);assert.equal(deer.species,'deer');assert.ok(available(s,a).includes('hunt'));
 const practice=a.skills.hunt;act(s,a,'hunt');assert.equal(a.skills.hunt,practice);
 let days=0;while(!a.journey.encounter&&days++<20)journeyWork(s,a,()=>{});
 assert.equal(a.journey.encounter,deer.id);assert.equal(a.journey.remaining,1);assert.deepEqual(available(s,a),['hunt','flee']);assert.ok(observation(s,a).includes(':prey:'));validateSave(s);
 const attack=combatStats(s,a).attack;let rounds=0;while(a.journey.encounter&&rounds++<20)act(s,a,'hunt');
 assert.equal(deer.health,0);assert.ok(a.alive);assert.equal(a.skills.hunt-practice,s.weapons[0].uses);assert.ok(s.weapons[0].condition<100);
 // Hold gear condition constant to isolate the effect of practice.
 s.weapons[0].condition=100;assert.ok(combatStats(s,a).attack>attack);assert.equal(a.journey.cargo.food,8);
 while(a.journey)journeyWork(s,a,()=>{});validateSave(s);
});
test('prey is accessible to each founding human village and never ambushes passing travellers',()=>{
 const s=newGame(92,0);for(const c of s.world.settlements.filter(c=>c.species==='human'))assert.ok(s.world.beasts.some(b=>b.species==='deer'&&Math.hypot(animalPosition(s,b).x-c.x,animalPosition(s,b).y-c.y)<=350));
 const a=s.agents[0],z=contact(s);for(const b of s.world.beasts)if(!SPECIES[b.species].passive)b.health=0;
 assert.equal(routeThreat(s,a,z),false);startGather(s,a,'wood',12,()=>{});a.journey.kind='hunt';
 for(let i=0;i<100;i++)encounterOnRoute(s,a,{x:z.x-300,y:z.y},{x:z.x+300,y:z.y});
 assert.equal(a.journey.encounter,undefined);assert.equal(a.skills.hunt,0);
});
test('animal positions survive saves; old territories retain their species when replenishing',()=>{
 const s=newGame(93,0),copy=validateSave(s);assert.deepEqual(copy.world.beasts,s.world.beasts);
 for(const z of s.world.wildlands)delete z.prey;
 s.world.beasts=s.world.beasts.filter(b=>b.species!=='deer');for(const c of s.world.settlements)stateOf(s,c).day=120;wildlifeDay(s);assert.ok(s.world.beasts.every(b=>b.species!=='deer'));validateSave(s);
 for(const edit of [b=>b.x=NaN,b=>b.y=2001,b=>delete b.y]){const bad=newGame(94,0);edit(bad.world.beasts.find(b=>b.species==='deer'));assert.throws(()=>validateSave(bad));}
});

test('replenishing prey refills the vacant grassland patch without copying a surviving deer',()=>{
 const s=newGame(95,0),z=s.world.wildlands[0],prey=s.world.beasts.filter(b=>b.area===z.id&&b.species==='deer'),spot=animalPosition(s,prey[0]);prey[0].health=0;
 s.day=120;wildlifeDay(s);const alive=s.world.beasts.filter(b=>b.area===z.id&&b.species==='deer'&&b.health>0);
 assert.equal(alive.length,2);assert.ok(alive.some(b=>b.id!==prey[0].id&&b.x===spot.x&&b.y===spot.y));assert.equal(prey[0].health,0);
});
