const fs = require('fs');
const path = 'src/i18n/locals/fr/Admin/index.ts';
try {
    const content = fs.readFileSync(path, 'utf8');
    // Simple check: count braces?
    // Or try to compile it effectively?
    // Since it's TS, we can't require it directly in Node (unless ts-node).
    // But we can check brace balance.
    let balance = 0;
    for (let char of content) {
        if (char === '{') balance++;
        if (char === '}') balance--;
    }
    console.log('Brace balance:', balance);
} catch (e) {
    console.error(e);
}
