import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium, type Browser, type Page } from "playwright";
import { scrapePage } from "../scraper.js";

const MOCK_HTML = `
<html><body>
<div class="profileFilmsList">
  <div class="item">
    <div class="nameRus"><a href="https://www.kinopoisk.ru/film/1234/">Изобретение лжи (2009)</a></div>
    <div class="nameEng">The Invention of Lying</div>
    <div class="rating"><b>6.695</b><span>(69 339)</span><span>100 мин.</span></div>
    <div class="date">15.04.2026, 00:04</div>
    <div class="vote">8</div>
  </div>
  <div class="item even">
    <div class="nameRus"><a href="https://www.kinopoisk.ru/film/5678/">Непобедимый (сериал, 2021 – ...)</a></div>
    <div class="nameEng">Invincible</div>
    <div class="rating"><b>8.136</b><span>(63 678)</span><span>50 мин.</span></div>
    <div class="date">15.04.2026, 09:14</div>
    <div class="vote">6</div>
  </div>
  <div class="item">
    <div class="nameRus"><a href="https://www.kinopoisk.ru/film/9999/">Маркета Лазарова (1967)</a></div>
    <div class="nameEng">Marketa Lazarová</div>
    <div class="rating"><b>7.800</b><span>(3 200)</span><span>166 мин.</span></div>
    <div class="date">13.04.2026, 10:48</div>
    <div class="vote">8</div>
  </div>
</div>
</body></html>
`;

const MOCK_MISSING_FIELDS = `
<html><body>
<div class="profileFilmsList">
  <div class="item">
    <div class="nameRus"><a href="https://www.kinopoisk.ru/film/0000/">Без рейтинга (2020)</a></div>
    <div class="nameEng"></div>
    <div class="rating"></div>
    <div class="date">01.01.2026, 12:00</div>
    <div class="vote">5</div>
  </div>
</div>
</body></html>
`;

let browser: Browser;
let page: Page;

before(async () => {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  page = await context.newPage();
});

after(async () => {
  await browser.close();
});

describe("scrapePage", () => {
  it("extracts all fields from standard items", async () => {
    await page.setContent(MOCK_HTML);
    const ratings = await scrapePage(page);

    assert.equal(ratings.length, 3);

    const first = ratings[0];
    assert.equal(first.title, "Изобретение лжи (2009)");
    assert.equal(first.originalTitle, "The Invention of Lying");
    assert.equal(first.year, "2009");
    assert.equal(first.rating, 8);
    assert.equal(first.ratedAt, "15.04.2026, 00:04");
    assert.equal(first.kpRating, "6.695");
    assert.equal(first.votesCount, "69339");
    assert.equal(first.duration, "100");
    assert.ok(first.kpUrl.includes("/film/1234/"));
  });

  it("parses series year from title with year range", async () => {
    await page.setContent(MOCK_HTML);
    const ratings = await scrapePage(page);
    const series = ratings[1];

    assert.equal(series.title, "Непобедимый (сериал, 2021 – ...)");
    assert.equal(series.year, "2021");
    assert.equal(series.rating, 6);
  });

  it("handles multiple items with correct count", async () => {
    await page.setContent(MOCK_HTML);
    const ratings = await scrapePage(page);
    assert.equal(ratings.length, 3);

    assert.equal(ratings[2].title, "Маркета Лазарова (1967)");
    assert.equal(ratings[2].year, "1967");
    assert.equal(ratings[2].duration, "166");
  });

  it("handles missing optional fields gracefully", async () => {
    await page.setContent(MOCK_MISSING_FIELDS);
    const ratings = await scrapePage(page);

    assert.equal(ratings.length, 1);
    const item = ratings[0];
    assert.equal(item.title, "Без рейтинга (2020)");
    assert.equal(item.originalTitle, "");
    assert.equal(item.kpRating, "");
    assert.equal(item.votesCount, "");
    assert.equal(item.duration, "");
    assert.equal(item.rating, 5);
    assert.equal(item.year, "2020");
  });
});
