#!/usr/bin/env node

/**
 * Deployment Setup Helper for Vercel (Frontend) and Render (Backend)
 * This script helps verify that deployment is configured correctly
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

console.log("🚀 TrackZen Deployment Setup Checker (Vercel + Render)\n");

// Check if required files exist
const requiredFiles = [
  "vercel.json",
  "render.yaml",
  "package.json",
  ".env.example",
];

console.log("📋 Checking required files...");
let allFilesExist = true;

requiredFiles.forEach((file) => {
  if (existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing!`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log(
    "\n❌ Some required files are missing. Please ensure all configuration files are present.",
  );
  process.exit(1);
}

// Check package.json scripts
console.log("\n📋 Checking build scripts...");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const requiredScripts = [
  "build:client",
  "build:server",
  "build:vercel",
  "build:render",
  "typecheck",
  "test",
];

requiredScripts.forEach((script) => {
  if (packageJson.scripts[script]) {
    console.log(`✅ npm run ${script}`);
  } else {
    console.log(`❌ npm run ${script} - Missing!`);
  }
});

// Test build process
console.log("\n🔧 Testing build process...");
try {
  console.log("Running type check...");
  execSync("npm run typecheck", { stdio: "pipe" });
  console.log("✅ Type check passed");

  console.log("Running tests...");
  execSync("npm run test", { stdio: "pipe" });
  console.log("✅ Tests passed");

  console.log("Testing client build (Vercel)...");
  execSync("npm run build:vercel", { stdio: "pipe" });
  console.log("✅ Client build successful");

  // Check if dist/spa exists
  if (existsSync("dist/spa")) {
    console.log("✅ Client build output directory exists");
  } else {
    console.log("❌ Client build output directory missing");
  }

  console.log("Testing server build (Render)...");
  execSync("npm run build:render", { stdio: "pipe" });
  console.log("✅ Server build successful");

  // Check if dist/server exists
  if (existsSync("dist/server")) {
    console.log("✅ Server build output directory exists");
  } else {
    console.log("❌ Server build output directory missing");
  }
} catch (error) {
  console.log("❌ Build process failed:");
  console.log(error.stdout?.toString() || error.message);
  process.exit(1);
}

// Check configuration files
console.log("\n📋 Verifying configuration files...");

// Check vercel.json
try {
  const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8"));
  if (vercelConfig.buildCommand && vercelConfig.outputDirectory) {
    console.log("✅ Vercel configuration is valid");
  } else {
    console.log("❌ Vercel configuration is incomplete");
  }
} catch (error) {
  console.log("❌ Vercel configuration is invalid JSON");
}

// Check render.yaml
try {
  const renderConfig = readFileSync("render.yaml", "utf8");
  if (
    renderConfig.includes("buildCommand") &&
    renderConfig.includes("startCommand")
  ) {
    console.log("✅ Render configuration is valid");
  } else {
    console.log("❌ Render configuration is incomplete");
  }
} catch (error) {
  console.log("❌ Render configuration file is invalid");
}

console.log("\n🎉 Deployment setup verification complete!");
console.log("\n📚 Next steps:");
console.log("");
console.log("🎯 Frontend Deployment (Vercel):");
console.log("1. Connect to Vercel: https://vercel.com");
console.log("2. Import your GitHub repository");
console.log("3. Configure environment variables:");
console.log("   - VITE_API_BASE_URL=https://your-render-app.onrender.com");
console.log("4. Deploy automatically on push to main branch");
console.log("");
console.log("🎯 Backend Deployment (Render):");
console.log("1. Connect to Render: https://render.com");
console.log("2. Create a new Web Service from your GitHub repository");
console.log("3. Configure environment variables:");
console.log("   - NODE_ENV=production");
console.log("   - MONGODB_URI=your_mongodb_connection_string");
console.log("   - JWT_SECRET=your_secure_jwt_secret");
console.log("   - CORS_ORIGIN=https://your-vercel-app.vercel.app");
console.log("4. Deploy automatically on push to main branch");
console.log("");
console.log("📖 See DEPLOYMENT.md for detailed instructions");
console.log("");
console.log("⚠️  Important: Make sure to set up your MongoDB database first!");
