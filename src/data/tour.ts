export type TourStep = {
  organId: string;
  title: string;
  text: string;
};

export const TOUR: TourStep[] = [
  {
    organId: "brain",
    title: "Otak — Pusat Kendali",
    text: "Perjalanan dimulai dari puncak. Otak berisi sekitar 86 miliar neuron yang mengendalikan pikiran, gerakan, ingatan, dan fungsi vital seperti pernapasan.",
  },
  {
    organId: "heart",
    title: "Jantung — Sang Pemompa",
    text: "Turun ke rongga dada, jantung dengan 4 ruangnya berdenyut ±100.000 kali sehari, memompa sekitar 7.500 liter darah ke seluruh tubuh.",
  },
  {
    organId: "lung-right",
    title: "Paru-paru — Pertukaran Gas",
    text: "Di kedua sisi jantung, paru-paru menampung sekitar 300 juta alveolus. Luas permukaannya setara lapangan tenis untuk menyerap oksigen.",
  },
  {
    organId: "liver",
    title: "Hati — Laboratorium Tubuh",
    text: "Di perut kanan atas, hati menjalankan lebih dari 500 fungsi: menawarkan racun, memproduksi empedu, dan mampu meregenerasi dirinya sendiri.",
  },
  {
    organId: "stomach",
    title: "Lambung — Pencerna Pertama",
    text: "Di sebelah kiri, lambung mengaduk makanan dengan asam klorida ber-pH 1,5–3,5, namun dilindungi lapisan mukus agar tidak mencerna dirinya.",
  },
  {
    organId: "intestines",
    title: "Usus Halus — Penyerap Nutrisi",
    text: "Membentang hingga 6–7 meter, usus halus dengan vili-vilinya menyerap sebagian besar nutrisi dari makanan yang kita konsumsi.",
  },
  {
    organId: "kidney-left",
    title: "Ginjal — Penyaring Darah",
    text: "Di bagian belakang rongga perut, sepasang ginjal menyaring seluruh darah tubuh sekitar 40 kali sehari melalui satu juta nefron.",
  },
];

export const TOUR_STEP_MS = 7000;
