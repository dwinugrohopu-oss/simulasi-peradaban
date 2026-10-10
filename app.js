import {localDraft,describeEffect,OBJECT_LABELS,validateDescriptor} from './world-schema.js';
import {DAY_MS,OFFLINE_CAP,newGame,population,capacity,era,tick,advance,observation,available,epsilon,row,startProject,BUILDINGS,LABELS,POLICIES,validateSave,log,TRAITS,efficiency,expertise,traitBonus,buildingNeeds,applyObject} from './engine.js';
const $=id=>document.getElementById(id),KEY='peradaban-save-v1',fmt=n=>Math.floor(n).toLocaleString('id-ID');
let state,selected=null,speed=1,previous=Date.now(),saveAt=0,renderAt=0,storageFailed=false,blockedRestore=false,previousHidden=document.hidden;
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
 $('project').replaceChildren();if(state.project){const b=BUILDINGS[state.project.key],p=el('div',undefined,'project');p.append(el('strong',b.name+' sedang dibangun'),meter(state.project.progress/state.project.required*100),el('small',`${Math.floor(state.project.progress)} / ${state.project.required} kerja`));$('project').append(p);}
 $('buildings').replaceChildren();for(const [key,b]of Object.entries(BUILDINGS)){const block=el('div',undefined,'building'),head=el('div');head.append(el('strong',b.name),el('small','× '+state.buildings[key]));block.append(head,el('p',b.tip),el('small',`${b.wood} kayu · ${b.stone} batu · ${b.work} kerja`)); const need=buildingNeeds(state).find(n=>n.key===key);block.append(el('small',need.score>0?'Kebutuhan warga: '+need.reason:'Kebutuhan saat ini tercukupi.'));$('buildings').append(block);}
}
function showAgents(){
 $('agents').replaceChildren();const agents=$('agent-filter').value==='all'?state.agents:population(state);
 for(const a of agents){const c=el('div',undefined,'agent'),head=el('header'),text=el('div');text.append(el('strong',a.name),el('small',`${a.age} tahun${a.alive?'':' · arsip'}`));head.append(el('div',a.name.charAt(0),'portrait'),text);c.append(head,el('div',a.alive?(a.age<16?'Tumbuh · ':'')+LABELS[a.action]:a.exitReason==='emigration'?'Pindah permukiman':'Kehidupan selesai','action'));const bars=el('div',undefined,'bars');for(const [label,value]of [['Kesehatan',a.health],['Energi',a.energy]]){const b=el('div');b.append(el('label',`${label} ${Math.round(value)}%`),meter(value));bars.append(b);}c.append(el('small',a.traits.map(k=>TRAITS[k].name).join(' · '),'trait-tags'));const skilled=Object.entries(a.skills).filter(([k,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,3);c.append(el('small',skilled.map(([k,v])=>`${LABELS[k]}: ${expertise(a,k)} (${Math.floor(v)})`).join(' · ')));c.append(el('small',`Reputasi ${Math.round(a.reputation)} · Pribadi: ${fmt(a.stash.food)} pangan, ${fmt(a.stash.wood)} kayu, ${fmt(a.stash.stone)} batu`));c.append(el('small','Alat: '+(Object.values(a.equipment).map(id=>state.tools.find(t=>t.id===id)?.name).filter(Boolean).join(' / ')||'belum ada')));c.append(bars,el('div',`${fmt(a.steps)} pengalaman · lapar ${Math.round(a.hunger)}%`,'metrics'));const b=el('button','Lihat pembelajaran →');b.onclick=()=>{selected=a.id;$('inspect').value=String(a.id);showModel();$('model').scrollIntoView({behavior:'smooth',block:'center'});};c.append(b);$('agents').append(c);}
 if(!agents.length)$('agents').append(el('p','Tidak ada penduduk aktif. Kamu dapat memulai dunia baru atau mengimpor simpanan.'));
}
function showModel(){
 const a=state.agents.find(a=>a.id===selected)||population(state)[0]||state.agents.at(-1);$('model').replaceChildren();if(!a)return;selected=a.id;$('inspect').value=String(a.id);
 for(const m of a.memories.slice(0,4))$('model').append(el('small',`Hari ${m.day}: ${m.name} · ${{theft:'pencurian',intimidation:'intimidasi',revenge:'balas dendam',help:'bantuan',manipulation:'manipulasi',hostility:'permusuhan',dispute:'perselisihan',friendship:'pertemanan'}[m.kind]||m.kind}`));
 const stateKey=observation(state,a),values=row(a,stateKey),allowed=available(state,a),ranked=allowed.slice().sort((x,y)=>values[y]+traitBonus(a,y)-values[x]-traitBonus(a,x));const max=Math.max(1,...allowed.map(k=>Math.abs(values[k])));
 $('model').append(el('small',`${a.name} · eksplorasi ${Math.round(epsilon(a)*100)}% · ${Object.keys(a.q).length} situasi dikenal`),el('p',`Situasi kini: ${a.hunger>=55?'lapar':'cukup kenyang'}, ${a.energy<35?'energi rendah':'energi cukup'}.`));
 for(const key of ranked){const r=el('div',undefined,'model-row'+(key===ranked[0]?' best':''));r.append(el('span',LABELS[key]),el('strong',(values[key]+traitBonus(a,key)).toFixed(2)),meter(Math.abs(values[key])/max*100));$('model').append(r);}
 $('model').append(el('small',`Nilai Q + kecenderungan sifat terbesar biasanya dipilih; eksplorasi masih dapat memilih tindakan lain. Hadiah terakhir: ${a.lastReward.toFixed(1)}.`));
}
function showObjects(){
 $('world-objects').replaceChildren(...state.objects.map(o=>{const d=el('div',undefined,'world-object');d.append(el('strong',o.descriptor.name),el('small',OBJECT_LABELS[o.kind]+' · '+(o.kind==='event'?o.remaining+' hari tersisa':o.kind==='building'?'Bangunan aktif':'Cadangan '+Math.floor(o.stock))),el('small',describeEffect(o.descriptor)));return d;}));
}
function drawMap(time){
 const c=$('world'),ctx=c.getContext('2d'),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#173426';ctx.fillRect(0,0,w,h);
 // Stable decorative terrain, independent of simulation RNG.
 for(let y=0;y<12;y++)for(let x=0;x<23;x++){ctx.fillStyle=(x*7+y*11)%5===0?'#1d3b2c':'#193729';ctx.fillRect(x*40,y*40,39,39);}
 ctx.strokeStyle='#285b63';ctx.lineWidth=45;ctx.beginPath();ctx.moveTo(780,-40);ctx.bezierCurveTo(630,150,890,210,750,530);ctx.stroke();ctx.strokeStyle='#30717a';ctx.lineWidth=26;ctx.stroke();
 const spots={forage:[130,135],wood:[185,330],stone:[600,340],farm:[390,310],build:[475,190],research:[545,130],eat:[365,195],rest:[305,105],social:[430,205],fish:[750,220],steal:[365,195],intimidate:[430,205],revenge:[430,205],persuade:[430,205],share:[365,195]};
 for(let i=0;i<18;i++){const x=55+(i*83)%550,y=45+(i*113)%370;if(x>245&&x<560&&y<290)continue;ctx.fillStyle='#365d35';ctx.beginPath();ctx.moveTo(x,y-20);ctx.lineTo(x-14,y+10);ctx.lineTo(x+14,y+10);ctx.fill();ctx.fillStyle='#6a6242';ctx.fillRect(x-2,y+10,4,10);}
 ctx.strokeStyle='#5e6446';ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(290,120);ctx.lineTo(430,205);ctx.lineTo(550,135);ctx.moveTo(430,205);ctx.lineTo(400,320);ctx.stroke();
 for(let i=0;i<state.buildings.hut;i++){const x=275+(i%4)*55,y=85+Math.floor(i/4)*45;ctx.fillStyle='#a08a60';ctx.fillRect(x,y,35,28);ctx.fillStyle='#735a3f';ctx.beginPath();ctx.moveTo(x-5,y);ctx.lineTo(x+17,y-20);ctx.lineTo(x+40,y);ctx.fill();ctx.fillStyle='#364032';ctx.fillRect(x+13,y+12,9,16);}
 if(state.buildings.farm){ctx.fillStyle='#697541';ctx.fillRect(335,280,130,75);for(let i=0;i<7;i++){ctx.fillStyle='#acc56d';ctx.fillRect(345+i*16,290,7,53);}}
 if(state.buildings.school){ctx.fillStyle='#b3aa7e';ctx.fillRect(515,88,65,45);ctx.fillStyle='#625d45';ctx.fillRect(508,80,80,12);ctx.fillStyle='#35452e';ctx.fillRect(541,107,15,26);}
 if(state.buildings.well){ctx.fillStyle='#b0b3a0';ctx.beginPath();ctx.ellipse(470,250,18,10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#2e7482';ctx.beginPath();ctx.ellipse(470,248,11,5,0,0,Math.PI*2);ctx.fill();}
 if(state.project){ctx.strokeStyle='#dab56f';ctx.setLineDash([4,5]);ctx.strokeRect(453,155,50,40);ctx.setLineDash([]);}
 ctx.font='12px system-ui';ctx.fillStyle='#b1c4a6';ctx.fillText('HUTAN',70,395);ctx.fillText('BATU',583,396);ctx.fillText('SUNGAI',790,410);
 for(const o of state.objects){const d=o.descriptor,x=40+(w-80)*d.x/100,y=40+(h-80)*d.y/100;ctx.fillStyle={river:'#5babb3',forest:'#83af68',quarry:'#aeb3a3',ruins:'#c5ae85',building:'#e0bd7e',event:'#d49989'}[o.kind];ctx.beginPath();ctx.arc(x,y,o.kind==='river'?17:10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#eceddb';ctx.font='10px system-ui';ctx.fillText(d.name.slice(0,22),Math.min(w-145,x+14),y+3);}
 const colors=['#e0bd7e','#b6d6ad','#d39884','#9fbeca','#c7b4d5'];for(const a of population(state)){const kind={fish:'river',wood:'forest',stone:'quarry',research:'ruins'}[a.action],target=state.objects.find(o=>o.kind===kind&&o.stock>0),spot=target?[40+(w-80)*target.descriptor.x/100,40+(h-80)*target.descriptor.y/100]:spots[a.action]||spots.rest,phase=(time/900+a.id)*2.2,x=spot[0]+Math.sin(phase)*8+(a.id%4-1.5)*14,y=spot[1]+Math.cos(phase)*5+Math.floor(a.id/4)*9;ctx.fillStyle='#07130a55';ctx.beginPath();ctx.ellipse(x,y+7,7,3,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=colors[a.color];ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e3c6a0';ctx.beginPath();ctx.arc(x,y-6,3,0,Math.PI*2);ctx.fill();}
}
function drawChart(){const c=$('chart'),ctx=c.getContext('2d'),data=state.history;ctx.clearRect(0,0,c.width,c.height);const max=Math.max(30,...data.map(h=>h.food));ctx.strokeStyle='#2e4035';for(let i=0;i<4;i++){const y=20+i*45;ctx.beginPath();ctx.moveTo(10,y);ctx.lineTo(590,y);ctx.stroke();}ctx.font='12px system-ui';ctx.fillStyle='#9aae9b';if(data.length<2){ctx.fillText('Grafik tersedia setelah 20 hari.',15,100);return;}ctx.beginPath();data.forEach((h,i)=>{const x=12+i/(data.length-1)*575,y=170-h.food/max*145;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle='#afd29b';ctx.lineWidth=3;ctx.stroke();$('chart-caption').textContent=`Hari ${fmt(data[0].day)}–${fmt(data.at(-1).day)} · rentang 0–${fmt(max)} makanan`;}
function render(){
 const active=population(state),all=state.agents,steps=all.reduce((n,a)=>n+a.steps,0);
 $('era').textContent=era(state);$('date').textContent=`Tahun ${Math.floor(state.day/60)+1} · Hari ${state.day%60+1}`;
 $('pause').disabled=blockedRestore;$('policy').disabled=blockedRestore;
 $('pause').textContent=state.paused?'Lanjutkan':'Jeda';$('world-status').textContent=!active.length?'Permukiman berakhir':state.paused?'Waktu dijeda':'Penduduk beraktivitas';$('policy').value=state.policy;
 $('population').textContent=`${active.length} / ${capacity(state)} penduduk`;
 $('resources').replaceChildren(resource('MAKANAN',fmt(state.food),'Cadangan bersama'),resource('KAYU',fmt(state.wood),'Bahan bangunan'),resource('BATU',fmt(state.stone),'Bahan bangunan'),resource('PENGETAHUAN',fmt(state.tech),'Era baru pada 60 & 200'),resource('KEHARMONISAN',Math.round(state.harmony)+'%','Kondisi masyarakat'),resource('PENDUDUK',String(active.length),`${state.birthCount} lahir · ${state.immigrationCount} datang · ${state.emigrationCount} pindah · ${state.deathCount} meninggal`));
 showBuildings();showAgents();showObjects();showTools();
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
$('policy').onchange=()=>{catchUp();state.policy=$('policy').value;log(state,'Prioritas berubah: '+POLICIES[state.policy]+'.');persist();render();};
$('agent-filter').onchange=showAgents;$('inspect').onchange=()=>{selected=Number($('inspect').value);showModel();};
$('export').onclick=()=>{let content;if(blockedRestore){try{content=localStorage.getItem(KEY);}catch{}}if(!content){persist();content=JSON.stringify(state,null,2);}const url=URL.createObjectURL(new Blob([content],{type:'application/json'})),a=el('a');a.href=url;a.download='peradaban-hari-'+state.day+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import-button').onclick=()=>$('import').click();$('import').onchange=async()=>{const f=$('import').files[0];try{if(!f)return;if(f.size>4*1024*1024)throw Error('File terlalu besar (maksimal 4 MB).');const candidate=validateSave(JSON.parse(await f.text()));if(!confirm('Ganti dunia saat ini dengan simpanan ini? Unduh cadangan dulu jika ingin menyimpan dunia lama.'))return;state=candidate;state.lastSaved=Date.now();previous=Date.now();selected=null;pendingObject=null;$('draft-preview').hidden=true;storageFailed=false;blockedRestore=false;error('');persist();render();notice('Simpanan dan model belajar berhasil diimpor. Waktu di dalam file dipulihkan tanpa menambah waktu berlalu.');}catch(e){error(e.message||'File tidak valid.');}finally{$('import').value='';}};
$('new').onclick=()=>{if(!confirm('Mulai dunia baru? Unduh simpanan terlebih dahulu jika ingin mempertahankan dunia ini.'))return;state=newGame();previous=Date.now();selected=null;pendingObject=null;$('draft-preview').hidden=true;storageFailed=false;blockedRestore=false;error('');persist();$('notice').hidden=true;render();};
let promptMode='local',pendingObject=null,promptBusy=false;
async function initPrompt(){
 try{const r=await fetch('/api/config');if(!r.ok)throw Error('static');const c=await r.json();promptMode=c.enabled?c.mode:'disabled';$('llm-status').textContent=c.message;$('token-field').hidden=!c.authRequired;$('draft-button').disabled=!c.enabled;}
 catch{promptMode='local';$('llm-status').textContent='Mode lokal (kata kunci). LLM memerlukan deployment Web Service dengan env API.';}
}
$('prompt-form').onsubmit=async event=>{
 event.preventDefault();if(promptBusy||blockedRestore)return;promptBusy=true;const world=state;error('');$('draft-button').disabled=true;
 try{const prompt=$('world-prompt').value.trim();if(!prompt||prompt.length>1200)throw Error('Tulis prompt 1–1200 karakter.');let result;
 if(promptMode==='local')result={descriptor:localDraft(prompt),mode:'local'};
 else {if(promptMode==='disabled')throw Error('Layanan LLM belum dikonfigurasi.');const r=await fetch('/api/draft',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+$('world-token').value},body:JSON.stringify({prompt}),signal:AbortSignal.timeout(45000)});result=await r.json();if(!r.ok)throw Error(result.error||'Layanan prompt tidak merespons.');}
 if(state!==world)return;pendingObject=validateDescriptor(result.descriptor);$('draft-title').textContent=pendingObject.name+' · '+(result.mode==='llm'?'LLM':'mode lokal');$('draft-description').textContent=pendingObject.description;$('draft-effect').textContent=describeEffect(pendingObject);$('draft-preview').hidden=false;
 }catch(e){error(e.name==='TimeoutError'?'Permintaan prompt terlalu lama. Coba lagi.':e.message);}finally{promptBusy=false;$('draft-button').disabled=promptMode==='disabled';}
};
$('apply-object').onclick=()=>{if(!pendingObject||blockedRestore)return;try{catchUp();applyObject(state,pendingObject);pendingObject=null;$('draft-preview').hidden=true;persist();render();notice('Objek dimasukkan. Warga akan menyesuaikan keputusan lewat pengalaman.');}catch(e){error(e.message);}};
$('discard-object').onclick=()=>{pendingObject=null;$('draft-preview').hidden=true;};
initPrompt();
// Page hide saves the exact current state, while reload recovers elapsed time.
window.addEventListener('pagehide',()=>{if(!blockedRestore){catchUp();persist();}});
document.addEventListener('visibilitychange',()=>{catchUp();if(!blockedRestore)persist();render();});
load();render();
setInterval(()=>{if(blockedRestore)return;const now=Date.now();catchUp(now);if(now-renderAt>=800&&!document.hidden){render();renderAt=now;}if(now-saveAt>=5000)persist(now);},250);
function animate(time){if(!document.hidden)drawMap(time);requestAnimationFrame(animate);}requestAnimationFrame(animate);

function showTools(){
 $('tools').replaceChildren(el('p',`${state.prototypes} prototipe · ${state.experiments} uji · ${fmt(state.fiber)} serat · ${fmt(state.bone)} tulang`));
 const labels={prototype:'Menunggu uji',ready:'Berhasil',failed:'Gagal',broken:'Rusak'};
 for(const t of state.tools.slice(-12).reverse()){const item=el('div',undefined,'world-object');item.append(el('strong',t.name),el('small',`${state.agents.find(a=>a.id===t.owner)?.name||'Arsip warga'} · ${LABELS[t.job]} · ${labels[t.status]}`),el('small',`Massa ${t.physics.mass.toFixed(2)} · Sambungan ${t.physics.joint.toFixed(0)} · Daya tahan ${Math.round(t.condition)}/${Math.round(t.physics.durability)}`),el('small',`Potensi hasil ${Math.round(t.physics.gain[t.job]*100)}% · Hasil uji ${t.measured===null?'belum diuji':Math.round(t.measured*100)+'%'} · ${t.uses} pemakaian`));$('tools').append(item);}
}
