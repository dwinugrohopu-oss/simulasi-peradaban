import {ATTRIBUTES,initAttributes,statFactor,trainAttributes,initCulture} from './civics.js';
import {RESOURCE_KEYS,WORK_ACTIONS,balance,buildingCost,spend,affordable,civic,goal,needBonus,workAvailable,runResearch,runWork,buildingNeeds as needs,known,targets,nextDiscovery} from './economy.js';
import {initEconomy,aptitude,createWorld,tickWorld,validateEconomy,validateWorld,addWorldObject,bindWorld,migrateWorld} from './world.js';
import {experiment,useTool,evaluateDesign,craftingNeeded} from './physics.js';
import {initCitizen,deposit,cooperation,interact,revengeTarget} from './society.js';
import {validateDescriptor} from './world-schema.js';
/* Pure simulation and tabular Q-learning; shared by the browser and Node tests. */
export const VERSION=6, DAY_MS=4000, OFFLINE_CAP=8*60*60*1000;
import {ACTIONS,LABELS,BUILDINGS,POLICIES,TRAITS,STAGES,POPULATION_LIMIT,BUILDING_LIMIT,TOOL_LIMIT} from './rules.js';
export {ACTIONS,LABELS,BUILDINGS,POLICIES,TRAITS};
export function traitBonus(a,key){return a.traits.reduce((n,k)=>n+(TRAITS[k].jobs.includes(key)?1.2:0),0);}
export function efficiency(a,key){return statFactor(a,key)*(.55+.45*a.health/100)*(1+Math.min(1.5,a.skills[key]/150))*a.traits.reduce((n,k)=>n*(TRAITS[k].jobs.includes(key)?TRAITS[k].efficiency:1),1);}
export function expertise(a,key){return a.skills[key]>=150?'Ahli':a.skills[key]>=60?'Terampil':a.skills[key]>=20?'Terlatih':'Pemula';}
function chooseTraits(s){const positive=['diligent','curious','sociable','frugal','brave','careful'],negative=['selfish','greedy','vengeful','aggressive','cruel','manipulative'],pool=random(s)<.35?negative:positive;const first=pool[Math.floor(random(s)*pool.length)],remaining=positive.filter(k=>k!==first);return [first,remaining[Math.floor(random(s)*remaining.length)]];}
const NAMES=['Arka','Nara','Bima','Sari','Raka','Laras','Damar','Ayu','Jati','Kirana','Bayu','Sekar','Wira','Tara','Dian','Sena'];
const clamp=(n,min=0,max=100)=>Math.min(max,Math.max(min,n));
export function random(s){let n=s.rng>>>0;n^=n<<13;n^=n>>>17;n^=n<<5;s.rng=n>>>0;return s.rng/4294967296;}
export function log(s,text){s.logs.unshift({day:s.day,text});s.logs=s.logs.slice(0,45);}
export function population(s){return s.agents.filter(a=>a.alive&&!a.away);}
export function capacity(s){return 3+s.buildings.hut*3+s.buildings.habitat*4;}
export function era(s){return STAGES[civic(s)?.stage||0];}
export function newAgent(s,origin='immigrant'){const id=s.nextId++,a={id,name:NAMES[(id-1)%NAMES.length]+(id>16?' '+Math.ceil(id/16):''),age:origin==='birth'?0:16+Math.floor(random(s)*18),origin,traits:chooseTraits(s),alive:true,away:false,grievance:0,health:100,hunger:15,energy:90,mood:70,action:'rest',steps:0,rewardSum:0,explorations:0,lastReward:0,q:{},visits:{},skills:Object.fromEntries(ACTIONS.map(k=>[k,0])),color:Math.floor(random(s)*5),exitReason:null};initCitizen(a);initAttributes(s,a);a.arcaneSensitivity=aptitude(s.seed,a.id);s.agents.push(a);if(s.agents.length>100){let excess=s.agents.length-100;s.agents=s.agents.filter(item=>item.alive||excess--<=0);}return a;}
export function newGame(seed=Date.now(),now=Date.now(),options={}){
 const s={version:VERSION,rng:(Number(seed)>>>0)||1,seed:(Number(seed)>>>0)||1,day:0,food:65,wood:30,stone:15,fiber:8,bone:4,tools:[],nextToolId:1,prototypes:0,experiments:0,tech:0,harmony:75,policy:'balanced',buildings:Object.fromEntries(Object.keys(BUILDINGS).map(k=>[k,k==='hut'&&!options.empty?1:0])),project:null,agents:[],nextId:1,logs:[],paused:false,lastSaved:now,carryMs:0,history:[],totalSteps:0,deathCount:0,birthCount:0,immigrationCount:0,emigrationCount:0,objects:[],nextObjectId:1};
 if(options.empty){for(const key of ['food','wood','stone','fiber','bone'])s[key]=0;}else{for(let i=0;i<6;i++)newAgent(s,'founder');log(s,'Enam perintis tiba. Mereka mulai mencoba dan belajar.');}initEconomy(s);s.world=options.world===false?null:createWorld(s,newGame);if(s.world)bindWorld(s);return s;
}
export function observation(s,a){return [a.hunger>=55?1:0,a.energy<35?1:0,s.food<population(s).length*3?1:0,s.project?1:0,s.harmony<40?1:0,goal(s).kind,s.policy].join(':');}
export function available(s,a){if(!a.alive||a.away)return [];if(a.hunger>=85&&(s.food>=1||a.stash.food>=1))return ['eat'];if(a.energy<=5)return ['rest'];if(a.age<16)return ['forage','rest','social',...(s.food>=1&&a.hunger>10?['eat']:[])];const wanted=targets(s),list=['rest','social',...workAvailable(s,a)];if(s.food<wanted.food*2||s.fiber<wanted.fiber||s.bone<wanted.bone)list.push('forage');if(s.wood<wanted.wood*2)list.push('wood');if(s.stone<wanted.stone*2)list.push('stone');if(nextDiscovery(s)||!civic(s))list.push('research');if(craftingNeeded(s,a))list.push('craft');if(s.food<wanted.food*2&&s.objects.some(o=>o.kind==='river'&&o.stock>=1))list.push('fish');if(s.food<wanted.food*2&&s.buildings.farm&&(s._turn?.farmers||0)<s.buildings.farm*3)list.push('farm');if(s.project)list.push('build');if((s.food>=1||a.stash.food>=1)&&a.hunger>10)list.push('eat');if(Object.values(a.stash).some(n=>n>0))list.push('share');if(a.stash.food<25&&population(s).some(b=>b.id!==a.id&&b.age>=16)){if(a.traits.includes('greedy'))list.push('steal');if(a.traits.includes('manipulative'))list.push('persuade');}if(s.day-a.lastConflict>=10&&population(s).some(b=>b.id!==a.id&&b.age>=16)){if(a.traits.some(t=>['aggressive','cruel'].includes(t)))list.push('intimidate');if(a.traits.includes('vengeful')&&revengeTarget(s,a))list.push('revenge');}return list;}
export function epsilon(a){return Math.max(.05,Math.min(.45,.28*Math.exp(-a.steps/700)*a.traits.reduce((n,k)=>n*TRAITS[k].explore,1)));}
export function row(a,state){if(a.q[state])return a.q[state];const legacy=state.replace(/^([01]:[01]:[01]:[01]:[01]):[a-z]+:/,'$1:');const baseline=legacy!==state?a.q[legacy]:null;return a.q[state]=Object.fromEntries(ACTIONS.map(k=>[k,baseline?.[k]??0]));}
export function selectAction(s,a,state=observation(s,a)){
 const choices=available(s,a),values=row(a,state),agenda=goal(s);
 if(random(s)<epsilon(a)){a.explorations++;return choices[Math.floor(random(s)*choices.length)];}
 const best=Math.max(...choices.map(k=>values[k]+traitBonus(a,k)+needBonus(s,a,k,agenda)));const tied=choices.filter(k=>Math.abs(values[k]+traitBonus(a,k)+needBonus(s,a,k,agenda)-best)<1e-9);return tied[Math.floor(random(s)*tied.length)];
}
export function learn(a,state,action,reward,nextState,nextActions,terminal=false,alpha=.16){
 const current=row(a,state),future=terminal?0:Math.max(...nextActions.map(k=>row(a,nextState)[k]));
 const target=reward+.75*future;current[action]+=alpha*(target-current[action]);
 a.visits[state]=(a.visits[state]||0)+1;a.steps++;a.rewardSum+=reward;a.lastReward=reward;
}
export function startProject(s,key){
 const b=Object.hasOwn(BUILDINGS,key)?BUILDINGS[key]:null;if(!b)throw Error('Bangunan tidak dikenal.');if(s.project)throw Error('Selesaikan proyek yang sedang berjalan.');
 if(s.buildings[key]>=BUILDING_LIMIT)throw Error('Batas bangunan ini sudah tercapai.');
 if(b.requires&&!known(s,b.requires))throw Error('Penemuan prasyarat bangunan belum dikuasai.');if(!spend(s,buildingCost(b)))throw Error('Bahan bangunan belum cukup.');
 s.project={key,progress:0,required:b.work};ensureTurn(s);s._turn.allocations.push({purpose:b.name,inputs:buildingCost(b)});log(s,'Proyek '+b.name+' dimulai. Penduduk akan belajar mengerjakannya.');
}
export function act(s,a,key){
 if(!ACTIONS.includes(key)||key==='voyage')throw Error('Tindakan tidak dikenal.');if(!a.alive||a.away)return 0;ensureTurn(s);const resources=Object.fromEntries(RESOURCE_KEYS.map(k=>[k,balance(s,k)]));let workNote=null;
 const tool=useTool(s,a,key==='extract'?'stone':key,{random,log});const before={hunger:a.hunger,energy:a.energy},scale=efficiency(a,key)*(a.age<16?.45:1)*tool.output,scarce=s.food<population(s).length*3;let reward=0;
 switch(key){
 case 'forage': {s.fiber+=.4*scale;s.bone+=.12*scale;const amount=(1.5+random(s)*2)*scale;deposit(s,a,'food',amount);a.energy-=5;reward=amount*(scarce?1.5:s.food<population(s).length*6?.6:.05);break;}
 case 'wood': {const amount=(1.5+random(s)*1.5)*scale+harvestObject(s,'forest',scale);deposit(s,a,'wood',amount);a.energy-=7;reward=amount*(s.wood<80?1:.05);break;}
 case 'stone': {const amount=(1+random(s))*scale+harvestObject(s,'quarry',scale);deposit(s,a,'stone',amount);a.energy-=8;reward=amount*(s.stone<65?1.3:.05);break;}
 case 'farm': {if(!s.buildings.farm||s._turn.farmers>=s.buildings.farm*3){reward=-1;break;}s._turn.farmers++;const amount=(3+random(s)*2)*scale*weatherFactor(s)*(known(s,'agriculture')?1.25:1);deposit(s,a,'food',amount);a.energy-=6;reward=amount*(scarce?1.5:s.food<population(s).length*6?.6:.05);break;}
 case 'build': if(s.project){s.project.progress+=2*scale*cooperation(s,a);a.energy-=7;reward=3;}break;
 case 'research': {const result=runResearch(s,a,scale,{log});s.tech+=harvestObject(s,'ruins',scale*.3);reward=result.reward;a.energy-=result.energy;break;}
 case 'craft':reward=experiment(s,a,{random,log});a.energy-=6;break;
 case 'fish': {const amount=harvestObject(s,'river',3*scale);deposit(s,a,'food',amount);a.energy-=5;reward=amount*(scarce?1.5:s.food<population(s).length*6?.6:.05);break;}
 case 'eat': if(s.food>=1||a.stash.food>=1){const source=a.stash.food>=1?a.stash:s;source.food-=a.traits.includes('frugal')?.8:1;a.hunger=clamp(a.hunger-38);a.health=clamp(a.health+1);reward=(before.hunger-a.hunger)*.16;}else reward=-2;break;
 case 'rest':a.energy=clamp(a.energy+27);if(a.hunger<80)a.health=clamp(a.health+.25);reward=(a.energy-before.energy)*.18;break;
 case 'steal':case 'intimidate':case 'revenge':case 'persuade':case 'share':reward=interact(s,a,key,{random,log});a.energy-=3;if(['intimidate','revenge'].includes(key))a.lastConflict=s.day;break;
 case 'smelt':case 'fuel':case 'alloy':case 'generate':case 'extract':case 'useResource':case 'studyMagic':case 'channel':case 'heal':case 'enchantBuild':case 'observe':case 'assembleShip':case 'defend':case 'teach':case 'diplomacy':case 'translate':{workNote=runWork(s,a,key,scale,{log});reward=workNote.reward;a.energy-=workNote.energy;break;}
 case 'social': {const interaction=interact(s,a,key,{random,log});const moodBefore=a.mood;a.mood=clamp(a.mood+(interaction<0?-4:20*scale));reward=(a.mood-moodBefore)*.12+(s.harmony<40?6:.5);s.harmony=clamp(s.harmony+(interaction<0?-.5:1.5*scale));reward+=interaction;a.energy-=2;break;}
 }
 if(a.energy<before.energy)a.energy=before.energy-(before.energy-a.energy)*tool.energy*a.traits.reduce((n,k)=>n*TRAITS[k].energy,1);
 a.hunger=clamp(a.hunger+(a.age<16?2:3));a.mood=clamp(a.mood-.5);a.energy=clamp(a.energy);
 if(a.hunger>=90){a.health=clamp(a.health-3);reward-=5;}if(a.energy<=10)reward-=2;
 if(a.hunger<55&&a.energy>25){a.health=clamp(a.health+.05+s.buildings.well*.08);reward+=.2;}
 if(s.policy==='survival'&&['forage','farm'].includes(key))reward+=2;
 if(s.policy==='expansion'&&['wood','stone','build'].includes(key))reward+=1.5;
 if(s.policy==='knowledge'&&['research','craft','teach','studyMagic','observe'].includes(key))reward+=2;
 a.skills[key]+=1;trainAttributes(a,key);a.action=key;if(s.project&&s.project.progress>=s.project.required)completeProject(s);
 const inputs={},outputs={};for(const resource of RESOURCE_KEYS){const delta=balance(s,resource)-resources[resource];if(delta<-.000001)inputs[resource]=-delta;else if(delta>.000001)outputs[resource]=delta;}s._turn.records.push({id:a.id,name:a.name,action:key,inputs,outputs,target:workNote?.target||null,note:workNote?.note||''});
 if(a.health<=0){a.alive=false;a.exitReason='death';s.deathCount++;log(s,a.name+' meninggal karena kebutuhan hidup tidak terpenuhi.');reward-=15;}
 return reward;
}
function annualEvent(s){
 const event=Math.floor(random(s)*4);
 if(event===0){const lost=Math.min(s.food,s.food*.18);s.food-=lost;log(s,'Musim kering: cadangan makanan berkurang '+Math.round(lost)+'.');}
 else if(event===1){log(s,'Musim berganti; persediaan kayu tetap bergantung pada pekerjaan warga.');}
 else if(event===2){const learned=population(s).some(a=>a.action==='research')?2:0;s.tech+=learned;log(s,learned?'Pengamatan musim membantu penelitian: pengetahuan +2.':'Pergantian musim memberi bahan pengamatan baru.');}
 else {s.harmony=clamp(s.harmony-12);for(const a of population(s))a.mood=clamp(a.mood-8);log(s,'Perselisihan warga menurunkan keharmonisan.');}
 for(const a of s.agents.filter(a=>a.alive)){a.age++;if(a.age>75&&random(s)<.04+(a.age-75)*.008){a.alive=false;a.exitReason='death';s.deathCount++;log(s,a.name+' meninggal pada usia '+a.age+' tahun.');}}
}
export function tick(s){if(s.paused||!worldPopulation(s))return false;if(s.world)return tickWorld(s,{tick:tickSettlement,newGame,log,resolveDeaths});return tickSettlement(s);}
export function tickSettlement(s,options={}){
 if(s.paused)return false;
 if(options.advanceDay!==false)s.day++;ensureTurn(s,true);updateObjects(s);autoPlan(s);s.harmony=clamp(s.harmony-.08);
 // Rotate order to avoid consistently privileging one agent over shared food/building resources.
 const agents=population(s),offset=s.day%agents.length;
 for(let i=0;i<agents.length;i++){const a=agents[(i+offset)%agents.length];if(!a.alive)continue;const state=observation(s,a),key=selectAction(s,a,state),reward=act(s,a,key);learn(a,state,key,reward,observation(s,a),available(s,a),!a.alive,s.buildings.school?.22:.16);s.totalSteps++;}
 if(s.day%60===0)annualEvent(s);
 const storage=Math.max(30,population(s).length*12+s.buildings.farm*20),spoiled=Math.max(0,s.food-storage)*.005;s.food-=spoiled;if(spoiled>=1&&s.day%30===0)log(s,'Pangan berlebih rusak di penyimpanan: '+Math.round(spoiled)+'.');demographics(s);for(const a of s.agents){if(!a.alive&&!a.away&&!a.estateSettled){if(a.exitReason==='death')for(const k of ['food','wood','stone']){s[k]+=a.stash[k];a.stash[k]=0;}a.estateSettled=true;for(const t of s.tools)if(t.owner===a.id&&t.status==='prototype')t.status='failed';}if(s.day%60===0&&!a.traits.includes('vengeful'))for(const k of Object.keys(a.relations))a.relations[k]*=.9;}s.objects=s.objects.filter(o=>o.kind!=='event'||o.remaining>0);
 s.lastTurn={day:s.day,goal:goal(s).reason,allocations:s._turn.allocations.map(a=>({...a})),records:s._turn.records.map(r=>({...r}))};
 if(s.day%10===0){s.history.push({day:s.day,pop:population(s).length,food:Math.round(s.food),tech:Math.round(s.tech)});s.history=s.history.slice(-90);}
 resolveDeaths(s);return true;
}
export function elapsedBudget(elapsedMs,carryMs=0){const total=Math.min(OFFLINE_CAP,Math.max(0,Number(elapsedMs)||0))+carryMs;return {ticks:Math.floor(total/DAY_MS),carryMs:total%DAY_MS};}
export function advance(s,elapsedMs){
 if(s.paused||!worldPopulation(s))return 0;
 const budget=elapsedBudget(elapsedMs,s.carryMs),n=budget.ticks;s.carryMs=budget.carryMs;let completed=0;
 for(let i=0;i<n;i++){if(!tick(s))break;completed++;}return completed;
}
export function validateSave(value,options={}){
 const s=JSON.parse(JSON.stringify(value));const oldVersion=s?.version,legacy=s?.version===1,upgrade=legacy||s?.version===2,worldUpgrade=upgrade||s?.version===3;if(upgrade){s.version=VERSION;s.fiber=8;s.bone=4;s.tools=[];s.nextToolId=1;s.prototypes=0;s.experiments=0;for(const a of s.agents||[]){initCitizen(a);for(const k of ACTIONS)if(a.skills&&a.skills[k]===undefined)a.skills[k]=0;for(const values of Object.values(a.q||{}))for(const k of ACTIONS)if(values[k]===undefined)values[k]=0;}}if(worldUpgrade){s.version=VERSION;initEconomy(s);s.world=options.isolated?null:createWorld(s,newGame);}if(oldVersion>=1&&oldVersion<5){s.version=VERSION;for(const k of Object.keys(BUILDINGS))if(s.buildings[k]===undefined)s.buildings[k]=0;initNewFields(s);for(const a of s.agents){for(const k of ACTIONS)if(a.skills[k]===undefined)a.skills[k]=0;for(const v of Object.values(a.q))for(const k of ACTIONS)if(v[k]===undefined)v[k]=0;a.away=false;a.grievance=a.grievance??0;}if(s.world)migrateWorld(s,log);}
 if(oldVersion===5){s.version=VERSION;for(const a of s.agents){for(const key of ACTIONS){a.skills[key]??=0;for(const r of Object.values(a.q))r[key]??=0;}}}if(oldVersion<6){for(const a of s.agents)initAttributes(s,a);if(s.world)for(const c of s.world.settlements)initCulture(s,c);}
 if(options.isolated&&s.world!==null||!options.isolated&&s.world===null)throw Error('Simpanan peradaban harus memiliki struktur dunia yang sesuai.');const finite=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
 if(!s||s.version!==VERSION||!finite(s.rng,1,4294967295)||!finite(s.seed,1,4294967295)||!finite(s.day,0,1e8)||!finite(s.nextId,1,1e7)||!finite(s.lastSaved,0,1e16)||!finite(s.carryMs,0,DAY_MS)||typeof s.paused!=='boolean'||!Object.hasOwn(POLICIES,s.policy))throw Error('Format simpanan tidak cocok.');
 for(const key of ['food','wood','stone','tech','harmony','totalSteps','deathCount'])if(!finite(s[key],0,1e12))throw Error('Nilai simpanan tidak valid.');
 for(const key of Object.keys(BUILDINGS))if(!Number.isInteger(s.buildings?.[key])||!finite(s.buildings[key],0,BUILDING_LIMIT))throw Error('Bangunan simpanan tidak valid.');
 if(s.project&&(!Object.hasOwn(BUILDINGS,s.project.key)||!finite(s.project.progress,0,1000)||s.project.required!==BUILDINGS[s.project.key].work))throw Error('Proyek simpanan tidak valid.');
 if(!Array.isArray(s.agents)||s.agents.length>POPULATION_LIMIT+100||!Array.isArray(s.logs)||s.logs.length>45||!Array.isArray(s.history)||s.history.length>90)throw Error('Ukuran simpanan tidak valid.');
 if(s.agents.filter(a=>a.alive).length>POPULATION_LIMIT)throw Error('Penduduk melampaui batas.');const ids=new Set();for(const a of s.agents){if(!Number.isInteger(a.id)||a.id<1||a.id>=s.nextId||ids.has(a.id)||typeof a.name!=='string'||a.name.length>50||typeof a.alive!=='boolean'||!finite(a.age,0,1e6)||!finite(a.color,0,4)||!finite(a.steps,0,1e12)||!finite(a.explorations,0,a.steps)||!finite(a.rewardSum,-1e12,1e12)||!finite(a.lastReward,-1000,1000)||!ACTIONS.includes(a.action))throw Error('Penduduk simpanan tidak valid.');ids.add(a.id);
 for(const k of Object.keys(ATTRIBUTES))if(!finite(a.attributes?.[k],0,100))throw Error('Atribut warga tidak valid.');
 for(const k of ['health','hunger','energy','mood'])if(!finite(a[k],0,100))throw Error('Kondisi penduduk tidak valid.');
 if(legacy){a.skills.fish=0;const convert=key=>key.replace(/:(balanced|survival|expansion|knowledge)$/,':0:$1');a.q=Object.fromEntries(Object.entries(a.q).map(([k,v])=>[convert(k),v]));a.visits=Object.fromEntries(Object.entries(a.visits).map(([k,v])=>[convert(k),v]));}
 for(const k of ACTIONS)if(!finite(a.skills?.[k],0,1e12))throw Error('Skill tidak valid.');
 if(!a.q||typeof a.q!=='object'||Array.isArray(a.q)||Object.keys(a.q).length>1000||!a.visits||typeof a.visits!=='object')throw Error('Model belajar tidak valid.');
 for(const [key,values]of Object.entries(a.q)){if(!/^[01]:[01]:[01]:[01]:[01]:(?:(general|food|materials|building|tools|study|metal|fuel|alloy|energy|magic|radio|ship|war|custom):)?(balanced|survival|expansion|knowledge)$/.test(key)||!finite(a.visits[key]||0,0,1e12))throw Error('State belajar tidak valid.');if(legacy)values.fish=0;for(const k of ACTIONS)if(!finite(values[k],-1000,1000))throw Error('Bobot model tidak valid.');}}
 for(const l of s.logs)if(!finite(l.day,0,s.day)||typeof l.text!=='string'||l.text.length>500)throw Error('Riwayat tidak valid.');
 for(const h of s.history)for(const k of ['day','pop','food','tech'])if(!finite(h[k],0,1e12))throw Error('Grafik tidak valid.');
 if(legacy){
 s.objects=[];s.nextObjectId=1;s.birthCount=0;s.immigrationCount=0;s.emigrationCount=0;
 for(const a of s.agents){a.traits=[['diligent','curious','sociable','frugal','brave','careful'][(a.id-1)%6],['diligent','curious','sociable','frugal','brave','careful'][a.id%6]];a.origin='founder';a.exitReason=a.alive?null:'death';}
 log(s,'Sifat warga dan pembangunan otonom aktif. Progres dan model lama dipertahankan.');}
 for(const k of ['birthCount','immigrationCount','emigrationCount','nextObjectId'])if(!Number.isInteger(s[k])||!finite(s[k],k==='nextObjectId'?1:0,1e9))throw Error('Data populasi tidak valid.');
 if(!Array.isArray(s.objects)||s.objects.length>24)throw Error('Objek dunia tidak valid.');
 const objectIds=new Set();for(const o of s.objects){validateDescriptor(o.descriptor);if(!Number.isInteger(o.id)||o.id<1||o.id>=s.nextObjectId||objectIds.has(o.id)||o.kind!==o.descriptor.kind||!finite(o.stock,0,1000)||!finite(o.remaining,0,180))throw Error('Objek simpanan tidak valid.');objectIds.add(o.id);}
 for(const a of s.agents)if(!Array.isArray(a.traits)||a.traits.length!==2||new Set(a.traits).size!==2||a.traits.some(k=>!Object.hasOwn(TRAITS,k))||!['founder','birth','immigrant'].includes(a.origin)||![null,'death','emigration'].includes(a.exitReason))throw Error('Sifat penduduk tidak valid.');
 validateSociety(s,finite);validateTurn(s,finite);validateEconomy(s,finite);validateWorld(s,validateSave,validateDescriptor,finite);if(s.world)bindWorld(s);return s;
}

