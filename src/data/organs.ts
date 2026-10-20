export type SystemId =
  | "skeletal"
  | "muscular"
  | "circulatory"
  | "respiratory"
  | "digestive"
  | "nervous"
  | "excretory"
  | "sensory";

export type Organ = {
  id: string;
  system: SystemId;
  name: { id: string; en: string };
  description: string;
  func: string;
  facts: string[];
  difficulty: 1 | 2 | 3;
  related: string[];
};

export const SYSTEMS: Record<
  SystemId,
  { id: SystemId; name: string; color: string; icon: string; blurb: string }
> = {
  skeletal: {
    id: "skeletal",
    name: "Sistem Rangka",
    color: "#e2e8f0",
    icon: "🦴",
    blurb: "Menopang tubuh, melindungi organ, dan tempat pembentukan sel darah.",
  },
  muscular: {
    id: "muscular",
    name: "Sistem Otot",
    color: "#fb7185",
    icon: "💪",
    blurb: "Menghasilkan gerakan, menjaga postur, dan memproduksi panas tubuh.",
  },
  circulatory: {
    id: "circulatory",
    name: "Sistem Peredaran Darah",
    color: "#f87171",
    icon: "❤️",
    blurb: "Memompa dan mengedarkan darah, oksigen, dan nutrisi ke seluruh tubuh.",
  },
  respiratory: {
    id: "respiratory",
    name: "Sistem Pernapasan",
    color: "#93c5fd",
    icon: "🫁",
    blurb: "Menukar oksigen dan karbon dioksida antara tubuh dan lingkungan.",
  },
  digestive: {
    id: "digestive",
    name: "Sistem Pencernaan",
    color: "#fbbf24",
    icon: "🍽️",
    blurb: "Mengolah makanan menjadi energi dan nutrisi yang dapat diserap.",
  },
  nervous: {
    id: "nervous",
    name: "Sistem Saraf",
    color: "#c084fc",
    icon: "🧠",
    blurb: "Mengendalikan dan mengoordinasi seluruh aktivitas tubuh.",
  },
  excretory: {
    id: "excretory",
    name: "Sistem Ekskresi",
    color: "#34d399",
    icon: "🫘",
    blurb: "Membuang zat sisa metabolisme dan menjaga keseimbangan cairan.",
  },
  sensory: {
    id: "sensory",
    name: "Sistem Indera",
    color: "#f0abfc",
    icon: "👁️",
    blurb: "Menerima rangsang dari lingkungan dan mengirimkannya ke otak.",
  },
};

