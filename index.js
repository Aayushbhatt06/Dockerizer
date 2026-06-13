#!/usr/bin/env node
const figlet = require('figlet');
const analyze = require("./src/commands/analyze");

// Terminal color definitions
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    red: '\x1b[31m'
};

// Strips ANSI escape sequences to accurately calculate visible string length
function stripAnsi(str) {
    return str.replace(/\x1b\[[0-9;]*m/g, '');
}

// Wraps text inside a beautiful box with custom border color
function wrapInBox(text, borderColor = '') {
    const lines = text.split('\n');
    while (lines.length && lines[0].trim() === '') lines.shift();
    while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();

    const maxLength = Math.max(...lines.map(line => stripAnsi(line).length));
    const borderTop = '┌' + '─'.repeat(maxLength + 4) + '┐';
    const borderBottom = '└' + '─'.repeat(maxLength + 4) + '┘';

    const boxedLines = lines.map(line => {
        const visibleLength = stripAnsi(line).length;
        const padding = ' '.repeat(maxLength - visibleLength);
        return `│  ${line}${padding}  │`;
    });

    return [
        borderColor + borderTop + colors.reset,
        ...boxedLines.map(line => borderColor + '│' + colors.reset + line.slice(1, -1) + borderColor + '│' + colors.reset),
        borderColor + borderBottom + colors.reset
    ].join('\n');
}

// Renders the stylized startup banner
function printBanner() {
    try {
        const rawFiglet = figlet.textSync('Dockerizer', { horizontalLayout: 'default' });
        // Color the figlet banner in bright cyan
        const coloredFiglet = rawFiglet.split('\n')
            .map(line => `${colors.bright}${colors.cyan}${line}${colors.reset}`)
            .join('\n');

        const subtitle = `${colors.bright}${colors.yellow}Zero-config Dockerfile Generator for Node.js${colors.reset}`;
        
        // Find visible width of the figlet banner to center the subtitle
        const rawLines = rawFiglet.split('\n');
        const figletWidth = Math.max(...rawLines.map(l => l.length));
        const subtitleVisibleLength = 44; // visible chars in subtitle
        const padSize = Math.max(0, Math.floor((figletWidth - subtitleVisibleLength) / 2));
        const paddedSubtitle = ' '.repeat(padSize) + subtitle;

        const combined = `${coloredFiglet}\n\n${paddedSubtitle}`;
        console.log(wrapInBox(combined, `${colors.bright}${colors.blue}`) + '\n');
    } catch (err) {
        console.log(`${colors.bright}${colors.cyan}--- Dockerizer ---${colors.reset}\n`);
    }
}

// Print logo banner, then run the command pipeline
printBanner();
analyze();