export function applyObject(s,value,civId=1){
 const d=validateDescriptor(value);if(s.world){const civ=s.world.settlements.find(c=>c.id===Number(civId));if(!civ)throw Error('Peradaban tujuan tidak dikenal.');if(addWorldObject(s,civ,d,log))return d;if(civ.id!==1)return applyObject(civ.state,d);}else if(['resource','magic'].includes(d.kind)||d.kind==='event'&&['war','rebellion','contact','awakening','custom'].includes(d.event))throw Error('Objek ini memerlukan dunia induk.');
 if(s.objects.length>=24)throw Error('Dunia sudah memiliki 24 objek.');
 if(d.kind==='building'&&s.buildings[d.building]+d.amount+(s.project?.key===d.building?1:0)>BUILDING_LIMIT)throw Error(`Bangunan melewati batas ${BUILDING_LIMIT} per jenis.`);
 const o={id:s.nextObjectId++,kind:d.kind,descriptor:d,stock:d.richness*80,remaining:d.kind==='event'?d.duration:0};
 if(d.kind==='building')s.buildings[d.building]+=d.amount;
 s.objects.push(o);log(s,'Objek baru: '+d.name+'. '+d.description);return o;
}
function harvestObject(s,kind,amount){const o=s.objects.find(o=>o.kind===kind&&o.stock>0);if(!o)return 0;const obtained=Math.min(amount,o.stock);o.stock-=obtained;return obtained;}
function weatherFactor(s){return s.objects.some(o=>o.kind==='event'&&o.descriptor.event==='drought'&&o.remaining>=0)?.4:1;}
function updateObjects(s){
 for(const o of s.objects){const d=o.descriptor;if(o.kind==='river'){o.stock=Math.min(d.richness*80,o.stock+.2*d.richness);if(s.day%60===0&&random(s)<d.intensity*.06){s.food*=.85;for(const a of population(s))a.health=clamp(a.health-2*d.intensity);log(s,d.name+' meluap: pangan -15%, kesehatan warga menurun.');}}
 if(o.kind==='event'&&o.remaining>0){if(d.event==='flood')s.food*=1-.003*d.intensity;if(d.event==='disease')for(const a of population(s))a.health=clamp(a.health-.15*d.intensity);if(d.event==='festival'){s.harmony=clamp(s.harmony+.2*d.intensity);for(const a of population(s))a.mood=clamp(a.mood+.2*d.intensity);}o.remaining--;if(o.remaining===0)log(s,d.name+' berakhir.');}}
 for(const a of population(s))if(a.health<=0){a.alive=false;a.exitReason='death';s.deathCount++;log(s,a.name+' meninggal akibat dampak peristiwa dunia.');}
 // Expired events are removed so players can add new interventions indefinitely.

}
export function buildingNeeds(s){return needs(s);}
export function autoPlan(s){
 if(s.project||!population(s).length)return;
 const need=buildingNeeds(s).find(n=>n.score>0);if(!need)return;
 const b=BUILDINGS[need.key];if(affordable(s,buildingCost(b))){startProject(s,need.key);log(s,'Warga merencanakan '+b.name+' sendiri: '+need.reason);}
}
function demographics(s){
 const active=population(s),adults=active.filter(a=>a.age>=18&&a.age<=45),space=Math.min(POPULATION_LIMIT,capacity(s))-s.agents.filter(a=>a.alive).length;
 if(s.day%60===0&&space>0&&adults.length>=2&&s.food>active.length*5&&s.harmony>45){const births=Math.min(space,Math.max(1,Math.floor(adults.length/4)),Math.floor((s.food-active.length*5)/8));for(let i=0;i<births;i++){const child=newAgent(s,'birth');s.birthCount++;s.food-=8;log(s,child.name+' lahir. Anak belajar lewat kegiatan ringan sampai usia 16.');}}
 if(!civic(s)&&s.day%90===0&&population(s).length<Math.min(POPULATION_LIMIT,capacity(s))&&s.food>30&&s.harmony>35){const a=newAgent(s);s.immigrationCount++;s.food-=12;log(s,a.name+' datang menetap dengan sifat dan model belajar baru.');}
 if(s.day%60===0&&active.length>2&&(s.harmony<22||s.food<active.length)){const a=active.filter(a=>a.alive&&a.age>=16).sort((a,b)=>a.mood-b.mood)[0];if(a){if(civic(s))s._turn.migrant=a.id;else{a.alive=false;a.exitReason='emigration';s.emigrationCount++;log(s,a.name+' pindah karena kondisi permukiman memburuk.');}}}
}

