#!/usr/bin/env node

/**
 * This script analyzes JavaScript bundle sizes and helps identify unused code.
 * It's meant to be run after building your application.
 * 
 * Usage:
 * 1. Run `npm run build` to build your application
 * 2. Run `node analyze-bundle.js` to analyze the bundle
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Configuration
const distFolder = path.join(__dirname, 'dist');
const assetsFolder = path.join(distFolder, 'assets');
const sizeThreshold = 100 * 1024; // 100 KB threshold for warnings

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

console.log(`${colors.bold}${colors.blue}✨ Bundle Size Analyzer${colors.reset}\n`);

// Check if the dist folder exists
if (!fs.existsSync(distFolder)) {
  console.error(`${colors.red}Error: dist folder not found. Run 'npm run build' first.${colors.reset}`);
  process.exit(1);
}

// Get all JS files in the assets folder
function getJsFiles(folder) {
  if (!fs.existsSync(folder)) {
    console.error(`${colors.red}Error: ${folder} does not exist${colors.reset}`);
    return [];
  }

  return fs.readdirSync(folder)
    .filter(file => file.endsWith('.js'))
    .map(file => path.join(folder, file));
}

// Provide library specific optimization recommendations
function getOptimizationRecommendations(fileContent) {
  const recommendations = [];
  
  // Check for large libraries by pattern matching
  if (fileContent.includes('echarts')) {
    recommendations.push({
      library: 'ECharts',
      message: 'Replace full ECharts import with individual components: import { BarChart, LineChart } from "echarts/charts"'
    });
  }
  
  if (fileContent.includes('moment')) {
    recommendations.push({
      library: 'Moment.js',
      message: 'Consider replacing Moment.js with a lighter alternative like date-fns or Luxon'
    });
  }
  
  if (fileContent.includes('lodash')) {
    if (!fileContent.includes('lodash/')) {
      recommendations.push({
        library: 'Lodash',
        message: 'Use specific imports from Lodash: import map from "lodash/map" instead of import { map } from "lodash"'
      });
    }
  }
  
  // Include recommendation for Finance-Tracker-Dashboard component
  if (fileContent.includes('Finance-Tracker-Dashboard')) {
    recommendations.push({
      library: 'Finance-Tracker-Dashboard',
      message: 'Use the optimized Finance-Tracker-Dashboard-Optimized component instead'
    });
  }
  
  return recommendations;
}
function getBundleSize(file) {
  const content = fs.readFileSync(file);
  const gzipped = zlib.gzipSync(content);
  
  return {
    name: path.basename(file),
    size: content.length,
    gzippedSize: gzipped.length,
    gzipRatio: Math.round((gzipped.length / content.length) * 100) / 100
  };
}

// Format size in human-readable format
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Analyze JS bundles
const jsFiles = getJsFiles(assetsFolder);
const bundleSizes = jsFiles.map(getBundleSize);

// Sort bundles by size (largest first)
bundleSizes.sort((a, b) => b.size - a.size);

// Display results
console.log(`${colors.bold}Found ${bundleSizes.length} JavaScript bundles:${colors.reset}\n`);

let totalSize = 0;
let totalGzippedSize = 0;

bundleSizes.forEach(bundle => {
  totalSize += bundle.size;
  totalGzippedSize += bundle.gzippedSize;
  
  // Choose color based on size
  const color = bundle.size > sizeThreshold ? colors.red : colors.green;
  
  console.log(
    `${color}${bundle.name}${colors.reset} - ` +
    `${formatSize(bundle.size)} (${formatSize(bundle.gzippedSize)} gzipped)`
  );
});

console.log(`\n${colors.bold}Total size: ${formatSize(totalSize)} (${formatSize(totalGzippedSize)} gzipped)${colors.reset}\n`);

// Recommendations
console.log(`${colors.bold}${colors.blue}Recommendations:${colors.reset}`);

// Check large bundles
const largeBundles = bundleSizes.filter(b => b.size > sizeThreshold);
if (largeBundles.length > 0) {
  console.log(`${colors.yellow}Found ${largeBundles.length} large bundle(s):${colors.reset}`);
  largeBundles.forEach(bundle => {
    console.log(`- ${bundle.name} (${formatSize(bundle.size)})`);
  });
  console.log(`\nConsider split these bundles into smaller chunks.`);
}

// General recommendations
console.log(`\n${colors.green}General tips to reduce bundle size:${colors.reset}`);
console.log(`1. Use dynamic imports (React.lazy) to split large components`);
console.log(`2. Consider replacing heavy libraries with lighter alternatives`);
console.log(`3. Enable tree-shaking by using ES modules syntax`);
console.log(`4. Use the ImportSource analyzer in Chrome DevTools to find unused code`);
console.log(`5. Check if you are importing entire libraries when you only need specific functions`);

console.log(`\n${colors.blue}Finished bundle analysis!${colors.reset}`);
