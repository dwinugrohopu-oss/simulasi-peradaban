import test from 'node:test';
import assert from 'node:assert/strict';
import {camera,showPlanet,project,focus,zoom,pan} from '../map.js';
test('whole planet fits phone and desktop dimensions, focus restores settlement view',()=>{for(const [width,height]of [[360,700],[920,480],[1800,1000],[640,320]]){const c=camera(width,height);c.planet=1;showPlanet(c);assert.equal(c.planet,1);for(const [x,y]of [[0,0],[3200,0],[0,2000],[3200,2000]]){const p=project(c,x,y);assert.ok(p.x>=0&&p.x<=width&&p.y>=0&&p.y<=height);}const z=c.zoom;zoom(c,1.3);assert.ok(c.zoom>z);assert.equal(c.overview,false);showPlanet(c);pan(c,10,0);assert.equal(c.overview,false);focus(c,{planet:0,x:650,y:250});assert.equal(c.zoom,.85);assert.equal(c.planet,0);assert.deepEqual(project(c,650,250),{x:width/2,y:height/2});}});
