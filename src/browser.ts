import { chromium, type Browser, type Page } from "playwright";
import * as readline from "node:readline";

export async function launchBrowser(): Promise<{ browser: Browser; page: Page }> {
  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    locale: "ru-RU",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();
  return { browser, page };
}

export async function navigateToVotes(page: Page, userId: string): Promise<void> {
  const url = `https://www.kinopoisk.ru/user/${userId}/votes/list/ord/date/page/1/perpage/200/`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
}

export async function waitForUserReady(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      "\n🎬 Browser is open. Log in to Kinopoisk if needed, then press ENTER here to start scraping...\n",
      () => {
        rl.close();
        resolve();
      },
    );
  });
}
