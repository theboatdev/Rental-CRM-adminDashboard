// Copies Monaco's AMD build into public/ so the config editor loads it from
// this app instead of a third-party CDN. Skips the copy when already current.
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// monaco-editor's exports map hides package.json, so walk up from its entry point.
function findPackageRoot(name) {
  let dir = path.dirname(require.resolve(name));
  while (dir !== path.dirname(dir)) {
    const manifest = path.join(dir, "package.json");
    if (existsSync(manifest) && JSON.parse(readFileSync(manifest, "utf8")).name === name) return dir;
    dir = path.dirname(dir);
  }
  throw new Error(`Could not locate the ${name} package root`);
}

const monacoDir = findPackageRoot("monaco-editor");
const { version } = JSON.parse(readFileSync(path.join(monacoDir, "package.json"), "utf8"));

const target = path.join(appDir, "public", "monaco", "vs");
const stamp = path.join(appDir, "public", "monaco", "VERSION");

if (existsSync(stamp) && readFileSync(stamp, "utf8").trim() === version) process.exit(0);

rmSync(path.dirname(target), { recursive: true, force: true });
cpSync(path.join(monacoDir, "min", "vs"), target, { recursive: true });
writeFileSync(stamp, `${version}\n`);
console.log(`Copied monaco-editor ${version} to public/monaco/vs`);
