import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const argValue = (flag: string): string | null => {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
};

const repo = argValue("--repo") ?? process.cwd();
const packageJsonPath = path.join(repo, "package.json");

const raw = fs.readFileSync(packageJsonPath, "utf8");
const pkg = JSON.parse(raw) as { engines?: { node?: string } };
const range = pkg.engines?.node;
if (!range) {
  console.log("node engine check: no engines.node specified");
  process.exit(0);
}

const nodeVersionRaw = execSync("node --version").toString().trim();
const nodeVersion = nodeVersionRaw.replace(/^v/, "");

const parseVersion = (value: string): [number, number, number] => {
  const parts = value.split(".").map((v) => Number.parseInt(v, 10));
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
};

const compare = (a: [number, number, number], b: [number, number, number]): number => {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] > b[i]) return 1;
    if (a[i] < b[i]) return -1;
  }
  return 0;
};

const match = range.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
if (!match) {
  console.log(`node engine check: unable to parse engines.node '${range}'`);
  process.exit(0);
}

const minVersion: [number, number, number] = [
  Number.parseInt(match[1] ?? "0", 10),
  Number.parseInt(match[2] ?? "0", 10),
  Number.parseInt(match[3] ?? "0", 10),
];

const nodeParsed = parseVersion(nodeVersion);
if (compare(nodeParsed, minVersion) < 0) {
  console.error(
    `node engine check failed: node ${nodeVersionRaw} does not satisfy engines.node '${range}'. Update nixpkgs/node.`,
  );
  process.exit(1);
}

console.log(`node engine check ok: node ${nodeVersionRaw} satisfies '${range}'`);
