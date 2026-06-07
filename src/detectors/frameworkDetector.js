/**
 * Detects the runtime, framework, database, and other features based on project dependencies.
 * @param {object} packageInfo - Object containing dependencies and devDependencies.
 * @returns {object} Detected framework metadata.
 */
function frameworkDetector(packageInfo) {
    const dependencies = {
        ...(packageInfo?.dependencies || {}),
        ...(packageInfo?.devDependencies || {})
    };

    // 1. Detect Framework
    let framework = 'node'; // default JS runtime environment fallback
    if (dependencies['next']) {
        framework = 'next';
    } else if (dependencies['@nestjs/core']) {
        framework = 'nest';
    } else if (dependencies['express']) {
        framework = 'express';
    } else if (dependencies['fastify']) {
        framework = 'fastify';
    } else if (dependencies['koa']) {
        framework = 'koa';
    } else if (dependencies['react']) {
        if (dependencies['vite'] || dependencies['@vitejs/plugin-react']) {
            framework = 'react-vite';
        } else {
            framework = 'react';
        }
    } else if (dependencies['vue']) {
        if (dependencies['nuxt']) {
            framework = 'nuxt';
        } else {
            framework = 'vue';
        }
    } else if (dependencies['@angular/core']) {
        framework = 'angular';
    } else if (dependencies['svelte']) {
        framework = 'svelte';
    }

    // 2. Detect Database
    let database = null;
    if (dependencies['mongoose'] || dependencies['mongodb']) {
        database = 'mongodb';
    } else if (dependencies['pg'] || dependencies['pg-promise']) {
        database = 'postgresql';
    } else if (dependencies['mysql'] || dependencies['mysql2']) {
        database = 'mysql';
    } else if (dependencies['sqlite3'] || dependencies['better-sqlite3']) {
        database = 'sqlite';
    } else if (dependencies['sequelize']) {
        database = 'sequelize-supported';
    }

    // 3. Detect features (Realtime, Upload, Cache)
    const realtime = !!(dependencies['socket.io'] || dependencies['socket.io-client'] || dependencies['ws']);
    const upload = !!(dependencies['multer'] || dependencies['formidable'] || dependencies['express-fileupload'] || dependencies['busboy']);
    const cache = !!(dependencies['redis'] || dependencies['ioredis'] || dependencies['memcached']);

    const result = {
        runtime: 'node', // JS environment focus
        framework,
        database,
        realtime,
        upload,
        cache
    };

    // Log the detection result for visibility
    console.log(result);

    return result;
}

module.exports = frameworkDetector;
