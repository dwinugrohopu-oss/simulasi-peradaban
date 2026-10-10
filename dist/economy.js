import {housingCapacity} from './shelter.js';
import {researchCandidates,nextResearch,researchStatus,researchWork} from './research.js';
import {equipmentActions,equipmentWork,weaponPower} from './equipment.js';
import {startCustomGather,startCampaign,resourcePressure,restoreNature,needsExploration} from './frontier.js';
import {toolById} from './physics.js';
import {cultureActions,cultureWork,understanding} from './civics.js';
import {BUILDINGS,DISCOVERIES,BUILDING_LIMIT} from './rules.js';
export const RESOURCE_KEYS=['food','wood','stone','ore','fiber','bone','metal','fuel','energy','alloy','mana'];
const DISCOVERY_ORDER=Object.entries(DISCOVERIES).map(([id,d])=>({id,...d}));
export const WORK_ACTIONS=['smelt','fuel','alloy','generate','extract','useResource','studyMagic','channel','heal','enchantBuild','observe','assembleShip','defend','teach','diplomacy','translate'];
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export function civic(s){return s._context?.civ||s.world?.settlements.find(c=>c.id===1)||null;}
export function rootOf(s){return s._context?.root||(s.world?s:null);}
export function living(s){return s.agents.filter(a=>a.alive&&!a.away);}
export function adults(s){return living(s).filter(a=>a.age>=16);}
export function balance(s,key){return Object.hasOwn(s.industry||{},key)?s.industry[key]:s[key];}
export function add(s,key,amount){if(Object.hasOwn(s.industry||{},key))s.industry[key]+=amount;else s[key]+=amount;}
export function affordable(s,cost){return Object.entries(cost).every(([key,v])=>Number.isFinite(v)&&v>=0&&balance(s,key)>=v);}
export function spend(s,cost){if(!affordable(s,cost))return false;for(const [key,v]of Object.entries(cost))add(s,key,-v);return true;}
export function buildingCost(b){return Object.fromEntries(RESOURCE_KEYS.filter(k=>b[k]>0).map(k=>[k,b[k]]));}
export function known(s,id){return civic(s)?.discoveries.includes(id)||false;}
export function nearbySource(s){const c=civic(s),root=rootOf(s);return root&&c?root.world.sources.find(o=>o.planet===c.planet&&Math.hypot(c.x-o.x,c.y-o.y)<320):null;}
export function targets(s){const p=living(s).length,c=civic(s),d=nextDiscovery(s),cost={food:Math.max(20,p*5),wood:80,stone:65,fiber:12,bone:6,metal:15,fuel:15,energy:30,alloy:12,mana:20};for(const [k,v]of Object.entries(d?.cost||{}))cost[k]=Math.max(cost[k]||0,v);for(const b of buildingNeeds(s).filter(n=>n.score>0).slice(0,1)){for(const [k,v]of Object.entries(buildingCost(BUILDINGS[b.key])))cost[k]=Math.max(cost[k]||0,v);}if(c?.ship||c?.expeditionPlan)for(const [k,v]of Object.entries((c.ship||c.expeditionPlan).cost))cost[k]=Math.max(cost[k]||0,v);return cost;}
export function buildingNeeds(s){
 const p=living(s).length,health=living(s).reduce((n,a)=>n+a.health,0)/Math.max(1,p),capacity=housingCapacity(s),c=civic(s);
 const stockPressure=s.food>s.buildings.warehouse*345||s.wood>s.buildings.warehouse*550||s.stone>s.buildings.warehouse*550;
 const gearStamp=[s.day,s.nextToolId,s.nextWeaponId,s.nextVehicleId].join(':');if(s._storageDemand?.stamp!==gearStamp)Object.defineProperty(s,'_storageDemand',{value:{stamp:gearStamp,count:s.tools.filter(t=>t.condition>0&&['ready','prototype'].includes(t.status)).length+s.weapons.filter(w=>w.condition>0).length+s.vehicles.filter(v=>v.condition>0).length},enumerable:false,configurable:true});
 const storagePressure=stockPressure||s._storageDemand.count>s.buildings.warehouse*40;
 const needs=[{key:'warehouse',score:s.buildings.warehouse===0?105:storagePressure?60:0,reason:'Melindungi persediaan dan peralatan dari kerusakan di tanah.'},{key:'hut',score:capacity<=p?65:capacity-p<3?30:0,reason:'Warga tanpa rumah mudah sakit, kurang pulih saat tidur dan mudah marah.'},{key:'farm',score:Math.max(0,(p/4-s.buildings.farm)*20)+(s.food<p*4&&s.buildings.farm===0?50:0),reason:'Panen membutuhkan lahan dan petani.'},{key:'well',score:s.buildings.well===0&&p>=6?35:health<65&&s.buildings.well<2?20:0,reason:'Warga membutuhkan air dan pemulihan.'},{key:'school',score:s.buildings.school===0&&s.tech>=25?40:s.buildings.school<2&&s.tech>=150?10:0,reason:'Melatih peneliti dan generasi berikutnya.'}];
 for(const key of ['furnace','workshop','generator','observatory','shipyard'])needs.push({key,score:s.buildings[key]===0&&c?.discoveries.includes(BUILDINGS[key].requires)?55:0,reason:BUILDINGS[key].tip});
 for(const d of researchCandidates(s).slice(0,8))if(!s.buildings[d.facility]&&!needs.some(n=>n.key===d.facility))needs.push({key:d.facility,score:42+(d.id==='agriculture'?10:0),reason:'Fasilitas untuk riset '+d.name});
 return needs.map(n=>({...n,score:s.buildings[n.key]>=BUILDING_LIMIT?0:n.score})).sort((a,b)=>b.score-a.score);
}
export function nextDiscovery(s){return nextResearch(s);}
export function developmentStatus(s,id){return researchStatus(s,id);}
function resourceTask(s,r){const t=targets(s),c=civic(s),d=nextDiscovery(s);if(r.category==='food'&&s.food<t.food)return 'food';if(r.healing>r.toxicity&&living(s).some(a=>a.health<85))return 'medicine';if(r.category==='mineral'&&known(s,'metallurgy')&&s.buildings.furnace&&balance(s,'metal')<t.metal&&balance(s,'fuel')>=.5)return 'metal';if(r.category==='fuel'&&known(s,'metallurgy')&&s.buildings.furnace&&balance(s,'fuel')<t.fuel)return 'fuel';if(r.energy>0&&known(s,'electricity')&&s.buildings.generator&&balance(s,'energy')<t.energy)return 'energy';if(r.arcane>0&&c?.magic&&balance(s,'mana')<t.mana)return 'magic';if(r.research>0&&d&&s.tech<d.tech)return 'research';return null;}
export function customTarget(s,stored=false){return s.customResources.filter(r=>(stored?r.amount>=.25:r.stock>0)&&resourceTask(s,r)).sort((a,b)=>b.strength-a.strength)[0]||null;}
function productionGoal(s,key,target){
 if(key==='metal'){if(balance(s,'fuel')<1)return productionGoal(s,'fuel',2);if(s.ore<2)return {kind:'materials',actions:['mineOre','explore'],reason:'Bijih untuk peleburan'};return {kind:'metal',actions:['smelt','useResource'],reason:`Logam ${Math.floor(balance(s,key))}/${target}`};}
 if(key==='fuel'){if(s.wood<2)return {kind:'materials',actions:['wood'],reason:'Kayu untuk bahan bakar'};return {kind:'fuel',actions:['fuel','useResource'],reason:`Bahan bakar ${Math.floor(balance(s,key))}/${target}`};}
 if(key==='alloy'){if(balance(s,'metal')<2)return productionGoal(s,'metal',3);if(balance(s,'fuel')<1)return productionGoal(s,'fuel',2);return {kind:'alloy',actions:['alloy'],reason:`Paduan ${Math.floor(balance(s,key))}/${target}`};}
 if(key==='energy'){if(balance(s,'fuel')<1)return productionGoal(s,'fuel',2);return {kind:'energy',actions:['generate','useResource'],reason:`Energi ${Math.floor(balance(s,key))}/${target}`};}
 return {kind:key==='food'?'food':'materials',actions:key==='food'?['farm','fish','forage','useResource']:key==='fiber'||key==='bone'?['forage']:[key],reason:`${key} ${Math.floor(balance(s,key))}/${Math.ceil(target)}`};
}
export function goal(s){
 const c=civic(s),p=living(s);if(s.food<Math.max(6,p.length*3))return {kind:'food',actions:['farm','fish','forage','useResource'],reason:'Cadangan pangan menipis'};
 if(c?.war)return {kind:'war',actions:['defend','forgeWeapon'],reason:'Perang memerlukan penjaga dan logistik'};
 if(s.project)return {kind:'building',actions:['build','enchantBuild'],reason:'Menyelesaikan '+BUILDINGS[s.project.key].name};
 if(needsExploration(s))return {kind:'materials',actions:['explore'],reason:'Menjelajah mencari deposit baru'};
 const building=buildingNeeds(s).find(n=>n.score>0);if(building){const cost=buildingCost(BUILDINGS[building.key]);const shortage=Object.entries(cost).find(([k,v])=>balance(s,k)<v);if(shortage)return productionGoal(s,...shortage);}
 const d=nextDiscovery(s);if(c?.expeditionPlan&&!d){for(const [key,amount]of Object.entries(c.expeditionPlan.cost))if(balance(s,key)<amount)return productionGoal(s,key,amount);return {kind:'ship',actions:['assembleShip','research'],reason:'Mengumpulkan kru dan menyiapkan ekspedisi'};}
 if(c?.ship&&c.ship.progress<c.ship.required)return {kind:'ship',actions:['assembleShip'],reason:'Merakit wahana sebelum kru berangkat'};
 if(d){if(d.id==='metallurgy'&&s.achievements.successfulTools<2){for(const key of ['wood','stone','fiber'])if(balance(s,key)<4)return productionGoal(s,key,4);return {kind:'tools',actions:['craft'],reason:'Dua alat yang berhasil diperlukan untuk memahami material'};}
 if(d.id==='mechanics'&&s.achievements.smelt<3)return productionGoal(s,'metal',15);
 for(const [k,v]of Object.entries(d.cost))if(!c?.studies?.some(p=>p.id===d.id)&&balance(s,k)<v)return productionGoal(s,k,v);
 return {kind:'study',actions:['research','teach'],reason:'Meneliti '+d.name};}
 if(known(s,'electricity')&&s.buildings.generator&&balance(s,'energy')<Math.max(20,p.length*.5))return productionGoal(s,'energy',Math.max(20,p.length*.5));
 const upgrades=known(s,'metallurgy')&&s.buildings.workshop&&adults(s).some(a=>['wood','stone','farm'].some(job=>{const tool=toolById(s,a.equipment[job]);return tool&&(!['metal','alloy'].includes(tool.design.head)||known(s,'mechanics')&&tool.design.head!=='alloy'||known(s,'electricity')&&s.buildings.generator&&tool.design.drive!=='electric');}));if(upgrades){if(s.wood<1)return productionGoal(s,'wood',2);if(known(s,'electricity')&&balance(s,'metal')<2)return productionGoal(s,'metal',4);const metal=known(s,'mechanics')?'alloy':'metal';if(balance(s,metal)<4)return productionGoal(s,metal,4);if(known(s,'electricity')&&balance(s,'energy')<20)return productionGoal(s,'energy',20);return {kind:'tools',actions:['craft'],reason:'Meningkatkan alat sesuai penemuan dan bahan industri'};}
 if(c?.magic&&balance(s,'mana')<20)return {kind:'magic',actions:['channel','useResource'],reason:'Mengisi persediaan mana'};
 return {kind:'general',actions:['social','teach','craft'],reason:'Merawat hubungan dan keahlian'};
}
export function workAvailable(s,a){
 const c=civic(s),list=[...cultureActions(s,a),...equipmentActions(s)];if(known(s,'metallurgy')&&s.buildings.furnace){if(s.wood>=2)list.push('fuel');if(affordable(s,{ore:2,fuel:1}))list.push('smelt');}if(known(s,'mechanics')&&s.buildings.workshop&&affordable(s,{metal:2,fuel:1}))list.push('alloy');if(known(s,'electricity')&&s.buildings.generator&&affordable(s,{fuel:1}))list.push('generate');
 if(customTarget(s))list.push('extract');if(customTarget(s,true))list.push('useResource');
 const gifted=a.arcaneSensitivity>=75;if(s.buildings.arcaneSanctum&&c&&((!c.magic&&gifted&&a.skills.research>=20&&s.tech>=40&&nearbySource(s))||(c.magic&&a.skills.studyMagic<20&&a.skills.research>=10&&(nearbySource(s)||adults(s).some(b=>b.skills.studyMagic>=20)))))list.push('studyMagic');if(c?.magic&&(gifted||a.skills.studyMagic>=20)){if(nearbySource(s)&&balance(s,'mana')<100)list.push('channel');if(balance(s,'mana')>=2){if(living(s).some(b=>b.health<85))list.push('heal');if(s.project)list.push('enchantBuild');}}
 if(known(s,'electronics')&&known(s,'astronomy')&&s.buildings.observatory&&balance(s,'energy')>=.5&&c.signalProgress<100)list.push('observe');if(c?.ship&&c.ship.progress<c.ship.required&&known(s,'spaceflight')&&s.buildings.shipyard)list.push('assembleShip');if(c?.war&&s.food>=.5&&a.health>=35)list.push('defend');if(s.buildings.school&&a.skills.research>=20&&living(s).some(b=>b.id!==a.id&&b.skills.research<a.skills.research*.7))list.push('teach');if(known(s,'herbalMedicine')&&s.buildings.bioLab&&s.food>=1&&living(s).some(p=>p.health<90))list.push('treat');if(known(s,'forestry')&&s.buildings.ecologyStation&&(s.world||s._context)&&s.wood>=3)list.push('restore');if(known(s,'mindfulness')&&s.buildings.mindHall)list.push('meditate');if(known(s,'administration')&&s.buildings.civicHall&&s.food>=.2)list.push('govern');return list;
}
export function needBonus(s,a,key,g=goal(s)){let n=g.actions.includes(key)?(g.kind==='war'?10:5):0;
 if((a.energy<35||a.health<40)&&key==='rest')n+=5;if(!a.home&&['build','enchantBuild'].includes(key)&&s.project?.key==='hut')n+=2;if(a.hunger>55&&key==='eat')n+=5;
 if(key==='craft'&&(s.tools.some(t=>t.status==='prototype'&&(t.maker??t.owner)===a.id)||adults(s).some(b=>['wood','stone','farm'].some(job=>b.skills[job]>10&&!b.equipment[job]))))n+=3;
 if(key==='share'&&s.food<living(s).length*3&&a.stash.food>3)n+=8;
 if(key==='studyMagic'&&!civic(s)?.magic)n+=4;if(key==='heal'&&living(s).some(b=>b.health<45))n+=7;if(key==='observe')n+=5;
 if(key==='extract'&&customTarget(s)&&!customTarget(s,true))n+=5;if(key==='useResource'&&customTarget(s,true))n+=5;
 if(['diplomacy','translate'].includes(key)){const c=civic(s),root=rootOf(s);if(c?.contacts.some(id=>{const other=root.world.settlements.find(x=>x.id===id);return other&&understanding(c,other)<.55;}))n+=key==='translate'?7:3;}
 if(key==='teach'&&nextDiscovery(s)&&Math.max(...adults(s).map(b=>b.skills.research))<nextDiscovery(s).skill)n-=4;
 if(key==='research'&&civic(s)?.study&&a.skills.research<DISCOVERIES[civic(s).study.id].skill*.5)n-=3;
 return n;
}
export function runResearch(s,a,scale,{log}){return researchWork(s,a,scale,log);}
export function runWork(s,a,key,scale,{log}){
 if(['forgeWeapon','makeVehicle'].includes(key))return equipmentWork(s,a,key,scale,log);
 if(key==='restore')return restoreNature(s,a,scale);
 if(['diplomacy','translate'].includes(key))return cultureWork(s,a,key);
 const c=civic(s);if(known(s,'automation')&&['smelt','alloy','generate','fuel'].includes(key))scale*=1.25;if(known(s,'runeCraft')&&['heal','enchantBuild','channel'].includes(key))scale*=1.15;let reward=0,energy=5,note='',target=null;
 if(key==='fuel'&&known(s,'metallurgy')&&s.buildings.furnace&&spend(s,{wood:2})){add(s,'fuel',2*scale);s.achievements.fuel++;reward=balance(s,'fuel')<targets(s).fuel?4:1;energy=7;}
 else if(key==='smelt'&&known(s,'metallurgy')&&s.buildings.furnace&&spend(s,{ore:2,fuel:1})){add(s,'metal',1.5*scale);s.achievements.smelt++;reward=balance(s,'metal')<targets(s).metal?4:1;energy=8;}
 else if(key==='alloy'&&known(s,'mechanics')&&s.buildings.workshop&&spend(s,{metal:2,fuel:1})){add(s,'alloy',1.5*scale);s.achievements.alloy++;reward=balance(s,'alloy')<targets(s).alloy?4:1;energy=7;}
 else if(key==='generate'&&known(s,'electricity')&&s.buildings.generator&&spend(s,{fuel:1})){add(s,'energy',5*scale);s.achievements.generate++;reward=balance(s,'energy')<targets(s).energy?4:1;energy=6;}
 else if(key==='extract'){const r=customTarget(s);if(r){if(s.world||s._context)return startCustomGather(s,a,r,12*scale/(1+r.hardness/8),log);const amount=Math.min(r.stock,2*scale/(1+r.hardness/8));r.stock-=amount;r.amount+=amount;a.health=Math.max(0,a.health-amount*r.toxicity*.02);reward=2.5;energy=8;target=r.name;a.resourceTarget=r.key;}}
 else if(key==='useResource'){const r=customTarget(s,true);if(r){const mode=resourceTask(s,r),amount=Math.min(r.amount,1*scale);if(mode==='metal'&&!spend(s,{fuel:.5}))return {reward:-1,energy:1};r.amount-=amount;target=r.name;note=mode;a.resourceTarget=r.key;if(mode==='food')s.food+=amount*3;else if(mode==='medicine'){const patient=living(s).slice().sort((a,b)=>a.health-b.health)[0];patient.health=clamp(patient.health+amount*(r.healing-r.toxicity),0,100);target=patient.name+' / '+r.name;}else if(mode==='metal'){add(s,'metal',amount*r.strength/50);s.achievements.smelt++;}else if(mode==='fuel')add(s,'fuel',amount*Math.max(1,r.energy));else if(mode==='energy')add(s,'energy',amount*r.energy);else if(mode==='magic')add(s,'mana',amount*r.arcane);else if(mode==='research'){s.tech+=amount*r.research;a.skills.research+=.5;}if(mode!=='medicine')a.health=clamp(a.health-amount*r.toxicity*.03,0,100);reward=3;}}
 else if(key==='studyMagic'&&workAvailable(s,a).includes(key)){if(!c.magic)return researchWork(s,a,scale,log,'arcanePractice');a.skills.research+=.25;reward=3;}
 else if(key==='channel'&&workAvailable(s,a).includes(key)){add(s,'mana',nearbySource(s).power*scale*(known(s,'arcaneIndustry')?1.3:1));reward=2.5;}
 else if(key==='heal'&&workAvailable(s,a).includes(key)&&spend(s,{mana:2})){const patient=living(s).slice().sort((a,b)=>a.health-b.health)[0],before=patient.health;patient.health=clamp(patient.health+4*scale,0,100);reward=(patient.health-before)*.7;target=patient.name;}
 else if(key==='enchantBuild'&&s.project&&workAvailable(s,a).includes(key)&&spend(s,{mana:2})){s.project.progress+=3*scale;reward=3;}
 else if(key==='observe'&&workAvailable(s,a).includes(key)&&spend(s,{energy:.5})){c.signalProgress=Math.min(100,c.signalProgress+2*scale*(known(s,'interplanetaryProtocol')?1.2:1));reward=3;}
 else if(key==='assembleShip'&&workAvailable(s,a).includes(key)){c.ship.progress=Math.min(c.ship.required,c.ship.progress+2*scale);reward=3.5;energy=7;}
 else if(key==='defend'&&c?.war){if(c.war.claim&&!a.journey)return startCampaign(s,a,log);if(c.war.claim&&a.journey?.phase!=='camp')return {reward:-1,energy:1};if(a.journey){if(a.journey.provisions<.5)return {reward:-1,energy:1};a.journey.provisions-=.5;a.hunger=Math.max(0,a.hunger-8);}else if(!spend(s,{food:.5}))return {reward:-1,energy:1};const defense=1+scale+a.skills.defend/100+weaponPower(s,a);s._turn.defense+=defense;a.combatDefense=defense;reward=4;energy=9;}
 else if(key==='teach'&&s.buildings.school){const pupil=living(s).filter(b=>b.id!==a.id&&b.skills.research<a.skills.research*.7).sort((a,b)=>a.skills.research-b.skills.research)[0];if(pupil){pupil.skills.research+=Math.min(2*scale,(a.skills.research-pupil.skills.research)*.05);reward=2.5;target=pupil.name;}}
 else if(key==='treat'&&known(s,'herbalMedicine')&&s.buildings.bioLab&&spend(s,{food:1})){const patient=living(s).sort((a,b)=>a.health-b.health)[0];patient.health=Math.min(100,patient.health+scale*(known(s,'regenerativeMedicine')?8:3));target=patient.name;reward=3;}
 else if(key==='meditate'&&known(s,'mindfulness')&&s.buildings.mindHall){a.attributes.discipline=Math.min(100,a.attributes.discipline+.06*scale);a.mood=Math.min(100,a.mood+5);reward=2;}
 else if(key==='govern'&&known(s,'administration')&&s.buildings.civicHall&&spend(s,{food:.2})){c.government.legitimacy=Math.min(100,c.government.legitimacy+.1*scale);s.harmony=Math.min(100,s.harmony+.2*scale);reward=2;}
 else {reward=-1;energy=1;}
 return {reward,energy,note,target};
}
