import { argv } from "node:process";
import { crawlSiteAsync, normalizeURL } from "./crawl.js";
import { writeJSONReport } from "./report.js";

async function main() {
    if (argv.length != 5)
        throw new Error("app takes just one argument");

    // looking for the third argument in the list
    // what comes before is some links for the nvmrc and the running file (we skip)
    const baseURL = argv[2];
    const maxConcurrency = argv[3];
    const maxPages = argv[4];

    normalizeURL('https://learnwebscraping.dev/practice/ecommerce/')

    console.log(`started crawling ${argv[2]}`)
    const pages = await crawlSiteAsync(baseURL, parseInt(maxConcurrency), parseInt(maxPages));
    writeJSONReport(pages, 'report.json');
    console.log("Finished crawling.");
    const firstPage = Object.values(pages)[0];
    if (firstPage) {
        console.log(`First page record: ${firstPage["url"]} - ${firstPage["heading"]}`);
    }
    process.exit(0);
}

try {
    main();
} catch (e) {
    console.error((e as Error).message);
    process.exit(1);
}