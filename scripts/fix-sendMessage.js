#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

const filePath = '/Users/ahmadzein/github/autoDeploy/src/api/server.js';
let content = readFileSync(filePath, 'utf8');

// Fix all instances of })}\n\n`); to });
content = content.replace(/\}\)\}\\n\\n`\);/g, '});');

// Check for any remaining patterns
const remainingPatterns = content.match(/\}\)[^\)]*`\);/g);
if (remainingPatterns) {
    console.log('Found remaining patterns to fix:', remainingPatterns.length);
    remainingPatterns.forEach(pattern => {
        console.log('Pattern:', pattern);
    });
}

// Write the fixed content
writeFileSync(filePath, content);
console.log('Fixed sendMessage syntax issues');