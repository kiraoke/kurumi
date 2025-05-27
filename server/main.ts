import { Context, Hono } from "@hono/hono";

const app: Hono = new Hono();

app.get("/", (c: Context) => {
  return c.text("hi");
});

Deno.serve(app.fetch);
