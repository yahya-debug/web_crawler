import { argv } from "node:process";

function main() {
    if (argv.length != 3)
        throw new Error("app takes just one argument");

    const baseURL = argv[2];

    console.log(`started crawling ${argv[2]}`)
    process.exit(0);
}

try {
    main();
} catch (e) {
    console.error((e as Error).message);
    process.exit(1);
}