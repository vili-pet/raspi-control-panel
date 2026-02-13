import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { ENV } from "./env";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Panel password auth (standalone mode)
  const isStandalone = ENV.oAuthServerUrl === 'disabled';
  const secret = new TextEncoder().encode(ENV.cookieSecret || 'raspi-secret');

  app.post('/api/panel-auth/login', async (req, res) => {
    const { password } = req.body;
    if (password === ENV.panelPassword) {
      const token = await new SignJWT({ authenticated: true })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(secret);
      res.setHeader('Set-Cookie', `panel_token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`);
      return res.json({ success: true });
    }
    return res.status(401).json({ success: false, message: 'Wrong password' });
  });

  app.get('/api/panel-auth/check', async (req, res) => {
    if (!isStandalone) return res.json({ authenticated: true });
    const cookies = parseCookieHeader(req.headers.cookie || '');
    const token = cookies.panel_token;
    if (!token) return res.json({ authenticated: false });
    try {
      await jwtVerify(token, secret);
      return res.json({ authenticated: true });
    } catch {
      return res.json({ authenticated: false });
    }
  });

  app.post('/api/panel-auth/logout', (_req, res) => {
    res.setHeader('Set-Cookie', 'panel_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
    return res.json({ success: true });
  });

  // Protect tRPC routes in standalone mode
  if (isStandalone) {
    app.use('/api/trpc', async (req, res, next) => {
      const cookies = parseCookieHeader(req.headers.cookie || '');
      const token = cookies.panel_token;
      if (!token) return res.status(401).json({ error: 'Not authenticated' });
      try {
        await jwtVerify(token, secret);
        next();
      } catch {
        return res.status(401).json({ error: 'Not authenticated' });
      }
    });
  }

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
