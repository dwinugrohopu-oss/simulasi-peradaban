import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','app.js','engine.js','world-schema.js','physics.js','society.js','world.js','warfare.js','map.js','economy.js','rules.js','notifications.js','civics.js','research.js','frontier.js','ideologies.js','equipment.js','warehouse.js','storage.js','shelter.js','wildlife.js','menu-groups.js'])await copyFile(file,'dist/'+file);
console.log('Static game ready in dist/');
