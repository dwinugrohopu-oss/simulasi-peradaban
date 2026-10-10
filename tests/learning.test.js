import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,tick,act,observation,available,row,learn,creditJourney,selectAction,validateSave,resolveDeaths,autoPlan,worldPopulation} from '../engine.js';
import {gatherTarget} from '../frontier.js';
import {stateOf} from '../world.js';
function step(s,a,key){const state=observation(s,a),travelling=!!a.journey,health=a.health,reward=act(s,a,key);creditJourney(s,a,state,key,reward,travelling,health);learn(a,state,key,reward,observation(s,a),available(s,a),!a.alive);return reward;}
test('observations distinguish shelter, health, farms, depleted food and journey provisions',()=>{
 const s=newGame(1,0),a=s.agents[0],initial=observation(s,a);a.health=30;assert.notEqual(observation(s,a),initial);a.health=100;s.buildings.farm=1;assert.notEqual(observation(s,a),initial);s.buildings.farm=0;gatherTarget(s,'food').stock=2;assert.notEqual(observation(s,a),initial);step(s,a,'forage');const packed=observation(s,a);a.journey.provisions=0;assert.notEqual(observation(s,a),packed);
});
test('travellers eat only food they carry, can combine small portions, rest and turn back',()=>{
 const s=newGame(3,0),a=s.agents[0];step(s,a,'wood');s.food=100;a.journey.provisions=0;a.stash.food=0;a.hunger=90;assert.ok(!available(s,a).includes('eat'));a.journey.provisions=.4;a.journey.cargo.food=.6;assert.deepEqual(available(s,a),['eat']);const food=s.food;step(s,a,'eat');assert.equal(s.food,food);assert.equal(a.journey.provisions+a.journey.cargo.food,0);assert.ok(a.hunger<60);a.energy=0;assert.deepEqual(available(s,a),['rest']);step(s,a,'rest');assert.ok(a.energy>0);a.health=30;assert.ok(available(s,a).includes('returnHome'));step(s,a,'returnHome');assert.equal(a.journey.phase,'return');
});
test('empty journeys credit the initiating action; experience changes preference beyond the rules',()=>{
 const s=newGame(7,0),a=s.agents[0];s.buildings.farm=1;a.traits=['frugal','sociable'];s.food=0;a.steps=100000;const initial=observation(s,a);let untrained=0;for(let i=0;i<200;i++)if(selectAction(s,a,initial)==='farm')untrained++;
 let start;
 for(let attempt=0;attempt<20;attempt++){
  s.food=0;a.stash.food=0;a.hunger=15;a.energy=90;a.health=100;const node=s.world.nodes.find(n=>n.planet===0&&n.kind==='food');node.stock=100;start=observation(s,a);step(s,a,'forage');node.stock=0;
  let days=0;while(a.journey&&days++<30)step(s,a,'travel');assert.equal(a.journey,null);assert.equal(a.tripCredit,null);
  s.food=0;a.hunger=15;a.energy=90;a.health=100;node.stock=100;step(s,a,'farm');s.day++;
 }
 assert.ok(a.q[start].forage<0);assert.ok(a.q[start].farm>a.q[start].forage+5);s.food=0;a.hunger=15;a.energy=90;a.health=100;a.steps=100000;
 let farms=0;for(let i=0;i<200;i++)if(selectAction(s,a,start)==='farm')farms++;assert.ok(farms>175,`learned farmer chosen ${farms}/200`);assert.ok(farms>untrained+50,`learned ${farms}, rules alone ${untrained}`);
});
test('journey credit survives saving and death settles it once',()=>{
 const s=newGame(9,0),a=s.agents[0];step(s,a,'wood');const restored=validateSave(s);assert.deepEqual(restored.agents[0].tripCredit,a.tripCredit);const b=restored.agents[0],key=b.tripCredit.state;b.health=0;resolveDeaths(restored);assert.equal(b.tripCredit,null);const value=b.q[key].wood;assert.ok(value<0);resolveDeaths(restored);assert.equal(b.q[key].wood,value);
 for(const edit of [p=>p.days=-1,p=>p.reward=Infinity,p=>p.state='invalid',p=>p.action='invalid']){const bad=structuredClone(s);edit(bad.agents[0].tripCredit);assert.throws(()=>validateSave(bad));}
});
test('version8 Q values and mid-journey cargo migrate without inventing delayed credit',()=>{
 const s=newGame(11,0),a=s.agents[0];step(s,a,'wood');s.version=8;for(const c of s.world.settlements){const st=stateOf(s,c);st.version=8;for(const b of st.agents){delete b.tripCredit;delete b.skills.returnHome;for(const r of Object.values(b.q))delete r.returnHome;}}
 const key=Object.keys(a.q)[0],old=a.q[key].wood,restored=validateSave(s);assert.equal(restored.version,11);assert.equal(restored.agents[0].q[key].wood,old);assert.equal(restored.agents[0].q[key].returnHome,0);assert.deepEqual(restored.agents[0].journey,a.journey);assert.equal(restored.agents[0].tripCredit,null);
});
test('food scarcity plans an affordable farm before storage; blocked priorities permit another project',()=>{
 const s=newGame(12,0);s.food=0;s.wood=25;s.stone=5;autoPlan(s);assert.equal(s.project.key,'farm');const t=newGame(13,0);t.buildings.warehouse=1;t.buildings.farm=1;t.food=100;t.wood=35;t.stone=10;autoPlan(t);assert.equal(t.project.key,'hut');
});
test('sparse minimal-ration villages survive500 days across the regression seeds',()=>{
 for(const seed of [1,2,42,101]){const s=newGame(seed,0);for(let i=0;i<500;i++)tick(s);validateSave(s);assert.ok(s.world.settlements.every(c=>stateOf(s,c).agents.some(a=>a.alive)),`seed ${seed} villages survived`);assert.ok(worldPopulation(s)>=30);assert.ok(s.world.beasts.some(b=>b.species==='deer'&&b.health===0),`seed ${seed} hunted prey autonomously`);assert.ok(s.world.settlements.some(c=>stateOf(s,c).agents.some(a=>a.skills.hunt>0)));assert.ok(s.world.settlements.filter(c=>stateOf(s,c).buildings.farm>0).length>=3);}
});

test('a delivered material load rewards the decision to leave',()=>{
 const s=newGame(15,0),a=s.agents[0];s.food=0;const state=observation(s,a),wood=s.wood;step(s,a,'wood');let days=0;while(a.journey&&days++<30)step(s,a,'travel');assert.equal(a.journey,null);assert.ok(s.wood+a.stash.wood>wood);assert.ok(a.q[state].wood>0);
});
