#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

const filePath = '/Users/ahmadzein/github/autoDeploy/src/api/server.js';
const content = readFileSync(filePath, 'utf8');

// Split content into lines for easier processing
const lines = content.split('\n');
const newLines = [];

let i = 0;
while (i < lines.length) {
    const line = lines[i];
    
    // Check if this line contains res.write(`data:
    if (line.includes('res.write(`data: ${JSON.stringify(')) {
        // Find the complete res.write statement
        let resWriteLines = [line];
        let j = i + 1;
        let openBraces = 0;
        let closeBraces = 0;
        
        // Count braces in first line
        for (const char of line) {
            if (char === '{') openBraces++;
            if (char === '}') closeBraces++;
        }
        
        // Continue until we balance the braces
        while (j < lines.length && openBraces > closeBraces) {
            const nextLine = lines[j];
            resWriteLines.push(nextLine);
            
            for (const char of nextLine) {
                if (char === '{') openBraces++;
                if (char === '}') closeBraces++;
            }
            
            // Check if this line ends the res.write
            if (nextLine.includes('})}\n\n`);')) {
                break;
            }
            j++;
        }
        
        // Now we have the complete res.write statement
        // Extract the JSON object part
        const fullStatement = resWriteLines.join('\n');
        const jsonMatch = fullStatement.match(/res\.write\(`data: \${JSON\.stringify\(([\s\S]*?)\)}\n\n`\);/);
        
        if (jsonMatch) {
            const jsonContent = jsonMatch[1];
            // Replace the first line with sendMessage
            const indent = line.match(/^\s*/)[0];
            newLines.push(`${indent}sendMessage(${jsonContent}`);
            
            // Add the remaining lines (but skip the last one with })}\n\n`);
            for (let k = 1; k < resWriteLines.length - 1; k++) {
                newLines.push(resWriteLines[k]);
            }
            
            // Add the closing line with just });
            const lastLine = resWriteLines[resWriteLines.length - 1];
            const lastIndent = lastLine.match(/^\s*/)[0];
            newLines.push(`${lastIndent}});`);
            
            // Skip the lines we just processed
            i = j + 1;
            continue;
        }
    }
    
    // Check for event: close pattern
    if (line.includes('res.write(`event: close\\ndata: {}\\n\\n`);') || 
        line.includes("res.write('event: close\\ndata: {}\\n\\n');")) {
        const indent = line.match(/^\s*/)[0];
        newLines.push(`${indent}sendMessage({ type: 'close' });`);
        i++;
        continue;
    }
    
    // Otherwise, keep the line as is
    newLines.push(line);
    i++;
}

// Write the transformed content
const newContent = newLines.join('\n');
writeFileSync(filePath, newContent);
console.log('Transformation complete!');