export type Badge = {
  id: string;
  name: string;
  desc: string;
  icon: string;
  tier: "bronze" | "silver" | "gold";
};

export const BADGES: Badge[] = [
  { id: "first-step", name: "Langkah Pertama", desc: "Menemukan organ pertamamu", icon: "🌱", tier: "bronze" },
  { id: "explorer-5", name: "Penjelajah", desc: "Menemukan 5 organ", icon: "🧭", tier: "bronze" },
  { id: "explorer-10", name: "Ahli Anatomi", desc: "Menemukan 10 organ", icon: "🔬", tier: "silver" },
  { id: "quiz-ace", name: "Nilai Sempurna", desc: "Menjawab 5 kuis benar berturut-turut", icon: "🎯", tier: "silver" },
  { id: "heart-master", name: "Ahli Jantung", desc: "Menemukan organ Jantung", icon: "❤️", tier: "gold" },
  { id: "brain-master", name: "Ahli Saraf", desc: "Menemukan organ Otak", icon: "🧠", tier: "gold" },
  { id: "streak-3", name: "Konsisten", desc: "Streak 3 hari berturut-turut", icon: "🔥", tier: "bronze" },
  { id: "coin-500", name: "Kolektor", desc: "Mengumpulkan 500 koin", icon: "💰", tier: "silver" },
  { id: "level-5", name: "Naik Kelas", desc: "Mencapai Level 5", icon: "⭐", tier: "gold" },
  { id: "all-systems", name: "Master Tubuh", desc: "Menjelajahi semua sistem organ", icon: "🏆", tier: "gold" },
];

export const BADGE_BY_ID: Record<string, Badge> = Object.fromEntries(
  BADGES.map((b) => [b.id, b]),
);
