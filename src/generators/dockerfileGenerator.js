const fs = require('fs').promises;
const path = require('path');

/**
 * Generates a Dockerfile and .dockerignore based on the detected framework and system Node version.
 * @param {object} detectedConfig - The output of the framework detector.
 * @returns {Promise<void>}
 */
async function dockerfileGenerator(detectedConfig, port, cmd, buildStep) {
    const framework = detectedConfig?.framework || 'node';
    
    // Map detected framework to template name
    let templateName = 'node';
    if (framework === 'express') {
        templateName = 'express';
    } else if (framework === 'next') {
        templateName = 'next';
    } else if (framework === 'react' || framework === 'react-vite') {
        templateName = 'react';
    }

    // Resolve template path (templates are in the root of the package)
    const templatePath = path.join(__dirname, '..', '..', 'templates', templateName);

    try {
        // 1. Read the template
        let dockerfileContent = await fs.readFile(templatePath, 'utf8');

        // 2. Inject current Node version, port, command and build step
        const nodeVersion = process.versions.node.split('.')[0];
        dockerfileContent = dockerfileContent
            .replace(/{{NODE_VERSION}}/g, nodeVersion)
            .replace(/{{PORT}}/g, port);

        if (cmd) {
            dockerfileContent = dockerfileContent.replace(/{{CMD}}/g, cmd);
        }

        if (buildStep !== undefined) {
            dockerfileContent = dockerfileContent.replace(/{{BUILD_STEP}}/g, buildStep);
        }

        // 3. Write Dockerfile to the scanned project root (process.cwd())
        const destDockerfilePath = path.join(process.cwd(), 'Dockerfile');
        await fs.writeFile(destDockerfilePath, dockerfileContent, 'utf8');
        console.log(`\n✨ \x1b[1m\x1b[32mDockerfile generated successfully\x1b[0m from template "\x1b[36m${templateName}\x1b[0m" using Node version \x1b[36m${nodeVersion}\x1b[0m!`);

        // 4. Generate .dockerignore in the scanned project root
        const destDockerignorePath = path.join(process.cwd(), '.dockerignore');
        const dockerignoreContent = [
            'node_modules',
            'npm-debug.log',
            '.git',
            '.gitignore',
            'Dockerfile',
            '.dockerignore',
            '.env',
            '.env.*',
            '!.env.example'
        ].join('\n') + '\n';

        await fs.writeFile(destDockerignorePath, dockerignoreContent, 'utf8');
        console.log(`✨ \x1b[1m\x1b[32m.dockerignore generated successfully!\x1b[0m`);

    } catch (error) {
        console.error('\x1b[31mError generating Dockerfile/dockerignore:\x1b[0m', error);
    }
}

module.exports = dockerfileGenerator;
