import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { launchBrowser, navigateToVotes, waitForUserReady } from "./browser.js";
import { scrapeAllRatings } from "./scraper.js";
import { formatRatings } from "./formatters.js";
import { ALL_FIELDS, type Format, type Rating } from "./types.js";

const FORMATS: Format[] = ["json", "csv", "xml"];

export interface CliOptions {
  userId: string;
  format: Format;
  fields: (keyof Rating)[];
  output: string;
}

export type ParseResult =
  | { ok: true; options: CliOptions }
  | { ok: false; help: boolean; error?: string };

export function parseArgs(argv: string[]): ParseResult {
  if (argv.includes("--help") || argv.includes("-h")) {
    return { ok: false, help: true };
  }

  let userId = "";
  let format: Format = "json";
  let fields: (keyof Rating)[] = [...ALL_FIELDS];
  let output = "";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    switch (arg) {
      case "--user-id":
        userId = next ?? "";
        i++;
        break;
      case "--format":
        if (next && FORMATS.includes(next as Format)) {
          format = next as Format;
        } else {
          return { ok: false, help: false, error: `Invalid format "${next}". Must be one of: ${FORMATS.join(", ")}` };
        }
        i++;
        break;
      case "--fields": {
        const raw = next?.split(",").map((s) => s.trim()) ?? [];
        const invalid = raw.filter((f) => !ALL_FIELDS.includes(f as keyof Rating));
        if (invalid.length > 0) {
          return { ok: false, help: false, error: `Unknown fields: ${invalid.join(", ")}\nAvailable: ${ALL_FIELDS.join(", ")}` };
        }
        fields = raw as (keyof Rating)[];
        i++;
        break;
      }
      case "--output":
        output = next ?? "";
        i++;
        break;
    }
  }

  if (!userId) {
    return { ok: false, help: true, error: "--user-id is required." };
  }

  if (!output) {
    output = `./ratings_${userId}.${format}`;
  }

  return { ok: true, options: { userId, format, fields, output } };
}

function printHelp(): void {
  console.log(`
Kinopoisk Votes Parser
  Export your Kinopoisk ratings to JSON, CSV or XML.

Usage:
  npx tsx src/index.ts --user-id <id> [options]

Options:
  --user-id <id>      (required) Kinopoisk user ID
  --format <fmt>      Output format: json, csv, xml (default: json)
  --fields <list>     Comma-separated fields to include (default: all)
  --output <path>     Output file path (default: ratings_<userId>.<format>)
  --help              Show this help message

Available fields:
  ${ALL_FIELDS.join(", ")}

Examples:
  npx tsx src/index.ts --user-id 129356
  npx tsx src/index.ts --user-id 129356 --format csv
  npx tsx src/index.ts --user-id 129356 --format xml --fields title,rating,ratedAt
  npx tsx src/index.ts --user-id 129356 --output my-ratings.json
`);
}

async function main() {
  const result = parseArgs(process.argv.slice(2));

  if (!result.ok) {
    if (result.error) console.error(`Error: ${result.error}\n`);
    if (result.help) printHelp();
    process.exitCode = result.help && !result.error ? 0 : 1;
    return;
  }

  const opts = result.options;
  const outputPath = resolve(opts.output);

  console.log(`\nKinopoisk Votes Parser`);
  console.log(`  User ID: ${opts.userId}`);
  console.log(`  Format:  ${opts.format}`);
  console.log(`  Fields:  ${opts.fields.join(", ")}`);
  console.log(`  Output:  ${outputPath}\n`);

  const { browser, page } = await launchBrowser();

  try {
    await navigateToVotes(page, opts.userId);
    await waitForUserReady();

    const ratings = await scrapeAllRatings(page, (collected, pageNum, total) => {
      const suffix = total ? ` / ${total}` : "";
      console.log(`  Page ${pageNum} — ${collected}${suffix} ratings collected`);
    });

    const content = formatRatings(ratings, opts.fields, opts.format);
    await writeFile(outputPath, content, "utf-8");
    console.log(`\nDone! ${ratings.length} ratings saved to ${outputPath}`);
  } catch (err) {
    console.error("\nFatal error:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main();
}
