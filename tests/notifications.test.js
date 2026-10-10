import {newGame} from './fixtures.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {log,applyObject} from '../engine.js';
import {localDraft} from '../world-schema.js';
import {createNotices,classifyNotice} from '../notifications.js';
test('notices distinguish completed achievements, major events and ordinary work',()=>{
 for(const text of ['Penelitian Mesin selesai. Zaman: Industri.','Pengamatan dan latihan warga berhasil memahami sihir.','Kru mendirikan Koloni Nusa Senyap 3.','Rumah selesai dibangun.'])assert.equal(classifyNotice(text).kind,'achievement');
 assert.equal(classifyNotice('Perang dengan Rival dimulai.').kind,'alert');assert.equal(classifyNotice('Peristiwa Badai ion mulai.').kind,'event');assert.equal(classifyNotice('Sungai Bening meluap: pangan -15%.' ).kind,'event');assert.equal(classifyNotice('Penelitian Mesin dimulai; bahan dialokasikan.'),null);assert.equal(classifyNotice('Warga merencanakan Rumah sendiri.'),null);
});
test('old logs are ignored and mirrored foreign achievements appear only once with the correct civilization',()=>{
 const s=newGame(1,0),n=createNotices(),alien=s.world.settlements[1];log(s,'Rumah selesai dibangun.');n.reset(s);n.collect(s);assert.equal(n.show(0),null);const text='Penelitian Mesin selesai. Zaman: Industri.';log(alien.state,text);log(s,alien.name+': '+text);n.collect(s);const item=n.show(1);assert.equal(item.civId,alien.id);assert.equal(item.title,'Penemuan baru');n.collect(s);assert.equal(n.waiting,0);n.dismiss();assert.equal(n.show(2),null);
});
test('notices expire, queue is bounded, and reset after import cannot replay previous messages',()=>{
 const s=newGame(2,0),n=createNotices();n.reset(s);for(let i=0;i<20;i++){s.day++;log(s,'Penelitian Teknologi '+i+' selesai. Zaman: Industri.');}n.collect(s);assert.equal(n.waiting,12);assert.equal(n.show(100).day,9);assert.equal(n.waiting,11);assert.equal(n.show(10099).day,9);assert.equal(n.show(10100).day,10);n.reset(s);n.collect(s);assert.equal(n.show(20000),null);assert.equal(n.waiting,0);
});
test('an event with a free-form name still appears even without a keyword in its name',()=>{
 const s=newGame(3,0),n=createNotices();n.reset(s);const d={...localDraft('festival'),name:'Hari kegembiraan',description:'Warga menikmati hari bersama.'};applyObject(s,d);n.collect(s);const item=n.show(0);assert.equal(item.kind,'event');assert.ok(item.text.includes('Hari kegembiraan'));
});
