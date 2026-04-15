import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { launchBrowser, navigateToVotes, waitForUserReady } from "./browser.js";
import { scrapeAllRatings } from "./scraper.js";

function parseArgs(args: string[]): { userId: string; output: string } {
  let userId = "129356";
  let output = "./ratings.json";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--user-id" && args[i + 1]) {
      userId = args[i + 1];
      i++;
    } else if (args[i] === "--output" && args[i + 1]) {
      output = args[i + 1];
      i++;
    }
  }

  return { userId, output };
}

async function main() {
  const { userId, output } = parseArgs(process.argv.slice(2));
  const outputPath = resolve(output);

  console.log(`\nKinopoisk Ratings Parser`);
  console.log(`User ID: ${userId}`);
  console.log(`Output:  ${outputPath}\n`);

  const { browser, page } = await launchBrowser();

  try {
    await navigateToVotes(page, userId);
    await waitForUserReady();

    const ratings = await scrapeAllRatings(page, (collected, pageNum, total) => {
      const suffix = total ? ` / ${total}` : "";
      console.log(`  Page ${pageNum} — ${collected}${suffix} ratings collected`);
    });

    await writeFile(outputPath, JSON.stringify(ratings, null, 2), "utf-8");
    console.log(`\nDone! ${ratings.length} ratings saved to ${outputPath}`);
  } catch (err) {
    console.error("\nFatal error:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
