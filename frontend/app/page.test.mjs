import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("home page source defines the layout shell contract", async () => {
  const source = await readFile(new URL("./page.tsx", import.meta.url), "utf8");

  assert.match(source, /workspace-sidebar/);
  assert.match(source, /mobile-menu-button/);
  assert.match(source, /Subject list/);
  assert.match(source, /Selected record/);
  assert.match(source, /Schedule/);
  assert.match(source, /Load more/);
  assert.match(source, /Monday start/);
  assert.match(source, /30-minute slots/);
  assert.match(source, /\/api\/auth\/google\/start/);
  assert.match(source, /\/api\/students/);
});
