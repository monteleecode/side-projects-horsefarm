import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("compose file defines frontend backend and database without MinIO", async () => {
  const compose = await readFile(new URL("../docker-compose.yml", import.meta.url), "utf8");

  assert.match(compose, /^\s{2}frontend:/m);
  assert.match(compose, /^\s{2}backend:/m);
  assert.match(compose, /^\s{2}db:/m);
  assert.doesNotMatch(compose.toLowerCase(), /minio/);
});

test("backend receives database configuration from the database service", async () => {
  const compose = await readFile(new URL("../docker-compose.yml", import.meta.url), "utf8");

  assert.match(compose, /DATABASE_URL:\s*postgres:\/\/horsefarm:horsefarm@db:5432\/horsefarm/);
});

test("frontend rewrites api requests to the backend service", async () => {
  const nextConfig = await readFile(new URL("../frontend/next.config.ts", import.meta.url), "utf8");

  assert.match(nextConfig, /source:\s*["']\/api\/:path\*["']/);
  assert.match(nextConfig, /destination:\s*`\$\{backendOrigin\}\/api\/:path\*`/);
});

test("frontend docker build accepts the backend origin for api rewrites", async () => {
  const dockerfile = await readFile(new URL("../frontend/Dockerfile", import.meta.url), "utf8");

  assert.match(dockerfile, /ARG BACKEND_ORIGIN=http:\/\/localhost:3001/);
  assert.match(dockerfile, /ENV BACKEND_ORIGIN=\$\{BACKEND_ORIGIN\}/);
});
