# Kinopoisk Votes Parser

CLI tool that exports your [Kinopoisk](https://www.kinopoisk.ru/) movie ratings to **JSON**, **CSV**, or **XML**. It opens a real browser via Playwright so you can log in and bypass any captchas, then automatically scrapes every page of your votes list.

## Prerequisites

- **Node.js >= 18** (tested on 22)
- **npm**

## Installation

```bash
git clone https://github.com/ArseniyDyupin/kinopoisk-votes-parser.git
cd kinopoisk-votes-parser
npm install
```

`npm install` will automatically download the Chromium browser needed by Playwright.

## Usage

```bash
npx tsx src/index.ts --user-id <YOUR_USER_ID> [options]
```

### Finding your User ID

Open your Kinopoisk profile in a browser. The URL looks like:

```
https://www.kinopoisk.ru/user/129356/
                              ^^^^^^ this is your user ID
```

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--user-id <id>` | **(required)** | Your Kinopoisk user ID |
| `--format <fmt>` | `json` | Output format: `json`, `csv`, `xml` |
| `--fields <list>` | all fields | Comma-separated list of fields to include |
| `--output <path>` | `ratings_<userId>.<format>` | Custom output file path |
| `--help` | | Show help and exit |

### Available fields

| Field | Example |
|-------|---------|
| `title` | Зомболодка! (сериал, 2019) |
| `originalTitle` | Zomboat! |
| `year` | 2019 |
| `rating` | 7 |
| `ratedAt` | 15.04.2026, 11:49 |
| `kpRating` | 7.275 |
| `votesCount` | 22468 |
| `duration` | 24 |
| `kpUrl` | https://www.kinopoisk.ru/film/1234/ |

### Examples

Export all fields as JSON (default):

```bash
npx tsx src/index.ts --user-id 129356
```

Export only title, rating and date as CSV:

```bash
npx tsx src/index.ts --user-id 129356 --format csv --fields title,rating,ratedAt
```

Export as XML to a specific file:

```bash
npx tsx src/index.ts --user-id 129356 --format xml --output my-export.xml
```

## How it works

1. A Chromium browser window opens and navigates to your votes page.
2. **You log in** to Kinopoisk if needed (or handle a captcha) directly in the browser.
3. Press **Enter** in the terminal when the ratings list is visible.
4. The tool automatically scrapes all pages (with 1.5s delay between pages to stay under rate limits).
5. The output file is saved and the browser closes.

## Output examples

### JSON

```json
[
  {
    "title": "Зомболодка! (сериал, 2019)",
    "originalTitle": "Zomboat!",
    "year": "2019",
    "rating": 7,
    "ratedAt": "15.04.2026, 11:49",
    "kpRating": "7.275",
    "votesCount": "22468",
    "duration": "24",
    "kpUrl": "https://www.kinopoisk.ru/film/1234/"
  }
]
```

### CSV

```csv
"title","rating","ratedAt"
"Зомболодка! (сериал, 2019)","7","15.04.2026, 11:49"
```

### XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ratings>
  <rating>
    <title>Зомболодка! (сериал, 2019)</title>
    <rating>7</rating>
    <ratedAt>15.04.2026, 11:49</ratedAt>
  </rating>
</ratings>
```

## License

MIT
