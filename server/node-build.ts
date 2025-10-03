import path from "path";
import fs from "fs";
import { createServer } from "./index";
import express from "express";

const app = createServer();
const port = process.env.PORT || 3000;

// In production, serve the built SPA files
const __dirname = import.meta.dirname;

// Allow overriding static directory via env variable for manual deployments
const staticDirEnv = process.env.STATIC_DIR ? path.resolve(process.env.STATIC_DIR) : null;

let distPath = path.join(__dirname, "../spa");

// Prefer STATIC_DIR if provided and exists
if (staticDirEnv && fs.existsSync(staticDirEnv)) {
  distPath = staticDirEnv;
} else {
  // Fallback to client/dist if spa not found (monorepo-style builds)
  if (!fs.existsSync(distPath)) {
    const candidate = path.resolve(__dirname, "../../client/dist");
    if (fs.existsSync(candidate)) distPath = candidate;
  }
}

// Serve static files if folder exists
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Handle React Router - serve index.html for all non-API routes
  app.get("*", (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }

    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
  if (fs.existsSync(distPath)) {
    console.log(`📱 Frontend: http://localhost:${port}`);
  } else {
    console.log("ℹ️ No static frontend served (set STATIC_DIR or place SPA in server/spa or client/dist)");
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
