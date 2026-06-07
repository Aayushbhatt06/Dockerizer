const fs = require('fs').promises;
const path = require('path');

/**
 * Reads the package.json file identified in projectInfo, and extracts
 * its dependencies and devDependencies.
 * @param {object} projectInfo - The output of the project scanner.
 * @returns {Promise<object>} Object containing dependencies and devDependencies.
 */
async function packageAnalyzer(projectInfo) {
    const defaultResult = {
        dependencies: {},
        devDependencies: {},
        main: null,
        scripts: {}
    };

    // Find the relative path of package.json from the files list (root level only)
    const packageJsonRelativePath = projectInfo.files.find(
        (file) => file === 'package.json'
    );

    if (!packageJsonRelativePath) {
        console.log("package.json was not found for this directory");
        process.exit(1);
    }

    try {
        const absolutePath = path.join(process.cwd(), packageJsonRelativePath);
        const fileContent = await fs.readFile(absolutePath, 'utf8');
        const parsedPackage = JSON.parse(fileContent);

        const result = {
            dependencies: parsedPackage.dependencies || {},
            devDependencies: parsedPackage.devDependencies || {},
            main: parsedPackage.main || null,
            scripts: parsedPackage.scripts || {}
        };

        return result;
    } catch (error) {
        console.error('Error analyzing package.json:', error);
        return defaultResult;
    }
}

module.exports = packageAnalyzer;
