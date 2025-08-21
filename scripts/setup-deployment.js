#!/usr/bin/env node

/**
 * Deployment Setup Helper
 * This script helps verify that deployment is configured correctly
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('🚀 TrackZen Deployment Setup Checker\n');

// Check if required files exist
const requiredFiles = [
  '.github/workflows/deploy.yml',
  'netlify.toml',
  'package.json'
];

console.log('📋 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing!`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please run the setup again.');
  process.exit(1);
}

// Check package.json scripts
console.log('\n📋 Checking build scripts...');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const requiredScripts = ['build:netlify', 'typecheck', 'test'];

requiredScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`✅ npm run ${script}`);
  } else {
    console.log(`❌ npm run ${script} - Missing!`);
  }
});

// Test build process
console.log('\n🔧 Testing build process...');
try {
  console.log('Running type check...');
  execSync('npm run typecheck', { stdio: 'pipe' });
  console.log('✅ Type check passed');

  console.log('Running tests...');
  execSync('npm run test', { stdio: 'pipe' });
  console.log('✅ Tests passed');

  console.log('Testing build...');
  execSync('npm run build:netlify', { stdio: 'pipe' });
  console.log('✅ Build successful');

  // Check if dist/spa exists
  if (existsSync('dist/spa')) {
    console.log('✅ Build output directory exists');
  } else {
    console.log('❌ Build output directory missing');
  }

} catch (error) {
  console.log('❌ Build process failed:');
  console.log(error.stdout?.toString() || error.message);
  process.exit(1);
}

console.log('\n🎉 Deployment setup verification complete!');
console.log('\n📚 Next steps:');
console.log('1. Connect to Netlify: https://netlify.com');
console.log('2. Create a new site from your GitHub repository');
console.log('3. Add GitHub secrets: NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID');
console.log('4. Push to main branch to trigger deployment');
console.log('\n📖 See docs/DEPLOYMENT.md for detailed instructions');
