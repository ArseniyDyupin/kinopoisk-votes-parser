import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "../index.js";
import { ALL_FIELDS } from "../types.js";

describe("parseArgs", () => {
  it("parses --user-id with defaults", () => {
    const result = parseArgs(["--user-id", "123"]);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.options.userId, "123");
    assert.equal(result.options.format, "json");
    assert.deepEqual(result.options.fields, ALL_FIELDS);
    assert.equal(result.options.output, "./ratings_123.json");
  });

  it("parses --format csv and adjusts output extension", () => {
    const result = parseArgs(["--user-id", "456", "--format", "csv"]);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.options.format, "csv");
    assert.equal(result.options.output, "./ratings_456.csv");
  });

  it("parses --format xml", () => {
    const result = parseArgs(["--user-id", "789", "--format", "xml"]);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.options.format, "xml");
    assert.equal(result.options.output, "./ratings_789.xml");
  });

  it("parses --fields with subset", () => {
    const result = parseArgs(["--user-id", "1", "--fields", "title,rating"]);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.options.fields, ["title", "rating"]);
  });

  it("parses --output to override default", () => {
    const result = parseArgs(["--user-id", "1", "--output", "custom.json"]);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.options.output, "custom.json");
  });

  it("returns error for missing --user-id", () => {
    const result = parseArgs(["--format", "json"]);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.help, true);
    assert.ok(result.error?.includes("--user-id"));
  });

  it("returns error for invalid format", () => {
    const result = parseArgs(["--user-id", "1", "--format", "yaml"]);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.error?.includes("yaml"));
  });

  it("returns error for unknown field", () => {
    const result = parseArgs(["--user-id", "1", "--fields", "title,badfield"]);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.error?.includes("badfield"));
  });

  it("returns help flag for --help", () => {
    const result = parseArgs(["--help"]);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.help, true);
    assert.equal(result.error, undefined);
  });

  it("returns help flag for -h", () => {
    const result = parseArgs(["-h"]);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.help, true);
  });
});
