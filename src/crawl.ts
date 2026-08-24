import * as url from 'node:url';
import { JSDOM } from 'jsdom';
import { ExtractedPageData } from './types.js';


export function normalizeURL(inURL: string): string {
    // saftey check
    if (!URL.canParse(inURL))
        return '';

    const urlobj = new url.URL(inURL);
    if (urlobj.pathname.endsWith('/'))
        urlobj.pathname = urlobj.pathname.slice(0, urlobj.pathname.length-1);
    const urlstr = urlobj.hostname + urlobj.pathname + urlobj.search;
    return urlstr;
}
export function reproduceLink(baseURL: string, path: string): string {
    // path is a full working url
    if (URL.canParse(path))
        return path;
    // one / between two
    if (baseURL.endsWith('/'))
        baseURL = baseURL.slice(0, baseURL.length-1);
    if (path.startsWith('/'))
        path = path.slice(1);
    return baseURL + '/' + path;
}

export function getHeadingFromHTML(html: string): string {
    const dom = new JSDOM(html);
    
    return dom.window.document.querySelector('h1')?.textContent || '';
}

export function getFirstParagraphFromHTML(html: string): string {
    const dom = new JSDOM(html);
    
    const mainP = dom.window.document.querySelector('main p');
    const firstP = dom.window.document.querySelector('p')
    return mainP?.textContent || firstP?.textContent || '';
}

export function getURLsFromHTML(html: string, baseURL: string): string[] {
    const dom = new JSDOM(html);

    const a_el = dom.window.document.querySelectorAll('a');
    const links = [];

    for (const el of a_el)
        links.push(reproduceLink(baseURL, el.href));
    
    return links
}
export function getImagesFromHTML(html: string, baseURL: string): string[] {
    const dom = new JSDOM(html);

    const img_el = dom.window.document.querySelectorAll('img');
    const links = [];

    for (const el of img_el)
        links.push(reproduceLink(baseURL, el.src));

    return links
}

export function extractPageData(html: string, baseURL: string): ExtractedPageData {
    return ({
        url: baseURL,
        heading: getHeadingFromHTML(html),
        firstParagraph: getFirstParagraphFromHTML(html),
        outgoingLinks: getURLsFromHTML(html, baseURL),
        imageURLs: getImagesFromHTML(html, baseURL)
    });
}