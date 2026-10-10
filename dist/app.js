import {settlementGroups} from './menu-groups.js';
import {combatStats,SPECIES} from './wildlife.js';
import {equipmentStorage} from './storage.js';
import {housingCapacity} from './shelter.js';
import {ARMORS,WEAPONS,VEHICLES} from './equipment.js';
import {warehouseStock,equipmentRows,STOCK_NAMES,VEHICLE_NAMES} from './warehouse.js';
import {BELIEFS,ideologyName,profession} from './ideologies.js';
import {RESEARCH_BRANCHES,RESEARCH_EFFECTS} from './rules.js';
import {NODE_NAMES} from './frontier.js';
import {ATTRIBUTES,GOVERNMENTS,LANGUAGE_STAGES,territory,understanding,sampleSentence} from './civics.js';
import {createNotices} from './notifications.js';
import {buildingCost,known} from './economy.js';
import {stateOf,stageName,DISCOVERIES,discoveryStatus} from './world.js';
import {camera,drawWorld,pan,zoom,focus,hit,hitResource,hitStock} from './map.js';
import {localDraft,describeEffect,OBJECT_LABELS,validateDescriptor} from './world-schema.js';
import {DAY_MS,OFFLINE_CAP,newGame,population,capacity,era,tick,advance,observation,available,epsilon,row,startProject,BUILDINGS,LABELS,POLICIES,validateSave,log,TRAITS,efficiency,expertise,traitBonus,buildingNeeds,applyObject,goal,needBonus} from './engine.js';
let renderCiv=null,renderTargets=null;
const $=id=>renderTargets?.[id]||document.getElementById(id),KEY='peradaban-save-v1',fmt=n=>Math.floor(n).toLocaleString('id-ID');
let state,focusId=1,pendingTarget=1,selected=null,speed=1,previous=Date.now(),saveAt=0,renderAt=0,storageFailed=false,blockedRestore=false,previousHidden=document.hidden;
const view=camera(),worldNotices=createNotices();
let menuOrigin=null,noticeUntil=0,detailCitizen=null;
function currentRoot(){return state;}
function focused(){if(renderCiv)return renderCiv;return state.world.settlements.find(c=>c.id===focusId)||state.world.settlements[0];}
function viewState(){return stateOf(state,focused());}
function selectCivilization(id,center=true){focusId=Number(id);selected=null;detailCitizen=null;revealMenuSettlement=focusId;if(center)focus(view,focused());render();}
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function notice(text){$('notice').textContent=text;$('notice').hidden=false;noticeUntil=Date.now()+8000;}
function error(text){$('error').textContent=text;$('error').hidden=!text;}
function storageMessage(){return storageFailed?'Gagal menyimpan di browser. Unduh cadangan.':'Tersimpan otomatis di browser ini';}
function persist(now=Date.now()){
 if(blockedRestore)return;
 state.lastSaved=now;
 try{localStorage.setItem(KEY,JSON.stringify(state));storageFailed=false;}catch{storageFailed=true;error('Penyimpanan browser tidak tersedia atau penuh. Gunakan Unduh simpanan agar progres tidak hilang.');}
 $('save-status').textContent=storageMessage();saveAt=now;
}
function load(){
 let raw;
 try{raw=localStorage.getItem(KEY);}catch{storageFailed=true;}
 if(raw){try{state=validateSave(JSON.parse(raw));const elapsed=Math.max(0,Date.now()-state.lastSaved),days=advance(state,elapsed);if(days)notice(`Saat kamu pergi, ${fmt(days)} hari berlalu. Penduduk tetap belajar. Waktu dihitung maksimal 8 jam.`);}catch{state=newGame();state.paused=true;error('Simpanan browser tidak dapat dibaca. Simulasi baru dijeda dan simpanan lama tidak ditimpa. Unduh cadangan lama atau impor file yang valid.');storageFailed=true;blockedRestore=true;$('save-status').textContent='Simpanan lama dipertahankan; impor atau mulai dunia baru.';return;}}
 else state=newGame();
 persist();
}
function meter(value){const t=el('div',undefined,'track'),f=el('div',undefined,'fill');f.style.width=Math.min(100,Math.max(0,value))+'%';t.append(f);return t;}
function showBuildings(){
 const state=viewState();
 $('project').replaceChildren();if(state.project){const b=BUILDINGS[state.project.key],p=el('div',undefined,'project');p.append(el('strong',b.name+' sedang dibangun'),meter(state.project.progress/state.project.required*100),el('small',`${Math.floor(state.project.progress)} / ${state.project.required} kerja`));$('project').append(p);}
 const needs=buildingNeeds(state);
 $('buildings').replaceChildren(inventoryTable('Bangunan · '+focused().name,['Bangunan','Jumlah','Biaya','Kebutuhan'],Object.entries(BUILDINGS).map(([key,b])=>{const need=needs.find(n=>n.key===key)||{score:0};return [b.name,state.buildings[key],Object.entries(buildingCost(b)).map(([k,v])=>v+' '+resourceName(k)).join(' · '),b.requires&&!known(state,b.requires)?'Prasyarat: '+DISCOVERIES[b.requires].name:need.score>0?need.reason:'Tercukupi'];})));

}
function showAgents(){
 const civ=focused(),state=viewState(),agents=$('agent-filter').value==='all'?state.agents:state.agents.filter(a=>a.alive),table=el('table',undefined,'people-table'),thead=el('thead'),header=el('tr'),body=el('tbody');
 for(const label of ['Nama','Sedang apa','Pekerjaan','Umur','Info'])header.append(el('th',label));thead.append(header);table.append(thead,body);
 for(const a of agents){const row=el('tr');row.append(el('td',a.name),el('td',a.alive?(a.away?'Ekspedisi':a.journey?`${LABELS[a.action]} · ${a.journey.phase==='return'?'Pulang':a.journey.phase==='harvest'?'Mengambil resource':a.journey.phase==='camp'?'Di front':'Berangkat'}`:LABELS[a.action]):a.exitReason==='emigration'?'Pindah':'Meninggal'),el('td',profession(state,a,civ)),el('td',a.age+' tahun'));const cell=el('td'),button=el('button','Detail');button.setAttribute('aria-label','Detail '+a.name);button.onclick=()=>{selectCivilization(civ.id,false);detailCitizen=a.id;showCitizenDetail();$('agent-detail-close').focus();$('agent-detail').scrollIntoView({behavior:'smooth',block:'nearest'});};cell.append(button);row.append(cell);body.append(row);}
 const scroll=$('agents').scrollLeft;$('agents').replaceChildren(table);$('agents').scrollLeft=scroll;
 if(!agents.length)$('agents').append(el('p','Tidak ada penduduk aktif.'));
}
function showCitizenDetail(){
 const state=viewState(),a=state.agents.find(a=>a.id===detailCitizen);$('agent-detail').hidden=!a;$('agent-detail-content').replaceChildren();if(!a)return;
 $('agent-detail-name').textContent='Detail '+a.name+' · '+focused().name;const locations=equipmentStorage(state);
 const c=el('div',undefined,'agent'),head=el('header'),text=el('div');text.append(el('strong',a.name),el('small',`${a.age} tahun${a.alive?'':' · arsip'}`));head.append(el('div',a.name.charAt(0),'portrait'),text);c.append(head,el('div',a.alive?(a.away?'Sedang ekspedisi':(a.age<16?'Tumbuh · ':'')+LABELS[a.action]):a.exitReason==='emigration'?'Pindah permukiman':'Kehidupan selesai','action'));const bars=el('div',undefined,'bars');for(const [label,value]of [['Kesehatan',a.health],['Energi',a.energy],['Suasana hati',a.mood]]){const b=el('div');b.append(el('label',`${label} ${Math.round(value)}%`),meter(value));bars.append(b);}c.append(el('small',profession(state,a,focused())),el('small',ideologyName(a)),el('small',Object.entries(BELIEFS).map(([k,label])=>label+' '+Math.round(a.ideology[k])).join(' · ')));c.append(el('small',a.traits.map(k=>TRAITS[k].name).join(' · '),'trait-tags'));const skilled=Object.entries(a.skills).filter(([k,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,3);c.append(el('small',skilled.map(([k,v])=>`${LABELS[k]}: ${expertise(a,k)} (${Math.floor(v)})`).join(' · ')));c.append(el('small',`Reputasi ${Math.round(a.reputation)} · Pribadi: ${fmt(a.stash.food)} pangan, ${fmt(a.stash.wood)} kayu, ${fmt(a.stash.stone)} batu`));c.append(el('small',a.home?'Rumah: '+BUILDINGS[a.home.kind].name+' '+a.home.building+' · Tempat '+a.home.bed:'Tanpa rumah · tidur di luar, pemulihan lebih rendah','housing-state'));if(a.illnessDays)c.append(el('small','Sedang sakit · '+a.illnessDays+' hari','illness-state'));c.append(showEquipmentSlots(state,a,locations));const attributes=el('div',undefined,'attribute-grid');for(const [key,label]of Object.entries(ATTRIBUTES))attributes.append(el('small',label+' '+Math.round(a.attributes[key])));c.append(attributes);const battle=combatStats(state,a);c.append(el('small',`Pertarungan: serangan ${Math.round(battle.attack)} · pertahanan ${Math.round(battle.defense)} · kecepatan ${Math.round(battle.speed)} · latihan bertahan ${Math.floor(a.skills.defend)}, berburu ${Math.floor(a.skills.hunt)}, menghindar ${Math.floor(a.skills.flee)}`));c.append(bars,el('div',`Kepekaan sihir ${a.arcaneSensitivity} · ${fmt(a.steps)} pengalaman · lapar ${Math.round(a.hunger)}%`,'metrics'));const b=el('button','Lihat pembelajaran →');b.onclick=()=>{selected=a.id;$('inspect').value=String(a.id);showModel();openMenu('learning');$('model').scrollIntoView({behavior:'smooth',block:'center'});};c.append(b);$('agent-detail-content').append(c);
}
$('agent-detail-close').onclick=()=>{detailCitizen=null;showCitizenDetail();};
function showEquipmentSlots(s,a,locations){
 const grid=el('div',undefined,'equipment-slots');
 for(const [slot,label]of [['wood','Penebangan'],['stone','Penggalian'],['farm','Pertanian'],['weapon','Senjata'],['armor','Pelindung'],['vehicle','Kendaraan']]){
  const category=slot==='weapon'?'weapons':slot==='armor'?'armors':slot==='vehicle'?'vehicles':'tools',id=slot==='vehicle'?a.journey?.vehicle:a.equipment[slot],item=s[category].find(item=>item.id===id),cell=el('div',undefined,'equipment-slot');cell.append(el('small',label));
  if(!item){cell.append(el('span','Kosong'));}else{const name=category==='tools'?item.name:category==='weapons'?{stone:'Senjata batu',metal:'Senjata logam',ballistic:'Senjata balistik'}[item.type]:category==='armors'?ARMORS[item.type].name:VEHICLE_NAMES[item.type],max=category==='tools'?item.physics.durability:100;
   const using=category==='tools'?a.action===slot:slot==='weapon'?['defend','hunt'].includes(a.action):!!a.journey;
   const place=locations.stored[category].has(id)?'Di gudang':locations.carried[category].has(id)?using?'Digunakan':'Dibawa':'Di tanah';
   cell.append(el('strong',name),el('small',Math.round(item.condition/max*100)+'% · '+place),el('small','Daya tahan '+Math.round(category==='tools'?max:(category==='weapons'?WEAPONS:category==='armors'?ARMORS:VEHICLES)[item.type].durability)+' · '+item.uses+'× pakai'));cell.setAttribute('title',name+' · Ketahanan '+item.condition.toFixed(1)+'/'+max+(category==='tools'?'':' · Daya tahan '+(category==='weapons'?WEAPONS:category==='armors'?ARMORS:VEHICLES)[item.type].durability));
  }grid.append(cell);
 }return grid;
}
function showModel(){
 const state=viewState();
 const a=state.agents.find(a=>a.id===selected)||population(state)[0]||state.agents.at(-1);$('model').replaceChildren();if(!a)return;selected=a.id;$('inspect').value=String(a.id);
 for(const m of a.memories.slice(0,4))$('model').append(el('small',`Hari ${m.day}: ${m.name} · ${{theft:'pencurian',intimidation:'intimidasi',revenge:'balas dendam',help:'bantuan',manipulation:'manipulasi',hostility:'permusuhan',dispute:'perselisihan',friendship:'pertemanan'}[m.kind]||m.kind}`));
 const agenda=goal(state);const stateKey=observation(state,a),values=row(a,stateKey),allowed=available(state,a),ranked=allowed.slice().sort((x,y)=>values[y]+traitBonus(a,y)+needBonus(state,a,y,agenda)-values[x]-traitBonus(a,x)-needBonus(state,a,x,agenda));const max=Math.max(1,...allowed.map(k=>Math.abs(values[k])));
 $('model').append(el('small',`${focused().name} · ${a.name} · eksplorasi ${Math.round(epsilon(a)*100)}% · ${Object.keys(a.q).length} situasi dikenal`),el('p',`Situasi kini: ${a.hunger>=55?'lapar':'cukup kenyang'}, ${a.energy<35?'energi rendah':'energi cukup'}, ${a.health<45?'kesehatan rendah':'kesehatan cukup'}, ${a.home?'punya rumah':'tanpa rumah'}, ${state.buildings.farm?'ada ladang':'belum ada ladang'}${a.journey?' · perjalanan '+a.journey.phase+' · bekal '+fmt(a.journey.provisions):''}.`));
 if(a.tripCredit)$('model').append(el('small',`Hasil perjalanan akan memperbarui keputusan ${LABELS[a.tripCredit.action]}: ${a.tripCredit.days} hari, nilai sementara ${a.tripCredit.reward.toFixed(1)}.`));
 for(const key of ranked){const r=el('div',undefined,'model-row'+(key===ranked[0]?' best':''));r.append(el('span',LABELS[key]),el('strong',(values[key]+traitBonus(a,key)+needBonus(state,a,key,agenda)).toFixed(2)),meter(Math.abs(values[key])/max*100));$('model').append(r);}
 $('model').append(el('small',`Pengalaman, sifat, dan kebutuhan desa biasanya dipilih; eksplorasi masih dapat memilih tindakan lain. Hadiah terakhir: ${a.lastReward.toFixed(1)}.`));
}
function showObjects(){
 const state=viewState();
 $('world-objects').replaceChildren(...state.objects.map(o=>{const d=el('div',undefined,'world-object');d.append(el('strong',o.descriptor.name),el('small',OBJECT_LABELS[o.kind]+' · '+(o.kind==='event'?o.remaining+' hari tersisa':o.kind==='building'?'Bangunan aktif':'Cadangan '+Math.floor(o.stock))),el('small',describeEffect(o.descriptor)));return d;}));
}
function drawMap(time){const canvas=$('world'),rect=canvas.getBoundingClientRect();const width=Math.max(1,Math.round(rect.width)),height=Math.max(1,Math.round(rect.height));if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}drawWorld(state,view,$('world'),focusId,time);}
function drawChart(){const state=viewState();const c=$('chart'),ctx=c.getContext('2d'),data=state.history;ctx.clearRect(0,0,c.width,c.height);const max=Math.max(30,...data.map(h=>h.food));ctx.strokeStyle='#2e4035';for(let i=0;i<4;i++){const y=20+i*45;ctx.beginPath();ctx.moveTo(10,y);ctx.lineTo(590,y);ctx.stroke();}ctx.font='12px system-ui';ctx.fillStyle='#9aae9b';if(data.length<2){ctx.fillText('Grafik tersedia setelah 20 hari.',15,100);return;}ctx.beginPath();data.forEach((h,i)=>{const x=12+i/(data.length-1)*575,y=170-h.food/max*145;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle='#afd29b';ctx.lineWidth=3;ctx.stroke();$('chart-caption').textContent=`Hari ${fmt(data[0].day)}–${fmt(data.at(-1).day)} · rentang 0–${fmt(max)} makanan`;}

let groupedWorld=null,revealMenuSettlement=1;
const menuTrees=new Map();
const groupedCategories=[
 {id:'people',target:'agents',fields:[['agents','div','people-table-scroll']],show:showAgents},
 {id:'resources',target:'resources',fields:[['warehouse-title','h3'],['warehouse-status','p'],['resources','div'],['warehouse-custom','div'],['tools','div']],show:()=>{showWarehouse();showTools();}},
 {id:'buildings',target:'buildings',fields:[['project','div'],['buildings','div']],show:showBuildings},
 {id:'development',target:'discoveries',fields:[['discoveries','div'],['custom-resources','div']],show:showDiscoveries},
 {id:'flow',target:'flows',fields:[['flow-goal','p'],['flows','div']],show:showFlow},
 {id:'culture',target:'government',fields:[['government','div'],['language','div']],show:showCulture},
 {id:'policy',target:'group-policy',fields:[['group-policy','div']],show:showSettlementPolicy},
 {id:'learning',target:'group-learning',fields:[['group-learning','div']],show:showSettlementLearning},
 {id:'journal',target:'logs',fields:[['logs','div']],show:showSettlementJournal},
 {id:'trends',target:'group-trends',fields:[['chart','canvas'],['chart-caption','p']],show:drawChart}
];
function groupBranch(level,key){
 const node=el('details',undefined,'menu-group menu-group-'+level),summary=el('summary'),content=el('div',undefined,'group-content');
 node.dataset.groupLevel=level;node.dataset.groupKey=key;node.append(summary,content);return {node,summary,content};
}
function renderSettlementLeaf(config,leaf){
 if(!leaf.path.every(branch=>branch.node.open))return;
 const civ=state.world.settlements.find(c=>c.id===leaf.civId);if(!civ)return;
 if(document.activeElement?.tagName==='SELECT'&&leaf.content.contains?.(document.activeElement))return;
 const scrolls=new Map([...leaf.content.querySelectorAll('.inventory-scroll')].map(n=>[n.getAttribute('aria-label'),n.scrollLeft]));
 const oldCiv=renderCiv,oldTargets=renderTargets;renderCiv=civ;renderTargets=leaf.targets;
 try{config.show();for(const n of leaf.content.querySelectorAll('.inventory-scroll'))n.scrollLeft=scrolls.get(n.getAttribute('aria-label'))||0;}finally{renderCiv=oldCiv;renderTargets=oldTargets;}
}
function showGroupedMenus(){
 if(groupedWorld!==state){menuTrees.clear();groupedWorld=state;revealMenuSettlement=focusId;}
 const groups=settlementGroups(state);
 for(const config of groupedCategories){
  let tree=menuTrees.get(config.id);if(!tree){tree={branches:new Map(),leaves:new Map(),stamp:null};menuTrees.set(config.id,tree);}
  const roots=[],stamp=[];for(const b of tree.branches.values())b.nextChildren=null;
  const branch=(level,key)=>{let b=tree.branches.get(key);if(!b){b=groupBranch(level,key);b.node.ontoggle=()=>{for(const leaf of tree.leaves.values())renderSettlementLeaf(config,leaf);};tree.branches.set(key,b);}return b;};
  for(const group of groups){
   const government=branch('government','government:'+group.id),regions=[];
   government.summary.textContent='Pemerintahan '+group.leader.name+' · '+GOVERNMENTS[group.leader.government.type]+' · '+group.population+' warga';
   for(const region of group.regions){
    const district=branch('region','region:'+group.id+':'+region.id),settlements=[];
    district.summary.textContent=region.name+' · '+region.members.length+' permukiman · '+region.population+' warga';
    for(const civ of region.members){
     let leaf=tree.leaves.get(civ.id);
     if(!leaf){
      const b=groupBranch('settlement','settlement:'+civ.id),targets={};b.node.dataset.settlementId=String(civ.id);
      const mapButton=el('button','Lihat di peta','settlement-focus');mapButton.onclick=()=>selectCivilization(civ.id);b.content.append(mapButton);
      for(const [id,tag,cls]of config.fields){const node=el(tag,undefined,cls);node.dataset.field=id;if(tag==='canvas'){node.width=600;node.height=190;node.setAttribute('aria-label','Grafik pangan '+civ.name);}targets[id]=node;b.content.append(node);}
      leaf={...b,targets,civId:civ.id,path:[]};tree.leaves.set(civ.id,leaf);
      leaf.node.ontoggle=()=>renderSettlementLeaf(config,leaf);
     }
     leaf.path=[government,district,leaf];const s=stateOf(state,civ);
     leaf.summary.textContent=civ.name+' · '+s.agents.filter(a=>a.alive).length+' warga'+(civ.id===focusId?' · di peta':'');
     if(revealMenuSettlement===civ.id)for(const b of leaf.path)b.node.open=true;
     settlements.push(leaf.node);stamp.push(group.id+':'+region.id+':'+civ.id);
    }
    regions.push(district.node);
    district.nextChildren=settlements;
   }
   government.nextChildren=regions;roots.push(government.node);
  }
  const signature=stamp.join('|');
  if(tree.stamp!==signature){
   for(const b of tree.branches.values())if(b.nextChildren)b.content.replaceChildren(...b.nextChildren);
   $(config.target).replaceChildren(...roots);tree.stamp=signature;
  }
  for(const leaf of tree.leaves.values())renderSettlementLeaf(config,leaf);
 }
 revealMenuSettlement=null;
}
function showSettlementPolicy(){
 const civ=focused(),s=viewState(),select=el('select');select.setAttribute('aria-label','Prioritas '+civ.name);select.disabled=blockedRestore;
 for(const [key,label]of Object.entries(POLICIES)){const option=el('option',label);option.value=key;select.append(option);}select.value=s.policy;
 select.onchange=()=>{if(blockedRestore)return;catchUp();const target=stateOf(state,civ);target.policy=select.value;log(target,'Prioritas berubah: '+POLICIES[target.policy]+'.');persist();render();};
 $('group-policy').replaceChildren(el('label','Prioritas '+civ.name),select,el('p',goal(s).reason));
}
function showSettlementLearning(){
 const civ=focused(),s=viewState(),table=el('table',undefined,'people-table'),head=el('thead'),header=el('tr'),body=el('tbody');
 for(const title of ['Nama','Pengalaman','Situasi','Model'])header.append(el('th',title));head.append(header);table.append(head,body);
 for(const a of s.agents){const tr=el('tr'),cell=el('td'),button=el('button','Periksa');button.onclick=()=>{selectCivilization(civ.id,false);selected=a.id;showModel();$('model').scrollIntoView({behavior:'smooth',block:'nearest'});};cell.append(button);tr.append(el('td',a.name),el('td',fmt(a.steps)),el('td',fmt(Object.keys(a.q).length)),cell);body.append(tr);}
 const wrap=el('div',undefined,'people-table-scroll');wrap.append(table);$('group-learning').replaceChildren(wrap);
}
function showSettlementJournal(){
 $('logs').replaceChildren(...viewState().logs.map(l=>{const d=el('div',undefined,'log');d.append(el('small','HARI '+l.day),el('p',l.text));return d;}));
}
function render(){
 worldNotices.collect(currentRoot());if($('menu-drawer').hidden)showNotification();if(Date.now()>=noticeUntil)$('notice').hidden=true;
 const root=currentRoot();const state=viewState();showCivilizations(root);
 const active=population(state),all=state.agents,steps=all.reduce((n,a)=>n+a.steps,0);
 $('era').textContent=focused().name+' · '+stageName(focused());$('date').textContent=`Tahun ${Math.floor(root.day/60)+1} · Hari ${root.day%60+1}`;
 $('pause').disabled=blockedRestore;$('policy').disabled=blockedRestore;
 $('pause').textContent=root.paused?'Lanjutkan':'Jeda';$('world-status').textContent=!active.length?'Permukiman berakhir':root.paused?'Waktu dijeda':'Penduduk beraktivitas';$('policy').value=state.policy;
 $('population').textContent=`${active.length} di desa · ${state.agents.filter(a=>a.alive&&a.away).length} kru / ${capacity(state)} tempat`;
 showGroupedMenus();showCitizenDetail();showObjects();
 $('learning-stats').replaceChildren();for(const [label,value]of [['Keputusan dipelajari',fmt(state.totalSteps)],['Situasi dikenal',fmt(all.reduce((n,a)=>n+Object.keys(a.q).length,0))],['Pilihan eksplorasi',Math.round(all.reduce((n,a)=>n+a.explorations,0)/Math.max(1,steps)*100)+'%'],['Rata-rata hadiah',(all.reduce((n,a)=>n+a.rewardSum,0)/Math.max(1,steps)).toFixed(1)]]){const b=el('div');b.append(el('strong',value),el('small',label));$('learning-stats').append(b);}
 const options=all.map(a=>el('option',a.name+(a.alive?'':' · arsip')));options.forEach((o,i)=>o.value=String(all[i].id));$('inspect').replaceChildren(...options);showModel();

}
function catchUp(now=Date.now()){
 const elapsed=Math.max(0,now-previous);previous=now;
 // Visible speed affects active play only. Away time always advances at normal speed.
 if(!previousHidden&&elapsed<10000)advance(state,Math.min(elapsed,OFFLINE_CAP)*speed);
 else advance(state,elapsed);
 previousHidden=document.hidden;
}
$('pause').onclick=()=>{catchUp();state.paused=!state.paused;persist();render();};
$('speed').onchange=()=>{catchUp();speed=Number($('speed').value);};
$('policy').onchange=()=>{catchUp();const target=viewState();target.policy=$('policy').value;log(target,'Prioritas berubah: '+POLICIES[target.policy]+'.');persist();render();};
$('agent-filter').onchange=showGroupedMenus;$('inspect').onchange=()=>{selected=Number($('inspect').value);showModel();};
$('export').onclick=()=>{let content;if(blockedRestore){try{content=localStorage.getItem(KEY);}catch{}}if(!content){persist();content=JSON.stringify(state,null,2);}const url=URL.createObjectURL(new Blob([content],{type:'application/json'})),a=el('a');a.href=url;a.download='peradaban-hari-'+state.day+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import-button').onclick=()=>$('import').click();$('import').onchange=async()=>{const f=$('import').files[0];try{if(!f)return;if(f.size>64*1024*1024)throw Error('File terlalu besar (maksimal 64 MB).');const candidate=validateSave(JSON.parse(await f.text()));if(!confirm('Ganti dunia saat ini dengan simpanan ini? Unduh cadangan dulu jika ingin menyimpan dunia lama.'))return;state=candidate;worldNotices.reset(state);closeMenu();focusId=1;focus(view,focused());state.lastSaved=Date.now();previous=Date.now();selected=null;detailCitizen=null;pendingObject=null;$('draft-preview').hidden=true;storageFailed=false;blockedRestore=false;error('');persist();render();notice('Simpanan dan model belajar berhasil diimpor. Waktu di dalam file dipulihkan tanpa menambah waktu berlalu.');}catch(e){error(e.message||'File tidak valid.');}finally{$('import').value='';}};
$('new').onclick=()=>{if(!confirm('Mulai dunia baru? Unduh simpanan terlebih dahulu jika ingin mempertahankan dunia ini.'))return;state=newGame();worldNotices.reset(state);closeMenu();focusId=1;focus(view,focused());previous=Date.now();selected=null;detailCitizen=null;pendingObject=null;$('draft-preview').hidden=true;storageFailed=false;blockedRestore=false;error('');persist();$('notice').hidden=true;render();};
let promptMode='local',pendingObject=null,promptBusy=false;
async function initPrompt(){
 try{const r=await fetch('/api/config');if(!r.ok)throw Error('static');const c=await r.json();promptMode=c.enabled?c.mode:'disabled';$('llm-status').textContent=c.message;$('token-field').hidden=!c.authRequired;$('draft-button').disabled=!c.enabled;}
 catch{promptMode='local';$('llm-status').textContent='Mode lokal (kata kunci). LLM memerlukan deployment Web Service dengan env API.';}
}
$('prompt-form').onsubmit=async event=>{
 event.preventDefault();if(promptBusy||blockedRestore)return;promptBusy=true;const world=state,targetId=focusId;error('');$('draft-button').disabled=true;
 try{const prompt=$('world-prompt').value.trim();if(!prompt||prompt.length>1200)throw Error('Tulis prompt 1–1200 karakter.');let result;
 if(promptMode==='local')result={descriptor:localDraft(prompt),mode:'local'};
 else {if(promptMode==='disabled')throw Error('Layanan LLM belum dikonfigurasi.');const r=await fetch('/api/draft',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+$('world-token').value},body:JSON.stringify({prompt}),signal:AbortSignal.timeout(45000)});result=await r.json();if(!r.ok)throw Error(result.error||'Layanan prompt tidak merespons.');}
 if(state!==world)return;pendingObject=validateDescriptor(result.descriptor);pendingTarget=targetId;$('draft-title').textContent=pendingObject.name+' → '+state.world.settlements.find(c=>c.id===pendingTarget).name+' · '+(result.mode==='llm'?'LLM':'mode lokal');$('draft-description').textContent=pendingObject.description;$('draft-effect').textContent=describeEffect(pendingObject);$('draft-preview').hidden=false;
 }catch(e){error(e.name==='TimeoutError'?'Permintaan prompt terlalu lama. Coba lagi.':e.message);}finally{promptBusy=false;$('draft-button').disabled=promptMode==='disabled';}
};
$('apply-object').onclick=()=>{if(!pendingObject||blockedRestore)return;try{catchUp();applyObject(state,pendingObject,pendingTarget);pendingObject=null;$('draft-preview').hidden=true;persist();render();notice('Objek dimasukkan. Warga akan menyesuaikan keputusan lewat pengalaman.');}catch(e){error(e.message);}};
$('discard-object').onclick=()=>{pendingObject=null;$('draft-preview').hidden=true;};
initPrompt();
// Page hide saves the exact current state, while reload recovers elapsed time.
window.addEventListener('pagehide',()=>{if(!blockedRestore){catchUp();persist();}});
document.addEventListener('visibilitychange',()=>{catchUp();if(!blockedRestore)persist();render();});
load();worldNotices.reset(state);initMenus();initMap();focus(view,focused());render();
setInterval(()=>{if(blockedRestore)return;const now=Date.now();catchUp(now);if(now-renderAt>=800&&!document.hidden){render();renderAt=now;}if(now-saveAt>=5000)persist(now);},250);
function animate(time){if(!document.hidden)drawMap(time);requestAnimationFrame(animate);}requestAnimationFrame(animate);

function inventoryTable(title,headers,rows){
 const wrap=el('div',undefined,'inventory-scroll'),table=el('table',undefined,'inventory-table');
 wrap.tabIndex=0;wrap.setAttribute('aria-label',title);table.append(el('caption',title));
 const head=el('thead'),tr=el('tr');for(const text of headers){const th=el('th',text);th.setAttribute('scope','col');tr.append(th);}head.append(tr);table.append(head);
 const body=el('tbody');for(const values of rows){const tr=el('tr');values.forEach((value,i)=>{const td=el(i===0?'th':'td',String(value));if(i===0)td.setAttribute('scope','row');tr.append(td);});body.append(tr);}table.append(body);wrap.append(table);return wrap;
}
function showWarehouse(){
 const civ=focused(),stock=warehouseStock(state,civ);
 const s=viewState();$('warehouse-title').textContent=(s.buildings.warehouse?'Gudang ':'Tumpukan di tanah · ')+civ.name;
 $('warehouse-status').textContent=s.buildings.warehouse+' gudang · '+s.agents.filter(a=>a.alive&&!a.home).length+' tanpa rumah / '+housingCapacity(s)+' tempat · Pengetahuan '+fmt(s.tech)+' · Keharmonisan '+Math.round(s.harmony)+'% · '+s.birthCount+' lahir · '+s.immigrationCount+' datang · '+s.emigrationCount+' pindah · '+s.deathCount+' meninggal';
 $('resources').replaceChildren(inventoryTable('Persediaan · '+civ.name,['Bahan','Gudang','Tanah','Total'],Object.entries(stock.resources).map(([key,value])=>[STOCK_NAMES[key],fmt(stock.stored[key]),fmt(stock.ground[key]),fmt(value)])));
 $('warehouse-custom').replaceChildren();if(stock.custom.length)$('warehouse-custom').append(inventoryTable('Bahan khusus',['Bahan','Gudang','Tanah'],stock.custom.map(r=>[r.name,fmt(r.stored),fmt(r.ground)])));

}
function showTools(){
 const s=viewState(),groups=[['tools','Alat kerja'],['weapons','Senjata'],['armors','Pelindung'],['vehicles','Kendaraan']].map(([category,title])=>({category,title,rows:equipmentRows(s,category)}));
 const stamp=JSON.stringify([focused().id,groups,s.buildings.warehouse,s.vehicleProject,s.prototypes,s.experiments]);if($('tools').dataset.inventoryStamp===stamp)return;
 const scrolls=new Map([...$('tools').querySelectorAll('.inventory-scroll')].map(node=>[node.getAttribute('aria-label'),node.scrollLeft]));$('tools').dataset.inventoryStamp=stamp;
 $('tools').replaceChildren(el('h3','Peralatan gudang'),el('small','Slot warga tetap dicatat saat alat dikembalikan ke gudang. Peralatan di tanah cepat rusak; pemakaian dan perjalanan juga mengurangi ketahanan.'));
 for(const {category,title,rows}of groups){
  if(!rows.length){$('tools').append(el('p',title+': belum ada.'));continue;}
  const headers=['Jenis','Gudang','Tanah','Dibawa','Kondisi'];
  $('tools').append(inventoryTable(title,headers,rows.map(r=>[r.name,r.stored,r.ground,r.carried||0,r.condition===null?'—':Math.round(r.condition)+'%'])));
  const pending=rows.reduce((n,r)=>n+r.pending,0),archive=rows.reduce((n,r)=>n+r.archive,0);if(pending||archive)$('tools').append(el('small',title+': '+pending+' menunggu uji · '+archive+' arsip/rusak'));

 }
 if(s.vehicleProject)$('tools').append(el('p','Perakitan '+VEHICLE_NAMES[s.vehicleProject.type]+': '+s.vehicleProject.progress.toFixed(1)+' / '+s.vehicleProject.required));
 $('tools').append(el('small',s.prototypes+' prototipe dibuat · '+s.experiments+' pengujian'));
 for(const node of $('tools').querySelectorAll('.inventory-scroll'))node.scrollLeft=scrolls.get(node.getAttribute('aria-label'))||0;
}

function showCivilizations(root){
 const options=root.world.settlements.map(c=>{const o=el('option',c.name+' · '+stageName(c));o.value=String(c.id);return o;});$('civilization').replaceChildren(...options);$('civilization').value=String(focusId);
 $('planet').replaceChildren(...root.world.planets.map(p=>{const o=el('option',p.name);o.value=String(p.id);return o;}));$('planet').value=String(view.planet);$('map-layer').value=view.layer;$('zoom-label').textContent=Math.round(view.zoom*100)+'%';
 $('world-summary').textContent=`${root.world.settlements.length} peradaban · ${root.world.splits} perpecahan · ${root.world.wars} perang · ${root.world.contacts} kontak · ${root.world.colonies} koloni`;
 $('civilizations').replaceChildren(...root.world.settlements.map(c=>{const s=stateOf(root,c),card=el('button',undefined,'civilization-card'+(c.id===focusId?' selected':''));card.append(el('strong',c.name),el('small',`${c.species==='alien'?'Alien':'Manusia'} · ${root.world.planets[c.planet].name} · ${population(s).length} warga`),el('small',stageName(c)+(c.war?' · Perang':c.magic?' · Sihir':'')),el('small',c.contacts.length?'Kontak: '+c.contacts.map(id=>root.world.settlements.find(o=>o.id===id)?.name).join(', '):'Belum mengenal peradaban lain'));card.onclick=()=>selectCivilization(c.id);return card;}));
}
function showDiscoveries(){const civ=focused(),s=viewState();$('discoveries').replaceChildren(el('p',civ.magic?'Sihir dipakai untuk pemulihan warga dan membantu proyek.':`Sihir: pengamatan ${Math.min(60,civ.magicProgress)}/60. Perlu sumber dekat, warga peka ≥75, keahlian penelitian ≥20, dan pengetahuan ≥40.`));
 $('discoveries').append(el('p',civ.studies.length+' proyek paralel · faktor koordinasi '+(1+.15*Math.max(0,civ.studies.length-1)).toFixed(2)+'×. Setiap fasilitas menampung 2 peneliti per hari.'));
 const opened=$('discoveries').branchState??=new Map();
 for(const [branch,info]of Object.entries(RESEARCH_BRANCHES)){
  const group=el('details'),summary=el('summary',info.name+' · '+s.buildings[info.facility]+' fasilitas');group.dataset.branch=branch;
  group.open=opened.has(branch)?opened.get(branch):civ.studies.some(p=>DISCOVERIES[p.id].branch===branch);group.ontoggle=()=>opened.set(branch,group.open);group.append(summary);
  const rows=Object.entries(DISCOVERIES).filter(([,d])=>d.branch===branch).map(([id,d])=>{const done=civ.discoveries.includes(id),p=civ.studies.find(p=>p.id===id),status=discoveryStatus(state,civ,id);return [d.name,done?'Dikuasai':p?`Riset ${p.progress.toFixed(1)} / ${p.required} · ${p.workers.length} peneliti`:status.missing.join(' · ')||'Siap',RESEARCH_EFFECTS[id],Object.entries(d.cost).map(([k,v])=>resourceName(k)+' '+v).join(' · ')];});
  group.append(inventoryTable(info.name,['Penemuan','Status','Manfaat','Biaya'],rows));$('discoveries').append(group);
 }

 $('discoveries').append(el('small',civ.flight?`${civ.flight.phase==='return'?'Kru kembali dari':'Ekspedisi menuju'} ${state.world.planets[civ.flight.destination].name}: ${civ.flight.remaining} hari. Kru: ${civ.flight.crew.map(id=>s.agents.find(a=>a.id===id)?.name).join(', ')}. Bekal ${civ.flight.cargo.food.toFixed(1)}.`:`Pengamatan radio ${Math.min(100,civ.signalProgress)}/100 · ${civ.ship?'Perakitan wahana '+civ.ship.progress.toFixed(1)+'/'+civ.ship.required:civ.expeditionPlan?'Mengumpulkan bahan dan kru':'Belum ada wahana disiapkan'}`));
 $('custom-resources').replaceChildren(...s.customResources.map(r=>{const item=el('div',undefined,'world-object');item.append(el('strong',r.name),el('small',`${fmt(r.stock)} di alam · ${r.amount.toFixed(1)} terkumpul · ${r.category}`),el('small',`Energi ${r.energy} · Sihir ${r.arcane} · Riset ${r.research} · Toksisitas ${r.toxicity}`));return item;}));
 for(const e of state.world.events.filter(e=>e.civ===civ.id))$('custom-resources').append(el('p',`${e.descriptor.name}: ${e.active?e.remaining+' hari tersisa':'menunggu '+e.descriptor.trigger}`));
}
function initMap(){
 const canvas=$('world'),pointers=new Map();let drag=null,pinch=null;
 const pos=e=>{const rect=canvas.getBoundingClientRect();return {x:(e.clientX-rect.left)*canvas.width/rect.width,y:(e.clientY-rect.top)*canvas.height/rect.height};};
 for(const [id,key]of [['government-overlay','governmentOverlay'],['language-overlay','languageOverlay'],['resource-overlay','resourceOverlay']])$(id).onclick=()=>{view[key]=!view[key];$(id).setAttribute('aria-pressed',String(view[key]));drawMap(Date.now());};
 $('stock-mode').value=view.stockMode;$('stock-mode').onchange=()=>{view.stockMode=$('stock-mode').value;drawMap(Date.now());};
 const refresh=()=>{$('zoom-label').textContent=Math.round(view.zoom*100)+'%';drawMap(Date.now());};
 canvas.addEventListener('wheel',e=>{e.preventDefault();const p=pos(e);zoom(view,Math.exp(-e.deltaY*.001),p.x,p.y);refresh();},{passive:false});
 canvas.addEventListener('pointerdown',e=>{const p=pos(e);pointers.set(e.pointerId,p);canvas.setPointerCapture(e.pointerId);if(pointers.size===1)drag={...p,startX:p.x,startY:p.y,moved:false};else if(pointers.size===2){const [a,b]=[...pointers.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);if(drag)drag.moved=true;}});
 canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const p=pos(e),old=pointers.get(e.pointerId);pointers.set(e.pointerId,p);if(pointers.size===2){const [a,b]=[...pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(pinch>0)zoom(view,distance/pinch,(a.x+b.x)/2,(a.y+b.y)/2);pinch=distance;}else if(drag){if(Math.hypot(p.x-drag.startX,p.y-drag.startY)>6)drag.moved=true;if(drag.moved)pan(view,p.x-old.x,p.y-old.y);}refresh();});
 const end=(e,cancel=false)=>{const p=pointers.get(e.pointerId);if(!cancel&&p&&pointers.size===1&&drag&&!drag.moved){const stock=hitStock(view,p.x,p.y);if(stock){selectCivilization(stock.civId,false);openMenu('resources');pointers.delete(e.pointerId);pinch=null;drag=null;return;}const node=hitResource(state,view,p.x,p.y,focusId);if(node){const owner=state.world.settlements.find(c=>c.id===node.owner),area=state.world.wildlands.find(z=>z.id===node.wildland),beasts=area?state.world.beasts.filter(b=>b.area===area.id&&b.health>0):[];$('map-detail').hidden=false;$('map-detail').textContent=NODE_NAMES[node.kind]+' · '+fmt(node.stock)+' / '+fmt(node.capacity)+' · '+(node.renewal?'Pulih perlahan':'Tidak terbarukan')+' · '+(owner?owner.name:'Wilayah bebas')+(area?' · BAHAYA: '+area.name+' · '+beasts.length+' hewan buas · '+[...new Set(beasts.map(b=>b.species))].map(k=>{const b=SPECIES[k];return b.name+' (tingkat '+b.tier+', serangan '+b.attack+', pertahanan '+b.defense+', kecepatan '+b.speed+')';}).join('; '):'');}const object=node?null:hit(state,view,p.x,p.y);if(object){if(view.layer==='space'){view.layer='planet';view.planet=object.id;view.x=1600;view.y=1000;view.zoom=.24;render();}else selectCivilization(object.id);}}pointers.delete(e.pointerId);pinch=null;drag=null;};
 canvas.addEventListener('pointerup',e=>end(e));canvas.addEventListener('pointercancel',e=>end(e,true));
 $('civilization').onchange=()=>selectCivilization($('civilization').value);
 $('planet').onchange=()=>{view.planet=Number($('planet').value);view.layer='planet';view.x=1600;view.y=1000;view.zoom=.24;render();};
 $('map-layer').onchange=()=>{view.layer=$('map-layer').value;view.x=1600;view.y=1000;view.zoom=.24;render();};
 $('zoom-in').onclick=()=>{zoom(view,1.3);refresh();};$('zoom-out').onclick=()=>{zoom(view,1/1.3);refresh();};$('map-home').onclick=()=>{focus(view,focused());render();};
}

function resourceName(key){return {food:'pangan',wood:'kayu',stone:'batu',fiber:'serat',bone:'tulang',metal:'logam',fuel:'bahan bakar',alloy:'paduan',energy:'energi',mana:'mana'}[key]||key;}
function showFlow(){const s=viewState(),g=goal(s);$('flow-goal').textContent=g.reason;$('flows').replaceChildren();const jobs=new Map();for(const r of s.lastTurn?.records||[]){const job=jobs.get(r.action)||{count:0,inputs:{},outputs:{},targets:[]};job.count++;for(const [k,n]of Object.entries(r.inputs))job.inputs[k]=(job.inputs[k]||0)+n;for(const [k,n]of Object.entries(r.outputs))job.outputs[k]=(job.outputs[k]||0)+n;if(r.target)job.targets.push(r.target);jobs.set(r.action,job);}const amounts=o=>Object.entries(o).map(([k,n])=>n.toFixed(1)+' '+resourceName(k)).join(', ');
 for(const [key,job]of jobs){const item=el('div',undefined,'world-object');item.append(el('strong',`${job.count} warga · ${LABELS[key]}`));if(Object.keys(job.inputs).length)item.append(el('small','Dipakai: '+amounts(job.inputs)));if(Object.keys(job.outputs).length)item.append(el('small','Dihasilkan: '+amounts(job.outputs)));if(job.targets.length)item.append(el('small','Tujuan: '+[...new Set(job.targets)].join(', ')));$('flows').append(item);}for(const a of s.lastTurn?.allocations||[])$('flows').append(el('small','Dialokasikan untuk '+a.purpose+': '+amounts(a.inputs)));if(!jobs.size)$('flows').append(el('p','Rincian muncul setelah warga menjalankan satu hari kegiatan.'));}

function openMenu(panel=null,origin=null){
 menuOrigin=origin||menuOrigin||document.activeElement;
 $('menu-drawer').hidden=false;$('menu-backdrop').hidden=false;$('world-workspace').inert=true;
 for(const id of ['menu-toggle','explore-toggle','intervention-toggle','journal-toggle'])$(id).setAttribute('aria-expanded','true');
 if(panel){const target=$('panel-'+panel);for(const id of ['navigation','resources','people','policy','flow','buildings','development','learning','culture','journal','trends','prompt','saves'])$('panel-'+id).open=id===panel;target.scrollIntoView({block:'start'});}
 $('menu-close').focus();
}
function closeMenu(){
 $('menu-drawer').hidden=true;$('menu-backdrop').hidden=true;$('world-workspace').inert=false;
 for(const id of ['menu-toggle','explore-toggle','intervention-toggle','journal-toggle'])$(id).setAttribute('aria-expanded','false');
 menuOrigin?.focus?.();menuOrigin=null;
}
function showNotification(){
 const item=worldNotices.show(Date.now());$('world-notifications').hidden=!item;if(!item)return;
 const node=$('world-notifications');if(node.dataset.noticeId===String(item.id))return;node.dataset.noticeId=String(item.id);node.dataset.kind=item.kind;
 $('notification-kind').textContent=item.kind==='achievement'?'Pencapaian':item.kind==='alert'?'Perhatian':'Peristiwa';
 $('notification-title').textContent=item.title;$('notification-text').textContent=item.text;
 $('notification-meta').textContent=item.name+' · Hari '+item.day+' · Ketuk untuk catatan';
}
function initMenus(){
 closeMenu();
 $('menu-toggle').onclick=()=>openMenu(null,$('menu-toggle'));
 $('explore-toggle').onclick=()=>openMenu('navigation',$('explore-toggle'));
 $('intervention-toggle').onclick=()=>openMenu('prompt',$('intervention-toggle'));
 $('journal-toggle').onclick=()=>openMenu('journal',$('journal-toggle'));
 $('menu-close').onclick=closeMenu;$('menu-backdrop').onclick=closeMenu;
 $('notification-dismiss').onclick=()=>{worldNotices.dismiss();showNotification();};
 $('notification-open').onclick=()=>{const item=worldNotices.show(Date.now());if(item)selectCivilization(item.civId);openMenu('journal',$('journal-toggle'));worldNotices.dismiss();$('world-notifications').hidden=true;};
 document.addEventListener('keydown',event=>{if($('menu-drawer').hidden)return;if(event.key==='Escape'){event.preventDefault();closeMenu();}else if(event.key==='Tab'){const nodes=[...$('menu-drawer').querySelectorAll('button,select,input,textarea,summary,a[href]')].filter(n=>!n.disabled&&n.getClientRects().length);if(!nodes.length)return;const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
}

function showCulture(){const c=focused(),s=viewState(),g=c.government,l=c.language,t=territory(state,c),leader=s.agents.find(a=>a.id===g.leader);$('government').replaceChildren(el('h2',GOVERNMENTS[g.type]),el('p',t.form+' · '+t.pop+' warga nyata · '+t.members.length+' permukiman · Pemerintahan '+(g.power>=70?'kuat':g.power<40?'lemah':'sedang')),el('small',leader?'Pemimpin: '+leader.name:'Belum ada pemimpin dewasa'));for(const [key,label]of [['legitimacy','Legitimasi'],['cohesion','Kohesi'],['administration','Administrasi'],['economy','Ketahanan ekonomi'],['military','Militer'],['stability','Stabilitas'],['power','Kekuatan']]){const row=el('div',undefined,'government-stat');row.append(el('span',label),el('strong',Math.round(g[key])+'/100'),meter(g[key]));$('government').append(row);}const habits=Object.entries(g.habits).map(([key,n])=>({commons:'Kepemilikan bersama',private:'Kekayaan pribadi',care:'Perawatan & berbagi',coercion:'Pemaksaan',diversity:'Keragaman kerja',coordination:'Keseragaman tindakan'}[key]+': '+Math.round(n*100)+'%'));$('government').append(el('small',habits.join(' · ')),el('p','Bentuk pemerintahan mengikuti kebiasaan yang bertahan; kekuatannya bergantung pada kondisi warga dan lembaga. Ini model permainan.'));$('language').replaceChildren(el('h2','Bahasa '+l.name),el('p',LANGUAGE_STAGES[l.stage]+' · Komunikasi '+l.practice.toFixed(1)+' · Penulisan '+l.writing.toFixed(1)));for(const [key,word]of Object.entries(l.lexicon))$('language').append(el('small',({food:'Pangan',water:'Air',shelter:'Tempat tinggal',peace:'Damai',danger:'Bahaya',work:'Kerja',trade:'Perdagangan',knowledge:'Pengetahuan'}[key]||key)+' → '+(l.stage===0?'isyarat '+word:word)));$('language').append(el('p','Contoh pesan damai/perdagangan: '+sampleSentence(c)));for(const id of c.contacts){const other=state.world.settlements.find(x=>x.id===id),b=l.bridges[id];$('language').append(el('p',other.name+': pemahaman '+Math.round(understanding(c,other)*100)+'% · '+(b?.incidents||0)+' salah paham'));}}
