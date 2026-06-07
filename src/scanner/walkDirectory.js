const fs = require('fs').promises;
const path = require('path');

/**
 * Recursively walks the directory and returns all files.
 * Ignores node_modules and .git directories.
 * @param {string} dirPath - The directory path to scan.
 * @param {string} rootPath - The root directory path to calculate relative paths.
 * @returns {Promise<string[]>} List of relative file paths.
 */
async function walk(dirPath, rootPath) {
    let files = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
            // Ignore node_modules, .git, and other hidden/system directories
            if (entry.name === 'node_modules' || entry.name === '.git') {
                continue;
            }
            const subDirFiles = await walk(fullPath, rootPath);
            files = files.concat(subDirFiles);
        } else if (entry.isFile()) {
            const relativePath = path.relative(rootPath, fullPath);
            // Normalize separators to forward slash (/) for cross-platform consistency
            const normalizedPath = relativePath.split(path.sep).join('/');
            files.push(normalizedPath);
        }
    }

    return files;
}

/**
 * Scans the current project directory to construct its file structure metadata.
 * Logs and returns the project structure object.
 * @returns {Promise<object>} Project structure object.
 */
async function scanProject() {
    const rootPath = process.cwd();
    const root = path.basename(rootPath);

    let files = [];
    try {
        files = await walk(rootPath, rootPath);
    } catch (error) {
        console.error('Error walking directory:', error);
    }

    // Sort files for consistent output
    files.sort();

    const packageJsonExists = files.includes('package.json');
    const packageLockExists = files.includes('package-lock.json');

    const result = {
        root: root,
        files: files,
        packageJsonPath: packageJsonExists ? `${root}/package.json` : null,
        packageLockPath: packageLockExists ? `${root}/package-lock.json` : null
    };

    // Log the response as requested
    return result;
}

module.exports = scanProject;