function validateSociety(s,finite){
 for(const k of ['fiber','bone','prototypes','experiments','nextToolId'])if(!finite(s[k],k==='nextToolId'?1:0,1e12))throw Error('Data penelitian tidak valid.');
 if(!Array.isArray(s.tools)||s.tools.length>TOOL_LIMIT)throw Error('Arsip alat tidak valid.');const ids=new Set();
 for(const t of s.tools){const p=evaluateDesign(t.design);if(t.maker!==undefined&&(!Number.isInteger(t.maker)||t.maker<1||t.maker>=s.nextId))throw Error('Pembuat alat tidak valid.');if(!Number.isInteger(t.id)||t.id<1||t.id>=s.nextToolId||ids.has(t.id)||!Number.isInteger(t.owner)||t.owner<1||t.owner>=s.nextId||!['wood','stone','farm'].includes(t.job)||!['prototype','ready','failed','broken'].includes(t.status)||typeof t.name!=='string'||t.name.length>160||!finite(t.condition,0,p.durability)||!finite(t.uses,0,1e12)||!finite(t.createdDay,0,s.day)||!(t.testedDay===null||finite(t.testedDay,0,s.day))||!(t.measured===null||finite(t.measured,-1,2))||JSON.stringify(t.physics)!==JSON.stringify(p))throw Error('Rancangan alat tidak valid.');ids.add(t.id);}
 for(const k of ['successfulTools','toolUses','smelt','fuel','alloy','generate'])if(!finite(s.achievements?.[k],0,1e12))throw Error('Bukti praktik tidak valid.');
 for(const a of s.agents){if(typeof a.away!=='boolean'||!finite(a.grievance,0,100))throw Error('Status warga tidak valid.');for(const k of ['food','wood','stone'])if(!finite(a.stash?.[k],0,30))throw Error('Persediaan pribadi tidak valid.');if(!finite(a.reputation,0,100)||!finite(a.lastConflict,-100,s.day)||typeof a.estateSettled!=='boolean'||!Array.isArray(a.memories)||a.memories.length>8)throw Error('Hubungan warga tidak valid.');
 for(const field of ['relations','equipment','designMemory'])if(!a[field]||typeof a[field]!=='object'||Array.isArray(a[field]))throw Error('Data warga tidak valid.');
 if(Object.keys(a.relations).length>32||Object.keys(a.designMemory).length>600||Object.keys(a.equipment).length>3)throw Error('Arsip warga terlalu besar.');
 for(const [id,n]of Object.entries(a.relations))if(!/^\d+$/.test(id)||Number(id)<1||Number(id)>=s.nextId||!finite(n,-100,100))throw Error('Relasi tidak valid.');
 for(const m of a.memories)if(m.scope!==undefined&&(!Number.isInteger(m.scope)||!finite(m.scope,1,1e8))||!Number.isInteger(m.who)||m.who<1||(m.scope?m.who>1e7:m.who>=s.nextId)||typeof m.name!=='string'||m.name.length>50||!['theft','attack','intimidation','revenge','help','manipulation','hostility','dispute','friendship'].includes(m.kind)||!finite(m.day,0,s.day))throw Error('Ingatan tidak valid.');
 for(const [key,n]of Object.entries(a.designMemory))if(!/^(wood|stone|bone|metal|alloy):(wood|stone|bone|metal|alloy):(fiber|wood|none|metal|alloy):(blade|pick|hoe)(?::(manual|electric))?$/.test(key)||!finite(n,-1,2))throw Error('Ingatan rancangan tidak valid.');
 for(const [job,id]of Object.entries(a.equipment))if(!['wood','stone','farm'].includes(job)||!s.tools.some(t=>t.id===id&&t.owner===a.id&&t.job===job))throw Error('Peralatan warga tidak valid.');
 }
}

