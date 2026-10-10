import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave,available} from '../engine.js';
import {equipmentWork,equipmentActions,equipWeapon,useWeapon,weaponUsable,WEAPONS} from '../equipment.js';
import {combatStats,wildlifeCombat,huntTarget} from '../wildlife.js';
import {startHunt,journeyWork} from '../frontier.js';
import {stateOf} from '../world.js';
const noop=()=>{};
function give(s,a,type,ammo=0){const w={id:s.nextWeaponId++,type,condition:100,uses:0,owner:null,...(WEAPONS[type].ammoCapacity?{ammo}:{})};s.weapons.push(w);equipWeapon(s,a);return w;}
test('bow costs materials, starts empty, refills finite arrows and learns only by actual use',()=>{
 const s=newGame(1,0),a=s.agents[0];s.buildings.warehouse=1;s.wood=30;s.fiber=12;s.stone=6;
 equipmentWork(s,a,'forgeWeapon',1,noop);const w=s.weapons[0];assert.equal(w.type,'bow');assert.equal(w.ammo,0);assert.equal(s.wood,16);assert.equal(s.fiber,4);assert.equal(weaponUsable(w),false);assert.equal(a.weaponPractice,undefined);
 assert.ok(equipmentActions(s,a).includes('reloadWeapon'));equipmentWork(s,a,'reloadWeapon',1,noop);assert.equal(w.ammo,12);assert.equal(s.wood,4);assert.equal(s.stone,3);assert.equal(s.fiber,1);assert.equal(a.weaponPractice,undefined);
 const attack=combatStats(s,a).attack;useWeapon(s,a);assert.equal(w.ammo,11);assert.equal(w.uses,1);assert.equal(a.weaponPractice.bow,1);assert.ok(w.condition<100);w.condition=100;assert.ok(combatStats(s,a).attack>attack);validateSave(s);
});
test('no remote refills or warehouse equipment teleport; empty ranged weapon gives no weapon damage or training',()=>{
 const s=newGame(2,0),a=s.agents[0];s.buildings.warehouse=1;s.wood=100;s.stone=100;s.fiber=100;s.food=20;const w=give(s,a,'bow',2);assert.ok(huntTarget(s,a));startHunt(s,a,noop);assert.ok(a.journey);
 const stock=s.wood;assert.ok(!equipmentActions(s,a).includes('reloadWeapon'));assert.equal(equipmentWork(s,a,'reloadWeapon',1,noop).reward,-1);assert.equal(s.wood,stock);
 give(s,s.agents[1],'laser',20);assert.equal(equipWeapon(s,a).id,w.id);useWeapon(s,a);useWeapon(s,a);assert.equal(w.ammo,0);a.journey.encounter=s.world.beasts.find(b=>b.species==='deer').id;assert.deepEqual(available(s,a),['flee']);const uses=w.uses,practice=a.weaponPractice.bow;assert.equal(useWeapon(s,a),null);assert.equal(w.uses,uses);assert.equal(a.weaponPractice.bow,practice);assert.equal(huntTarget(s,a),null);const empty=combatStats(s,a).attack;delete a.equipment.weapon;assert.equal(combatStats(s,a).attack,empty);
});
test('ranged hunting uses one arrow per strike, opening range protects hunter, and meat is awarded once',()=>{
 const s=newGame(3,0),a=s.agents[0];s.food=20;const w=give(s,a,'bow',12);startHunt(s,a,noop);let t=0;while(!a.journey.encounter&&t++<20)journeyWork(s,a,noop);assert.ok(a.journey.encounter);const beast=s.world.beasts.find(b=>b.id===a.journey.encounter),health=a.health;wildlifeCombat(s,a,'hunt',noop);assert.equal(w.ammo,11);assert.equal(a.weaponPractice.bow,1);assert.equal(a.health,health);while(a.journey.encounter&&t++<40)wildlifeCombat(s,a,'hunt',noop);assert.equal(beast.health,0);assert.equal(12-w.ammo,w.uses);assert.equal(a.weaponPractice.bow,w.uses);assert.equal(a.journey.cargo.food,8);wildlifeCombat(s,a,'hunt',noop);assert.equal(a.journey.cargo.food,8);validateSave(s);
});
test('advanced weapons need research and arsenal; settled citizens can upgrade a complete old inventory',()=>{
 const s=newGame(4,0),a=s.agents[0],c=s.world.settlements[0];s.buildings.warehouse=1;s.wood=s.stone=s.fiber=1000;s.industry.metal=s.industry.fuel=s.industry.alloy=s.industry.energy=1000;
 for(const citizen of s.agents)give(s,citizen,'stone');assert.ok(equipmentActions(s,a).includes('forgeWeapon'));equipmentWork(s,a,'forgeWeapon',1,noop);assert.equal(s.weapons.at(-1).type,'bow');
 c.discoveries.push('weaponry','metallurgy');s.buildings.arsenal=1;equipmentWork(s,a,'forgeWeapon',1,noop);assert.equal(s.weapons.at(-1).type,'sword');c.discoveries.push('ballistics');equipmentWork(s,a,'forgeWeapon',1,noop);assert.equal(s.weapons.at(-1).type,'grenade');c.discoveries.push('precisionEngineering');equipmentWork(s,a,'forgeWeapon',1,noop);assert.equal(s.weapons.at(-1).type,'cannon');c.discoveries.push('electronics');equipmentWork(s,a,'forgeWeapon',1,noop);assert.equal(s.weapons.at(-1).type,'laser');
});
test('ammunition and per-weapon training survive saves; old ballistic stock migrates empty without altering world',()=>{
 const s=newGame(5,0),a=s.agents[0];const w=give(s,a,'pistol',8);useWeapon(s,a);assert.deepEqual(validateSave(s),s);
 for(const corrupt of [s=>s.weapons[0].ammo=-1,s=>s.weapons[0].ammo=100,s=>s.weapons[0].ammo=.5,s=>delete s.weapons[0].ammo,s=>s.agents[0].weaponPractice.pistol=-1,s=>s.agents[0].weaponPractice.fake=1]){const bad=structuredClone(s);corrupt(bad);assert.throws(()=>validateSave(bad));}
 const old=newGame(6,0);give(old,old.agents[0],'ballistic',0);delete old.weapons[0].ammo;const nodes=structuredClone(old.world.nodes),beasts=structuredClone(old.world.beasts);for(const c of old.world.settlements){const st=stateOf(old,c);st.version=10;for(const a of st.agents){delete a.skills.reloadWeapon;for(const row of Object.values(a.q))delete row.reloadWeapon;}}
 const restored=validateSave(old);assert.equal(restored.version,11);assert.equal(restored.weapons[0].ammo,0);assert.equal(restored.agents[0].skills.reloadWeapon,0);assert.deepEqual(restored.world.nodes,nodes);assert.deepEqual(restored.world.beasts,beasts);assert.deepEqual(validateSave(restored),restored);
});
test('laser refills consume energy and heavy cannon reduces speed',()=>{const s=newGame(7,0),a=s.agents[0];s.buildings.warehouse=1;s.industry.energy=5;const w=give(s,a,'laser');equipmentWork(s,a,'reloadWeapon',1,noop);assert.equal(w.ammo,2);assert.equal(s.industry.energy,1);const speed=combatStats(s,a).speed;w.type='cannon';w.ammo=2;assert.ok(combatStats(s,a).speed<speed);});
