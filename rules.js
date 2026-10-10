/* Shared rules for the simulation, planner, UI and save validator. */
export const ACTIONS=['forage','wood','stone','farm','build','research','eat','rest','social','fish','steal','intimidate','revenge','persuade','share','craft','smelt','fuel','alloy','generate','extract','useResource','studyMagic','channel','heal','enchantBuild','observe','assembleShip','defend','teach','diplomacy','translate','voyage'];
export const LABELS={forage:'Mencari makanan',wood:'Menebang kayu',stone:'Menambang batu',farm:'Bertani',build:'Membangun',research:'Meneliti',eat:'Makan',rest:'Istirahat',social:'Bersosialisasi',fish:'Memancing',steal:'Mencuri',intimidate:'Mengintimidasi',revenge:'Membalas dendam',persuade:'Memanipulasi',share:'Berbagi',craft:'Merancang dan menguji alat',smelt:'Melebur logam',fuel:'Membuat bahan bakar',alloy:'Membuat paduan',generate:'Menghasilkan listrik',extract:'Mengumpulkan resource khusus',useResource:'Memanfaatkan resource',studyMagic:'Mempelajari sihir',channel:'Mengumpulkan mana',heal:'Merawat dengan sihir',enchantBuild:'Membangun dengan sihir',observe:'Mengamati sinyal',assembleShip:'Merakit wahana',defend:'Mempertahankan wilayah',teach:'Mengajar',diplomacy:'Berunding',translate:'Menerjemahkan bahasa',voyage:'Ekspedisi'};
export const BUILDINGS={hut:{name:'Rumah',wood:35,stone:10,work:30,tip:'Kapasitas +3 penduduk.'},farm:{name:'Ladang',wood:25,stone:5,work:25,tip:'Membuka bertani. Panen membutuhkan warga yang bekerja.'},school:{name:'Balai belajar',wood:60,stone:35,work:60,tip:'Penelitian +50% dan belajar lebih cepat.'},well:{name:'Sumur',wood:30,stone:45,work:40,tip:'Membantu pemulihan dan mengurangi dampak kemarau.'},furnace:{name:'Tungku',wood:40,stone:30,work:40,requires:'metallurgy',tip:'Warga bisa membuat bahan bakar dan melebur logam.'},workshop:{name:'Bengkel',wood:45,stone:25,metal:8,work:55,requires:'metallurgy',tip:'Tempat praktik mesin dan pembuatan paduan.'},generator:{name:'Pembangkit',wood:45,stone:30,metal:25,work:65,requires:'electricity',tip:'Menghasilkan listrik jika dioperasikan warga dan diberi bahan bakar.'},observatory:{name:'Observatorium',wood:40,stone:20,metal:12,work:55,requires:'astronomy',tip:'Tempat mengamati langit dan sinyal dengan energi.'},shipyard:{name:'Galangan wahana',wood:60,stone:40,metal:30,alloy:15,work:85,requires:'rocketry',tip:'Tempat warga merakit wahana sebelum kru berangkat.'},habitat:{name:'Habitat tertutup',wood:0,stone:0,metal:20,alloy:40,energy:50,work:90,requires:'colonization',tip:'Perlindungan koloni di planet yang tidak ramah.'}};
export const POLICIES={balanced:'Seimbang',survival:'Ketahanan pangan',expansion:'Pembangunan',knowledge:'Pengetahuan'};
export const TRAITS={
 diligent:{name:'Rajin',jobs:['wood','stone','farm','build','smelt','fuel','alloy','generate','assembleShip'],efficiency:1.18,energy:.9,explore:1},
 curious:{name:'Penasaran',jobs:['research','craft','studyMagic','observe','teach'],efficiency:1.25,energy:1,explore:1.35},
 sociable:{name:'Supel',jobs:['social','teach','heal'],efficiency:1.15,energy:1,explore:1.1},
 frugal:{name:'Hemat',jobs:['forage','farm','fish'],efficiency:1.1,energy:1,explore:.85},
 brave:{name:'Pemberani',jobs:['stone','wood','fish','extract','defend'],efficiency:1.18,energy:1,explore:1.2},
 selfish:{name:'Egois',jobs:['wood','forage'],efficiency:1,energy:1,explore:1},
 greedy:{name:'Serakah',jobs:['steal'],efficiency:1,energy:1,explore:1.1},
 vengeful:{name:'Pendendam',jobs:['revenge'],efficiency:1,energy:1,explore:1},
 aggressive:{name:'Agresif',jobs:['intimidate'],efficiency:1,energy:1,explore:1.1},
 cruel:{name:'Kejam',jobs:['intimidate','revenge'],efficiency:1,energy:1,explore:1},
 manipulative:{name:'Manipulatif',jobs:['persuade'],efficiency:1,energy:1,explore:1},
 careful:{name:'Hati-hati',jobs:['build','farm','research','craft','studyMagic','enchantBuild'],efficiency:1.12,energy:.85,explore:.7}
};
export const STAGES=['Permukiman awal','Agraris','Zaman logam','Industri','Listrik','Digital','Antariksa'];
export const DISCOVERIES={
 agriculture:{work:8,name:'Pertanian',requires:[],tech:15,skill:8,stage:1,cost:{wood:8},needs:s=>s.buildings.farm>0},
 metallurgy:{work:12,name:'Peleburan logam',requires:['agriculture'],tech:70,skill:20,stage:2,cost:{wood:20,stone:25},needs:s=>s.achievements.successfulTools>=2},
 mechanics:{work:18,name:'Mesin dan perkakas',requires:['metallurgy'],tech:160,skill:35,stage:3,cost:{metal:12,wood:35},needs:s=>s.achievements.toolUses>=10&&s.buildings.workshop>0&&s.achievements.smelt>=3},
 astronomy:{work:20,name:'Astronomi',requires:['mechanics'],tech:220,skill:60,stage:3,cost:{metal:8},needs:s=>s.buildings.school>0},
 electricity:{work:24,name:'Pembangkit listrik',requires:['mechanics'],tech:300,skill:70,stage:4,cost:{metal:20,fuel:15},needs:s=>s.buildings.workshop>0},
 electronics:{work:28,name:'Elektronika dan radio',requires:['electricity'],tech:500,skill:100,stage:5,cost:{metal:25,energy:30},needs:s=>s.buildings.generator>0},
 rocketry:{work:32,name:'Propulsi roket',requires:['electronics','astronomy'],tech:850,skill:150,stage:5,cost:{alloy:25,fuel:40}},
 lifeSupport:{work:32,name:'Penunjang kehidupan',requires:['rocketry'],tech:1000,skill:170,stage:5,cost:{energy:40,food:50},needs:s=>s.buildings.shipyard>0},
 spaceflight:{work:36,name:'Penerbangan antariksa',requires:['lifeSupport'],tech:1200,skill:200,stage:6,cost:{alloy:40,fuel:80,energy:100}},
 colonization:{work:40,name:'Habitat planet',requires:['spaceflight'],tech:1500,skill:240,stage:6,cost:{alloy:60,energy:150,food:100}}
};

export const POPULATION_LIMIT=256,BUILDING_LIMIT=128,TOOL_LIMIT=2048;
