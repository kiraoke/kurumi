const file = Deno.readTextFileSync("./public/mm.json");
const metaFile = Deno.readTextFileSync("./public/meta.json");

const music = JSON.parse(file);
const meta = JSON.parse(metaFile);
const metaNames = Object.keys(meta);

const names = Object.keys(music);

const parseLRC = (lrcText: string) => {
  return lrcText
    .split("\n")
    .map((line) => {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const milliseconds = parseInt(match[3]);
        const timeInSeconds = minutes * 60 + seconds + milliseconds / 100;
        return { time: timeInSeconds, text: match[4].trim()  };
      }
      return null;
    })
    .filter(Boolean);
};

for (let i = 0; i < names.length; i++) {
  const name = metaNames[i];
  const search = names[i];
  const pp = await fetch(
    `https://lrclib.net/api/search?q=${encodeURIComponent(search)}`,
  );
  const data = await pp.json();

  const lrc = data[0]?.syncedLyrics;

  Deno.writeTextFileSync(`./public/lyrics/${name}.lrc`, lrc);
  console.log(name)
}

