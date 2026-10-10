import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../engine.js';
import {administrativeRegion,settlementGroups} from '../menu-groups.js';
test('administrative districts group each settlement exactly once under its government and geographical planet quadrant',()=>{
 const s=newGame(4,0),before=structuredClone(s);s.world.settlements[2].polityId=1;s.world.settlements[3].polityId=1;s.world.settlements[1].polityId=1;
 const snapshot=structuredClone(s),groups=settlementGroups(s),group=groups.find(g=>g.id===1);
 assert.equal(group.members.length,4);assert.equal(group.regions.length,4);assert.equal(group.population,35);
 assert.deepEqual(groups.flatMap(g=>g.regions.flatMap(r=>r.members.map(c=>c.id))).sort((a,b)=>a-b),[1,2,3,4,5]);
 assert.deepEqual(s,snapshot);assert.equal(before.food,s.food);assert.ok(group.regions.every(r=>r.name.startsWith('Daerah ')));
});
test('district membership follows location and cannot mix planets or independent governments',()=>{
 const s=newGame(5,0),a=s.world.settlements[0],b=s.world.settlements[2];
 b.x=a.x+100;b.y=a.y+100;assert.equal(administrativeRegion(s.world,a).id,administrativeRegion(s.world,b).id);
 assert.notEqual(settlementGroups(s).find(g=>g.id===a.id),settlementGroups(s).find(g=>g.id===b.id));
 b.polityId=a.polityId;assert.equal(settlementGroups(s).find(g=>g.id===a.id).regions[0].members.length,2);
 b.planet=1;assert.notEqual(administrativeRegion(s.world,a).id,administrativeRegion(s.world,b).id);
 a.x=1600;a.y=1000;assert.ok(administrativeRegion(s.world,a).name.includes('Tenggara'));
});
