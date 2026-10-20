type Entry = { id: string; desc?: string };

const DICT: Record<string, Entry> = {
  "skull": {
    id: "Tengkorak",
    desc: "Tengkorak adalah struktur tulang yang membentuk kepala dan melindungi otak. Tengkorak manusia tersusun dari 22 tulang yang saling terhubung oleh sendi tak bergerak bernama sutura, serta membentuk rongga bagi organ penglihatan, pendengaran, dan penciuman.",
  },
  "cranium": {
    id: "Tengkorak (Kranium)",
    desc: "Kranium adalah bagian tengkorak yang membentuk rongga pelindung otak. Kranium tersusun dari tulang frontal, parietal, temporal, oksipital, sfenoid, dan etmoid.",
  },
  "mandible": {
    id: "Tulang Rahang Bawah",
    desc: "Mandibula adalah tulang rahang bawah dan satu-satunya tulang tengkorak yang dapat bergerak. Tulang ini menahan gigi bawah dan membentuk sendi temporomandibula untuk mengunyah serta berbicara.",
  },
  "maxilla": {
    id: "Tulang Rahang Atas",
    desc: "Maksila adalah tulang rahang atas yang membentuk langit-langit keras mulut, dasar rongga hidung, dan dasar rongga mata. Tulang ini menahan gigi atas.",
  },
  "frontal bone": {
    id: "Tulang Dahi",
    desc: "Tulang frontal membentuk dahi dan atap rongga mata. Di dalamnya terdapat rongga sinus frontal yang membantu melembapkan udara pernapasan.",
  },
  "parietal bone": {
    id: "Tulang Ubun-ubun",
    desc: "Tulang parietal adalah sepasang tulang yang membentuk bagian atas dan samping tengkorak, melindungi bagian besar otak (serebrum).",
  },
  "temporal bone": {
    id: "Tulang Pelipis",
    desc: "Tulang temporal membentuk sisi dan dasar tengkorak. Di dalamnya terdapat organ pendengaran dan keseimbangan, serta tempat melekatnya otot leher.",
  },
  "occipital bone": {
    id: "Tulang Kepala Belakang",
    desc: "Tulang oksipital membentuk bagian belakang dan dasar tengkorak. Pada bagian bawahnya terdapat lubang besar (foramen magnum) tempat sumsum tulang belakang keluar dari otak.",
  },
  "zygomatic bone": {
    id: "Tulang Pipi",
    desc: "Tulang zigomatik (tulang pipi) membentuk tonjolan pipi dan tepi luar rongga mata, serta menjadi tempat melekatnya otot pengunyah.",
  },
  "nasal bone": {
    id: "Tulang Hidung",
    desc: "Tulang nasal adalah sepasang tulang kecil yang membentuk pangkal jembatan hidung.",
  },
  "hyoid bone": {
    id: "Tulang Hioid",
    desc: "Tulang hioid adalah tulang berbentuk huruf U di leher yang tidak berhubungan langsung dengan tulang lain. Tulang ini menopang lidah dan membantu proses menelan serta berbicara.",
  },
  "clavicle": {
    id: "Tulang Selangka",
    desc: "Klavikula (tulang selangka) menghubungkan tulang dada dengan tulang belikat. Tulang ini menjaga bahu tetap pada posisinya dan menyalurkan gaya dari lengan ke tubuh.",
  },
  "scapula": {
    id: "Tulang Belikat",
    desc: "Skapula (tulang belikat) adalah tulang pipih segitiga di punggung yang menghubungkan lengan atas dengan tubuh. Tulang ini menjadi tempat melekatnya banyak otot bahu.",
  },
  "humerus": {
    id: "Tulang Lengan Atas",
    desc: "Humerus adalah tulang panjang lengan atas yang menghubungkan bahu dengan siku. Tulang ini membentuk sendi bahu dan sendi siku.",
  },
  "radius": {
    id: "Tulang Pengumpil",
    desc: "Radius adalah tulang lengan bawah pada sisi ibu jari. Tulang ini memungkinkan gerakan memutar telapak tangan (pronasi dan supinasi).",
  },
  "ulna": {
    id: "Tulang Hasta",
    desc: "Ulna adalah tulang lengan bawah pada sisi kelingking. Tulang ini membentuk sendi siku bersama humerus.",
  },
  "sternum": {
    id: "Tulang Dada",
    desc: "Sternum adalah tulang pipih di tengah dada yang menghubungkan tulang rusuk melalui tulang rawan. Tulang ini melindungi jantung dan paru-paru.",
  },
  "rib cage": {
    id: "Tulang Rusuk",
    desc: "Tulang rusuk (kosta) tersusun dari 12 pasang tulang yang membentuk kurungan pelindung jantung dan paru-paru. Tulang ini juga ikut bergerak saat bernapas.",
  },
  "vertebral column": {
    id: "Tulang Belakang",
    desc: "Tulang belakang (kolumna vertebralis) tersusun dari 33 ruas vertebra yang melindungi sumsum tulang belakang dan menopang tubuh agar tegak.",
  },
  "sacrum": {
    id: "Tulang Sakrum",
    desc: "Sakrum adalah tulang berbentuk segitiga di dasar tulang belakang yang menyatukan panggul dan menyalurkan berat tubuh ke tungkai.",
  },
  "coccyx": {
    id: "Tulang Ekor",
    desc: "Koksis (tulang ekor) adalah sisa tulang belakang bagian bawah yang tersusun dari beberapa vertebra yang menyatu.",
  },
  "hip bone": {
    id: "Tulang Panggul",
    desc: "Tulang panggul terbentuk dari tiga tulang yang menyatu: ilium, iskium, dan pubis. Tulang ini menopang organ perut dan menyalurkan berat tubuh ke tungkai.",
  },
  "pelvis": {
    id: "Panggul",
    desc: "Panggul adalah cincin tulang yang menghubungkan tulang belakang dengan tungkai dan melindungi organ di rongga panggul.",
  },
  "femur": {
    id: "Tulang Paha",
    desc: "Femur adalah tulang terpanjang dan terkuat dalam tubuh manusia. Tulang ini menghubungkan panggul dengan lutut dan menopang sebagian besar berat tubuh.",
  },
  "patella": {
    id: "Tempurung Lutut",
    desc: "Patela (tempurung lutut) adalah tulang kecil yang melindungi sendi lutut dan meningkatkan kekuatan otot paha saat meluruskan kaki.",
  },
  "tibia": {
    id: "Tulang Kering",
    desc: "Tibia (tulang kering) adalah tulang besar pada tungkai bawah yang menopang berat tubuh dan membentuk sendi lutut serta sendi pergelangan kaki. Bersama fibula, tibia dihubungkan oleh membran interoseus.",
  },
  "fibula": {
    id: "Tulang Betis",
    desc: "Fibula (tulang betis) adalah tulang ramping di sisi luar tungkai bawah yang membantu menstabilkan pergelangan kaki dan menjadi tempat melekatnya otot.",
  },
  "talus": {
    id: "Tulang Talus",
    desc: "Talus adalah tulang pergelangan kaki yang meneruskan berat tubuh dari tibia ke kaki.",
  },
  "calcaneus": {
    id: "Tulang Tumit",
    desc: "Kalkaneus adalah tulang tumit terbesar pada kaki, menopang berat tubuh dan menjadi tempat melekatnya tendon Achilles.",
  },
  "trapezius": {
    id: "Otot Trapesius",
    desc: "Otot trapesius membentang dari leher hingga punggung. Otot ini menggerakkan dan menstabilkan tulang belikat serta membantu menegakkan kepala.",
  },
  "deltoid": {
    id: "Otot Deltoid",
    desc: "Otot deltoid membentuk bahu dan berfungsi mengangkat serta memutar lengan atas ke berbagai arah.",
  },
  "pectoralis major": {
    id: "Otot Pektoralis Mayor",
    desc: "Otot pektoralis mayor berada di dada dan berperan menarik lengan ke depan dan ke dalam, serta membantu pernapasan dalam.",
  },
  "latissimus dorsi": {
    id: "Otot Latisimus Dorsi",
    desc: "Otot latisimus dorsi adalah otot punggung yang lebar, berfungsi menarik lengan ke bawah dan ke belakang serta memutar lengan ke dalam.",
  },
  "biceps": {
    id: "Otot Bisep Brakii",
    desc: "Otot bisep brachii berada di lengan depan dan berperan menekuk siku serta memutar lengan bawah.",
  },
  "triceps": {
    id: "Otot Trisep Brakii",
    desc: "Otot trisep brachii berada di belakang lengan atas dan berfungsi meluruskan siku.",
  },
  "diaphragm": {
    id: "Diafragma",
    desc: "Diafragma adalah otot berbentuk kubah yang memisahkan rongga dada dan perut. Otot ini adalah penggerak utama pernapasan: berkontraksi untuk menarik udara masuk.",
  },
  "rectus abdominis": {
    id: "Otot Rektus Abdominis",
    desc: "Otot rektus abdominis membentuk dinding depan perut, menekuk badan ke depan, dan menstabilkan panggul.",
  },
  "gluteus maximus": {
    id: "Otot Gluteus Maksimus",
    desc: "Otot gluteus maximus adalah otot terbesar pada tubuh, membentuk bokong dan berperan meluruskan serta memutar panggul saat berdiri dan berjalan.",
  },
  "quadriceps femoris": {
    id: "Otot Kuadrisep Femoris",
    desc: "Kuadrisep femoris adalah kelompok empat otot di depan paha yang meluruskan lutut — otot terkuat pada tungkai.",
  },
  "gastrocnemius": {
    id: "Otot Gastroknemius",
    desc: "Gastroknemius membentuk betis dan berfungsi menjinjitkan kaki serta mendorong tubuh saat berjalan dan melompat.",
  },
  "soleus": {
    id: "Otot Soleus",
    desc: "Otot soleus berada di bawah gastroknemius dan menjaga posisi tubuh tetap stabil saat berdiri.",
  },
  "masseter": {
    id: "Otot Masseter",
    desc: "Otot masseter adalah salah satu otot pengunyah terkuat, berfungsi mengangkat rahang bawah untuk menggigit.",
  },
  "temporalis": {
    id: "Otot Temporalis",
    desc: "Otot temporalis berada di sisi kepala dan berfungsi mengangkat serta menarik rahang bawah ke belakang.",
  },
  "sternocleidomastoid": {
    id: "Otot Sternokleidomastoid",
    desc: "Otot sternokleidomastoid menghubungkan tulang dada dan tulang selangka dengan tulang pelipis, berperan menekuk dan memutar kepala.",
  },
};

