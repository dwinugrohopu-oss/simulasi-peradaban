import {TOOL_LIMIT} from './rules.js';
import {balance,affordable,spend,known,adults} from './economy.js';
/* Deliberately simplified game physics: these values are relative, not engineering measurements. */
export const MATERIALS={
 metal:{name:'Logam',density:3,hardness:9,strength:95,toughness:80,edge:95},
 alloy:{name:'Paduan',density:2.5,hardness:10,strength:100,toughness:95,edge:100},
 wood:{name:'Kayu',density:.65,hardness:2,strength:40,toughness:65,edge:12},
 stone:{name:'Batu',density:2.6,hardness:8,strength:85,toughness:25,edge:80},
 bone:{name:'Tulang',density:1.7,hardness:4,strength:50,toughness:55,edge:45}
};
export const BINDINGS={metal:{name:'Baut logam',strength:90},alloy:{name:'Las paduan',strength:100},fiber:{name:'Serat',strength:65},wood:{name:'Pasak kayu',strength:40},none:{name:'Tanpa pengikat',strength:10}};
export const SHAPES={blade:{name:'Mata potong',edge:1,impact:.55,soil:.6},pick:{name:'Ujung runcing',edge:.4,impact:1,soil:.7},hoe:{name:'Mata lebar',edge:.55,impact:.6,soil:1}};
export const JOBS=['wood','stone','farm'];
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
export function evaluateDesign(d){
 if(d.drive!==undefined&&!['manual','electric'].includes(d.drive))throw Error('Penggerak alat tidak valid.');
 if(!MATERIALS[d.head]||!MATERIALS[d.handle]||!BINDINGS[d.binding]||!SHAPES[d.shape])throw Error('Komponen rancangan tidak valid.');
 const head=MATERIALS[d.head],handle=MATERIALS[d.handle],binding=BINDINGS[d.binding],shape=SHAPES[d.shape];
 const joint=Math.min(handle.strength,binding.strength),mass=head.density*.35+handle.density*.5;
 const leverage=clamp((handle.toughness/70)*(joint/40),.15,1.25);
 const durability=clamp(head.toughness*.4+joint*.7,8,100);
 const potential={wood:head.edge/100*shape.edge*leverage,stone:head.hardness/10*shape.impact*leverage,farm:head.strength/100*shape.soil*leverage};
 const gain=Object.fromEntries(JOBS.map(k=>[k,clamp(potential[k]-.07*mass,-.3,.9)]));
 if(d.drive==='electric')for(const job of JOBS)gain[job]=Math.min(1.4,gain[job]+.35);
 return {mass,joint,durability,gain,...(d.drive==='electric'?{motorBoost:.35}:{}),risk:clamp((1-joint/75)*.13+(1-head.toughness/100)*.04,.01,.2)};
}
export function designCost(d){const cost={wood:0,stone:0,bone:0,fiber:0};cost[d.head]=(cost[d.head]||0)+2;cost[d.handle]=(cost[d.handle]||0)+1;if(d.binding!=='none')cost[d.binding]=(cost[d.binding]||0)+1;if(d.drive==='electric'){cost.metal=(cost.metal||0)+2;cost.energy=4;}return cost;}
export function designName(d){return `${SHAPES[d.shape].name} ${MATERIALS[d.head].name.toLowerCase()} · ${MATERIALS[d.handle].name.toLowerCase()} + ${BINDINGS[d.binding].name.toLowerCase()}${d.drive==='electric'?' · motor listrik':''}`;}
export function performance(tool,job,powered=true){const condition=clamp(tool.condition/tool.physics.durability,0,1);return 1+((tool.physics.gain[job]||0)-(powered?0:tool.physics.motorBoost||0))*condition;}
export function experiment(s,a,{random,log}){
 const pending=s.tools.find(t=>t.status==='prototype'&&((t.maker??t.owner)===a.id||!s.agents.some(b=>b.id===(t.maker??t.owner)&&b.alive&&!b.away)));if(pending)pending.maker=a.id;
 if(pending){
  const measured=pending.physics.gain[pending.job]+(random(s)-.5)*.12,pass=measured>.05&&pending.physics.joint>=25;
  pending.measured=measured;pending.status=pass?'ready':'failed';pending.testedDay=s.day;s.experiments++;
  if(pass){const worker=s.agents.find(b=>b.id===pending.owner&&b.alive&&!b.away)||a;pending.owner=worker.id;worker.equipment[pending.job]=pending.id;s.achievements.successfulTools++;log(s,`${a.name} menguji ${pending.name}: berhasil, dipakai ${worker.name}.`);}
  else log(s,`${a.name} menguji ${pending.name}: sambungan atau hasilnya kurang baik. Rancangan dicatat untuk diperbaiki.`);
  const signature=[pending.design.head,pending.design.handle,pending.design.binding,pending.design.shape].join(':');
  a.designMemory[signature]=measured+(pass?.1:-.2);
  return pass?4:-1;
 }
 const staff=adults(s);const jobs=JOBS.filter(k=>k!=='farm'||s.buildings.farm);let recipient,job;for(const k of jobs.slice().sort((x,y)=>Math.max(0,...staff.map(b=>b.skills[y]))-Math.max(0,...staff.map(b=>b.skills[x])))){const worker=staff.slice().sort((x,y)=>y.skills[k]-x.skills[k]).find(b=>(b.skills[k]>=5||s.achievements.successfulTools<2)&&toolNeedsReplacement(s,b,k)&&!s.tools.some(t=>t.owner===b.id&&t.job===k&&t.status==='prototype'));if(worker){recipient=worker;job=k;break;}}if(!job)return .1;
 const shared=s.tools.filter(t=>t.job===job&&t.status==='ready').sort((x,y)=>y.measured-x.measured)[0];
 let design;
 const upgrade=upgradeDesign(s,job),oldTool=s.tools.find(t=>t.id===recipient.equipment[job]);
 if(upgrade&&(!oldTool||toolTier(oldTool.design)<toolTier(upgrade))&&affordable(s,designCost(upgrade))){design=upgrade;}
 else if(shared&&random(s)<.65&&(!upgrade||toolTier(shared.design)>=toolTier(upgrade))){design={...shared.design};}
 else {const availableMaterials=['wood','stone','bone',...(known(s,'metallurgy')?['metal']:[]),...(known(s,'mechanics')?['alloy']:[])];const previous=s.tools.filter(t=>(t.maker??t.owner)===a.id&&t.job===job).at(-1);design=previous?{...previous.design}:{head:availableMaterials[Math.floor(random(s)*availableMaterials.length)],handle:availableMaterials[Math.floor(random(s)*availableMaterials.length)],binding:['fiber','wood','none'][Math.floor(random(s)*3)],shape:Object.keys(SHAPES)[Math.floor(random(s)*3)]};
  if(previous){const component=['head','handle','binding','shape'][Math.floor(random(s)*4)],choices=component==='binding'?['fiber','wood','none',...(known(s,'metallurgy')?['metal']:[]),...(known(s,'mechanics')?['alloy']:[])]:component==='shape'?Object.keys(SHAPES):availableMaterials;const candidates=choices.map(value=>({...design,[component]:value}));candidates.sort((x,y)=>score(a,y)-score(a,x));design=random(s)<.7?candidates[0]:candidates[Math.floor(random(s)*candidates.length)];}}
 const cost=designCost(design);if(!affordable(s,cost)||!spend(s,cost))return -1;
 const physics=evaluateDesign(design),tool={id:s.nextToolId++,owner:recipient.id,maker:a.id,job,design,physics,name:designName(design),condition:physics.durability,status:'prototype',createdDay:s.day,testedDay:null,measured:null,uses:0};
 s.tools.push(tool);s.prototypes++;log(s,`${a.name} membuat prototipe ${tool.name}; perlu pengujian.`);
 // Preserve equipped and unfinished prototypes; prune old records to keep browser saves small.
 const equipped=new Set(s.agents.filter(a=>a.alive).flatMap(a=>Object.values(a.equipment)));
 while(s.tools.length>TOOL_LIMIT){const index=s.tools.findIndex(t=>!equipped.has(t.id)&&t.status!=='prototype');if(index<0)break;const [removed]=s.tools.splice(index,1);for(const citizen of s.agents)for(const key of Object.keys(citizen.equipment))if(citizen.equipment[key]===removed.id)delete citizen.equipment[key];}
 return 1;
}
function score(a,d){const key=[d.head,d.handle,d.binding,d.shape].join(':');return a.designMemory[key]??0;}
export function useTool(s,a,job,{random,log}){
 const tool=toolById(s,a.equipment[job]);if(!tool||tool.owner!==a.id||tool.status!=='ready'||tool.condition<=0)return {output:1,energy:1};
 const powered=tool.design.drive!=='electric'||spend(s,{energy:.2});const output=performance(tool,job,powered),energy=clamp(1+tool.physics.mass*.08-Math.max(0,output-1)*.3,.7,1.35);
 tool.uses++;s.achievements.toolUses++;tool.condition=Math.max(0,tool.condition-(.3+tool.physics.mass*.08));
 if(random(s)<tool.physics.risk*.03){a.health=Math.max(0,a.health-1.5);tool.condition=Math.max(0,tool.condition-3);}
 if(!tool.condition){tool.status='broken';delete a.equipment[job];log(s,`${a.name}: ${tool.name} rusak setelah ${tool.uses} pemakaian.`);}
 return {output,energy};
}

