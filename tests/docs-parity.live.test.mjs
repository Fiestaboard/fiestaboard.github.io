// Tests for the live-host mode of scripts/docs-parity.mjs (the mode the
// production watch runs). They drive the real script as a subprocess against
// a local HTTP server, so what is under test is exactly what CI executes.
//
// Motivation: GitHub Pages' edge occasionally answers a single request with a
// transient 503, which used to fail the whole watch and file a false-positive
// regression issue (#27).

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";

const SCRIPT = fileURLToPath(new URL("../scripts/docs-parity.mjs", import.meta.url));
const PAGE_HTML = "<!DOCTYPE html><html><body>a real page</body></html>";

// Serve /docs with a caller-supplied handler; count every request it receives.
async function startServer(handler) {
  const requests = [];
  const server = createServer((req, res) => {
    requests.push(req.url);
    handler(requests.length, res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  return { origin, requests, close: () => new Promise((resolve) => server.close(resolve)) };
}

async function runFixture(origin, fixture) {
  const dir = await mkdtemp(join(tmpdir(), "docs-parity-"));
  const fixturePath = join(dir, "fixture.json");
  await writeFile(fixturePath, JSON.stringify(fixture));
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SCRIPT, "--host", origin, "--fixture", fixturePath], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (c) => (stdout += c));
    child.stderr.on("data", (c) => (stderr += c));
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

const FIXTURE = [{ path: "/docs", expect: "page" }];
const servers = [];
after(async () => {
  for (const s of servers) await s.close();
});
async function server(handler) {
  const s = await startServer(handler);
  servers.push(s);
  return s;
}

test("recovers when a transient 503 is followed by a good response", async () => {
  const { origin, requests } = await server((n, res) => {
    if (n === 1) {
      res.writeHead(503).end("edge hiccup");
      return;
    }
    res.writeHead(200, { "content-type": "text/html" }).end(PAGE_HTML);
  });

  const { code, stdout, stderr } = await runFixture(origin, FIXTURE);

  assert.equal(code, 0, `expected success, got exit ${code}\nstdout: ${stdout}\nstderr: ${stderr}`);
  assert.match(stdout, /fixture 1\/1 passed/);
  assert.equal(requests.length, 2, "should have retried exactly once");
});

test("reports the retries it needed so real flakiness stays visible", async () => {
  const { origin } = await server((n, res) => {
    if (n === 1) {
      res.writeHead(503).end("edge hiccup");
      return;
    }
    res.writeHead(200, { "content-type": "text/html" }).end(PAGE_HTML);
  });

  const { stdout } = await runFixture(origin, FIXTURE);

  assert.match(stdout, /\/docs.*HTTP 503/, `retry not reported; stdout was:\n${stdout}`);
});

test("fails after exhausting retries when a 503 persists", async () => {
  const { origin, requests } = await server((_n, res) => res.writeHead(503).end("still down"));

  const { code, stderr } = await runFixture(origin, FIXTURE);

  assert.equal(code, 1);
  assert.match(stderr, /FIXTURE FAIL {2}\/docs: HTTP 503/);
  assert.equal(requests.length, 3, "should have made 3 attempts before giving up");
});

test("does not retry a 404 — a missing route is a real regression, not a blip", async () => {
  const { origin, requests } = await server((_n, res) => res.writeHead(404).end("nope"));

  const { code, stderr } = await runFixture(origin, FIXTURE);

  assert.equal(code, 1);
  assert.match(stderr, /FIXTURE FAIL {2}\/docs: HTTP 404/);
  assert.equal(requests.length, 1, "a 404 should fail fast, not burn retries");
});
