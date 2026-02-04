const fs = require('fs');

const content = fs.readFileSync('C:\\Projet AnylibreV2\\anylibre\\src\\app\\(protected)\\Provider\\TableauDeBord\\Service\\Add\\page.tsx', 'utf8');
const lines = content.split('\n');

let braceCount = 0;
let parenCount = 0;
let bracketCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;

        if (braceCount < 0) {
            console.log(`Negative brace count at line ${i + 1}, col ${j + 1}`);
            process.exit(1);
        }
    }
}

console.log(`Final counts: Brace=${braceCount}, Paren=${parenCount}, Bracket=${bracketCount}`);
