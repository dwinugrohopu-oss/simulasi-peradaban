export const OBJECT_KINDS=['river','forest','quarry','ruins','building','event'];
export const BUILDING_KEYS=['none','hut','farm','school','well'];
export const EVENT_KEYS=['none','drought','flood','festival','disease'];
export const OBJECT_LABELS={river:'Sungai',forest:'Hutan',quarry:'Tambang batu',ruins:'Reruntuhan',building:'Bangunan',event:'Peristiwa'};
export const OBJECT_SCHEMA={type:'object',additionalProperties:false,properties:{kind:{type:'string',enum:OBJECT_KINDS},name:{type:'string'},description:{type:'string'},x:{type:'number'},y:{type:'number'},richness:{type:'integer'},intensity:{type:'integer'},duration:{type:'integer'},building:{type:'string',enum:BUILDING_KEYS},event:{type:'string',enum:EVENT_KEYS},amount:{type:'integer'}},required:['kind','name','description','x','y','richness','intensity','duration','building','event','amount']};
export function validateDescriptor(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==OBJECT_SCHEMA.required.length||OBJECT_SCHEMA.required.some(k=>!Object.hasOwn(value,k)))throw Error('Rancangan objek tidak lengkap.');
 const d={...value},num=(k,min,max,integer=false)=>typeof d[k]==='number'&&Number.isFinite(d[k])&&d[k]>=min&&d[k]<=max&&(!integer||Number.isInteger(d[k]));
 if(!OBJECT_KINDS.includes(d.kind)||!BUILDING_KEYS.includes(d.building)||!EVENT_KEYS.includes(d.event)||typeof d.name!=='string'||d.name.trim().length<1||d.name.length>60||typeof d.description!=='string'||d.description.length>300||!num('x',0,100)||!num('y',0,100)||!num('richness',1,10,true)||!num('intensity',1,5,true)||!num('duration',10,180,true)||!num('amount',1,3,true))throw Error('Parameter objek di luar batas simulasi.');
 if((d.kind==='building')!==(d.building!=='none')||(d.kind==='event')!==(d.event!=='none'))throw Error('Jenis dan efek objek tidak cocok.');
 d.name=d.name.trim();return d;
}
export function describeEffect(d){
 if(d.kind==='river')return `Memancing dibuka, cadangan awal ${d.richness*80} ikan; risiko banjir tahunan ${d.intensity*6}%.`;
 if(d.kind==='forest'||d.kind==='quarry')return `Cadangan ${d.richness*80} ${d.kind==='forest'?'kayu':'batu'} meningkatkan hasil kerja sampai habis.`;
 if(d.kind==='ruins')return `Cadangan ${d.richness*80} temuan menambah hasil penelitian sampai habis.`;
 if(d.kind==='building')return `Tambahkan ${d.amount} ${d.building}; tanpa biaya bahan, sebagai intervensi dunia.`;
 return `${d.event} aktif selama ${d.duration} hari, intensitas ${d.intensity}.`;
}

export function localDraft(prompt){
 const text=prompt.toLowerCase();let kind,building='none',event='none',name;
 if(/sungai|river|ikan|memancing/.test(text)){kind='river';name='Sungai kehidupan';}
 else if(/hutan|forest/.test(text)){kind='forest';name='Hutan baru';}
 else if(/tambang|quarry|batu/.test(text)){kind='quarry';name='Bukit batu';}
 else if(/reruntuhan|ruins/.test(text)){kind='ruins';name='Reruntuhan kuno';}
 else if(/rumah|ladang|sekolah|balai belajar|sumur/.test(text)){kind='building';building=/rumah/.test(text)?'hut':/ladang/.test(text)?'farm':/sumur/.test(text)?'well':'school';name='Bangunan pemberian';}
 else if(/kekeringan|kemarau|banjir|festival|wabah/.test(text)){kind='event';event=/kekeringan|kemarau/.test(text)?'drought':/banjir/.test(text)?'flood':/wabah/.test(text)?'disease':'festival';name='Peristiwa baru';}
 else throw Error('Mode lokal mengenali sungai, hutan, tambang batu, reruntuhan, rumah, ladang, balai belajar, sumur, kemarau, banjir, festival, atau wabah.');
 return validateDescriptor({kind,name,description:'Intervensi mode lokal berdasarkan kata kunci; detail bebas memerlukan LLM.',x:/timur/.test(text)?85:/barat/.test(text)?15:50,y:/utara/.test(text)?20:/selatan/.test(text)?80:50,richness:5,intensity:2,duration:60,building,event,amount:1});
}
