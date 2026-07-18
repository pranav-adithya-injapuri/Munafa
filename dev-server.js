// dev-server.js
// Zero-dependency local server: statics + the real /api/recommend function.
// Run:  node dev-server.js   → http://localhost:4173
// Reads GEMINI_API_KEY from .env.local (same file vercel dev uses).
// Not used in production — Vercel serves the statics and api/ on its own.

const http = require("http");
const fs = require("fs");
const path = require("path");

// Minimal .env.local loader (KEY=value lines, # comments).
try {
  const env = fs.readFileSync(path.join(__dirname, ".env.local"), "utf8");
  env.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith("#") && !process.env[m[1]]) process.env[m[1]] = m[2];
  });
} catch (e) { /* no .env.local — the UI still works, AI falls back gracefully */ }

const handler = require("./api/recommend.js");
const mapColumnsHandler = require("./api/map-columns.js");
const parseVoiceHandler = require("./api/parse-voice-product.js");
const parseTallyHandler = require("./api/parse-tally.js");
const planHandler = require("./api/plan.js");
const sendAlertHandler = require("./api/send-alert.js");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml"
};

const PORT = process.env.PORT || 4173;

http.createServer((req, res) => {
  if (req.url.startsWith("/api/recommend") || req.url.startsWith("/api/map-columns") || req.url.startsWith("/api/parse-voice-product") || req.url.startsWith("/api/parse-tally") || req.url.startsWith("/api/plan") || req.url.startsWith("/api/send-alert")) {
    const fn = req.url.startsWith("/api/recommend") ? handler
      : req.url.startsWith("/api/map-columns") ? mapColumnsHandler
      : req.url.startsWith("/api/parse-voice-product") ? parseVoiceHandler
      : req.url.startsWith("/api/parse-tally") ? parseTallyHandler
      : req.url.startsWith("/api/send-alert") ? sendAlertHandler
      : planHandler;
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try { req.body = JSON.parse(body || "{}"); } catch (e) { req.body = {}; }
      const shim = {
        status(code) { res.statusCode = code; return shim; },
        json(obj) { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(obj)); }
      };
      Promise.resolve(fn(req, shim)).catch((err) => {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: String(err) }));
      });
    });
    return;
  }

  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const file = path.normalize(path.join(__dirname, p));
  if (!file.startsWith(__dirname)) { res.statusCode = 403; res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 404; res.end("not found"); return; }
    res.setHeader("content-type", TYPES[path.extname(file)] || "application/octet-stream");
    res.end(data);
  });
}).listen(PORT, () => {
  console.log("Munafa running on http://localhost:" + PORT);
  console.log(process.env.GEMINI_API_KEY
    ? "GEMINI_API_KEY loaded — AI advice is live."
    : "No GEMINI_API_KEY found — numbers work, AI advice will use the offline fallback.");
});
