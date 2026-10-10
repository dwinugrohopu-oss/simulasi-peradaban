import {stateOf,stageName,DISCOVERIES,discoveryStatus} from './world.js';
import {camera,drawWorld,pan,zoom,focus,hit} from './map.js';
import {localDraft,describeEffect,OBJECT_LABELS,validateDescriptor} from './world-schema.js';
import {DAY_MS,OFFLINE_CAP,newGame,population,capacity,era,tick,advance,observation,available,epsilon,row,startProject,BUILDINGS,LABELS,POLICIES,validateSave,log,TRAITS,efficiency,expertise,traitBonus,buildingNeeds,applyObject} from './engine.js';
const $=id=>document.getElementById(id),KEY='peradaban-save-v1',fmt=n=>Math.floor(n).toLocaleString('id-ID');
let state,focusId=1,pendingTarget=1,selected=null,speed=1,previous=Date.now(),saveAt=0,renderAt=0,storageFailed=false,blockedRestore=false,previousHidden=document.hidden;
const view=camera();
function currentRoot(){return state;}
function focused(){return state.world.settlements.find(c=>c.id===focusId)||state.world.settlements[0];}
function viewState(){return stateOf(state,focused());}
function selectCivilization(id,center=true){focusId=Number(id);selected=null;if(center)focus(view,focused());render();}
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function notice(text){$('notice').textContent=text;$('notice').hidden=false;}
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
function resource(label,value,detail){const r=el('div',undefined,'resource');r.append(el('span',label),el('strong',value),el('small',detail));return r;}
function showBuildings(){
 const state=viewState();
 $('project').replaceChildren();if(state.project){const b=BUILDINGS[state.project.key],p=el('div',undefined,'project');p.append(el('strong',b.name+' sedang dibangun'),meter(state.project.progress/state.project.required*100),el('small',`${Math.floor(state.project.progress)} / ${state.project.required} kerja`));$('project').append(p);}
 $('buildings').replaceChildren();for(const [key,b]of Object.entries(BUILDINGS)){const block=el('div',undefined,'building'),head=el('div');head.append(el('strong',b.name),el('small','× '+state.buildings[key]));block.append(head,el('p',b.tip),el('small',`${b.wood} kayu · ${b.stone} batu · ${b.work} kerja`)); const need=buildingNeeds(state).find(n=>n.key===key);block.append(el('small',need.score>0?'Kebutuhan warga: '+need.reason:'Kebutuhan saat ini tercukupi.'));$('buildings').append(block);}
}
function showAgents(){
 const state=viewState();
 $('agents').replaceChildren();const agents=$('agent-filter').value==='all'?state.agents:population(state);
 for(const a of agents){const c=el('div',undefined,'agent'),head=el('header'),text=el('div');text.append(el('strong',a.name),el('small',`${a.age} tahun${a.alive?'':' · arsip'}`));head.append(el('div',a.name.charAt(0),'portrait'),text);c.append(head,el('div',a.alive?(a.age<16?'Tumbuh · ':'')+LABELS[a.action]:a.exitReason==='emigration'?'Pindah permukiman':'Kehidupan selesai','action'));const bars=el('div',undefined,'bars');for(const [label,value]of [['Kesehatan',a.health],['Energi',a.energy]]){const b=el('div');b.append(el('label',`${label} ${Math.round(value)}%`),meter(value));bars.append(b);}c.append(el('small',a.traits.map(k=>TRAITS[k].name).join(' · '),'trait-tags'));const skilled=Object.entries(a.skills).filter(([k,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,3);c.append(el('small',skilled.map(([k,v])=>`${LABELS[k]}: ${expertise(a,k)} (${Math.floor(v)})`).join(' · ')));c.append(el('small',`Reputasi ${Math.round(a.reputation)} · Pribadi: ${fmt(a.stash.food)} pangan, ${fmt(a.stash.wood)} kayu, ${fmt(a.stash.stone)} batu`));c.append(el('small','Alat: '+(Object.values(a.equipment).map(id=>state.tools.find(t=>t.id===id)?.name).filter(Boolean).join(' / ')||'belum ada')));c.append(bars,el('div',`Kepekaan sihir ${a.arcaneSensitivity} · ${fmt(a.steps)} pengalaman · lapar ${Math.round(a.hunger)}%`,'metrics'));const b=el('button','Lihat pembelajaran →');b.onclick=()=>{selected=a.id;$('inspect').value=String(a.id);showModel();$('model').scrollIntoView({behavior:'smooth',block:'center'});};c.append(b);$('agents').append(c);}
 if(!agents.length)$('agents').append(el('p','Tidak ada penduduk aktif. Kamu dapat memulai dunia baru atau mengimpor simpanan.'));
}
function showModel(){
 const state=viewState();
 const a=state.agents.find(a=>a.id===selected)||population(state)[0]||state.agents.at(-1);$('model').replaceChildren();if(!a)return;selected=a.id;$('inspect').value=String(a.id);
 for(const m of a.memories.slice(0,4))$('model').append(el('small',`Hari ${m.day}: ${m.name} · ${{theft:'pencurian',intimidation:'intimidasi',revenge:'balas dendam',help:'bantuan',manipulation:'manipulasi',hostility:'permusuhan',dispute:'perselisihan',friendship:'pertemanan'}[m.kind]||m.kind}`));
 const stateKey=observation(state,a),values=row(a,stateKey),allowed=available(state,a),ranked=allowed.slice().sort((x,y)=>values[y]+traitBonus(a,y)-values[x]-traitBonus(a,x));const max=Math.max(1,...allowed.map(k=>Math.abs(values[k])));
 $('model').append(el('small',`${a.name} · eksplorasi ${Math.round(epsilon(a)*100)}% · ${Object.keys(a.q).length} situasi dikenal`),el('p',`Situasi kini: ${a.hunger>=55?'lapar':'cukup kenyang'}, ${a.energy<35?'energi rendah':'energi cukup'}.`));
 for(const key of ranked){const r=el('div',undefined,'model-row'+(key===ranked[0]?' best':''));r.append(el('span',LABELS[key]),el('strong',(values[key]+traitBonus(a,key)).toFixed(2)),meter(Math.abs(values[key])/max*100));$('model').append(r);}
 $('model').append(el('small',`Nilai Q + kecenderungan sifat terbesar biasanya dipilih; eksplorasi masih dapat memilih tindakan lain. Hadiah terakhir: ${a.lastReward.toFixed(1)}.`));
}
function showObjects(){
 const state=viewState();
 $('world-objects').replaceChildren(...state.objects.map(o=>{const d=el('div',undefined,'world-object');d.append(el('strong',o.descriptor.name),el('small',OBJECT_LABELS[o.kind]+' · '+(o.kind==='event'?o.remaining+' hari tersisa':o.kind==='building'?'Bangunan aktif':'Cadangan '+Math.floor(o.stock))),el('small',describeEffect(o.descriptor)));return d;}));
}
function drawMap(time){drawWorld(state,view,$('world'),focusId,time);}
function drawChart(){const state=viewState();const c=$('chart'),ctx=c.getContext('2d'),data=state.history;ctx.clearRect(0,0,c.width,c.height);const max=Math.max(30,...data.map(h=>h.food));ctx.strokeStyle='#2e4035';for(let i=0;i<4;i++){const y=20+i*45;ctx.beginPath();ctx.moveTo(10,y);ctx.lineTo(590,y);ctx.stroke();}ctx.font='12px system-ui';ctx.fillStyle='#9aae9b';if(data.length<2){ctx.fillText('Grafik tersedia setelah 20 hari.',15,100);return;}ctx.beginPath();data.forEach((h,i)=>{const x=12+i/(data.length-1)*575,y=170-h.food/max*145;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle='#afd29b';ctx.lineWidth=3;ctx.stroke();$('chart-caption').textContent=`Hari ${fmt(data[0].day)}–${fmt(data.at(-1).day)} · rentang 0–${fmt(max)} makanan`;}
function render(){
 const root=currentRoot();const state=viewState();showCivilizations(root);
 const active=population(state),all=state.agents,steps=all.reduce((n,a)=>n+a.steps,0);
 $('era').textContent=focused().name+' · '+stageName(focused());$('date').textContent=`Tahun ${Math.floor(root.day/60)+1} · Hari ${root.day%60+1}`;
 $('pause').disabled=blockedRestore;$('policy').disabled=blockedRestore;
 $('pause').textContent=root.paused?'Lanjutkan':'Jeda';$('world-status').textContent=!active.length?'Permukiman berakhir':root.paused?'Waktu dijeda':'Penduduk beraktivitas';$('policy').value=state.policy;
 $('population').textContent=`${active.length} / ${capacity(state)} penduduk`;
 $('resources').replaceChildren(resource('MAKANAN',fmt(state.food),'Cadangan bersama'),resource('KAYU',fmt(state.wood),'Bahan bangunan'),resource('BATU',fmt(state.stone),'Bahan bangunan'),resource('PENGETAHUAN',fmt(state.tech),'Penemuan mengikuti prasyarat'),resource('KEHARMONISAN',Math.round(state.harmony)+'%','Kondisi masyarakat'),resource('PENDUDUK',String(active.length),`${state.birthCount} lahir · ${state.immigrationCount} datang · ${state.emigrationCount} pindah · ${state.deathCount} meninggal`));
 $('resources').append(resource('LOGAM',fmt(state.industry.metal),'Bahan mesin dan alat'),resource('BAHAN BAKAR',fmt(state.industry.fuel),'Produksi dan roket'),resource('ENERGI',fmt(state.industry.energy),'Listrik dan ekspedisi'),resource('PADUAN',fmt(state.industry.alloy),'Struktur roket'),resource('MANA',fmt(state.industry.mana),focused().magic?'Pemulihan dan pembangunan':'Sumber belum dipahami'));
 showBuildings();showAgents();showObjects();showTools();showDiscoveries();
 $('learning-stats').replaceChildren();for(const [label,value]of [['Keputusan dipelajari',fmt(state.totalSteps)],['Situasi dikenal',fmt(all.reduce((n,a)=>n+Object.keys(a.q).length,0))],['Pilihan eksplorasi',Math.round(all.reduce((n,a)=>n+a.explorations,0)/Math.max(1,steps)*100)+'%'],['Rata-rata hadiah',(all.reduce((n,a)=>n+a.rewardSum,0)/Math.max(1,steps)).toFixed(1)]]){const b=el('div');b.append(el('strong',value),el('small',label));$('learning-stats').append(b);}
 const options=all.map(a=>el('option',a.name+(a.alive?'':' · arsip')));options.forEach((o,i)=>o.value=String(all[i].id));$('inspect').replaceChildren(...options);showModel();drawChart();
 $('logs').replaceChildren(...state.logs.map(l=>{const d=el('div',undefined,'log');d.append(el('small','HARI '+l.day),el('p',l.text));return d;}));
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
$('agent-filter').onchange=showAgents;$('inspect').onchange=()=>{selected=Number($('inspect').value);showModel();};
$('export').onclick=()=>{let content;if(blockedRestore){try{content=localStorage.getItem(KEY);}catch{}}if(!content){persist();content=JSON.stringify(state,null,2);}const url=URL.createObjectURL(new Blob([content],{type:'application/json'})),a=el('a');a.href=url;a.download='peradaban-hari-'+state.day+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import-button').onclick=()=>$('import').click();$('import').onchange=async()=>{const f=$('import').files[0];try{if(!f)return;if(f.size>16*1024*1024)throw Error('File terlalu besar (maksimal 16 MB).');const candidate=validateSave(JSON.parse(await f.text()));if(!confirm('Ganti dunia saat ini dengan simpanan ini? Unduh cadangan dulu jika ingin menyimpan dunia lama.'))return;state=candidate;focusId=1;focus(view,focused());state.lastSaved=Date.now();previous=Date.now();selected=null;pendingObject=null;$('draft-preview').hidden=true;storageFailed=false;blockedRestore=false;error('');persist();render();notice('Simpanan dan model belajar berhasil diimpor. Waktu di dalam file dipulihkan tanpa menambah waktu berlalu.');}catch(e){error(e.message||'File tidak valid.');}finally{$('import').value='';}};
$('new').onclick=()=>{if(!confirm('Mulai dunia baru? Unduh simpanan terlebih dahulu jika ingin mempertahankan dunia ini.'))return;state=newGame();focusId=1;focus(view,focused());previous=Date.now();selected=null;pendingObject=null;$('draft-preview').hidden=true;storageFailed=false;blockedRestore=false;error('');persist();$('notice').hidden=true;render();};
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
load();initMap();render();
setInterval(()=>{if(blockedRestore)return;const now=Date.now();catchUp(now);if(now-renderAt>=800&&!document.hidden){render();renderAt=now;}if(now-saveAt>=5000)persist(now);},250);
function animate(time){if(!document.hidden)drawMap(time);requestAnimationFrame(animate);}requestAnimationFrame(animate);

function showTools(){
 const state=viewState();
 $('tools').replaceChildren(el('p',`${state.prototypes} prototipe · ${state.experiments} uji · ${fmt(state.fiber)} serat · ${fmt(state.bone)} tulang`));
 const labels={prototype:'Menunggu uji',ready:'Berhasil',failed:'Gagal',broken:'Rusak'};
 for(const t of state.tools.slice(-12).reverse()){const item=el('div',undefined,'world-object');item.append(el('strong',t.name),el('small',`${state.agents.find(a=>a.id===t.owner)?.name||'Arsip warga'} · ${LABELS[t.job]} · ${labels[t.status]}`),el('small',`Massa ${t.physics.mass.toFixed(2)} · Sambungan ${t.physics.joint.toFixed(0)} · Daya tahan ${Math.round(t.condition)}/${Math.round(t.physics.durability)}`),el('small',`Potensi hasil ${Math.round(t.physics.gain[t.job]*100)}% · Hasil uji ${t.measured===null?'belum diuji':Math.round(t.measured*100)+'%'} · ${t.uses} pemakaian`));$('tools').append(item);}
}

function showCivilizations(root){
 const options=root.world.settlements.map(c=>{const o=el('option',c.name+' · '+stageName(c));o.value=String(c.id);return o;});$('civilization').replaceChildren(...options);$('civilization').value=String(focusId);
 $('planet').replaceChildren(...root.world.planets.map(p=>{const o=el('option',p.name);o.value=String(p.id);return o;}));$('planet').value=String(view.planet);$('map-layer').value=view.layer;$('zoom-label').textContent=Math.round(view.zoom*100)+'%';
 $('world-summary').textContent=`${root.world.settlements.length} peradaban · ${root.world.splits} perpecahan · ${root.world.wars} perang · ${root.world.contacts} kontak · ${root.world.colonies} koloni`;
 $('civilizations').replaceChildren(...root.world.settlements.map(c=>{const s=stateOf(root,c),card=el('button',undefined,'civilization-card'+(c.id===focusId?' selected':''));card.append(el('strong',c.name),el('small',`${c.species==='alien'?'Alien':'Manusia'} · ${root.world.planets[c.planet].name} · ${population(s).length} warga`),el('small',stageName(c)+(c.war?' · Perang':c.magic?' · Sihir':'')),el('small',c.contacts.length?'Kontak: '+c.contacts.map(id=>root.world.settlements.find(o=>o.id===id)?.name).join(', '):'Belum mengenal peradaban lain'));card.onclick=()=>selectCivilization(c.id);return card;}));
}
function showDiscoveries(){const civ=focused(),s=viewState();$('discoveries').replaceChildren(el('p',civ.magic?'Sihir dipakai untuk pemulihan warga dan membantu proyek.':`Sihir: pengamatan ${Math.min(60,civ.magicProgress)}/60. Perlu sumber dekat, warga peka ≥75, keahlian penelitian ≥20, dan pengetahuan ≥40.`));
 for(const [id,d]of Object.entries(DISCOVERIES)){const done=civ.discoveries.includes(id),item=el('div',undefined,'discovery'+(done?' done':''));item.append(el('strong',(done?'✓ ':'')+d.name),el('small',done?'Dikuasai':discoveryStatus(state,civ,id).missing.join(' · ')||'Siap; menunggu warga meneliti'));$('discoveries').append(item);}
 $('discoveries').append(el('small',civ.flight?`Ekspedisi → ${state.world.planets[civ.flight.destination].name}: ${civ.flight.remaining} hari tersisa.`:`Pengamatan radio ${Math.min(100,civ.signalProgress)}/100 · Persiapan ekspedisi ${Math.min(120,civ.launchProgress)}/120`));
 $('custom-resources').replaceChildren(...s.customResources.map(r=>{const item=el('div',undefined,'world-object');item.append(el('strong',r.name),el('small',`${fmt(r.stock)} di alam · ${r.amount.toFixed(1)} terkumpul · ${r.category}`),el('small',`Energi ${r.energy} · Sihir ${r.arcane} · Riset ${r.research} · Toksisitas ${r.toxicity}`));return item;}));
 for(const e of state.world.events.filter(e=>e.civ===civ.id))$('custom-resources').append(el('p',`${e.descriptor.name}: ${e.active?e.remaining+' hari tersisa':'menunggu '+e.descriptor.trigger}`));
}
function initMap(){
 const canvas=$('world'),pointers=new Map();let drag=null,pinch=null;
 const pos=e=>{const rect=canvas.getBoundingClientRect();return {x:(e.clientX-rect.left)*canvas.width/rect.width,y:(e.clientY-rect.top)*canvas.height/rect.height};};
 const refresh=()=>{$('zoom-label').textContent=Math.round(view.zoom*100)+'%';drawMap(Date.now());};
 canvas.addEventListener('wheel',e=>{e.preventDefault();const p=pos(e);zoom(view,Math.exp(-e.deltaY*.001),p.x,p.y);refresh();},{passive:false});
 canvas.addEventListener('pointerdown',e=>{const p=pos(e);pointers.set(e.pointerId,p);canvas.setPointerCapture(e.pointerId);if(pointers.size===1)drag={...p,startX:p.x,startY:p.y,moved:false};else if(pointers.size===2){const [a,b]=[...pointers.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);if(drag)drag.moved=true;}});
 canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const p=pos(e),old=pointers.get(e.pointerId);pointers.set(e.pointerId,p);if(pointers.size===2){const [a,b]=[...pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(pinch>0)zoom(view,distance/pinch,(a.x+b.x)/2,(a.y+b.y)/2);pinch=distance;}else if(drag){if(Math.hypot(p.x-drag.startX,p.y-drag.startY)>6)drag.moved=true;if(drag.moved)pan(view,p.x-old.x,p.y-old.y);}refresh();});
 const end=(e,cancel=false)=>{const p=pointers.get(e.pointerId);if(!cancel&&p&&pointers.size===1&&drag&&!drag.moved){const object=hit(state,view,p.x,p.y);if(object){if(view.layer==='space'){view.layer='planet';view.planet=object.id;view.x=1600;view.y=1000;view.zoom=.24;render();}else selectCivilization(object.id);}}pointers.delete(e.pointerId);pinch=null;drag=null;};
 canvas.addEventListener('pointerup',e=>end(e));canvas.addEventListener('pointercancel',e=>end(e,true));
 $('civilization').onchange=()=>selectCivilization($('civilization').value);
 $('planet').onchange=()=>{view.planet=Number($('planet').value);view.layer='planet';view.x=1600;view.y=1000;view.zoom=.24;render();};
 $('map-layer').onchange=()=>{view.layer=$('map-layer').value;view.x=1600;view.y=1000;view.zoom=.24;render();};
 $('zoom-in').onclick=()=>{zoom(view,1.3);refresh();};$('zoom-out').onclick=()=>{zoom(view,1/1.3);refresh();};$('map-home').onclick=()=>{focus(view,focused());render();};
}
