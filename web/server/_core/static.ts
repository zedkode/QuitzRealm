import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/// Livrarea bundle-ului în producție. Stă separat de `vite.ts` intenționat:
/// `vite.ts` importă Vite, care e o dependință de development, iar un import
/// din el ar trage tot Vite în imaginea de producție.
export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // SPA: rutele client-side (/game, /profile, ...) nu au fișier pe disc, deci
  // orice cale nepotrivită primește index.html.
  app.use("/{*splat}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
