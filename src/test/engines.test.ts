import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// Locked test toolchain (vitest 5.1.1 + vite 8.3.8) requires the
// intersection of their Node ranges. vitest's range
// (^22.12.0 || ^24.0.0 || >=26.0.0) is currently the narrowest and is fully
// contained in vite's (^20.19.0 || >=22.12.0), so the intersection equals
// vitest's range.
const EXPECTED = "^22.12.0 || ^24.0.0 || >=26.0.0";

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

  it("matches the locked vitest's Node requirement", () => {
    // Equality holds only while vitest has the narrowest range in the
    // toolchain. If this fails after a bump, recompute the intersection.
    const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
    expect(lock.packages?.["node_modules/vitest"]?.engines?.node).toBe(EXPECTED);
  });
});
