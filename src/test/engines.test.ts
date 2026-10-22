import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// Locked test toolchain (vitest 4.1.12 + vite 8.3.5) requires the
// intersection of their Node ranges: ^20.19.0 || ^22.12.0 || >=24.0.0.
const EXPECTED = "^20.19.0 || ^22.12.0 || >=24.0.0";

describe("engines.node", () => {
  it("declares the locked toolchain's supported Node range", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    expect(pkg.engines?.node).toBe(EXPECTED);
  });

  it("stays consistent between package.json and package-lock.json", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
    expect(lock.packages?.[""]?.engines?.node).toBe(pkg.engines?.node);
  });
});
