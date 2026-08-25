import pLimit, { LimitFunction } from 'p-limit';
import { isSameDomain } from './helpers.js';
import { getURLsFromHTML, normalizeURL } from './crawl.js';
export class ConcurrentCrawler {
    private baseURL: string;
    private pages: Record<string, number>;
    private limit: LimitFunction;
    private maxPages: number;
    private shouldStop: boolean;
    private allTasks: Set<Promise<void>>;
    constructor(baseURL: string, pages: Record<string, number> = {}, limit: number, maxPages: number) {
        this.baseURL = baseURL;
        this.pages = pages;
        this.limit = pLimit(limit);
        this.maxPages = maxPages;
        this.shouldStop = false;
        this.allTasks = new Set();
    }

    private addPageVisit(normalizedURL: string): boolean {
        if (this.shouldStop) return false;
        if (this.pages[normalizedURL] >= 1) {
            this.pages[normalizedURL]++;
            return false;
        }

        if (Object.keys(this.pages).length == this.maxPages) {
            this.shouldStop = true;
            console.log("Reached maximum number of pages to crawl.");
            return false;
        }
        this.pages[normalizedURL] = 1;
        return true;
    }


    private async getHTML(baseURL: string): Promise<string> {
        // bundle all inside the limit function
        return this.limit(async () => {
            // make a GET request to the base url of the claimed html page
            // we set header User-Agent: JohnCrawl/1.0
            const res = await fetch(baseURL, {
                headers: {
                    'User-Agent': 'JohnCrawl/1.0'
                }
            });
            
            // if URL gives back errors
            if (res.status >= 400)
                throw new Error(`error on the site: ${baseURL}`);
        
            // if not HTML reject
            console.log(res.headers.get('Content-Type'))
            if (!res.headers.get('Content-Type')?.includes('text/html'))
                throw new Error(`The URL: ${baseURL}, does not provide HTML page`);
        
        
            const data = await res.text();
        
            return data;
        })
    }

    // Crawl function, runs recursivley and gets the data of all html-pages links provided in the curPage
    // curPage will become the new found page in each move towards
    private async crawlPage(baseURL: string, curPage: string = baseURL) {
        if (!isSameDomain(baseURL, curPage) || this.shouldStop)
            return;

        const normalized = normalizeURL(curPage);
        if (!this.addPageVisit(normalized))
            return;

        console.log(`crawling ${curPage}`);
        // page html
        const html = await this.getHTML(curPage);

        // extract URLs
        const URLs = getURLsFromHTML(html, curPage);

        const pages = [];
        for (const url of URLs) {
            const crawlTask = this.crawlPage(baseURL, url);
            pages.push(crawlTask);
            this.allTasks.add(crawlTask); 
            crawlTask.finally(() => this.allTasks.delete(crawlTask));
        }

        await Promise.all(pages);
    }

    public async crawl() {
        await this.crawlPage(this.baseURL);
        return this.pages
    }
}