const test = require('node:test');
const assert = require('node:assert');
const frameworkDetector = require('../src/detectors/frameworkDetector');

test('frameworkDetector - detects express, mongodb, and all boolean flags', () => {
    const packageInfo = {
        dependencies: {
            '@sendgrid/mail': '^8.1.6',
            bcrypt: '^6.0.0',
            'body-parser': '^2.2.0',
            cloudinary: '^2.7.0',
            compression: '^1.8.1',
            cookie: '^1.1.1',
            'cookie-parser': '^1.4.7',
            cors: '^2.8.5',
            dotenv: '^17.2.1',
            express: '^5.1.0',
            joi: '^18.0.0',
            'json-parser': '^3.1.2',
            jsonwebtoken: '^9.0.2',
            mongoose: '^8.17.0',
            multer: '^1.4.4',
            redis: '^5.10.0',
            'socket.io': '^4.8.1'
        },
        devDependencies: {}
    };

    const result = frameworkDetector(packageInfo);

    assert.deepStrictEqual(result, {
        runtime: 'node',
        framework: 'express',
        database: 'mongodb',
        realtime: true,
        upload: true,
        cache: true
    });
});

test('frameworkDetector - falls back to unknown/default on empty dependencies', () => {
    const packageInfo = {
        dependencies: {},
        devDependencies: {}
    };

    const result = frameworkDetector(packageInfo);

    assert.deepStrictEqual(result, {
        runtime: 'node',
        framework: 'node',
        database: null,
        realtime: false,
        upload: false,
        cache: false
    });
});
