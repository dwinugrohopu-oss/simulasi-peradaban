import {assignHousing} from '../shelter.js';
import {bindWorld} from '../world.js';
import {initFrontier} from '../frontier.js';
import {newGame as create} from '../engine.js';
// Established scenarios use two settlements and abundant deposits to isolate their mechanic.
export function legacyWorld(seed,now,options={}){
 const s=create(seed,now,options);if(!s.world)return s;
 s.agents=s.world.settlements.filter(c=>c.species==='human').flatMap(c=>c.state?c.state.agents:s.agents);s.world.settlements=s.world.settlements.slice(0,2);s.world.nextId=3;s.food=10;
 const hash=(n)=>(Math.imul((s.seed^Math.imul(n,2654435761))>>>0,2246822507)>>>0);const w=s.world;w.nodes=[];w.claims=undefined;
 for(let planet=0;planet<3;planet++){const base=w.settlements.find(c=>c.planet===planet)||{x:1500,y:1000},near=[[95,40],[-110,70],[120,-90],[-160,-130],[250,10],[-50,-180]];for(let i=0;i<36;i++){const kind=['food','wood','stone','ore','wood','ore'][i%6],id=w.nodes.length+1,x=i<6?base.x+near[i][0]:220+(i%5)*550+(hash(id)%81),y=i<6?base.y+near[i][1]:150+Math.floor((i-6)/5)*300+(hash(id+500)%81),capacity=kind==='food'?1800:kind==='wood'?3500:kind==='ore'?2600:3000;w.nodes.push({id,planet,kind,x:Math.max(20,Math.min(3180,x)),y:Math.max(20,Math.min(1980,y)),stock:capacity,capacity,renewal:kind==='food'?.4:kind==='wood'?.08:0,owner:null,seenBy:[]});}}
 bindWorld(s);initFrontier(s);return s;
}
export function newGame(seed,now,options={}){const s=legacyWorld(seed,now,options);for(const t of [s,...(s.world?s.world.settlements.filter(c=>c.state).map(c=>c.state):[])])if(!options.empty){t.agents=t.agents.slice(0,6);t.nextId=7;t.food=65;t.wood=30;t.stone=15;t.fiber=8;t.bone=4;t.buildings.hut=2;t.buildings.warehouse=1;t.buildings.farm=0;assignHousing(t);}return s;}
