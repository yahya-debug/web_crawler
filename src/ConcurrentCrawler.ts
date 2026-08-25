import pLimit, { LimitFunction } from 'p-limit';
import { isSameDomain } from './helpers.js';
import { extractPageData, getURLsFromHTML, normalizeURL } from './crawl.js';
import { ExtractedPageData } from './types.js';
export class ConcurrentCrawler {
    private baseURL: string;
    private pages: Record<string, ExtractedPageData>;
    private limit: LimitFunction;
    private maxPages: number;
    private shouldStop: boolean;
    private allTasks: Set<Promise<void>>;
    private visited: Set<string>;
    constructor(baseURL: string, pages: Record<string, ExtractedPageData> = {}, limit: number, maxPages: number) {
        this.baseURL = baseURL;
        this.pages = pages;
        this.limit = pLimit(limit);
        this.maxPages = maxPages;
        this.shouldStop = false;
        this.allTasks = new Set();
        this.visited = new Set();
    }

    private addPageVisit(normalizedURL: string): boolean {
        if (this.shouldStop) return false;
        if (this.visited.has(normalizedURL)) {
            return false;
        }

        if (this.visited.size >= this.maxPages) {
            this.shouldStop = true;
            console.log("Reached maximum number of pages to crawl.");
            return false;
        }
        // reserve the slot synchronously, before any async work,
        // so concurrent crawls of the same URL can't race past this check
        this.visited.add(normalizedURL);
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

        try {
            console.log(`crawling ${curPage}`);
            // page html
            const html = await this.getHTML(curPage);
            // extract URLs
            const data = extractPageData(html, curPage);
            console.log(Object.keys(this.pages).length)
            this.pages[normalized] = data;
    
            const pages = [];
            for (const url of data.outgoingLinks) {
                const crawlTask = this.crawlPage(baseURL, url);
                pages.push(crawlTask);
                this.allTasks.add(crawlTask); 
                crawlTask.finally(() => this.allTasks.delete(crawlTask));
            }
    
            await Promise.all(pages);
        } catch (e) {
            return;
        }
    }

    public async crawl() {
        await this.crawlPage(this.baseURL);
        return this.pages
    }
}