const WORDS: Record<string, string> = {
  bone: "Tulang",
  bones: "Tulang",
  muscle: "Otot",
  muscles: "Otot",
  skull: "Tengkorak",
  cranium: "Tengkorak",
  mandible: "Rahang Bawah",
  maxilla: "Rahang Atas",
  nasal: "Hidung",
  zygomatic: "Pipi",
  temporal: "Pelipis",
  frontal: "Dahi",
  parietal: "Ubun-ubun",
  occipital: "Kepala Belakang",
  sphenoid: "Sfenoid",
  ethmoid: "Etmoid",
  lacrimal: "Lakrimal",
  palatine: "Palatina",
  vomer: "Vomer",
  concha: "Konka",
  hyoid: "Hioid",
  cervical: "Leher",
  thoracic: "Dada",
  lumbar: "Pinggang",
  vertebra: "Vertebra",
  vertebrae: "Vertebra",
  atlas: "Atlas",
  axis: "Aksis",
  sacrum: "Sakrum",
  coccyx: "Tulang Ekor",
  rib: "Rusuk",
  ribs: "Rusuk",
  sternum: "Tulang Dada",
  manubrium: "Manubrium",
  xiphoid: "Xifoid",
  clavicle: "Selangka",
  scapula: "Belikat",
  humerus: "Lengan Atas",
  radius: "Pengumpil",
  ulna: "Hasta",
  carpal: "Pergelangan Tangan",
  metacarpal: "Telapak Tangan",
  phalanx: "Jari",
  pelvis: "Panggul",
  ilium: "Ilium",
  ischium: "Iskium",
  pubis: "Pubis",
  femur: "Paha",
  patella: "Tempurung Lutut",
  tibia: "Kering",
  fibula: "Betis",
  tarsal: "Pergelangan Kaki",
  talus: "Talus",
  calcaneus: "Tumit",
  metatarsal: "Telapak Kaki",
  sesamoid: "Sesamoid",
  trapezius: "Trapesius",
  deltoid: "Deltoid",
  pectoralis: "Pektoralis",
  latissimus: "Latisimus",
  dorsi: "Dorsi",
  biceps: "Bisep",
  triceps: "Trisep",
  brachialis: "Brakialis",
  brachioradialis: "Brakioradialis",
  rectus: "Rektus",
  abdominis: "Abdominis",
  oblique: "Oblik",
  transversus: "Transversus",
  diaphragm: "Diafragma",
  gluteus: "Gluteus",
  quadriceps: "Kuadrisep",
  femoris: "Femoris",
  sartorius: "Sartorius",
  adductor: "Aduktor",
  gastrocnemius: "Gastroknemius",
  soleus: "Soleus",
  tibialis: "Tibialis",
  masseter: "Masseter",
  temporalis: "Temporalis",
  orbicularis: "Orbikularis",
  major: "Mayor",
  minor: "Minor",
  externus: "Eksternus",
  internus: "Internus",
  external: "Eksternal",
  internal: "Internal",
  anterior: "Depan",
  posterior: "Belakang",
  superior: "Atas",
  inferior: "Bawah",
  lateral: "Lateral",
  medial: "Medial",
  proximal: "Proksimal",
  distal: "Distal",
  left: "Kiri",
  right: "Kanan",
  upper: "Atas",
  lower: "Bawah",
  deep: "Dalam",
  superficial: "Superfisial",
  head: "Kepala",
  neck: "Leher",
  body: "Badan",
  shaft: "Batang",
  base: "Dasar",
  process: "Prosesus",
  spine: "Spina",
  canal: "Saluran",
  foramen: "Foramen",
  joint: "Sendi",
  cartilage: "Tulang Rawan",
  tendon: "Tendon",
  bursa: "Bursa",
  sheath: "Selubung",
  limb: "Anggota Gerak",
  foot: "Kaki",
  hand: "Tangan",
  leg: "Tungkai",
  thigh: "Paha",
  arm: "Lengan",
  forearm: "Lengan Bawah",
  face: "Wajah",
  tooth: "Gigi",
  teeth: "Gigi",
};

