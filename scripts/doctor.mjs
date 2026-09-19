#!/usr/bin/env node
// Slidr — environment diagnostic.
// Pure Node, no dependencies, safe to run pre-`npm install`.
// Exit 0 if everything required is OK; exit 1 on any required failure.

import { existsSync, statSync, readFileSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { homedir, platform } from "node:os";
import { join } from "node:path";

const CHECK = "✓";
const FAIL = "✗";
const INFO = "○";
const WARN = "!";

const checks = [];
let hardFailures = 0;

function add(symbol, label, detail, fatal = false) {
  checks.push({ symbol, label, detail });
  if (fatal && symbol === FAIL) hardFailures += 1;
}

function tryExec(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return null;
  }
}

function probeBinary(bin) {
  const cmd = platform() === "win32" ? "where" : "which";
  const result = tryExec(`${cmd} ${bin}`);
  if (result) return result.split("\n")[0];
  return null;
}

// 1. Node version
const major = Number(process.versions.node.split(".")[0]);
if (major >= 20) {
  add(CHECK, "Node", `v${process.versions.node}`);
} else {
  add(FAIL, "Node", `v${process.versions.node} (need ≥20 — install from https://nodejs.org)`, true);
}

// 2. LLM configuration (HTTP mode)
const llmConfigPath = join(process.cwd(), "data", "llm-config.json");
if (existsSync(llmConfigPath)) {
  try {
    const config = JSON.parse(readFileSync(llmConfigPath, "utf-8"));
    const httpReady = !!(config.baseURL && config.apiKey && config.model);
    if (httpReady) {
      add(CHECK, "LLM (HTTP)", `${config.baseURL} · model: ${config.model}`);
    } else {
      add(WARN, "LLM (HTTP)", "configured but incomplete — need baseURL + apiKey + model");
    }
  } catch {
    add(WARN, "LLM (HTTP)", "config file exists but is invalid JSON");
  }
} else {
  add(INFO, "LLM (HTTP)", "not configured — open Settings to add base URL + API key (free Groq/Google tier works)");
}

// 4. Dependencies
if (existsSync("node_modules") && statSync("node_modules").isDirectory()) {
  add(CHECK, "Dependencies", "node_modules present");
} else {
  add(FAIL, "Dependencies", "node_modules missing — run `npm run setup` or `npm install`", true);
}

// 5. Data files
const dataFiles = ["brand.json"];
const missingData = dataFiles.filter((f) => !existsSync(join("data", f)));
if (missingData.length === 0) {
  add(CHECK, "Data files", "present");
} else {
  // Created on first save in the UI; absence is expected on a fresh clone.
  add(INFO, "Data files", `${missingData.join(", ")} not created yet (written on first use)`);
}

// 5b. Projects directory
const projectsDir = join(process.cwd(), "projects");
if (existsSync(projectsDir)) {
  let count = 0;
  try {
    count = readdirSync(projectsDir).filter((d) => {
      try {
        return statSync(join(projectsDir, d)).isDirectory();
      } catch {
        return false;
      }
    }).length;
  } catch {
    // ignore
  }
  add(CHECK, "Projects", `${count} carousel project${count === 1 ? "" : "s"}`);
} else {
  add(INFO, "Projects", "no projects yet — create a carousel in the UI");
}

// 6. Theme presets
const themesDir = join(process.cwd(), "src", "lib", "themes", "presets");
if (existsSync(themesDir)) {
  const themeFiles = readdirSync(themesDir).filter(f => f.endsWith(".md"));
  add(CHECK, "Themes", `${themeFiles.length} theme presets available`);
} else {
  add(WARN, "Themes", "theme presets directory not found");
}

// 7. Port 3000
let portStatus = "free";
let portFree = true;
if (platform() !== "win32") {
  const pid = tryExec("lsof -ti :3000");
  if (pid) {
    portStatus = `in use by PID ${pid.split("\n")[0]} — run \`/stop\` to kill`;
    portFree = false;
  }
} else {
  const out = tryExec("netstat -ano -p tcp");
  if (out && /:3000\s+.+LISTENING/i.test(out)) {
    portStatus = "in use (run `netstat -ano | findstr :3000` for details)";
    portFree = false;
  }
}
add(portFree ? CHECK : INFO, "Port 3000", portStatus);

// Output
const labelWidth = Math.max(...checks.map((c) => c.label.length));
console.log("\n  Slidr — Environment Diagnostic\n");
for (const { symbol, label, detail } of checks) {
  console.log(`  ${symbol}  ${label.padEnd(labelWidth)}   ${detail}`);
}
console.log("");

if (hardFailures > 0) {
  console.log(`  ${hardFailures} required check${hardFailures > 1 ? "s" : ""} failed.\n`);
  process.exit(1);
} else {
  console.log("  All required checks passed.\n");
  process.exit(0);
}
