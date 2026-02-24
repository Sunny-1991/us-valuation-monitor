import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { generateDataset, validateDataset } from "./generate.ts";
import type { ValuationDataset } from "../../core/src/types.ts";

const CURRENT_FILE = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(CURRENT_FILE), "../../..");
const OUTPUT_DIR = path.join(ROOT_DIR, "data", "standardized");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "valuation-history.json");

function isSyntheticSource(source: string | undefined): boolean {
  return /synthetic/i.test(source || "");
}

async function readPreviousDataset(): Promise<ValuationDataset | undefined> {
  try {
    const text = await readFile(OUTPUT_FILE, "utf8");
    const parsed = JSON.parse(text) as ValuationDataset;
    validateDataset(parsed);
    if (isSyntheticSource(parsed.source)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

async function main(): Promise<void> {
  const previousDataset = await readPreviousDataset();
  const dataset = await generateDataset(undefined, { previousDataset });
  validateDataset(dataset);

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");

  console.log(`snapshot written: ${OUTPUT_FILE}`);
  console.log(`generatedAt: ${dataset.generatedAt}`);
  console.log(`source: ${dataset.source}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
