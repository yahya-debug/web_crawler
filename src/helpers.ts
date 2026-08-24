import { URL } from "node:url";

export function isSameDomain(url1: string, url2: string): boolean {
    if (!URL.canParse(url1) || !URL.canParse(url2))
        throw new Error("not a link")

    const p1 = URL.parse(url1), p2 = URL.parse(url2);

    return p1?.hostname == p2?.hostname;
}