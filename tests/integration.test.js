import {newGame} from './fixtures.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {tick,act,available,validateSave,worldPopulation,log,resolveDeaths,row} from '../engine.js';
import {DISCOVERIES} from '../rules.js';
import {stateOf,tickWorld} from '../world.js';
import {evaluateDesign} from '../physics.js';
function advanced(){const s=newGame(3,0),c=s.world.settlements[0];c.discoveries=Object.keys(DISCOVERIES);c.stage=6;s.tech=2000;s.buildings.shipyard=1;s.food=1000;s.wood=120;s.stone=80;for(const a of s.agents){a.age=25;a.traits=['diligent','careful'];}return s;}
function flight(s,kind='survey',remaining=2){const c=s.world.settlements[0],crew=s.agents.slice(0,kind==='survey'?2:3);for(const a of crew){a.away=true;a.action='voyage';}c.flight={kind,destination:2,phase:'outbound',remaining,crew:crew.map(a=>a.id),cargo:kind==='survey'?{food:20,energy:40}:{food:100,wood:120,stone:80,fiber:4,bone:2,metal:20,alloy:40,energy:80,fuel:0,mana:0}};return crew;}
function idle(s){return tickWorld(s,{tick:t=>{for(const a of t.agents)if(a.alive&&!a.away)act(t,a,'rest');},newGame,log,resolveDeaths});}
test('each settlement receives one workday on the same calendar and crews do no village labor',()=>{
 const s=advanced(),crew=flight(s),steps=crew.map(a=>a.steps),food=s.world.settlements[0].flight.cargo.food;tick(s);for(const [i,a]of crew.entries()){assert.equal(a.steps,steps[i]);assert.deepEqual(available(s,a),[]);assert.ok(!s.lastTurn.records.some(r=>r.id===a.id));}for(const c of s.world.settlements){const t=stateOf(s,c);assert.equal(t.day,s.day);assert.equal(new Set(t.lastTurn.records.map(r=>r.id)).size,t.lastTurn.records.length);}assert.ok(s.world.settlements[0].flight.cargo.food<food);assert.equal(worldPopulation(s),12);validateSave(s);
});
test('surveys return actual workers, retain their skills, record visited planets and restore only leftover cargo',()=>{
 const s=advanced(),crew=flight(s,'survey',1),c=s.world.settlements[0],skill=crew[0].skills.research;idle(s);assert.ok(c.surveyed.includes(2));assert.equal(c.flight.phase,'return');assert.ok(crew.every(a=>a.away));c.flight.remaining=1;const food=s.food,remaining=c.flight.cargo.food;idle(s);assert.equal(c.flight,null);assert.ok(crew.every(a=>!a.away));assert.equal(crew[0].skills.research,skill+5);assert.ok(s.food>food&&s.food<food+remaining);assert.equal(worldPopulation(s),12);validateSave(s);
});
test('colonies contain the real crew and consume supplied habitat materials, without free founders or houses',()=>{
 const s=advanced(),crew=flight(s,'colony',1),ids=crew.map(a=>a.id),c=s.world.settlements[0];crew[0].skills.wood=88;idle(s);const child=s.world.settlements.find(c=>c.colony);assert.ok(child);assert.equal(c.flight,null);assert.equal(child.state.agents.length,3);assert.ok(ids.every(id=>!s.agents.some(a=>a.id===id)&&child.state.agents.some(a=>a.id===id)));assert.equal(child.state.agents[0].skills.wood,88);assert.equal(child.state.buildings.hut,0);assert.equal(child.state.buildings.habitat,1);assert.equal(child.state.industry.alloy,0);assert.equal(child.state.industry.metal,0);assert.equal(child.state.wood,95);assert.equal(child.state.stone,75);assert.equal(child.state.totalSteps,0);assert.equal(worldPopulation(s),12);validateSave(s);
});
test('a crew death during arrival is counted once and cannot leave an orphan away status',()=>{
 const s=advanced(),crew=flight(s,'colony',1);crew[0].health=0;crew[0].stash.wood=2;idle(s);assert.equal(s.deathCount,1);assert.equal(worldPopulation(s),11);assert.equal(crew[0].away,false);assert.equal(crew[0].stash.wood,0);assert.equal(s.world.settlements.find(c=>c.colony).state.wood,97);validateSave(s);
});
test('immigration transfers a real citizen, supplies, equipment and foreign memories rather than generating people',()=>{
 const s=advanced(),home=s.world.settlements[0],other=s.world.settlements[1],a=s.agents[0];other.planet=0;other.explored=[];other.species='human';other.x=1000;other.y=900;other.state.buildings.hut=3;other.state.food=100;home.contacts=[other.id];other.contacts=[home.id];home.relations[other.id]=other.relations[home.id]=10;s.harmony=10;a.skills.wood=77;a.stash.food=4;a.memories=[{who:2,name:s.agents[1].name,kind:'theft',day:0}];const design={head:'stone',handle:'wood',binding:'fiber',shape:'blade'},physics=evaluateDesign(design);s.tools.push({id:s.nextToolId++,maker:a.id,owner:a.id,job:'wood',design,physics,name:'Kapak',condition:physics.durability,status:'ready',createdDay:0,testedDay:0,measured:.2,uses:0});a.equipment.wood=1;const count=worldPopulation(s);tickWorld(s,{tick:t=>{act(t,t.agents[0],'rest');if(t===s)t._turn.migrant=a.id;},newGame,log,resolveDeaths});const immigrant=other.state.agents.find(p=>p.origin==='immigrant');assert.ok(immigrant);assert.equal(immigrant.skills.wood,77);assert.equal(immigrant.stash.food,4);assert.equal(immigrant.memories[0].scope,home.id);assert.ok(other.state.tools.some(t=>t.owner===immigrant.id));assert.equal(s.tools.length,0);assert.equal(a.exitReason,'emigration');assert.equal(s.deathCount,0);assert.equal(s.emigrationCount,1);assert.equal(other.state.immigrationCount,1);assert.equal(worldPopulation(s),count);validateSave(s);
});
test('version four migration preserves learning and refunds only old flights lacking a real crew',()=>{
 const s=advanced(),c=s.world.settlements[0];s.version=4;c.flight={destination:1,remaining:10};s.agents[0].q['0:0:0:0:0:balanced']={wood:9};s.agents[0].visits['0:0:0:0:0:balanced']=2;const restored=validateSave(s);assert.equal(restored.version,11);assert.equal(restored.world.settlements[0].flight,null);assert.equal(restored.industry.alloy,25);assert.equal(restored.industry.fuel,40);assert.equal(restored.industry.energy,50);assert.equal(restored.agents[0].q['0:0:0:0:0:balanced'].wood,9);assert.equal(validateSave(restored).industry.alloy,25);
});
test('tampered crew, mismatched calendars and fabricated mission costs are rejected',()=>{
 const s=advanced();flight(s);const corrupt=structuredClone(s);corrupt.world.settlements[0].flight.crew=[999,1000];assert.throws(()=>validateSave(corrupt));const clock=structuredClone(s);clock.world.settlements[1].state.day=2;assert.throws(()=>validateSave(clock));const costs=advanced();costs.world.settlements[0].ship={kind:'survey',destination:2,cost:{alloy:1},progress:0,required:80};assert.throws(()=>validateSave(costs));
});

test('new need-aware states inherit old learned values without overwriting the original model',()=>{
 const a=newGame(2,0).agents[0];const old=row(a,'0:0:0:0:0:balanced');old.wood=9;const current=row(a,'0:0:0:0:0:materials:balanced');assert.equal(current.wood,9);current.wood=12;assert.equal(old.wood,9);assert.equal(row(a,'0:0:0:0:0:materials:balanced').wood,12);assert.equal(current.assembleShip,0);
});