export function worldPopulation(s){return s.agents.filter(a=>a.alive).length+(s.world?s.world.settlements.filter(c=>c.id!==1).reduce((n,c)=>n+c.state.agents.filter(a=>a.alive).length,0):0);}

function ensureTurn(s,reset=false){if(reset||!s._turn||s._turn.day!==s.day)Object.defineProperty(s,'_turn',{value:{day:s.day,records:[],allocations:[],farmers:0,defense:0,migrant:null},enumerable:false,configurable:true});}
export function completeProject(s){if(!s.project||s.project.progress<s.project.required)return false;const key=s.project.key;s.buildings[key]++;s.project=null;log(s,BUILDINGS[key].name+' selesai dibangun.');return true;}
export function resolveDeaths(s){for(const a of s.agents){if(a.alive&&a.health<=0){a.alive=false;a.exitReason='death';s.deathCount++;log(s,a.name+' meninggal akibat luka atau peristiwa dunia.');}if(!a.alive&&!a.away&&!a.estateSettled){if(a.exitReason==='death')for(const key of ['food','wood','stone']){s[key]+=a.stash[key];a.stash[key]=0;}a.estateSettled=true;for(const t of s.tools)if(t.owner===a.id&&t.status==='prototype')t.status='failed';}}}
function initNewFields(s){s.achievements??={successfulTools:s.tools.filter(t=>t.measured>.05).length,toolUses:s.tools.reduce((n,t)=>n+t.uses,0),smelt:0,fuel:0,alloy:0,generate:0};s.lastTurn=null;}
export {goal,needBonus};

function validateTurn(s,finite){if(s.lastTurn===null)return;const t=s.lastTurn;if(!t||!finite(t.day,0,s.day)||typeof t.goal!=='string'||t.goal.length>300||!Array.isArray(t.records)||t.records.length>POPULATION_LIMIT||!Array.isArray(t.allocations)||t.allocations.length>16)throw Error('Catatan pekerjaan tidak valid.');const flow=o=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.entries(o).every(([k,n])=>RESOURCE_KEYS.includes(k)&&finite(n,0,1e12));for(const r of t.records)if(!Number.isInteger(r.id)||r.id<1||r.id>=s.nextId||typeof r.name!=='string'||r.name.length>50||!ACTIONS.includes(r.action)||!flow(r.inputs)||!flow(r.outputs)||!(r.target===null||typeof r.target==='string'&&r.target.length<=150)||typeof r.note!=='string'||r.note.length>100)throw Error('Alur bahan tidak valid.');for(const a of t.allocations)if(typeof a.purpose!=='string'||a.purpose.length>100||!flow(a.inputs))throw Error('Alokasi proyek tidak valid.');}
