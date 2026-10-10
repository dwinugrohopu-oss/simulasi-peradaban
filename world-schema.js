export const OBJECT_KINDS=['river','forest','quarry','ruins','building','event','resource','magic'];
export const BUILDING_KEYS=['none','hut','farm','school','well'];
export const EVENT_KEYS=['none','drought','flood','festival','disease','war','rebellion','contact','awakening','custom'];
export const OBJECT_LABELS={river:'Sungai',forest:'Hutan',quarry:'Tambang batu',ruins:'Reruntuhan',building:'Bangunan',event:'Peristiwa',resource:'Resource khusus',magic:'Sumber sihir'};
export const OBJECT_SCHEMA={type:'object',additionalProperties:false,properties:{kind:{type:'string',enum:OBJECT_KINDS},name:{type:'string'},description:{type:'string'},x:{type:'number'},y:{type:'number'},richness:{type:'integer'},intensity:{type:'integer'},duration:{type:'integer'},building:{type:'string',enum:BUILDING_KEYS},event:{type:'string',enum:EVENT_KEYS},amount:{type:'integer'}},required:['kind','name','description','x','y','richness','intensity','duration','building','event','amount']};
const EXTENSIONS={resourceKey:{type:'string'},category:{type:'string',enum:['mineral','fuel','food','medicine','arcane','energy']},hardness:{type:'number'},strength:{type:'number'},toxicity:{type:'number'},energy:{type:'number'},arcane:{type:'number'},healing:{type:'number'},research:{type:'number'},renewable:{type:'boolean'},effect:{type:'string',enum:['food','health','harmony','research','energy','magic']},magnitude:{type:'integer'},trigger:{type:'string',enum:['immediate','lowHarmony','advanced','arcane']}};
Object.assign(OBJECT_SCHEMA.properties,EXTENSIONS);
export function validateDescriptor(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!Object.hasOwn(OBJECT_SCHEMA.properties,k))||OBJECT_SCHEMA.required.some(k=>!Object.hasOwn(value,k)))throw Error('Rancangan objek tidak lengkap.');
 const d={...value},num=(k,min,max,integer=false)=>typeof d[k]==='number'&&Number.isFinite(d[k])&&d[k]>=min&&d[k]<=max&&(!integer||Number.isInteger(d[k]));
 if(!OBJECT_KINDS.includes(d.kind)||!BUILDING_KEYS.includes(d.building)||!EVENT_KEYS.includes(d.event)||typeof d.name!=='string'||d.name.trim().length<1||d.name.length>60||typeof d.description!=='string'||d.description.length>300||!num('x',0,100)||!num('y',0,100)||!num('richness',1,10,true)||!num('intensity',1,5,true)||!num('duration',10,180,true)||!num('amount',1,3,true))throw Error('Parameter objek di luar batas simulasi.');
 if((d.kind==='building')!==(d.building!=='none')||(d.kind==='event')!==(d.event!=='none'))throw Error('Jenis dan efek objek tidak cocok.');
 if(d.kind==='resource'){
 if(typeof d.resourceKey!=='string'||!/^[a-z][a-z0-9_]{0,29}$/.test(d.resourceKey)||['constructor','prototype','__proto__'].includes(d.resourceKey)||!EXTENSIONS.category.enum.includes(d.category)||typeof d.renewable!=='boolean')throw Error('Identitas resource tidak valid.');
 for(const k of ['hardness','strength','toxicity','energy','arcane','healing','research'])if(!num(k,0,k==='strength'?100:10))throw Error('Sifat resource di luar batas.');
 }if(d.kind==='event'&&['war','rebellion','contact','awakening','custom'].includes(d.event)){if(!EXTENSIONS.trigger.enum.includes(d.trigger))throw Error('Pemicu peristiwa tidak valid.');if(d.event==='custom'&&(!EXTENSIONS.effect.enum.includes(d.effect)||!num('magnitude',-5,5,true)))throw Error('Efek peristiwa tidak valid.');}
 // Reject invalid optional fields too, including data intended for a different kind.
 for(const [k,v]of Object.entries(EXTENSIONS))if(Object.hasOwn(d,k)){if(v.type==='number'&&!num(k,0,k==='strength'?100:10)||v.type==='integer'&&!num(k,-5,5,true)||v.type==='boolean'&&typeof d[k]!=='boolean'||v.type==='string'&&(typeof d[k]!=='string'||d[k].length>60||v.enum&&!v.enum.includes(d[k])))throw Error('Parameter tambahan tidak valid.');}
 d.name=d.name.trim();return d;
}
export function describeEffect(d){
 if(d.kind==='resource')return `Cadangan ${d.richness*100} ${d.name}; kategori ${d.category}; kekerasan ${d.hardness}, kekuatan ${d.strength}. Saat dipakai: energi ${d.energy}, sihir ${d.arcane}, penelitian ${d.research}, penyembuhan ${d.healing}, toksisitas ${d.toxicity}. ${d.renewable?'Terbarukan.':'Bisa habis.'}`;
 if(d.kind==='magic')return 'Sumber tersembunyi: perlu warga peka ≥75, keahlian penelitian ≥20, pengetahuan ≥40, serta pengamatan dekat sumber.';
 if(d.kind==='event'&&['war','rebellion','contact','awakening','custom'].includes(d.event))return `Pemicu ${d.trigger}; ${d.duration} hari. `+({war:'Ketegangan dengan peradaban lain di planet yang sama; perang masih membutuhkan warga dan logistik.',rebellion:'Menurunkan keharmonisan dan meningkatkan keluhan; pemisahan membutuhkan kelompok serta bekal.',contact:'Memperkuat pencarian sinyal; kontak membutuhkan astronomi dan radio kedua pihak.',awakening:'Mempercepat pengamatan sihir; tidak melewati syarat kepekaan dan penelitian.',custom:`Efek ${d.effect}: ${d.magnitude*.2} per hari.`}[d.event]);
 if(d.kind==='river')return `Memancing dibuka, cadangan awal ${d.richness*80} ikan; risiko banjir tahunan ${d.intensity*6}%.`;
 if(d.kind==='forest'||d.kind==='quarry')return `Cadangan ${d.richness*80} ${d.kind==='forest'?'kayu':'batu'} meningkatkan hasil kerja sampai habis.`;
 if(d.kind==='ruins')return `Cadangan ${d.richness*80} temuan menambah hasil penelitian sampai habis.`;
 if(d.kind==='building')return `Tambahkan ${d.amount} ${d.building}; tanpa biaya bahan, sebagai intervensi dunia.`;
 return `${d.event} aktif selama ${d.duration} hari, intensitas ${d.intensity}.`;
}

