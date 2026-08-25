import { argv } from "node:process";
import { crawlSiteAsync, normalizeURL } from "./crawl.js";

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
    console.log(await crawlSiteAsync(baseURL, parseInt(maxConcurrency), parseInt(maxPages)));
    process.exit(0);
}

try {
    main();
} catch (e) {
    console.error((e as Error).message);
    process.exit(1);
}