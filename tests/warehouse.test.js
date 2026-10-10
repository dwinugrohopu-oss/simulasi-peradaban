import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from './fixtures.js';
import {warehouseStock,equipmentRows} from '../warehouse.js';
import {camera,focus,stockCardLayout,hitStock} from '../map.js';

test('warehouse and government totals include stored goods across planets, excluding private and travelling stock',()=>{
 const root=newGame(42,0),[a,b]=root.world.settlements;b.polityId=a.polityId;
 root.food=10;b.state.food=20;root.industry.metal=2;b.state.industry.metal=3;
 root.agents[0].stash.food=90;root.agents[0].journey={cargo:{food:70}};
 root.customResources=[{key:'crystal',name:'Kristal',amount:4,stock:200}];b.state.customResources=[{key:'crystal',name:'Kristal',amount:6,stock:100}];
 const before=JSON.stringify(root),local=warehouseStock(root,a),total=warehouseStock(root,a,'polity');
 assert.equal(local.resources.food,10);assert.equal(total.resources.food,30);assert.equal(total.resources.metal,5);assert.equal(total.members.length,2);assert.equal(total.custom[0].amount,10);
 b.polityId=b.id;assert.equal(warehouseStock(root,a,'polity').resources.food,10);b.polityId=a.polityId;
 assert.equal(JSON.stringify(root),before);
});

test('equipment groups all records by type and separates assignment, prototypes and damaged archives',()=>{
 const s=newGame(1,0,{world:false});
 const tool=(id,status,condition)=>({id,job:'wood',status,condition,physics:{durability:80}});
 s.tools=[tool(1,'ready',40),tool(2,'ready',80),tool(3,'prototype',80),tool(4,'failed',50),tool(5,'broken',0),tool(6,'ready',0)];
 s.agents[0].equipment.wood=1;s.agents[1].equipment.wood=2;s.agents[1].alive=false;
 const [row]=equipmentRows(s,'tools');assert.equal(row.total,6);assert.equal(row.used,1);assert.equal(row.available,1);assert.equal(row.pending,1);assert.equal(row.archive,3);assert.equal(row.condition,75);
 assert.equal(row.total,row.used+row.available+row.pending+row.archive);
 s.vehicles=[{id:1,type:'cart',condition:60},{id:2,type:'cart',condition:100},{id:3,type:'motor',condition:0}];
 s.agents[0].journey={vehicle:1};const [cart,motor]=equipmentRows(s,'vehicles');assert.equal(cart.used,1);assert.equal(cart.available,1);assert.equal(cart.condition,80);assert.equal(motor.archive,1);
});

test('stock cards stay inside the phone map, deduplicate government and stop accepting hits when hidden',()=>{
 const root=newGame(1,0),c=camera(360,620),[a,b]=root.world.settlements;focus(c,a);
 b.planet=a.planet;b.x=a.x+100;b.y=a.y;b.polityId=a.polityId;c.stockMode='polity';
 c.stockCards=stockCardLayout(root,c,a.id);assert.equal(c.stockCards.length,1);const card=c.stockCards[0];assert.equal(card.civId,a.id);assert.ok(card.x>=0&&card.x+card.width<=360);assert.ok(card.y>=88&&card.y+card.height<=470);
 assert.equal(hitStock(c,card.x+10,card.y+10).civId,a.id);c.stockMode='off';assert.equal(hitStock(c,card.x+10,card.y+10),null);assert.deepEqual(stockCardLayout(root,c,a.id),[]);
 c.stockMode='warehouse';c.layer='space';assert.deepEqual(stockCardLayout(root,c,a.id),[]);assert.equal(hitStock(c,card.x+10,card.y+10),null);
});
