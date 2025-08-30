#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

const filePath = process.argv[2];
if (!filePath) {
    console.error('Usage: node transform-res-writes.js <file-path>');
    process.exit(1);
}

const content = readFileSync(filePath, 'utf8');

// Transform res.write calls to sendMessage calls
let transformed = content;

// Pattern 1: res.write(`data: ${JSON.stringify({...})}\n\n`);
transformed = transformed.replace(
    /res\.write\(`data: \${JSON\.stringify\(({[\s\S]*?})\)}\n\n`\);/g,
    (match, jsonContent) => {
        // Clean up the JSON content
        const cleaned = jsonContent.trim();
        return `sendMessage(${cleaned});`;
    }
);

// Pattern 2: res.write('event: close\ndata: {}\n\n');
transformed = transformed.replace(
    /res\.write\('event: close\\ndata: \{\}\\n\\n'\);/g,
    `sendMessage({ type: 'close' });`
);

// Pattern 3: res.write(`event: close\ndata: {}\n\n`);
transformed = transformed.replace(
    /res\.write\(`event: close\\ndata: \{\}\\n\\n`\);/g,
    `sendMessage({ type: 'close' });`
);

// Write the transformed content
writeFileSync(filePath, transformed);
console.log('Transformation complete!');