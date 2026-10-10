// Existing balances stay authoritative. Warehouse capacity protects part of each stock;
// overflow remains on the ground and can still be consumed or used for construction.
export const STORAGE_CAPACITY={food:300,wood:500,stone:500,ore:300,fiber:150,bone:100,metal:250,fuel:250,alloy:200};
export const GROUND_DECAY={food:.04,wood:.006,stone:.0005,ore:.0005,fiber:.015,bone:.01,metal:.002,fuel:.01,alloy:.001};
export const EQUIPMENT_CAPACITY=40;
const balance=(s,key)=>Object.hasOwn(s.industry,key)?s.industry[key]:s[key];
export function storageSplit(s,key,amount=balance(s,key)){
 if(!Object.hasOwn(STORAGE_CAPACITY,key))return {stored:amount,ground:0,capacity:null};
 const capacity=s.buildings.warehouse*STORAGE_CAPACITY[key],stored=Math.min(amount,capacity);return {stored,ground:Math.max(0,amount-stored),capacity};
}
export function customStorage(s,r){const capacity=s.buildings.warehouse*150,stored=Math.min(r.amount,capacity);return {stored,ground:r.amount-stored,capacity};}
export function equipmentStorage(s){
 const carriedTools=new Set(s.agents.filter(a=>a.alive).flatMap(a=>['wood','stone','farm'].filter(k=>a.action===k||a.journey||a.away).map(k=>a.equipment[k]).filter(Boolean))),carriedWeapons=new Set(s.agents.filter(a=>a.alive).filter(a=>a.action==='defend'||a.journey||a.away).map(a=>a.equipment.weapon)),leased=new Set(s.agents.filter(a=>a.alive&&a.journey).map(a=>a.journey.vehicle));
 let remaining=s.buildings.warehouse*EQUIPMENT_CAPACITY;const stored={tools:new Set(),weapons:new Set(),vehicles:new Set()},carried={tools:carriedTools,weapons:carriedWeapons,vehicles:leased};
 for(const category of ['tools','weapons','vehicles'])for(const item of s[category])if(item.condition>0&&(!item.status||['ready','prototype'].includes(item.status))&&!carried[category].has(item.id)&&remaining>0){stored[category].add(item.id);remaining--;}
 return {stored,carried,capacity:s.buildings.warehouse*EQUIPMENT_CAPACITY};
}
export function storageDay(s,log){
 const ecology=s._context?.civ.discoveries.includes('closedEcology')||s.world?.settlements[0].discoveries.includes('closedEcology');
 const losses={};for(const [key,rate]of Object.entries(GROUND_DECAY)){const {stored,ground}=storageSplit(s,key),lost=(ground*rate+stored*(key==='food'?.002:0))*(key==='food'&&ecology?.5:1);if(lost>0){if(Object.hasOwn(s.industry,key))s.industry[key]-=lost;else s[key]-=lost;losses[key]=lost;}}
 for(const r of s.customResources){const {ground,stored}=customStorage(s,r),rate=r.category==='food'?.04:r.category==='medicine'?.02:.002;r.amount-=(ground*rate+stored*(r.category==='food'?.002:0))*(r.category==='food'&&ecology?.5:1);}
 for(const a of s.agents.filter(a=>a.alive))for(const key of ['food','wood','stone'])a.stash[key]*=1-(key==='food'?.01:GROUND_DECAY[key]);
 const locations=equipmentStorage(s);let damaged=0;
 for(const category of ['tools','weapons','vehicles'])for(const item of s[category]){
  if(item.condition<=0||item.status&&!['ready','prototype'].includes(item.status))continue;
  const held=locations.carried[category].has(item.id),protectedItem=locations.stored[category].has(item.id);
  const max=category==='tools'?item.physics.durability:100,rate=protectedItem?.0001:held?.001:.006;
  const resistance=category==='tools'?(['metal','alloy'].includes(item.design.head)?.6:1):item.type==='ballistic'||item.type==='motor'?.8:1;
  item.condition=Math.max(0,item.condition-max*rate*resistance);
  if(item.condition===0){damaged++;if(category==='tools')item.status='broken';if(category==='weapons')item.owner=null;
   for(const a of s.agents){
    if(category==='tools')for(const slot of ['wood','stone','farm'])if(a.equipment[slot]===item.id)delete a.equipment[slot];
    if(category==='weapons'&&a.equipment.weapon===item.id)delete a.equipment.weapon;
    if(category==='vehicles'&&a.journey?.vehicle===item.id){const j=a.journey;j.vehicle=null;j.speed=100;j.amount=Math.min(16,j.amount);if(['outbound','return'].includes(j.phase)){const target=j.phase==='return'?(s._context?.civ||s.world?.settlements[0]):j.target;j.remaining=j.total=Math.max(1,Math.ceil(Math.hypot(target.x-j.position.x,target.y-j.position.y)/100));}}
   }
  }
 }
 if(damaged)log(s,damaged+' peralatan rusak karena paparan saat penyimpanan atau dibawa.');
 if(s.day%30===0&&Object.values(losses).reduce((n,v)=>n+v,0)>=1)log(s,'Sebagian persediaan rusak atau hilang; bangun gudang untuk melindungi tumpukan di tanah.');
 return losses;
}
