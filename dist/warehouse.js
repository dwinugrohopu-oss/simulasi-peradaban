import {storageSplit,customStorage,equipmentStorage} from './storage.js';
import {stateOf} from './world.js';
import {RESOURCE_KEYS,balance} from './economy.js';

export const STOCK_NAMES={food:'Pangan',wood:'Kayu',stone:'Batu',ore:'Bijih',fiber:'Serat',bone:'Tulang',metal:'Logam',fuel:'Bahan bakar',energy:'Energi',alloy:'Paduan',mana:'Mana'};
export const TOOL_NAMES={wood:'Alat penebangan',stone:'Alat penggalian',farm:'Alat pertanian'};
export const WEAPON_NAMES={stone:'Senjata batu',metal:'Senjata logam',ballistic:'Senjata balistik'};
export const VEHICLE_NAMES={cart:'Kereta angkut',motor:'Kendaraan bermotor',biotic:'Kendaraan biotik'};

// A warehouse is a view of existing shared stock, not a second inventory.
export function warehouseStock(root,civ,scope='warehouse'){
 const members=scope==='polity'?root.world.settlements.filter(c=>c.polityId===civ.polityId):[civ];
 const resources=Object.fromEntries(RESOURCE_KEYS.map(k=>[k,0])),stored=Object.fromEntries(RESOURCE_KEYS.map(k=>[k,0])),ground=Object.fromEntries(RESOURCE_KEYS.map(k=>[k,0])),custom=new Map();
 for(const member of members){const s=stateOf(root,member);for(const key of RESOURCE_KEYS){const amount=balance(s,key),split=storageSplit(s,key,amount);resources[key]+=amount;stored[key]+=split.stored;ground[key]+=split.ground;}for(const r of s.customResources){const entry=custom.get(r.key)||{key:r.key,name:r.name,amount:0,stored:0,ground:0};const split=customStorage(s,r);entry.amount+=r.amount;entry.stored+=split.stored;entry.ground+=split.ground;custom.set(r.key,entry);}}
 return {members,resources,stored,ground,warehouses:members.reduce((n,c)=>n+stateOf(root,c).buildings.warehouse,0),custom:[...custom.values()]};
}

export function equipmentRows(s,category){
 const tools=category==='tools',items=s[category],names=tools?TOOL_NAMES:category==='weapons'?WEAPON_NAMES:VEHICLE_NAMES;
 const assigned=new Set(s.agents.filter(a=>a.alive).flatMap(a=>['wood','stone','farm'].map(k=>a.equipment[k]).filter(Boolean)));
 const leased=new Set(s.agents.filter(a=>a.alive&&a.journey).map(a=>a.journey.vehicle));
 const rows=new Map(),locations=equipmentStorage(s),armed=new Set(s.agents.filter(a=>a.alive).map(a=>a.equipment.weapon));
 for(const item of items){const key=tools?item.job:item.type,row=rows.get(key)||{key,name:names[key]||key,total:0,available:0,used:0,pending:0,archive:0,condition:0,healthy:0,stored:0,ground:0};row.total++;
  const healthy=item.condition>0&&(!tools||item.status==='ready');
  if(healthy||tools&&item.status==='prototype'&&item.condition>0){const location=locations.stored[category].has(item.id)?'stored':locations.carried[category].has(item.id)?'carried':'ground';row[location]=(row[location]||0)+1;}
  if(healthy){const used=tools?assigned.has(item.id):category==='vehicles'?leased.has(item.id):armed.has(item.id);row[used?'used':'available']++;row.healthy++;row.condition+=tools?item.condition/item.physics.durability*100:item.condition;}
  else if(tools&&item.status==='prototype')row.pending++;else row.archive++;
  rows.set(key,row);
 }
 return [...rows.values()].map(row=>({...row,condition:row.healthy?row.condition/row.healthy:null}));
}
