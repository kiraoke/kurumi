import { Hono } from "@hono/hono";
import Fuse, { FuseIndex } from "npm:fuse.js";

const musicRoute = new Hono();
const meta: string = await Deno.readTextFile("./public/meta.json");

const musicFiles = Object.entries(JSON.parse(meta)).map(([key, value]) => ({
  name: key,
  duration: value,
})) as MusicFile[];

interface MusicFile {
  name: string;
  duration: number;
}

const musicIndex = JSON.parse(Deno.readTextFileSync("./musicIndex.json"));

const fuseIndex: FuseIndex<MusicFile> = Fuse.parseIndex(musicIndex);

const fuse: Fuse<MusicFile> = new Fuse(
  musicFiles,
  {
    keys: ["name"],
    isCaseSensitive: false,
    includeScore: true,
    shouldSort: true,
    findAllMatches: true,
  },
  fuseIndex,
);

musicRoute.get("/", (c) => {
  const search: string | undefined = c.req.query("search");
  if (!search) {
    return c.json(
      {
        error: "Search query is required",
      },
      400,
    );
  }

  return c.json(
    {
      query: search,
      results: fuse.search(search),
    },
    200,
  );
});

export default musicRoute;
