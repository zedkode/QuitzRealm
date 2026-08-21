import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/// Livrarea bundle-urilor în producție.
///
/// Stă separat de `vite.ts` intenționat: acela importă Vite, care e o dependință
/// de development, iar un import din el ar trage tot Vite în imaginea de
/// producție.
///
/// Se servesc **două** aplicații de pe același proces: site-ul public la `/` și
/// panoul de administrare la `/admin`. Sunt pachete separate, cu bundle-uri
/// separate — un vizitator al paginii de start nu descarcă niciun kilooctet din
/// panou. Ordinea contează: `/admin` se înregistrează primul, altfel SPA-ul
/// public ar înghiți ruta.
export function serveStatic(app: Express) {
  const publicPath = path.resolve(import.meta.dirname, "public");
  const adminPath = path.resolve(import.meta.dirname, "admin");

  for (const [label, dir] of [["public", publicPath], ["admin", adminPath]] as const) {
    if (!fs.existsSync(dir)) {
      console.error(`Bundle-ul «${label}» lipsește din ${dir}. Rulează build-ul înainte de pornire.`);
    }
  }

  // --- panoul de administrare, sub /admin ---
  app.use("/admin", express.static(adminPath));
  app.use("/admin/{*splat}", (_req, res) => {
    res.sendFile(path.resolve(adminPath, "index.html"));
  });

  // --- site-ul public, la rădăcină ---
  app.use(express.static(publicPath));
  app.use("/{*splat}", (_req, res) => {
    res.sendFile(path.resolve(publicPath, "index.html"));
  });
}
