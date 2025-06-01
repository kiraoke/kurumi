const animeGirls = [
  "kaguya",
  "chika",
  "hayasaka",
  "ai",
  "miko",
  "koyasu",
  "kurumi",
  "origami",
  "yoshino",
  "kotori",
  "chisato",
  "takina",
  "mizuki",
  "ruby",
  "kana",
  "akane",
  "fern",
  "power",
  "makima",
  "himeno",
  "kobeni",
  "reze",
  "rei",
  "asuka",
  "misato",
];

const adjectives = [
  "brave",
  "cheerful",
  "clever",
  "curious",
  "elegant",
  "fierce",
  "gentle",
  "graceful",
  "happy",
  "honest",
  "kind",
  "lazy",
  "loyal",
  "mysterious",
  "nervous",
  "playful",
  "quiet",
  "reliable",
  "shy",
  "smart",
  "strong",
  "sweet",
  "thoughtful",
  "timid",
  "witty",
  "zany",
  "bold",
  "charming",
  "daring",
  "friendly",
  "grumpy",
  "moody",
  "optimistic",
  "patient",
  "silly",
  "tough",
  "wise",
];

function username(): string {
  const randomGirl = animeGirls[Math.floor(Math.random() * animeGirls.length)];
  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  return `${randomAdjective}-${randomGirl}-chan`;
}

console.log("Generated username:", username());

export default username;
