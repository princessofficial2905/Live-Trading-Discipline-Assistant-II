import { cp, mkdir, rm, copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(projectRoot, "dist");
const distHtml = resolve(distDir, "app.html");
const distIndex = resolve(distDir, "index.html");
const rootIndex = resolve(projectRoot, "index.html");
const rootAssets = resolve(projectRoot, "assets");
const distAssets = resolve(distDir, "assets");

await copyFile(distHtml, distIndex);
await copyFile(distIndex, rootIndex);
await rm(rootAssets, { force: true, recursive: true });
await mkdir(rootAssets, { recursive: true });
await cp(distAssets, rootAssets, { recursive: true });