export function localDraft(prompt){
 const text=prompt.toLowerCase();let kind,building='none',event='none',name;
 if(/sihir|mana|magic/.test(text)){kind='magic';name='Mata air mana';}
 else if(/perang|war|pemberontakan|perpecahan|alien|kontak/.test(text)){kind='event';event=/perang|war/.test(text)?'war':/pemberontakan|perpecahan/.test(text)?'rebellion':'contact';name='Pemicu '+event;}
 else if(/resource|sumber daya|kristal|uranium|besi|minyak/.test(text)){kind='resource';name=/uranium/.test(text)?'Uranium':/besi/.test(text)?'Besi':/minyak/.test(text)?'Minyak':'Kristal baru';}
 else if(/sungai|river|ikan|memancing/.test(text)){kind='river';name='Sungai kehidupan';}
 else if(/hutan|forest/.test(text)){kind='forest';name='Hutan baru';}
 else if(/tambang|quarry|batu/.test(text)){kind='quarry';name='Bukit batu';}
 else if(/reruntuhan|ruins/.test(text)){kind='ruins';name='Reruntuhan kuno';}
 else if(/rumah|ladang|sekolah|balai belajar|sumur/.test(text)){kind='building';building=/rumah/.test(text)?'hut':/ladang/.test(text)?'farm':/sumur/.test(text)?'well':'school';name='Bangunan pemberian';}
 else if(/kekeringan|kemarau|banjir|festival|wabah/.test(text)){kind='event';event=/kekeringan|kemarau/.test(text)?'drought':/banjir/.test(text)?'flood':/wabah/.test(text)?'disease':'festival';name='Peristiwa baru';}
 else throw Error('Mode lokal mengenali sungai, hutan, tambang batu, reruntuhan, rumah, ladang, balai belajar, sumur, kemarau, banjir, festival, atau wabah.');
 const extra=kind==='resource'?{resourceKey:name.toLowerCase().replace(/ /g,'_'),category:/minyak|uranium/.test(text)?'fuel':'mineral',hardness:5,strength:70,toxicity:/uranium/.test(text)?5:0,energy:/minyak|uranium/.test(text)?4:0,arcane:/kristal/.test(text)?2:0,healing:0,research:1,renewable:false}:kind==='event'&&['war','rebellion','contact'].includes(event)?{trigger:'immediate'}:{};
 return validateDescriptor({...extra,kind,name,description:'Intervensi mode lokal berdasarkan kata kunci; detail bebas memerlukan LLM.',x:/timur/.test(text)?85:/barat/.test(text)?15:50,y:/utara/.test(text)?20:/selatan/.test(text)?80:50,richness:5,intensity:2,duration:60,building,event,amount:1});
}
