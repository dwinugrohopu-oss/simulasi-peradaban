export const BEDS={hut:3,habitat:4};
export function housingCapacity(s){return s.buildings.hut*BEDS.hut+s.buildings.habitat*BEDS.habitat;}
export function assignHousing(s){
 const slots=new Map();for(const [kind,beds]of Object.entries(BEDS))for(let building=1;building<=s.buildings[kind];building++)for(let bed=1;bed<=beds;bed++)slots.set(kind+':'+building+':'+bed,{kind,building,bed});
 for(const a of s.agents){const key=a.home&&a.home.kind+':'+a.home.building+':'+a.home.bed;if(a.alive&&slots.has(key))slots.delete(key);else a.home=null;}
 const free=[...slots.values()];for(const a of s.agents)if(a.alive&&!a.home&&free.length)a.home=free.shift();
}
export function sheltered(a){return !!a.home&&!a.journey&&!a.away;}
export function housingDay(s,random,log){
 assignHousing(s);
 for(const a of s.agents.filter(a=>a.alive&&!a.away)){
  const indoors=sheltered(a);if(!indoors){a.mood=Math.max(0,a.mood-.35);a.health=Math.max(0,a.health-.06);}
  if(a.illnessDays>0){a.illnessDays--;a.health=Math.max(0,a.health-.15);}
  else if(random(s)<(indoors?.002:.012)){a.illnessDays=4+Math.floor(random(s)*4);a.health=Math.max(0,a.health-1);a.mood=Math.max(0,a.mood-2);log(s,a.name+' sakit'+(indoors?'.':' setelah tinggal atau tidur di luar.'));}
 }
}
export function validateHousing(s,finite){
 const occupied=new Set();for(const a of s.agents){if(!Number.isInteger(a.illnessDays)||!finite(a.illnessDays,0,30))throw Error('Kondisi sakit tidak valid.');if(a.home===null)continue;
  const h=a.home,key=h&&h.kind+':'+h.building+':'+h.bed;
  if(!h||!Object.hasOwn(BEDS,h.kind)||!Number.isInteger(h.building)||!finite(h.building,1,s.buildings[h.kind])||!Number.isInteger(h.bed)||!finite(h.bed,1,BEDS[h.kind])||occupied.has(key)||!a.alive)throw Error('Penempatan rumah tidak valid.');occupied.add(key);
 }
}
