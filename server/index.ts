import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { login, register, getProfile } from "./routes/auth";
import { getEmployeeDashboard, getManagerDashboard, getHRDashboard, getAdminDashboard } from "./routes/dashboard";
import { authenticateToken, requireRole } from "./middleware/auth";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/login", login);
  app.post("/api/auth/register", register);
  app.get("/api/auth/profile", authenticateToken, getProfile);

  // Dashboard routes (protected)
  app.get("/api/dashboard/employee", authenticateToken, requireRole(['employee']), getEmployeeDashboard);
  app.get("/api/dashboard/manager", authenticateToken, requireRole(['manager']), getManagerDashboard);
  app.get("/api/dashboard/hr", authenticateToken, requireRole(['hr']), getHRDashboard);
  app.get("/api/dashboard/admin", authenticateToken, requireRole(['admin']), getAdminDashboard);

  return app;
}
