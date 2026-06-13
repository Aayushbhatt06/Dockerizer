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
        console.log(`Dockerfile generated successfully from template "${templateName}" using Node version ${nodeVersion}!`);

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
        console.log('.dockerignore generated successfully!');

    } catch (error) {
        console.error('Error generating Dockerfile/dockerignore:', error);
    }
}

module.exports = dockerfileGenerator;
