import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { launchBrowser, navigateToVotes, waitForUserReady } from "./browser.js";
import { scrapeAllRatings } from "./scraper.js";
import { formatRatings } from "./formatters.js";
import { ALL_FIELDS, type Format, type Rating } from "./types.js";

const FORMATS: Format[] = ["json", "csv", "xml"];

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

interface CliOptions {
  userId: string;
  format: Format;
  fields: (keyof Rating)[];
  output: string;
}

function parseArgs(argv: string[]): CliOptions | null {
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return null;
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
          console.error(`Invalid format "${next}". Must be one of: ${FORMATS.join(", ")}`);
          return null;
        }
        i++;
        break;
      case "--fields": {
        const raw = next?.split(",").map((s) => s.trim()) ?? [];
        const invalid = raw.filter((f) => !ALL_FIELDS.includes(f as keyof Rating));
        if (invalid.length > 0) {
          console.error(`Unknown fields: ${invalid.join(", ")}\nAvailable: ${ALL_FIELDS.join(", ")}`);
          return null;
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
    console.error("Error: --user-id is required.\n");
    printHelp();
    return null;
  }

  if (!output) {
    output = `./ratings_${userId}.${format}`;
  }

  return { userId, format, fields, output };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts) {
    process.exitCode = opts === null && process.argv.includes("--help") ? 0 : 1;
    return;
  }

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

main();
