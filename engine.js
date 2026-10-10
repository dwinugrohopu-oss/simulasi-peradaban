/* Pure simulation and tabular Q-learning; shared by the browser and Node tests. */
export const VERSION=1, DAY_MS=4000, OFFLINE_CAP=8*60*60*1000;
export const ACTIONS=['forage','wood','stone','farm','build','research','eat','rest','social'];
export const LABELS={forage:'Mencari makanan',wood:'Menebang kayu',stone:'Menambang batu',farm:'Bertani',build:'Membangun',research:'Meneliti',eat:'Makan',rest:'Istirahat',social:'Bersosialisasi'};
export const BUILDINGS={hut:{name:'Rumah',wood:35,stone:10,work:30,tip:'Kapasitas +3 penduduk.'},farm:{name:'Ladang',wood:25,stone:5,work:25,tip:'Panen pasif dan membuka tindakan bertani.'},school:{name:'Balai belajar',wood:60,stone:35,work:60,tip:'Penelitian +50% dan belajar lebih cepat.'},well:{name:'Sumur',wood:30,stone:45,work:40,tip:'Pemulihan kesehatan harian +0,3.'}};
export const POLICIES={balanced:'Seimbang',survival:'Ketahanan pangan',expansion:'Pembangunan',knowledge:'Pengetahuan'};
const NAMES=['Arka','Nara','Bima','Sari','Raka','Laras','Damar','Ayu','Jati','Kirana','Bayu','Sekar','Wira','Tara','Dian','Sena'];
const clamp=(n,min=0,max=100)=>Math.min(max,Math.max(min,n));
export function random(s){let n=s.rng>>>0;n^=n<<13;n^=n>>>17;n^=n<<5;s.rng=n>>>0;return s.rng/4294967296;}
export function log(s,text){s.logs.unshift({day:s.day,text});s.logs=s.logs.slice(0,45);}
export function population(s){return s.agents.filter(a=>a.alive);}
export function capacity(s){return 3+s.buildings.hut*3;}
export function era(s){return s.tech>=200?'Peradaban berkembang':s.tech>=60?'Desa agraris':'Permukiman awal';}
function newAgent(s){const id=s.nextId++,a={id,name:NAMES[(id-1)%NAMES.length]+(id>16?' '+Math.ceil(id/16):''),age:16+Math.floor(random(s)*18),alive:true,health:100,hunger:15,energy:90,mood:70,action:'rest',steps:0,rewardSum:0,explorations:0,lastReward:0,q:{},visits:{},skills:Object.fromEntries(ACTIONS.map(k=>[k,0])),color:Math.floor(random(s)*5)};s.agents.push(a);if(s.agents.length>100){let excess=s.agents.length-100;s.agents=s.agents.filter(item=>item.alive||excess--<=0);}return a;}
export function newGame(seed=Date.now(),now=Date.now()){
 const s={version:VERSION,rng:(Number(seed)>>>0)||1,seed:(Number(seed)>>>0)||1,day:0,food:65,wood:30,stone:15,tech:0,harmony:75,policy:'balanced',buildings:{hut:1,farm:0,school:0,well:0},project:null,agents:[],nextId:1,logs:[],paused:false,lastSaved:now,carryMs:0,history:[],totalSteps:0,deathCount:0};
 for(let i=0;i<6;i++)newAgent(s);log(s,'Enam perintis tiba. Mereka mulai mencoba dan belajar.');return s;
}
export function observation(s,a){return [a.hunger>=55?1:0,a.energy<35?1:0,s.food<population(s).length*3?1:0,s.project?1:0,s.policy].join(':');}
export function available(s,a){if(a.hunger>=85&&s.food>=1)return ['eat'];if(a.energy<=5)return ['rest'];const list=['forage','wood','stone','research','rest','social'];if(s.buildings.farm)list.push('farm');if(s.project)list.push('build');if(s.food>=1&&a.hunger>10)list.push('eat');return list;}
export function epsilon(a){return Math.max(.05,.28*Math.exp(-a.steps/700));}
export function row(a,state){return a.q[state]||(a.q[state]=Object.fromEntries(ACTIONS.map(k=>[k,0])));}
export function selectAction(s,a,state=observation(s,a)){
 const choices=available(s,a),values=row(a,state);
 if(random(s)<epsilon(a)){a.explorations++;return choices[Math.floor(random(s)*choices.length)];}
 const best=Math.max(...choices.map(k=>values[k]));const tied=choices.filter(k=>Math.abs(values[k]-best)<1e-9);return tied[Math.floor(random(s)*tied.length)];
}
export function learn(a,state,action,reward,nextState,nextActions,terminal=false,alpha=.16){
 const current=row(a,state),future=terminal?0:Math.max(...nextActions.map(k=>row(a,nextState)[k]));
 const target=reward+.75*future;current[action]+=alpha*(target-current[action]);
 a.visits[state]=(a.visits[state]||0)+1;a.steps++;a.rewardSum+=reward;a.lastReward=reward;
}
export function startProject(s,key){
 const b=BUILDINGS[key];if(!b)throw Error('Bangunan tidak dikenal.');if(s.project)throw Error('Selesaikan proyek yang sedang berjalan.');
 if(s.buildings[key]>=8)throw Error('Batas bangunan ini sudah tercapai.');
 if(s.wood<b.wood||s.stone<b.stone)throw Error('Kayu atau batu belum cukup.');
 s.wood-=b.wood;s.stone-=b.stone;s.project={key,progress:0,required:b.work};log(s,'Proyek '+b.name+' dimulai. Penduduk akan belajar mengerjakannya.');
}
function act(s,a,key){
 const before={hunger:a.hunger,energy:a.energy},skill=a.skills[key],scale=1+Math.min(1.5,skill/150),scarce=s.food<population(s).length*3;let reward=0;
 switch(key){
 case 'forage': {const amount=(1.5+random(s)*2)*scale;s.food+=amount;a.energy-=5;reward=amount*(scarce?2:0.6);break;}
 case 'wood': {const amount=(1.5+random(s)*1.5)*scale;s.wood+=amount;a.energy-=7;reward=amount*(s.wood<80?1:.3);break;}
 case 'stone': {const amount=(1+random(s))*scale;s.stone+=amount;a.energy-=8;reward=amount*(s.stone<60?1.3:.4);break;}
 case 'farm': {const amount=(3+random(s)*2)*scale;s.food+=amount;a.energy-=6;reward=amount*(scarce?2:.6);break;}
 case 'build': if(s.project){const amount=2*scale;s.project.progress+=amount;a.energy-=7;reward=3;if(s.project.progress>=s.project.required){const k=s.project.key;s.buildings[k]++;s.project=null;reward+=5;log(s,BUILDINGS[k].name+' selesai dibangun.');}}break;
 case 'research': {const amount=.6*scale*(s.buildings.school?1.5:1);s.tech+=amount;a.energy-=4;reward=amount*2;break;}
 case 'eat': if(s.food>=1){s.food--;a.hunger=clamp(a.hunger-38);a.health=clamp(a.health+1);reward=(before.hunger-a.hunger)*.16;}else reward=-2;break;
 case 'rest':a.energy=clamp(a.energy+27);a.health=clamp(a.health+.7);reward=(a.energy-before.energy)*.18;break;
 case 'social':a.mood=clamp(a.mood+20);s.harmony=clamp(s.harmony+.6);a.energy-=2;reward=a.mood<85?2:0.5;break;
 }
 a.hunger=clamp(a.hunger+3);a.mood=clamp(a.mood-.5);a.energy=clamp(a.energy);
 if(a.hunger>=90){a.health=clamp(a.health-3);reward-=5;}if(a.energy<=10)reward-=2;
 if(a.hunger<55&&a.energy>25){a.health=clamp(a.health+.15+s.buildings.well*.3);reward+=.4;}
 if(s.policy==='survival'&&['forage','farm'].includes(key))reward+=2;
 if(s.policy==='expansion'&&['wood','stone','build'].includes(key))reward+=1.5;
 if(s.policy==='knowledge'&&key==='research')reward+=2;
 a.skills[key]+=1;a.action=key;
 if(a.health<=0){a.alive=false;s.deathCount++;log(s,a.name+' meninggal karena kebutuhan hidup tidak terpenuhi.');reward-=15;}
 return reward;
}
function annualEvent(s){
 const event=Math.floor(random(s)*4);
 if(event===0){const lost=Math.min(s.food,s.food*.18);s.food-=lost;log(s,'Musim kering: cadangan makanan berkurang '+Math.round(lost)+'.');}
 else if(event===1){s.wood+=20;log(s,'Hutan memberi hasil melimpah: kayu +20.');}
 else if(event===2){s.tech+=8;log(s,'Penemuan baru dibagikan: pengetahuan +8.');}
 else {s.harmony=clamp(s.harmony-12);for(const a of population(s))a.mood=clamp(a.mood-8);log(s,'Perselisihan warga menurunkan keharmonisan.');}
 for(const a of population(s)){a.age++;if(a.age>75&&random(s)<.04+(a.age-75)*.008){a.alive=false;s.deathCount++;log(s,a.name+' meninggal pada usia '+a.age+' tahun.');}}
}
export function tick(s){
 if(s.paused||!population(s).length)return false;
 s.day++;const oldEra=era(s);s.food+=s.buildings.farm*1.2;s.harmony=clamp(s.harmony-.08);
 // Rotate order to avoid consistently privileging one agent over shared food/building resources.
 const agents=population(s),offset=s.day%agents.length;
 for(let i=0;i<agents.length;i++){const a=agents[(i+offset)%agents.length],state=observation(s,a),key=selectAction(s,a,state),reward=act(s,a,key);learn(a,state,key,reward,observation(s,a),available(s,a),!a.alive,s.buildings.school?.22:.16);s.totalSteps++;}
 if(s.day%60===0)annualEvent(s);
 if(s.day%45===0&&population(s).length<Math.min(16,capacity(s))&&s.food>30){const a=newAgent(s);s.food-=12;log(s,a.name+' bergabung dengan permukiman; model belajarnya dimulai dari nol.');}
 if(era(s)!==oldEra)log(s,'Peradaban memasuki '+era(s)+'.');
 if(s.day%10===0){s.history.push({day:s.day,pop:population(s).length,food:Math.round(s.food),tech:Math.round(s.tech)});s.history=s.history.slice(-90);}
 if(!population(s).length)log(s,'Permukiman telah berakhir. Arsip pembelajaran tetap tersedia.');return true;
}
export function advance(s,elapsedMs){
 const elapsed=Math.min(OFFLINE_CAP,Math.max(0,Number(elapsedMs)||0));
 if(s.paused||!population(s).length)return 0;
 const total=elapsed+s.carryMs,n=Math.floor(total/DAY_MS);s.carryMs=total%DAY_MS;let completed=0;
 for(let i=0;i<n;i++){if(!tick(s))break;completed++;}return completed;
}
export function validateSave(value){
 const s=JSON.parse(JSON.stringify(value));const finite=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
 if(!s||s.version!==VERSION||!finite(s.rng,1,4294967295)||!finite(s.seed,1,4294967295)||!finite(s.day,0,1e8)||!finite(s.nextId,1,1e7)||!finite(s.lastSaved,0,1e16)||!finite(s.carryMs,0,DAY_MS)||typeof s.paused!=='boolean'||!Object.hasOwn(POLICIES,s.policy))throw Error('Format simpanan tidak cocok.');
 for(const key of ['food','wood','stone','tech','harmony','totalSteps','deathCount'])if(!finite(s[key],0,1e12))throw Error('Nilai simpanan tidak valid.');
 for(const key of Object.keys(BUILDINGS))if(!Number.isInteger(s.buildings?.[key])||!finite(s.buildings[key],0,8))throw Error('Bangunan simpanan tidak valid.');
 if(s.project&&(!Object.hasOwn(BUILDINGS,s.project.key)||!finite(s.project.progress,0,1000)||s.project.required!==BUILDINGS[s.project.key].work))throw Error('Proyek simpanan tidak valid.');
 if(!Array.isArray(s.agents)||s.agents.length>300||!Array.isArray(s.logs)||s.logs.length>45||!Array.isArray(s.history)||s.history.length>90)throw Error('Ukuran simpanan tidak valid.');
 const ids=new Set();for(const a of s.agents){if(!Number.isInteger(a.id)||a.id<1||a.id>=s.nextId||ids.has(a.id)||typeof a.name!=='string'||a.name.length>50||typeof a.alive!=='boolean'||!finite(a.age,0,1e6)||!finite(a.color,0,4)||!finite(a.steps,0,1e12)||!finite(a.explorations,0,a.steps)||!finite(a.rewardSum,-1e12,1e12)||!finite(a.lastReward,-1000,1000)||!ACTIONS.includes(a.action))throw Error('Penduduk simpanan tidak valid.');ids.add(a.id);
 for(const k of ['health','hunger','energy','mood'])if(!finite(a[k],0,100))throw Error('Kondisi penduduk tidak valid.');
 for(const k of ACTIONS)if(!finite(a.skills?.[k],0,1e12))throw Error('Skill tidak valid.');
 if(!a.q||typeof a.q!=='object'||Array.isArray(a.q)||Object.keys(a.q).length>1000||!a.visits||typeof a.visits!=='object')throw Error('Model belajar tidak valid.');
 for(const [key,values]of Object.entries(a.q)){if(!/^[01]:[01]:[01]:[01]:(balanced|survival|expansion|knowledge)$/.test(key)||!finite(a.visits[key]||0,0,1e12))throw Error('State belajar tidak valid.');for(const k of ACTIONS)if(!finite(values[k],-1000,1000))throw Error('Bobot model tidak valid.');}}
 for(const l of s.logs)if(!finite(l.day,0,s.day)||typeof l.text!=='string'||l.text.length>500)throw Error('Riwayat tidak valid.');
 for(const h of s.history)for(const k of ['day','pop','food','tech'])if(!finite(h[k],0,1e12))throw Error('Grafik tidak valid.');
 return s;
}