export const ORGANS: Organ[] = [
  {
    id: "brain",
    system: "nervous",
    name: { id: "Otak", en: "Brain" },
    description:
      "Pusat kendali tubuh yang terdiri dari miliaran neuron. Otak mengolah informasi dari seluruh indera dan mengirim perintah ke otot serta organ.",
    func: "Mengendalikan pikiran, gerakan, ingatan, emosi, dan fungsi vital seperti pernapasan.",
    facts: [
      "Otak orang dewasa hanya ~2% berat tubuh tetapi memakai ~20% oksigen.",
      "Memiliki sekitar 86 miliar neuron.",
    ],
    difficulty: 2,
    related: ["Spinal Cord", "Neuron"],
  },
  {
    id: "heart",
    system: "circulatory",
    name: { id: "Jantung", en: "Heart" },
    description:
      "Organ berotot seukuran kepalan tangan dengan 4 ruang: atrium dan ventrikel kanan-kiri, dipisahkan katup.",
    func: "Memompa darah ke paru-paru dan seluruh tubuh melalui sistem peredaran darah.",
    facts: [
      "Berdenyut sekitar 100.000 kali per hari.",
      "Memompa ~7.500 liter darah setiap hari.",
    ],
    difficulty: 1,
    related: ["Arteri", "Vena", "Paru-paru"],
  },
  {
    id: "lung-left",
    system: "respiratory",
    name: { id: "Paru-paru Kiri", en: "Left Lung" },
    description:
      "Paru-paru kiri memiliki 2 lobus karena berbagi ruang dengan jantung, dan berisi bronkus serta alveolus.",
    func: "Menukar oksigen masuk ke darah dan mengeluarkan karbon dioksida.",
    facts: [
      "Alveolus total luasnya sekitar 70 m² — seluas lapangan tenis.",
      "Manusia bernapas ~16 kali per menit.",
    ],
    difficulty: 1,
    related: ["Trakea", "Diafragma", "Bronkus"],
  },
  {
    id: "lung-right",
    system: "respiratory",
    name: { id: "Paru-paru Kanan", en: "Right Lung" },
    description:
      "Paru-paru kanan lebih besar dengan 3 lobus, menyediakan permukaan luas untuk pertukaran gas.",
    func: "Membawa oksigen ke dalam tubuh dan membuang karbon dioksida.",
    facts: [
      "Paru-paru kanan sedikit lebih besar dari paru-paru kiri.",
      "Di dalamnya terdapat sekitar 300 juta alveolus.",
    ],
    difficulty: 1,
    related: ["Trakea", "Diafragma", "Bronkus"],
  },
  {
    id: "liver",
    system: "digestive",
    name: { id: "Hati", en: "Liver" },
    description:
      "Kelenjar terbesar dalam tubuh, berwarna merah kecokelatan, terletak di rongga perut kanan atas.",
    func: "Menawarkan racun, memproduksi empedu, menyimpan energi, dan mengatur metabolisme.",
    facts: [
      "Hati dapat meregenerasi sebagian dirinya sendiri.",
      "Menjalankan lebih dari 500 fungsi berbeda.",
    ],
    difficulty: 2,
    related: ["Empedu", "Usus Halus"],
  },
  {
    id: "stomach",
    system: "digestive",
    name: { id: "Lambung", en: "Stomach" },
    description:
      "Organ berbentuk kantong berbentuk kacang yang menyimpan dan mengaduk makanan dengan asam lambung.",
    func: "Mencerna makanan secara mekanik dan kimiawi dengan asam klorida dan enzim.",
    facts: [
      "Asam lambung memiliki pH 1,5–3,5 yang sangat kuat.",
      "Lambung menghasilkan lapisan mukus agar tidak mencerna dirinya sendiri.",
    ],
    difficulty: 1,
    related: ["Esofagus", "Usus Halus", "Hati"],
  },
  {
    id: "intestines",
    system: "digestive",
    name: { id: "Usus Halus", en: "Small Intestine" },
    description:
      "Saluran berkelok sepanjang ~6 meter tempat sebagian besar penyerapan nutrisi terjadi.",
    func: "Menyerap nutrisi dan air dari makanan yang telah dicerna.",
    facts: [
      "Panjangnya sekitar 6–7 meter jika dibentangkan.",
      "Memiliki vili yang memperluas permukaan penyerapan 600×.",
    ],
    difficulty: 2,
    related: ["Lambung", "Usus Besar"],
  },
  {
    id: "large-intestine",
    system: "digestive",
    name: { id: "Usus Besar", en: "Large Intestine" },
    description:
      "Bagian akhir saluran pencernaan yang terdiri dari sekum, kolon, dan rektum, mengelilingi usus halus.",
    func: "Menyerap air dan elektrolit dari sisa makanan serta membentuk dan menyimpan feses.",
    facts: [
      "Panjangnya sekitar 1,5 meter.",
      "Menjadi tempat hidup triliunan bakteri usus yang bermanfaat.",
    ],
    difficulty: 1,
    related: ["Usus Halus", "Usus Buntu"],
  },
  {
    id: "appendix",
    system: "digestive",
    name: { id: "Usus Buntu", en: "Appendix" },
    description:
      "Kantung kecil berbentuk cacing sepanjang 5–10 cm yang menempel pada sekum di perut kanan bawah.",
    func: "Diduga berperan dalam sistem imun dan menyimpan flora usus yang bermanfaat.",
    facts: [
      "Sering dianggap organ sisa, tetapi kaya akan jaringan limfoid.",
      "Peradangannya disebut apendisitis dan sering harus dioperasi.",
    ],
    difficulty: 2,
    related: ["Usus Besar", "Sekum"],
  },
  {
    id: "kidney-left",
    system: "excretory",
    name: { id: "Ginjal Kiri", en: "Left Kidney" },
    description:
      "Organ berbentuk kacang seukuran kepalan tangan yang menyaring darah untuk membentuk urine.",
    func: "Menyaring limbah, mengatur keseimbangan air, garam, dan tekanan darah.",
    facts: [
      "Menyaring seluruh darah tubuh ~40 kali sehari.",
      "Berisi sekitar 1 juta nefron per ginjal.",
    ],
    difficulty: 2,
    related: ["Nefron", "Kandung Kemih"],
  },
  {
    id: "kidney-right",
    system: "excretory",
    name: { id: "Ginjal Kanan", en: "Right Kidney" },
    description:
      "Ginjal kanan berada sedikit lebih rendah karena berbagi ruang dengan hati di atasnya.",
    func: "Menyaring darah dan menghasilkan urine sebagai zat sisa.",
    facts: [
      "Ginjal menerima ~20% output jantung setiap menit.",
      "Manusia bisa bertahan hidup dengan satu ginjal sehat.",
    ],
    difficulty: 2,
    related: ["Nefron", "Kandung Kemih"],
  },
  {
    id: "skull",
    system: "skeletal",
    name: { id: "Tengkorak", en: "Skull" },
    description:
      "Struktur tulang yang melindungi otak dan membentuk wajah, terdiri dari 22 tulang.",
    func: "Melindungi otak, organ indera, dan menopang struktur wajah.",
    facts: [
      "Tengkorak manusia tersusun dari 22 tulang.",
      "Sendi antar tulang tengkorak disebut sutura.",
    ],
    difficulty: 1,
    related: ["Otak", "Rahang"],
  },
  {
    id: "ribcage",
    system: "skeletal",
    name: { id: "Tulang Rusuk", en: "Rib Cage" },
    description:
      "Kurungan tulang 12 pasang rusuk yang melindungi jantung dan paru-paru.",
    func: "Melindungi organ vital dan membantu proses pernapasan.",
    facts: [
      "Ada 12 pasang tulang rusuk pada manusia.",
      "Tiga pasang rusuk terakhir disebut 'rusuk palsu'.",
    ],
    difficulty: 1,
    related: ["Jantung", "Paru-paru"],
  },
  {
    id: "spinal-cord",
    system: "nervous",
    name: { id: "Sumsum Tulang Belakang", en: "Spinal Cord" },
    description:
      "Berkas saraf sepanjang ~45 cm yang membentang dari batang otak hingga ruas lumbal, dilindungi kolumna vertebralis.",
    func: "Menghubungkan otak dengan saraf tepi dan menjadi pusat gerak refleks.",
    facts: [
      "Terdiri dari 31 pasang saraf spinal.",
      "Berakhir sekitar ruas L1 sebagai conus medullaris.",
    ],
    difficulty: 2,
    related: ["Otak", "Batang Otak"],
  },
  {
    id: "cerebellum",
    system: "nervous",
    name: { id: "Otak Kecil", en: "Cerebellum" },
    description:
      "Bagian otak di bawah dan belakang serebrum yang mengatur keseimbangan serta koordinasi gerak.",
    func: "Mengatur keseimbangan, postur, dan koordinasi gerakan halus.",
    facts: [
      "Memuat lebih dari separuh neuron otak.",
      "Kerusakannya menyebabkan gerakan tidak terkoordinasi (ataksia).",
    ],
    difficulty: 2,
    related: ["Otak", "Batang Otak"],
  },
  {
    id: "brainstem",
    system: "nervous",
    name: { id: "Batang Otak", en: "Brainstem" },
    description:
      "Menghubungkan otak dengan sumsum tulang belakang; terdiri dari mesensefalon, pons, dan medula oblongata.",
    func: "Mengatur fungsi vital seperti pernapasan, detak jantung, dan tekanan darah.",
    facts: [
      "Pusat berbagai refleks vital tubuh.",
      "Medula oblongata mengatur denyut jantung dan pernapasan.",
    ],
    difficulty: 3,
    related: ["Otak", "Sumsum Tulang Belakang"],
  },
  {
    id: "aorta",
    system: "circulatory",
    name: { id: "Aorta", en: "Aorta" },
    description:
      "Arteri terbesar tubuh yang keluar dari ventrikel kiri dan bercabang ke seluruh tubuh.",
    func: "Mengedarkan darah kaya oksigen dari jantung ke seluruh tubuh.",
    facts: [
      "Berdiameter sekitar 2,5 cm.",
      "Dindingnya sangat elastis untuk menahan tekanan tinggi.",
    ],
    difficulty: 2,
    related: ["Jantung", "Arteri"],
  },
  {
    id: "vena-cava",
    system: "circulatory",
    name: { id: "Vena Cava", en: "Vena Cava" },
    description:
      "Dua pembuluh balik terbesar (superior dan inferior) yang membawa darah dari tubuh ke atrium kanan.",
    func: "Mengembalikan darah yang miskin oksigen ke jantung.",
    facts: [
      "Vena cava superior dari tubuh atas, inferior dari tubuh bawah.",
      "Merupakan vena terbesar dalam tubuh.",
    ],
    difficulty: 2,
    related: ["Jantung", "Vena"],
  },
  {
    id: "trachea",
    system: "respiratory",
    name: { id: "Trakea", en: "Trachea" },
    description:
      "Pipa napas bercincin tulang rawan yang menghubungkan laring dengan bronkus.",
    func: "Menyalurkan udara menuju dan dari paru-paru.",
    facts: [
      "Panjangnya sekitar 10–12 cm.",
      "Dilapisi silia yang menyaring debu dan kotoran.",
    ],
    difficulty: 1,
    related: ["Bronkus", "Paru-paru"],
  },
  {
    id: "bronchus",
    system: "respiratory",
    name: { id: "Bronkus", en: "Bronchus" },
    description:
      "Dua cabang trakea menuju paru-paru kiri dan kanan yang bercabang lagi menjadi bronkiolus.",
    func: "Mengalirkan udara dari trakea ke paru-paru.",
    facts: [
      "Bronkus kanan lebih lebar dan lebih tegak dari kiri.",
      "Bercabang hingga jutaan bronkiolus.",
    ],
    difficulty: 1,
    related: ["Trakea", "Paru-paru"],
  },
  {
    id: "esophagus",
    system: "digestive",
    name: { id: "Kerongkongan", en: "Esophagus" },
    description:
      "Saluran berotot sepanjang ~25 cm yang menghubungkan tenggorokan dengan lambung.",
    func: "Mendorong makanan ke lambung melalui gerak peristaltik.",
    facts: [
      "Tidak mencerna makanan, hanya mengantarkannya.",
      "Dilapisi lendir agar makanan mudah meluncur.",
    ],
    difficulty: 1,
    related: ["Lambung", "Mulut"],
  },
  {
    id: "pancreas",
    system: "digestive",
    name: { id: "Pankreas", en: "Pancreas" },
    description:
      "Kelenjar di belakang lambung yang menghasilkan enzim pencernaan dan hormon.",
    func: "Menghasilkan enzim pencernaan serta hormon insulin dan glukagon.",
    facts: [
      "Menghasilkan insulin pengatur gula darah.",
      "Enzimnya mencerna karbohidrat, protein, dan lemak.",
    ],
    difficulty: 2,
    related: ["Lambung", "Usus Halus"],
  },
  {
    id: "gallbladder",
    system: "digestive",
    name: { id: "Kandung Empedu", en: "Gallbladder" },
    description:
      "Kantung kecil di bawah hati yang menyimpan dan memekatkan empedu.",
    func: "Menyimpan empedu dan mengalirkannya ke usus saat mencerna lemak.",
    facts: [
      "Panjangnya sekitar 7–10 cm.",
      "Batu empedu dapat terbentuk di dalamnya.",
    ],
    difficulty: 2,
    related: ["Hati", "Usus Halus"],
  },
  {
    id: "bladder",
    system: "excretory",
    name: { id: "Kandung Kemih", en: "Urinary Bladder" },
    description:
      "Kantong berotot yang menampung urine sebelum dikeluarkan dari tubuh.",
    func: "Menyimpan urine hingga siap dikeluarkan melalui uretra.",
    facts: [
      "Menampung 300–500 mL urine.",
      "Dilapisi otot detrusor yang mendorong urine keluar.",
    ],
    difficulty: 1,
    related: ["Ginjal", "Ureter"],
  },
  {
    id: "ureter-left",
    system: "excretory",
    name: { id: "Ureter Kiri", en: "Left Ureter" },
    description:
      "Saluran sepanjang ~25 cm yang membawa urine dari ginjal kiri ke kandung kemih.",
    func: "Mengalirkan urine dari ginjal ke kandung kemih.",
    facts: [
      "Bergerak secara peristaltik.",
      "Salah satu dari dua saluran urine tubuh.",
    ],
    difficulty: 1,
    related: ["Ginjal Kiri", "Kandung Kemih"],
  },
  {
    id: "ureter-right",
    system: "excretory",
    name: { id: "Ureter Kanan", en: "Right Ureter" },
    description:
      "Saluran yang membawa urine dari ginjal kanan ke kandung kemih.",
    func: "Mengalirkan urine dari ginjal ke kandung kemih.",
    facts: [
      "Panjangnya sekitar 25 cm.",
      "Mencegah aliran balik urine ke ginjal.",
    ],
    difficulty: 1,
    related: ["Ginjal Kanan", "Kandung Kemih"],
  },
  {
    id: "eye-left",
    system: "sensory",
    name: { id: "Mata Kiri", en: "Left Eye" },
    description:
      "Organ penglihatan kiri; cahaya difokuskan oleh kornea dan lensa ke retina.",
    func: "Menerima rangsang cahaya dan mengubahnya menjadi sinyal saraf.",
    facts: [
      "Retina memuat sekitar 120 juta sel batang.",
      "Lensa memfokuskan cahaya melalui akomodasi.",
    ],
    difficulty: 2,
    related: ["Saraf Optik", "Otak"],
  },
  {
    id: "eye-right",
    system: "sensory",
    name: { id: "Mata Kanan", en: "Right Eye" },
    description:
      "Organ penglihatan kanan yang mengubah cahaya menjadi sinyal saraf menuju otak.",
    func: "Menangkap cahaya lalu mengirim gambarnya ke otak.",
    facts: [
      "Iris mengatur ukuran pupil.",
      "Kornea tidak memiliki pembuluh darah.",
    ],
    difficulty: 2,
    related: ["Saraf Optik", "Otak"],
  },
  {
    id: "ear-left",
    system: "sensory",
    name: { id: "Telinga Kiri", en: "Left Ear" },
    description:
      "Organ pendengaran dan keseimbangan kiri; terdiri dari telinga luar, tengah, dan dalam.",
    func: "Menerima gelombang suara dan menjaga keseimbangan tubuh.",
    facts: [
      "Koklea mengubah getaran menjadi sinyal saraf.",
      "Tulang pendengaran: martil, landasan, dan sanggurdi.",
    ],
    difficulty: 2,
    related: ["Koklea", "Otak"],
  },
  {
    id: "ear-right",
    system: "sensory",
    name: { id: "Telinga Kanan", en: "Right Ear" },
    description:
      "Organ pendengaran dan keseimbangan kanan.",
    func: "Menangkap suara dan menjaga keseimbangan tubuh.",
    facts: [
      "Kanal setengah lingkaran mengatur keseimbangan.",
      "Membran timpani bergetar saat terkena suara.",
    ],
    difficulty: 2,
    related: ["Koklea", "Otak"],
  },
  {
    id: "sternum",
    system: "skeletal",
    name: { id: "Tulang Dada", en: "Sternum" },
    description:
      "Tulang pipih di tengah dada yang menghubungkan tulang rusuk melalui tulang rawan.",
    func: "Melindungi jantung dan paru-paru serta menopang tulang rusuk.",
    facts: [
      "Terdiri dari manubrium, badan, dan prosesus xifoid.",
      "Menjadi penanda penting saat resusitasi jantung (CPR).",
    ],
    difficulty: 1,
    related: ["Tulang Rusuk", "Jantung"],
  },
];

export const ORGAN_BY_ID: Record<string, Organ> = Object.fromEntries(
  ORGANS.map((o) => [o.id, o]),
);
