import * as fs from "node:fs";
import { ExtractedPageData } from "./types.js";
import path from "node:path";

export function writeJSONReport(pageData: Record<string, ExtractedPageData>, filename: string): void {
    const sorted = Object.values(pageData).sort((a, b) => a.url.localeCompare(b.url));
    const stringified = JSON.stringify(sorted, null, 2);
    // console.log(stringified)
    fs.writeFileSync(path.resolve(process.cwd(), filename), stringified);
}