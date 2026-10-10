import {legacyWorld} from './fixtures.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,startProject,validateSave,tick,worldPopulation,log,resolveDeaths,newAgent} from '../engine.js';
import {stateOf} from '../world.js';
import {assignHousing,housingCapacity,housingDay} from '../shelter.js';
import {storageSplit,storageDay,equipmentStorage,EQUIPMENT_CAPACITY} from '../storage.js';
import {evaluateDesign,useTool} from '../physics.js';
import {equipWeapon,weaponPower,equipmentWork,VEHICLES} from '../equipment.js';
import {startGather,gatherTarget,journeyWork} from '../frontier.js';
import {buildingNeeds} from '../economy.js';
import {warehouseStock,equipmentRows} from '../warehouse.js';
const tool=(s,id=1,head='stone')=>{const design={head,handle:'wood',binding:'fiber',shape:'blade'},physics=evaluateDesign(design);return {id,owner:s.agents[0].id,maker:s.agents[0].id,job:'wood',design,physics,name:'Kapak '+head,condition:physics.durability,status:'ready',createdDay:0,testedDay:0,measured:.2,uses:0};};

test('warehouse must be paid for and finished before it protects existing ground piles',()=>{
 const s=newGame(1,0);s.wood=100;s.stone=10;startProject(s,'warehouse');assert.equal(s.wood,70);assert.equal(s.stone,5);assert.equal(storageSplit(s,'wood').stored,0);
 const allocated=s.wood;while(s.project)act(s,s.agents[0],'build');assert.equal(s.wood,allocated);assert.equal(s.buildings.warehouse,1);assert.equal(storageSplit(s,'wood').stored,70);assert.equal(storageSplit(s,'wood').ground,0);validateSave(s);
});

test('overflow stays on the ground and decays faster, with no duplicated stock or spontaneous materials',()=>{
 const s=newGame(2,0);s.buildings.warehouse=1;s.food=1000;s.wood=100;const split=storageSplit(s,'food');assert.deepEqual(split,{stored:300,ground:700,capacity:300});
 const before=s.food,losses=storageDay(s,log);assert.ok(Math.abs(losses.food-28.6)<1e-8);assert.ok(Math.abs(s.food+losses.food-before)<1e-8);assert.equal(s.wood,100);
 const stock=warehouseStock(s,s.world.settlements[0]);assert.ok(Math.abs(stock.resources.food-stock.stored.food-stock.ground.food)<1e-8);
 const outside=newGame(2,0);outside.food=1000;assert.equal(storageDay(outside,log).food,40);assert.ok(outside.food<s.food);validateSave(s);
});

test('idle equipment is stored until capacity fills; carried tools and ground tools have different exposure',()=>{
 const s=newGame(3,0);s.buildings.warehouse=1;s.tools=Array.from({length:EQUIPMENT_CAPACITY+1},(_,i)=>tool(s,i+1));s.nextToolId=s.tools.length+1;
 s.agents[0].equipment.wood=1;s.agents[0].action='rest';const locations=equipmentStorage(s);assert.equal(locations.stored.tools.size,EQUIPMENT_CAPACITY);assert.equal(locations.carried.tools.size,0);
 const before=s.tools.map(t=>t.condition);storageDay(s,log);assert.ok(before[40]-s.tools[40].condition>before[0]-s.tools[0].condition);
 s.agents[0].action='wood';assert.ok(equipmentStorage(s).carried.tools.has(1));assert.ok(!equipmentStorage(s).stored.tools.has(1));validateSave(s);
});

test('tool work wears condition according to workload and weapon slots cannot share a weapon or collide with tool IDs',()=>{
 const s=newGame(4,0,{world:false}),a=s.agents[0],b=s.agents[1];s.tools=[tool(s)];s.nextToolId=2;a.equipment.wood=1;
 const before=s.tools[0].condition;useTool(s,a,'wood',{random:()=>1,log});assert.ok(s.tools[0].condition<before);assert.equal(s.tools[0].uses,1);
 s.weapons=[{id:1,type:'stone',condition:100,uses:0,owner:null},{id:2,type:'metal',condition:100,uses:0,owner:null}];s.nextWeaponId=3;
 assert.equal(equipWeapon(s,a).id,2);assert.equal(equipWeapon(s,b).id,1);assert.notEqual(a.equipment.weapon,b.equipment.weapon);
 a.action='defend';act(s,a,'rest');const condition=s.weapons[1].condition;weaponPower(s,a);assert.ok(s.weapons[1].condition<condition);assert.equal(equipmentRows(s,'tools')[0].used,1);validateSave(s,{isolated:true});
 s.weapons[1].condition=.0001;storageDay(s,log);assert.equal(a.equipment.weapon,undefined);assert.equal(s.weapons[1].owner,null);validateSave(s,{isolated:true});
});

