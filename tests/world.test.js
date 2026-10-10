import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,tick,validateSave,applyObject,log,population,worldPopulation} from '../engine.js';
import {tickWorld,stateOf,discoveryStatus} from '../world.js';
import {localDraft,validateDescriptor} from '../world-schema.js';
import {camera,project,unproject,zoom,pan,focus,hit} from '../map.js';
function step(s,n=1){for(let i=0;i<n;i++){s.day++;tickWorld(s,{tick:()=>true,newGame,log});}}
function quiet(seed=23){const s=newGame(seed,0);for(const c of s.world.settlements)for(const a of stateOf(s,c).agents)a.action='rest';return s;}
function researcher(s){const a=s.agents[0];a.action='research';a.skills.research=30;a.arcaneSensitivity=90;return a;}
test('alien population and latent magic sources exist from the beginning and all settlements persist',()=>{
 const s=newGame(1,0);assert.equal(s.world.settlements.length,2);const alien=s.world.settlements[1];assert.equal(alien.species,'alien');assert.equal(alien.state.agents.length,6);assert.notEqual(alien.state.rng,s.rng);assert.equal(alien.magic,false);assert.equal(s.world.settlements[0].magic,false);assert.equal(s.world.contacts,0);assert.equal(s.world.sources.length,2);assert.deepEqual(validateSave(s),s);const old=alien.state.day;tick(s);assert.equal(alien.state.day,old+1);
});
test('discovery requires expertise, prerequisites, physical achievements and affordable materials',()=>{
 const s=quiet(),c=s.world.settlements[0];s.tech=2000;s.buildings.farm=1;s.wood=100;s.stone=100;assert.equal(discoveryStatus(s,c,'agriculture').ready,false);const a=researcher(s);assert.equal(discoveryStatus(s,c,'agriculture').ready,true);const wood=s.wood;step(s);assert.ok(c.discoveries.includes('agriculture'));assert.equal(s.wood,wood-8);assert.ok(!c.discoveries.includes('metallurgy'));s.experiments=2;s.wood=0;step(s);assert.ok(!c.discoveries.includes('metallurgy'));s.wood=30;step(s);assert.ok(c.discoveries.includes('metallurgy'));assert.equal(s.stone,75);a.skills.research=0;step(s,10);assert.ok(!c.discoveries.includes('mechanics'));assert.equal(c.stage,2);
});
test('magic is discovered by sustained qualified observation, used for healing, and not unlocked by a prompt alone',()=>{
 const s=quiet(),c=s.world.settlements[0],a=researcher(s);s.tech=40;a.arcaneSensitivity=74;step(s,40);assert.equal(c.magicProgress,0);a.arcaneSensitivity=90;a.skills.research=19;step(s,10);assert.equal(c.magic,false);a.skills.research=30;step(s,29);assert.equal(c.magic,false);step(s);assert.equal(c.magic,true);a.health=70;step(s,5);assert.ok(a.health>70);const blocked=quiet();applyObject(blocked,localDraft('sihir'));step(blocked,50);assert.equal(blocked.world.settlements[0].magic,false);
});
test('an autonomous split transfers people, private belongings, learned skills and communal supplies',()=>{
 const s=quiet(),c=s.world.settlements[0];s.food=1000;s.wood=1000;s.stone=1000;s.harmony=10;c.grievance=40;for(const a of s.agents){a.reputation=10;a.mood=10;a.skills.wood=77;}const total=worldPopulation(s),before=s.food;step(s);assert.equal(s.world.splits,1);const separated=s.world.settlements[2];assert.equal(separated.planet,0);assert.equal(separated.state.agents.length,2);assert.equal(population(s).length,4);assert.equal(worldPopulation(s),total);assert.equal(s.food+separated.state.food,before);assert.equal(separated.state.agents[0].skills.wood,77);assert.notEqual(separated.state,s);assert.ok(c.contacts.includes(separated.id));validateSave(s);
});
test('war follows hostility and logistics, causes losses, then reaches a ceasefire',()=>{
 const s=quiet(),c=s.world.settlements[0];s.food=s.wood=s.stone=1000;s.harmony=10;c.grievance=40;for(const a of s.agents)a.reputation=10;step(s);const rival=s.world.settlements[2];applyObject(s,localDraft('perang'));step(s,2);assert.equal(s.world.wars,1);assert.equal(c.war.against,rival.id);const health=s.agents.reduce((n,a)=>n+a.health,0),food=s.food;step(s,10);assert.ok(s.agents.reduce((n,a)=>n+a.health,0)<health);assert.ok(s.food<food);step(s,35);assert.equal(c.war,null);assert.equal(rival.war,null);validateSave(s);
});
test('a new LLM resource is finite, gathered, consumed, and has real economic and health effects',()=>{
 const s=quiet(),a=s.agents[0];a.action='stone';const d={...localDraft('kristal resource'),name:'Aether',resourceKey:'aether',energy:3,research:2,toxicity:5,arcane:2};applyObject(s,d);const r=s.customResources[0],stock=r.stock,health=a.health;step(s,10);assert.ok(r.stock<stock);assert.ok(r.amount>0);assert.ok(s.industry.energy>0);assert.ok(s.tech>0);assert.ok(a.health<health);assert.ok(s.industry.mana>0);assert.throws(()=>applyObject(s,d));assert.throws(()=>validateDescriptor({...d,toxicity:Infinity}));assert.throws(()=>validateDescriptor({...d,resourceKey:'__proto__'}));validateSave(s);
});
test('custom event waits for its specified trigger, applies bounded effects and expires',()=>{
 const s=quiet(),d={...localDraft('festival'),event:'custom',name:'Badai ion',trigger:'advanced',effect:'energy',magnitude:3,duration:10};applyObject(s,d);step(s,5);assert.equal(s.world.events[0].active,false);assert.equal(s.industry.energy,0);s.world.settlements[0].stage=4;step(s);assert.equal(s.world.events[0].active,true);assert.ok(Math.abs(s.industry.energy-.6)<1e-8);step(s,9);assert.equal(s.world.events.length,0);assert.ok(Math.abs(s.industry.energy-6)<1e-8);validateSave(s);
});
test('radio contact cannot occur until both species have astronomy, electronics and observations',()=>{
 const s=quiet(),a=s.world.settlements[0],b=s.world.settlements[1];applyObject(s,localDraft('alien kontak'));step(s);assert.equal(s.world.contacts,0);a.discoveries=['astronomy','electronics'];b.discoveries=['astronomy'];b.signalProgress=100;step(s);assert.equal(s.world.contacts,0);b.discoveries.push('electronics');step(s);assert.equal(s.world.contacts,1);assert.ok(a.contacts.includes(b.id));assert.ok(b.contacts.includes(a.id));
});
test('natural production and research can reach spaceflight and establish colonies',()=>{
 const s=newGame(1,0);for(let i=0;i<4500;i++)tick(s);assert.ok(s.world.settlements.some(c=>c.discoveries.includes('spaceflight')));assert.ok(s.world.contacts>0);assert.ok(s.world.colonies>0);assert.ok(s.world.settlements.every(c=>stateOf(s,c).industry.fuel>=0));assert.ok(s.world.settlements.length<=8);validateSave(s);
});
test('world simulation continues after original settlement dies; pause freezes every civilization',()=>{
 const s=newGame(42,0);for(const a of s.agents){a.alive=false;a.exitReason='death';}const alien=s.world.settlements[1].state;assert.equal(tick(s),true);assert.equal(alien.day,1);s.paused=true;const before=JSON.stringify(s);assert.equal(tick(s),false);assert.equal(JSON.stringify(s),before);
});
test('v3 migration preserves tools, money-equivalent supplies, ages and Q models; nested worlds reject',()=>{
 const s=newGame(2,0);for(let i=0;i<80;i++)tick(s);s.version=3;delete s.world;delete s.industry;delete s.customResources;for(const a of s.agents)delete a.arcaneSensitivity;const restored=validateSave(s);assert.equal(restored.version,4);for(const k of ['food','wood','stone','tech','tools','day'])assert.deepEqual(restored[k],s[k]);assert.deepEqual(restored.agents[0].q,s.agents[0].q);assert.equal(restored.agents[0].age,s.agents[0].age);assert.equal(restored.world.settlements[1].species,'alien');const bad=newGame(2,0);bad.world.settlements[1].state.world={settlements:[]};assert.throws(()=>validateSave(bad));const badResource=newGame(3,0);applyObject(badResource,localDraft('besi resource'));badResource.customResources[0].amount=-1;assert.throws(()=>validateSave(badResource));
});
test('pan, anchored zoom, camera limits, planet switching and settlement hit tests',()=>{
 const c=camera(),s=newGame(1,0),before=unproject(c,220,130);zoom(c,2,220,130);const after=unproject(c,220,130);assert.ok(Math.abs(before.x-after.x)<1e-8);assert.ok(Math.abs(before.y-after.y)<1e-8);pan(c,100,0);assert.ok(c.x<before.x+1000);zoom(c,1e10);assert.equal(c.zoom,2.5);zoom(c,1e-10);assert.equal(c.zoom,.18);focus(c,s.world.settlements[1]);assert.equal(c.planet,1);const p=project(c,1700,900);assert.equal(hit(s,c,p.x,p.y).id,2);c.layer='space';const planet=project(c,800,900);assert.equal(hit(s,c,planet.x,planet.y).id,0);
});
