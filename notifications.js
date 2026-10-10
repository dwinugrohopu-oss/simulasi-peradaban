/* Presentation-only notifications. Existing saves and simulation rules stay unchanged. */
import {stateOf} from './world.js';
export function classifyNotice(text){
 const rules=[[/Penelitian .+ selesai\./,'achievement','Penemuan baru'],[/berhasil memahami sihir/,'achievement','Sihir dipahami'],[/Kontak pertama/,'achievement','Kontak pertama'],[/mendirikan Koloni/,'achievement','Koloni baru'],[/selesai dibangun\./,'achievement','Bangunan selesai'],[/memisahkan diri menjadi/,'alert','Peradaban terpecah'],[/Perang .+ dimulai\./,'alert','Perang dimulai'],[/Gencatan senjata/,'event','Gencatan senjata'],[/Peristiwa .+ mulai\./,'event','Peristiwa dunia'],[/berangkat menuju/,'event','Ekspedisi berangkat'],[/Ekspedisi tiba/,'achievement','Planet dijelajahi'],[/Kru kembali\./,'event','Kru kembali'],[/meninggal|gugur dalam perang/,'alert','Warga meninggal'],[/ lahir\./,'event','Kelahiran'],[/Musim kering|Perselisihan warga|meluap|banjir|wabah|festival|kemarau/i,'event','Peristiwa dunia']];
 for(const [pattern,kind,title]of rules)if(pattern.test(text))return {kind,title};return null;
}
export function createNotices(){
 let seen=new WeakSet(),queue=[],current=null,expires=0,serial=0;
 const visit=(root,fn)=>{for(const civ of root.world.settlements)for(const entry of stateOf(root,civ).logs.slice().reverse()){if(civ.id===1&&root.world.settlements.some(c=>c.id!==1&&entry.text.startsWith(c.name+': ')))continue;fn(civ,entry);}};
 return {
 reset(root){seen=new WeakSet();queue=[];current=null;expires=0;visit(root,(_,entry)=>seen.add(entry));},
 collect(root){const batch=new Set(),fresh=[];visit(root,(civ,entry)=>{if(seen.has(entry))return;seen.add(entry);const localEvent=stateOf(root,civ).objects.some(o=>o.kind==='event'&&entry.text.startsWith('Objek baru: '+o.descriptor.name+'.'));const info=classifyNotice(entry.text)||(localEvent?{kind:'event',title:'Peristiwa baru'}:null),key=civ.id+':'+entry.day+':'+entry.text;if(!info||batch.has(key))return;batch.add(key);fresh.push({...info,id:++serial,text:entry.text,day:entry.day,civId:civ.id,name:civ.name});});queue.push(...fresh.sort((a,b)=>a.day-b.day));queue=queue.slice(-12);},
 show(now){if(current&&now>=expires)current=null;if(!current&&queue.length){current=queue.shift();expires=now+10000;}return current;},
 dismiss(){current=null;expires=0;},
 get waiting(){return queue.length;}
 };
}
