import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("home page source defines the staff MVP shell", async () => {
  const source = await readFile(new URL("./page.tsx", import.meta.url), "utf8");

  assert.match(source, /Horse Farm Management/);
  assert.match(source, /Staff workspace/);
  assert.match(
    source,
    /Internal scheduling, horse assignment, practice ride, and lesson credit/
  );
  assert.match(source, /Sign in with Google/);
  assert.match(source, /\/api\/auth\/google\/start/);
  assert.match(source, /farmadmin/);
});
