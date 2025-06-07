import { Hono } from "@hono/hono";

const musicRoute = new Hono();

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
      search,
    },
    200,
  );
});

export default musicRoute;
