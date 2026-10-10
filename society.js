const clamp=(n,min=0,max=100)=>Math.min(max,Math.max(min,n));
export function initCitizen(a){a.lastConflict=-100;a.estateSettled=false;a.stash={food:0,wood:0,stone:0};a.reputation=50;a.relations={};a.memories=[];a.equipment={};a.designMemory={};}
export function remember(a,other,kind,day,impact){a.relations[other.id]=clamp((a.relations[other.id]||0)+impact,-100,100);a.memories.unshift({who:other.id,name:other.name,kind,day});a.memories=a.memories.slice(0,8);if(Object.keys(a.relations).length>32)delete a.relations[Object.keys(a.relations)[0]];}
export function deposit(s,a,key,amount){const fraction=a.traits.includes('selfish')?.25:a.traits.includes('greedy')?.15:0;const kept=Math.min(amount*fraction,Math.max(0,30-a.stash[key]));a.stash[key]+=kept;s[key]+=amount-kept;return kept;}
export function cooperation(s,a){const others=s.agents.filter(b=>b.alive&&b.id!==a.id);const trust=others.reduce((n,b)=>n+(a.relations[b.id]||0),0)/Math.max(1,others.length);return clamp(1+trust/250,.5,1.3);}
export function revengeTarget(s,a){const victim=a.memories.find(m=>['theft','attack','intimidation','revenge'].includes(m.kind)&&s.agents.some(b=>b.id===m.who&&b.alive&&b.age>=16));return victim?s.agents.find(b=>b.id===victim.who):null;}
export function interact(s,a,key,{random,log}){
 const others=s.agents.filter(b=>b.alive&&b.age>=16&&b.id!==a.id);let b=key==='revenge'?revengeTarget(s,a):others[Math.floor(random(s)*Math.max(1,others.length))];
 if(key==='share'){let donated=0;for(const k of ['food','wood','stone']){const amount=Math.min(3,a.stash[k]);a.stash[k]-=amount;s[k]+=amount;donated+=amount;}if(donated){a.reputation=clamp(a.reputation+2);s.harmony=clamp(s.harmony+1);if(b)remember(b,a,'help',s.day,5);}return donated?2:0;}
 if(!b)return -1;
 if(key==='steal'){
  const source=b.stash.food>=1?b.stash:s,amount=Math.min(2,source.food,30-a.stash.food);if(!amount)return -1;
  const caught=random(s)>.45;source.food-=amount;a.stash.food+=amount;
  if(caught){remember(b,a,'theft',s.day,-20);a.reputation=clamp(a.reputation-4);b.mood=clamp(b.mood-8);s.harmony=clamp(s.harmony-1.2);log(s,`${a.name} mengambil pangan tanpa izin; ${b.name} mengetahuinya.`);return -2;}return amount*.7;
 }
 if(key==='persuade'){const agreed=(b.relations[a.id]||0)>-25&&random(s)<.55;const amount=agreed?Math.min(1.5,b.stash.food,30-a.stash.food):0;b.stash.food-=amount;a.stash.food+=amount;remember(b,a,'manipulation',s.day,-3);a.reputation=clamp(a.reputation-.5);return amount*.7-.3;}
 if(key==='intimidate'||key==='revenge'){
  if(key==='revenge'){// Revenge memories are consumed; a fresh offence is needed to repeat it.
   a.memories=a.memories.filter(m=>m.who!==b.id||!['theft','attack','intimidation','revenge'].includes(m.kind));}
  const damage=key==='revenge'?2.5:1;b.health=clamp(b.health-damage);b.mood=clamp(b.mood-6);a.reputation=clamp(a.reputation-3);s.harmony=clamp(s.harmony-1.5);remember(b,a,key==='intimidate'?'intimidation':key,s.day,-15);remember(a,b,'hostility',s.day,-8);log(s,`${a.name} ${key==='revenge'?'membalas dendam kepada':'mengintimidasi'} ${b.name}.`);
  if(!b.health){b.alive=false;b.exitReason='death';s.deathCount++;log(s,b.name+' meninggal akibat konflik.');}
  return a.traits.includes('cruel')?.4:-.5;
 }
 if(key==='social'){const hostile=(a.relations[b.id]||0)<-30||b.reputation<15;remember(a,b,hostile?'dispute':'friendship',s.day,hostile?-2:4);remember(b,a,hostile?'dispute':'friendship',s.day,hostile?-2:4);if(!hostile)a.reputation=clamp(a.reputation+.3);return hostile?-2:.6;}
 return 0;
}
