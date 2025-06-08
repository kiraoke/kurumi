import { Hono } from "@hono/hono";
import Fuse from "npm:fuse.js";

const musicRoute = new Hono();
const musicFiles: Deno.DirEntry[] = [...Deno.readDirSync("./public/music")];

const fuse: Fuse<Deno.DirEntry> = new Fuse(musicFiles, {
  keys: ["name"],
  isCaseSensitive: false,
  includeScore: true,
  shouldSort: true,
  findAllMatches: true,
});

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
      results: fuse.search(search)
    },
    200,
  );
});

export default musicRoute;
