const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });
const customConfig = { testEnvironment: 'node' };
module.exports = createJestConfig(customConfig);
