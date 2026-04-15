import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatRatings } from "../formatters.js";
import type { Rating } from "../types.js";

const sample: Rating = {
  title: 'Зомболодка! (сериал, 2019)',
  originalTitle: "Zomboat!",
  year: "2019",
  rating: 7,
  ratedAt: "15.04.2026, 11:49",
  kpRating: "7.275",
  votesCount: "22468",
  duration: "24",
  kpUrl: "https://www.kinopoisk.ru/film/1234/",
};

const allFields: (keyof Rating)[] = [
  "title", "originalTitle", "year", "rating",
  "ratedAt", "kpRating", "votesCount", "duration", "kpUrl",
];

describe("formatRatings — JSON", () => {
  it("produces valid JSON with all fields", () => {
    const out = formatRatings([sample], allFields, "json");
    const parsed = JSON.parse(out);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].title, sample.title);
    assert.equal(parsed[0].rating, 7);
    assert.equal(parsed[0].kpUrl, sample.kpUrl);
  });

  it("filters to selected fields only", () => {
    const out = formatRatings([sample], ["title", "rating"], "json");
    const parsed = JSON.parse(out);
    assert.deepEqual(Object.keys(parsed[0]), ["title", "rating"]);
    assert.equal(parsed[0].title, sample.title);
    assert.equal(parsed[0].originalTitle, undefined);
  });

  it("handles empty array", () => {
    const out = formatRatings([], allFields, "json");
    assert.deepEqual(JSON.parse(out), []);
  });
});

describe("formatRatings — CSV", () => {
  it("produces header + data row", () => {
    const out = formatRatings([sample], ["title", "rating", "ratedAt"], "csv");
    const lines = out.split("\n");
    assert.equal(lines.length, 2);
    assert.equal(lines[0], '"title","rating","ratedAt"');
  });

  it("escapes commas and quotes in values", () => {
    const tricky: Rating = {
      ...sample,
      title: 'Фильм "Кавычки", да',
    };
    const out = formatRatings([tricky], ["title"], "csv");
    const dataLine = out.split("\n")[1];
    assert.ok(dataLine.includes('""Кавычки""'), `Expected escaped quotes in: ${dataLine}`);
  });

  it("filters to selected fields", () => {
    const out = formatRatings([sample], ["year", "duration"], "csv");
    const lines = out.split("\n");
    assert.equal(lines[0], '"year","duration"');
    assert.equal(lines[1], '"2019","24"');
  });
});

describe("formatRatings — XML", () => {
  it("produces valid XML structure", () => {
    const out = formatRatings([sample], ["title", "rating"], "xml");
    assert.ok(out.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(out.includes("<ratings>"));
    assert.ok(out.includes("</ratings>"));
    assert.ok(out.includes("<title>"));
    assert.ok(out.includes("</title>"));
  });

  it("escapes special XML characters", () => {
    const tricky: Rating = {
      ...sample,
      title: "A & B < C > D",
    };
    const out = formatRatings([tricky], ["title"], "xml");
    assert.ok(out.includes("A &amp; B &lt; C &gt; D"));
    assert.ok(!out.includes("A & B"));
  });

  it("filters to selected fields", () => {
    const out = formatRatings([sample], ["rating", "year"], "xml");
    assert.ok(!out.includes("<title>"));
    assert.ok(!out.includes("<kpUrl>"));
    assert.ok(out.includes("<year>2019</year>"));
  });
});
