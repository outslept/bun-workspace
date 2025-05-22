/* eslint-disable no-console */
import { existsSync } from "node:fs";
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
const build = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "bun",
  format: "esm",
  sourcemap: "external",
  minify: true,
});

if (!build.success) {
  console.error(`${icons.error} Build failed`);
  build.logs.forEach((msg) => console.error(`${icons.error} ${msg}`));
  process.exit(1);
}

console.log(`${icons.success} Build completed successfully`);
build.outputs.forEach((out) =>
  console.log(`${icons.arrow} Generated ${out.path}`),
);

console.log(`\n${icons.info} Generating TypeScript declaration files...`);
const tsc = Bun.spawnSync(["tsc", "--emitDeclarationOnly", "--declaration"]);

if (tsc.exitCode !== 0) {
  console.error(`${icons.error} TypeScript declaration generation failed`);
  console.error(String(tsc.stderr));
  process.exit(1);
}

if (!existsSync("./dist/index.d.ts")) {
  console.error(
    `${icons.error} Declaration file not generated: ./dist/index.d.ts`,
  );
  process.exit(1);
}

console.log(`${icons.success} TypeScript declarations generated`);

console.log(`\n${icons.info} Running package validation...`);
const { messages, pkg } = await publint({
  pkgDir: "./",
  level: "warning",
  strict: true,
});

if (messages.length > 0) {
  console.log(`\n${icons.error} Package validation issues found:`);
  messages.forEach((msg) =>
    console.log(`${icons.warning} ${formatMessage(msg, pkg)}`),
  );
  process.exit(1);
}

console.log(`${icons.success} Package validation passed`);
