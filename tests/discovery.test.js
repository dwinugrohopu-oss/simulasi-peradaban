import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,available,validateSave,random,log,tick} from '../engine.js';
import {evaluateDesign,experiment,useTool,designCost} from '../physics.js';
import {deposit,interact,remember,revengeTarget,cooperation} from '../society.js';
const good={head:'stone',handle:'wood',binding:'fiber',shape:'blade'};
test('material, shape and joint affect useful output and prototype costs are conserved',()=>{
 const strong=evaluateDesign(good),weak=evaluateDesign({...good,binding:'none'});assert.ok(strong.gain.wood>weak.gain.wood);assert.ok(strong.durability>weak.durability);assert.ok(evaluateDesign({...good,shape:'pick'}).gain.stone>strong.gain.stone);
 const s=newGame(2,0),a=s.agents[0];s.wood=s.stone=s.bone=s.fiber=100;experiment(s,a,{random:()=>.1,log});assert.equal(s.tools.length,1);for(const [key,cost]of Object.entries(designCost(s.tools[0].design)))assert.equal(s[key],100-cost);assert.equal(s.tools[0].status,'prototype');
});
test('successful trials equip a tool, increase actual work and wear until breakage',()=>{
 const s=newGame(3,0),a=s.agents[0],physics=evaluateDesign(good);s.tools.push({id:1,owner:a.id,job:'wood',design:good,physics,name:'Kapak percobaan',condition:physics.durability,status:'prototype',createdDay:0,testedDay:null,measured:null,uses:0});s.nextToolId=2;s.prototypes=1;
 assert.equal(experiment(s,a,{random:()=>.5,log}),4);assert.equal(a.equipment.wood,1);const plain=structuredClone(s);plain.agents[0].equipment={};const before=s.wood;act(s,a,'wood');act(plain,plain.agents[0],'wood');assert.ok(s.wood-before>plain.wood-before);assert.equal(s.tools[0].uses,1);
 while(s.tools[0].condition>0)useTool(s,a,'wood',{random:()=>1,log});assert.equal(s.tools[0].status,'broken');assert.equal(a.equipment.wood,undefined);validateSave(s);
});
test('selfish ownership conserves resources and remembered theft enables one revenge',()=>{
 const s=newGame(4,0),a=s.agents[0],b=s.agents[1];a.traits=['selfish','diligent'];const old=s.food;deposit(s,a,'food',10);assert.equal(s.food+a.stash.food,old+10);assert.equal(a.stash.food,2.5);
 const all=s.food+s.agents.reduce((n,b)=>n+b.stash.food,0);interact(s,a,'steal',{random:()=>.9,log});assert.equal(s.food+s.agents.reduce((n,b)=>n+b.stash.food,0),all);const victim=s.agents.find(b=>b.memories.some(m=>m.kind==='theft'));assert.ok(victim);assert.equal(victim.relations[a.id],-20);assert.ok(a.reputation<50);
 victim.traits=['vengeful','diligent'];assert.equal(revengeTarget(s,victim),a);const health=a.health;interact(s,victim,'revenge',{random,log});assert.ok(a.health<health);assert.equal(revengeTarget(s,victim),null);
 remember(b,a,'theft',0,-90);assert.ok(cooperation(s,b)<1);validateSave(s);
});
test('negative actions respect age, personal capacity and conflict cooldown',()=>{
 const s=newGame(7,0),a=s.agents[0];a.traits=['aggressive','greedy'];assert.ok(available(s,a).includes('intimidate'));act(s,a,'intimidate');assert.ok(!available(s,a).includes('intimidate'));a.stash.food=30;assert.ok(!available(s,a).includes('steal'));a.age=4;assert.ok(!available(s,a).includes('steal'));assert.ok(!available(s,a).includes('intimidate'));
});
test('version two migration preserves state and Q values while malformed tools reject',()=>{
 const s=newGame(9,0);act(s,s.agents[0],'wood');s.version=2;s.agents[0].q={'0:0:0:0:0:balanced':Object.fromEntries(Object.keys(s.agents[0].skills).slice(0,10).map(k=>[k,7]))};const restored=validateSave(s);assert.equal(restored.version,3);assert.equal(restored.wood,s.wood);assert.equal(restored.agents[0].q['0:0:0:0:0:balanced'].wood,7);assert.equal(restored.agents[0].q['0:0:0:0:0:balanced'].steal,0);
 const bad=newGame(2,0);bad.agents[0].stash.food=31;assert.throws(()=>validateSave(bad));bad.agents[0].stash.food=0;bad.agents[0].equipment.wood=999;assert.throws(()=>validateSave(bad));
});
test('autonomous research yields tested, used tools rather than only knowledge',()=>{
 const s=newGame(17,0);for(let i=0;i<1500;i++)tick(s);assert.ok(s.experiments>0);assert.ok(s.tools.some(t=>t.uses>0));assert.ok(s.tools.length<=100);validateSave(s);
});
