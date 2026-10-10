import {assignHousing} from '../shelter.js';
// Small settlements keep established unit scenarios independent of the new-game census.
import {newGame as create} from '../engine.js';
export function newGame(seed,now,options={}){const s=create(seed,now,options);for(const t of [s,...(s.world?s.world.settlements.filter(c=>c.state).map(c=>c.state):[])])if(!options.empty){t.agents=t.agents.slice(0,6);t.nextId=7;t.food=65;t.wood=30;t.stone=15;t.fiber=8;t.bone=4;t.buildings.hut=2;t.buildings.warehouse=1;t.buildings.farm=0;assignHousing(t);}return s;}