test('real beds reserve places for expedition crew; homelessness worsens rest, sickness and mood',()=>{
 const s=newGame(5,0,{world:false}),a=s.agents[0],b=s.agents[1];assert.equal(housingCapacity(s),0);a.energy=10;act(s,a,'rest');const rough=a.energy;
 s.buildings.hut=1;assignHousing(s);a.energy=10;act(s,a,'rest');assert.ok(a.energy>rough);a.away=true;assignHousing(s);assert.ok(a.home);assert.equal(s.agents.filter(p=>p.home).length,3);
 const outsider=s.agents[3];outsider.illnessDays=0;b.illnessDays=0;const mood=outsider.mood;housingDay(s,()=>.005,log);assert.ok(outsider.illnessDays>0);assert.equal(b.illnessDays,0);assert.ok(outsider.mood<mood);
 a.away=false;a.health=0;resolveDeaths(s);assignHousing(s);assert.equal(a.home,null);assert.ok(outsider.home);validateSave(s,{isolated:true});
});

test('version seven saves migrate without inventing a warehouse or changing supplies, tools and Q',()=>{
 const old=legacyWorld(6,0);old.version=7;old.world.settlements[1].state.version=7;old.buildings.hut=2;
 for(const st of [old,old.world.settlements[1].state]){delete st.buildings.warehouse;for(const a of st.agents){delete a.home;delete a.illnessDays;}}
 const restored=validateSave(old);assert.equal(restored.version,11);assert.equal(restored.buildings.warehouse,0);assert.equal(restored.food,old.food);assert.equal(restored.buildings.hut,2);assert.equal(restored.agents.filter(a=>a.home).length,6);assert.deepEqual(restored.agents[0].q,old.agents[0].q);assert.deepEqual(validateSave(restored),restored);
 const bad=structuredClone(restored);bad.agents[1].home=bad.agents[0].home;assert.throws(()=>validateSave(bad));bad.agents[1].home=null;bad.agents[0].illnessDays=-1;assert.throws(()=>validateSave(bad));
});

test('minimal ration worlds gather, build and survive from bare ground across several seeds',()=>{
 for(const seed of [1,2,42,101]){const s=newGame(seed,0);for(let day=0;day<250;day++)tick(s);for(const c of s.world.settlements.filter(c=>c.id===1||c.id===2)){const st=stateOf(s,c);assert.ok(st.agents.some(a=>a.alive),'survival '+seed+' '+c.name);assert.ok(st.buildings.warehouse>0,'warehouse '+seed);assert.ok(st.buildings.hut>0,'housing '+seed);assert.ok(st.buildings.farm>0,'farms '+seed);}assert.equal(worldPopulation(s),40+s.world.settlements.reduce((n,c)=>n+stateOf(s,c).birthCount-stateOf(s,c).deathCount,0));validateSave(s);}
});

test('broken vehicle releases its slot, preserves collected cargo and continues home on foot',()=>{
 const s=newGame(7,0),a=s.agents[0];s.food=100;s.vehicles=[{id:1,type:'cart',speed:VEHICLES.cart.speed,capacity:VEHICLES.cart.capacity,condition:.0001,uses:0}];s.nextVehicleId=2;
 startGather(s,a,'stone',30,log);const node=gatherTarget(s,'stone'),before=s.stone+node.stock;while(a.journey.phase!=='return')journeyWork(s,a,log);const cargo=a.journey.cargo.stone;
 storageDay(s,log);assert.equal(a.journey.vehicle,null);assert.equal(a.journey.speed,100);assert.equal(a.journey.cargo.stone,cargo);while(a.journey)journeyWork(s,a,log);assert.equal(s.stone+node.stock,before);validateSave(s);
});

test('more equipment drives warehouse planning and broken weapon archives are pruned without deleting occupied slots',()=>{
 const s=newGame(8,0);s.buildings.warehouse=1;s.tools=Array.from({length:41},(_,i)=>tool(s,i+1));s.nextToolId=42;assert.ok(buildingNeeds(s).find(n=>n.key==='warehouse').score>0);
 s.tools=[];s.agents[0].equipment={weapon:1};s.weapons=Array.from({length:512},(_,i)=>({id:i+1,type:'stone',condition:i===0?100:0,uses:0,owner:i===0?s.agents[0].id:null}));s.nextWeaponId=513;
 s.world.settlements[0].discoveries=['agriculture','weaponry'];s.world.settlements[0].stage=1;s.buildings.arsenal=1;s.wood=100;s.stone=20;
 equipmentWork(s,s.agents[0],'forgeWeapon',1,log);assert.equal(s.weapons.length,512);assert.ok(s.weapons.some(w=>w.id===1&&w.owner===s.agents[0].id));assert.ok(s.weapons.some(w=>w.id===513));validateSave(s);
});


test('citizen archive pruning releases weapons and estates before removing their owners',()=>{
 const s=newGame(9,0,{world:false}),owner=s.agents[0];s.weapons=[{id:1,type:'stone',condition:100,uses:0,owner:owner.id}];s.nextWeaponId=2;owner.equipment.weapon=1;owner.alive=false;owner.exitReason='death';owner.stash.food=3;const food=s.food;
 while(s.agents.length<100)newAgent(s,'birth');newAgent(s,'birth');assert.ok(!s.agents.includes(owner));assert.equal(s.weapons[0].owner,null);assert.equal(owner.equipment.weapon,undefined);assert.equal(s.food,food+3);
});