const nz = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ").replace(/\.(r|l)$/i, "");

export function translateName(en: string): string {
  const key = nz(en);
  if (DICT[key]) return DICT[key].id;
  const tokens = en.split(/[\s#]+/).filter(Boolean);
  const mapped = tokens.map((t) => {
    const w = WORDS[t.toLowerCase().replace(/[^a-z]/g, "")];
    return w ?? t.charAt(0).toUpperCase() + t.slice(1);
  });
  const joined = mapped.join(" ");
  if (mapped[0] && !/^(Tulang|Otot)/.test(mapped[0])) return joined;
  return joined;
}

export function regionOf(en: string): string {
  const s = en.toLowerCase();
  if (/skull|mandible|maxilla|nasal|zygomatic|temporal|frontal|parietal|occipital|sphenoid|ethmoid|orbicularis|masseter|face|tooth|teeth/.test(s))
    return "kepala dan wajah";
  if (/cervical|hyoid|sternocleidomastoid|neck|scalen/.test(s)) return "leher";
  if (/thoracic|rib|sternum|pectoral|intercostal|diaphragm|scapula|trapezius|latissimus|clavicle|thorax/.test(s))
    return "dada dan punggung";
  if (/lumbar|abdom|oblique|rectus|transversus|iliocostalis|longissimus|spinalis/.test(s)) return "perut dan pinggang";
  if (/pelvis|ilium|ischium|pubis|sacrum|coccyx|gluteus|hip|piriformis|obturator/.test(s)) return "panggul";
  if (/humerus|radius|ulna|carpal|metacarpal|phalanx|biceps|triceps|brachialis|deltoid|forearm|hand|pronator|supinator|flexor|extensor/.test(s))
    return "lengan dan tangan";
  if (/femur|patella|tibia|fibula|tarsal|talus|calcaneus|metatarsal|quadriceps|gastrocnemius|soleus|sartorius|adductor|hamstring|leg|thigh|gluteus/.test(s))
    return "tungkai dan kaki";
  return "tubuh";
}

export function idDescription(en: string, group: "bone" | "muscle"): string {
  const key = nz(en);
  if (DICT[key]?.desc) return DICT[key].desc;
  const name = translateName(en);
  const region = regionOf(en);
  if (group === "muscle") {
    return `${name} merupakan salah satu otot pada sistem otot manusia. Otot ini terletak di bagian ${region} dan berperan menggerakkan serta menjaga kestabilan bagian tubuh tersebut.`;
  }
  return `${name} merupakan salah satu tulang pada sistem rangka manusia. Tulang ini terletak di bagian ${region}, berfungsi menopang tubuh, melindungi organ di sekitarnya, serta menjadi tempat melekatnya otot.`;
}
