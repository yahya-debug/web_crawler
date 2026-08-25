# webCrawl

A small TypeScript web crawler. Point it at a URL and it recursively follows
every link that stays on the same domain, extracts data from each page
(heading, first paragraph, outgoing links, image URLs), and writes the
results to a JSON report.

## How it works

1. `src/index.ts` reads CLI arguments and kicks off the crawl.
2. `ConcurrentCrawler` (`src/ConcurrentCrawler.ts`) drives the crawl:
   - Starting from the base URL, it fetches the page HTML, extracts data and
     links (`src/crawl.ts`), then recursively crawls every discovered link
     that belongs to the same domain (`isSameDomain` in `src/helpers.ts`).
   - Links are normalized (`normalizeURL`) so that `example.com/page` and
     `example.com/page/` are treated as the same page, and a `Set` of
     visited URLs prevents re-crawling a page or looping forever.
   - Concurrency is bounded with [`p-limit`](https://www.npmjs.com/package/p-limit)
     instead of firing every fetch at once with `Promise.all` — only `N`
     requests are ever in flight at a time.
   - Crawling stops once `maxPages` unique pages have been visited.
3. Once the crawl finishes, `src/report.ts` sorts the collected pages by URL
   and writes them to `report.json`.

## Requirements

- Node.js `22.15.0` (see `.nvmrc` — run `nvm use` if you use nvm)

## Install

```bash
npm install
```

## Run

```bash
npm start -- <baseURL> <maxConcurrency> <maxPages>
```

Example — crawl up to 20 pages of a site, 5 requests at a time:

```bash
npm start -- https://example.com 5 20
```

This prints progress as it crawls, then writes the extracted page data to
`report.json` in the project root (gitignored).

## Test

```bash
npm test
```

Runs the test suite with [Vitest](https://vitest.dev/).

## Possible enhancements

- **Respect `robots.txt`** before crawling a site.
- **Retry/backoff** for transient network errors instead of dropping a page
  on first failure.
- **Depth limiting**, in addition to the existing page-count limit.
- **Persist progress** so a crawl can resume after a crash instead of
  restarting from scratch.
- **Rate limiting per host** (beyond just bounding total concurrency) to
  avoid hammering a single server.
- **Streaming the report** to disk incrementally rather than holding every
  page in memory until the crawl finishes.
