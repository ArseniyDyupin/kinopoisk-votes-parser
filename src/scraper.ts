import type { Page } from "playwright";
import type { Rating } from "./types.js";

const DELAY_MS = 1500;
const MAX_RETRIES = 3;

export async function detectTotalRatings(page: Page): Promise<number | null> {
  try {
    const text = await page.textContent(".pagesFromTo");
    const match = text?.match(/из\s+([\d\s]+)/);
    if (match) {
      return parseInt(match[1].replace(/\s/g, ""), 10);
    }
  } catch {
    // pagination text not found — will use fallback strategy
  }
  return null;
}

async function hasNextPage(page: Page): Promise<boolean> {
  const next = await page.$(".navigator .list > li.arr:nth-last-child(2) a");
  return next !== null;
}

async function goToNextPage(page: Page): Promise<void> {
  const next = await page.$(".navigator .list > li.arr:nth-last-child(2) a");
  if (!next) throw new Error("No next page link found");

  await next.click();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForSelector(".profileFilmsList .item", { timeout: 15_000 });
}

async function selectMaxPerPage(page: Page): Promise<void> {
  const select = await page.$("select.navigator_per_page");
  if (!select) return;

  await select.press("End");
  try {
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector(".profileFilmsList .item", { timeout: 15_000 });
  } catch {
    // page might already be at max per page
  }
}

export async function scrapePage(page: Page): Promise<Rating[]> {
  return page.evaluate(() => {
    const ratings: Rating[] = [];
    const items = document.querySelectorAll(".profileFilmsList > .item");

    for (const item of items) {
      const nameRusEl = item.querySelector(".nameRus a") as HTMLAnchorElement | null;
      const nameEngEl = item.querySelector(".nameEng");
      const dateEl = item.querySelector(".date");
      const voteEl = item.querySelector(".vote");
      const ratingBold = item.querySelector(".rating b");
      const ratingSpans = item.querySelectorAll(".rating span");

      const title = nameRusEl?.textContent?.trim() ?? "";
      const originalTitle = nameEngEl?.textContent?.trim() ?? "";
      const ratedAt = dateEl?.textContent?.trim() ?? "";
      const ratingStr = voteEl?.textContent?.trim() ?? "0";

      const kpUrl = nameRusEl?.href ?? "";
      const kpRating = ratingBold?.textContent?.trim() ?? "";

      let votesCount = "";
      let duration = "";

      if (ratingSpans.length >= 1) {
        const votesMatch = ratingSpans[0]?.textContent?.match(/^\((.+)\)$/);
        if (votesMatch) votesCount = votesMatch[1].replace(/\s+/g, "");
      }
      if (ratingSpans.length >= 2) {
        const durationMatch = ratingSpans[ratingSpans.length - 1]?.textContent?.match(/^(.+)\s*мин\.$/);
        if (durationMatch) duration = durationMatch[1].trim();
      }

      const yearMatch = title.match(/\((?:(?:мини-)?сериал,\s*)?(\d{4})/);
      const year = yearMatch?.[1] ?? "";

      if (title) {
        ratings.push({
          title,
          originalTitle,
          year,
          rating: parseInt(ratingStr, 10) || 0,
          ratedAt,
          kpRating,
          votesCount,
          duration,
          kpUrl,
        });
      }
    }

    return ratings;
  });
}

export async function scrapeAllRatings(
  page: Page,
  onProgress?: (collected: number, pageNum: number, total: number | null) => void,
): Promise<Rating[]> {
  await selectMaxPerPage(page);

  const total = await detectTotalRatings(page);
  const totalPages = total ? Math.ceil(total / 200) : null;

  console.log(
    total
      ? `Found ${total} ratings (~${totalPages} pages)\n`
      : `Total count unknown — will scrape until no more pages\n`,
  );

  const allRatings: Rating[] = [];
  let pageNum = 1;

  while (true) {
    let pageRatings: Rating[] | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await page.waitForSelector(".profileFilmsList .item", { timeout: 15_000 });
        pageRatings = await scrapePage(page);
        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`  Attempt ${attempt}/${MAX_RETRIES} for page ${pageNum} failed: ${msg}`);
        if (attempt < MAX_RETRIES) {
          await page.waitForTimeout(DELAY_MS * 2);
          await page.reload({ waitUntil: "domcontentloaded" });
        } else {
          console.error(`  Skipping page ${pageNum} after ${MAX_RETRIES} failed attempts`);
        }
      }
    }

    if (pageRatings) {
      allRatings.push(...pageRatings);
    }

    onProgress?.(allRatings.length, pageNum, total);

    const morePages = await hasNextPage(page);
    if (!morePages) break;

    await page.waitForTimeout(DELAY_MS);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await goToNextPage(page);
        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`  Navigation attempt ${attempt}/${MAX_RETRIES} failed: ${msg}`);
        if (attempt === MAX_RETRIES) {
          console.error(`  Could not navigate past page ${pageNum}, stopping.`);
          return allRatings;
        }
        await page.waitForTimeout(DELAY_MS * 2);
      }
    }

    pageNum++;
  }

  return allRatings;
}
