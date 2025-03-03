import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Add logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

// Setup express with error handling
(async () => {
  try {
    log("Starting server initialization...");

    // Register all routes and get HTTP server
    const server = await registerRoutes(app);
    log("Routes registered successfully");

    // Error handling middleware should be after routes
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      // Don't send response for aborted requests
      if (err.code === 'ECONNABORTED' || err.type === 'request.aborted') {
        console.log('Request aborted by client');
        return;
      }

      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Only attempt to send a response if the response hasn't been sent yet
      if (!res.headersSent) {
        res.status(status).json({ message });
      }
    });

    // Setup Vite in development
    if (app.get("env") === "development") {
      await setupVite(app, server);
      log("Vite middleware setup complete");
    } else {
      serveStatic(app);
      log("Static serving setup complete");
    }

    // Listen on all network interfaces with hardcoded port 5000
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      log(`Server running at http://0.0.0.0:${port}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();