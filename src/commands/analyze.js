const scanProject = require("../scanner/walkDirectory");
const packageAnalyzer = require("../analyzer/packageAnalyzer");
const frameworkDetector = require("../detectors/frameworkDetector");
const dockerfileGenerator = require("../generators/dockerfileGenerator");
const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');
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

/**
 * Prompts the user to confirm/customize the configuration and specify the port.
 * @param {object} framework - Detected project configuration.
 * @returns {Promise<{framework: object, port: string}>} Verified configuration and port.
 */
async function askQuestions(framework) {
    const rl = readline.createInterface({ input, output });

    try {
        // 1. Check if some fields are null or false
        const hasUndetectedFields = 
            framework.database === null || 
            framework.realtime === false || 
            framework.upload === false || 
            framework.cache === false;

        if (hasUndetectedFields) {
            console.log(`\n${colors.bright}${colors.cyan}🔍 Detected Configuration:${colors.reset}`);
            console.log(colors.dim + JSON.stringify(framework, null, 2) + colors.reset);
            const isCorrect = await rl.question(`\n⚠️  ${colors.bright}${colors.yellow}Some configuration fields are not detected or false. Is this configuration correct? (y/n) [y]: ${colors.reset}`);
            
            if (isCorrect.trim().toLowerCase() === 'n' || isCorrect.trim().toLowerCase() === 'no') {
                console.log(`\n⚙️  ${colors.bright}${colors.cyan}Please customize the configuration:${colors.reset}`);
                
                const dbAnswer = await rl.question(`   ${colors.bright}Enter database type${colors.reset} (mongodb/postgresql/mysql/sqlite/none) [${framework.database || 'none'}]: `);
                const db = dbAnswer.trim().toLowerCase();
                if (db) {
                    framework.database = db === 'none' ? null : db;
                }

                const realtimeAnswer = await rl.question(`   ${colors.bright}Does the app require realtime support (socket.io/ws)?${colors.reset} (y/n) [${framework.realtime ? 'y' : 'n'}]: `);
                framework.realtime = realtimeAnswer.trim().toLowerCase() === 'y';

                const uploadAnswer = await rl.question(`   ${colors.bright}Does the app require file upload support (multer/formidable)?${colors.reset} (y/n) [${framework.upload ? 'y' : 'n'}]: `);
                framework.upload = uploadAnswer.trim().toLowerCase() === 'y';

                const cacheAnswer = await rl.question(`   ${colors.bright}Does the app require caching support (redis)?${colors.reset} (y/n) [${framework.cache ? 'y' : 'n'}]: `);
                framework.cache = cacheAnswer.trim().toLowerCase() === 'y';
            }
        }

        // 2. Ask for the port to expose
        let defaultPort = '3000';
        if (framework.framework === 'express') {
            defaultPort = '8000';
        } else if (framework.framework === 'react' || framework.framework === 'react-vite') {
            defaultPort = '80';
        }

        const portAnswer = await rl.question(`\n⚡ ${colors.bright}${colors.green}Enter the port to expose${colors.reset} [${defaultPort}]: `);
        const port = portAnswer.trim() || defaultPort;

        return { framework, port };
    } finally {
        rl.close();
    }
}

/**
 * Main command pipeline orchestrator.
 */
async function analyze() {
    const projectInfo = await scanProject();
    const dependencies = await packageAnalyzer(projectInfo);
    const framework = frameworkDetector(dependencies);


    const { framework: finalFramework, port } = await askQuestions(framework);

    // 1. Auto-detect start command
    let cmdString = 'node index.js';
    if (dependencies.scripts && dependencies.scripts.start) {
        cmdString = 'npm start';
        const scriptContent = dependencies.scripts.start;
        if (scriptContent.includes('vite') && !scriptContent.includes('--host')) {
            cmdString += ' -- --host';
        }
    } else if (dependencies.scripts && dependencies.scripts.dev) {
        cmdString = 'npm run dev';
        const scriptContent = dependencies.scripts.dev;
        if (scriptContent.includes('vite') && !scriptContent.includes('--host')) {
            cmdString += ' -- --host';
        }
    } else if (finalFramework.framework === 'next' || finalFramework.framework === 'react' || finalFramework.framework === 'react-vite') {
        cmdString = 'npm start';
    } else if (dependencies.main) {
        cmdString = `node ${dependencies.main}`;
    } else if (projectInfo.files.includes('server.js')) {
        cmdString = 'node server.js';
    } else if (projectInfo.files.includes('app.js')) {
        cmdString = 'node app.js';
    }

    const parts = cmdString.split(/\s+/).filter(Boolean);
    const cmd = JSON.stringify(parts);

    // 2. Auto-detect build step
    let buildStep = '';
    if (dependencies.scripts && dependencies.scripts.build) {
        buildStep = 'RUN npm run build';
    } else if (finalFramework.framework === 'next' || finalFramework.framework === 'react' || finalFramework.framework === 'react-vite') {
        // Build is mandatory for Next/React SPAs
        buildStep = 'RUN npm run build';
    }

    await dockerfileGenerator(finalFramework, port, cmd, buildStep);
}

module.exports = analyze;