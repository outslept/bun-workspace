/* eslint-disable no-console */
import { rm } from "node:fs/promises";
import process from "node:process";
import { publint } from "publint";
import { formatMessage } from "publint/utils";

const icons = {
  info: `\u001B[34mℹ\u001B[0m`,
  success: `\u001B[32m✓\u001B[0m`,
  error: `\u001B[31m✖\u001B[0m`,
  warning: `\u001B[33m⚠\u001B[0m`,
  arrow: `\u001B[34m→\u001B[0m`,
};

console.log(`${icons.info} Cleaning dist directory...`);
try {
  await rm("./dist", { recursive: true, force: true });
} catch {
  console.log(`${icons.warning} No dist directory found`);
}

console.log(`${icons.info} Starting build...`);
const buildResult = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "bun",
  format: "esm",
  sourcemap: "external",
  minify: true,
});

if (!buildResult.success) {
  console.error(`${icons.error} Build failed`);
  for (const message of buildResult.logs) {
    console.error(`${icons.error} ${message}`);
  }
  process.exit(1);
}

console.log(`${icons.success} Build completed successfully`);
for (const output of buildResult.outputs) {
  console.log(`${icons.arrow} Generated ${output.path}`);
}

console.log(`\n${icons.info} Running package validation...`);
const { messages, pkg } = await publint({
  pkgDir: "./",
  level: "warning",
  strict: true,
});

if (messages.length > 0) {
  console.log(`\n${icons.error} Package validation issues found:`);
  for (const message of messages) {
    console.log(`${icons.warning} ${formatMessage(message, pkg)}`);
  }
  process.exit(1);
}

console.log(`${icons.success} Package validation passed`);