export function craftingNeeded(s,a){const demand=craftDemand(s);return demand.value||demand.orphaned||demand.makers.has(a.id);}

export function toolTier(d){return (d.head==='alloy'?2:d.head==='metal'?1:0)+(d.drive==='electric'?1:0)+(d.binding==='metal'||d.binding==='alloy'?.1:0);}
export function upgradeDesign(s,job){if(!s.buildings.workshop||!known(s,'metallurgy'))return null;const material=known(s,'mechanics')?'alloy':'metal';return {head:material,handle:'wood',binding:material,shape:{wood:'blade',stone:'pick',farm:'hoe'}[job],...(known(s,'electricity')&&s.buildings.generator?{drive:'electric'}:{})};}
export function toolNeedsReplacement(s,a,job){const tool=toolById(s,a.equipment[job]);if(!tool||tool.status!=='ready'||tool.condition<=tool.physics.durability*.2)return true;const desired=upgradeDesign(s,job);return !!desired&&toolTier(tool.design)<toolTier(desired);}
function craftDemand(s){const stamp=[s.day,s.prototypes,s.experiments,s.tools.length,s.agents.length,s._context?.civ.discoveries.length||0,s.buildings.workshop,s.buildings.generator].join(':');if(s._craftDemand?.stamp===stamp)return s._craftDemand;const staff=adults(s),ids=new Set(staff.map(a=>a.id)),pending=s.tools.filter(t=>t.status==='prototype'),makers=new Set(pending.map(t=>t.maker??t.owner)),occupied=new Set(pending.map(t=>t.owner+':'+t.job));const value=JOBS.filter(job=>job!=='farm'||s.buildings.farm).some(job=>staff.some(b=>(b.skills[job]>=5||s.achievements.successfulTools<2)&&toolNeedsReplacement(s,b,job)&&!occupied.has(b.id+':'+job)));const cache={stamp,value,makers,orphaned:pending.some(t=>!ids.has(t.maker??t.owner))};Object.defineProperty(s,'_craftDemand',{value:cache,configurable:true,enumerable:false});return cache;}
export function toolById(s,id){if(!s._toolIndex||s._toolIndex.source!==s.tools||s._toolIndex.size!==s.tools.length||s._toolIndex.next!==s.nextToolId)Object.defineProperty(s,'_toolIndex',{value:{source:s.tools,size:s.tools.length,next:s.nextToolId,items:new Map(s.tools.map(t=>[t.id,t]))},configurable:true,enumerable:false});return s._toolIndex.items.get(id);}
