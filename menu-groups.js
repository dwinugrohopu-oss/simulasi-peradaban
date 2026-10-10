import {stateOf} from './world.js';

// Fixed geographical districts make membership stable as nearby towns develop.
// A district is scoped to a government and planet; neither stocks nor people move.
export function administrativeRegion(world,civ){
 const east=civ.x>=1600,south=civ.y>=1000,direction=south?(east?'Tenggara':'Barat Daya'):(east?'Timur Laut':'Barat Laut');
 return {id:civ.planet+':'+Number(east)+':'+Number(south),name:'Daerah '+direction+' · '+world.planets[civ.planet].name};
}
export function settlementGroups(root){
 const groups=new Map();
 for(const civ of root.world.settlements){
  const leader=root.world.settlements.find(c=>c.id===civ.polityId)||civ,group=groups.get(leader.id)||{id:leader.id,leader,regions:[],members:[],population:0};
  const district=administrativeRegion(root.world,civ);let region=group.regions.find(r=>r.id===district.id);
  if(!region){region={...district,members:[],population:0};group.regions.push(region);}
  const count=stateOf(root,civ).agents.filter(a=>a.alive).length;
  region.members.push(civ);region.population+=count;group.members.push(civ);group.population+=count;groups.set(group.id,group);
 }
 return [...groups.values()];
}
