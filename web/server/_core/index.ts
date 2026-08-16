import express from "express";
import { createServer } from "http";
import { serveStatic } from "./static";

/// Serverul panoului web nu are API propriu: browserul vorbește direct cu
/// backendul NestJS (`client/src/lib/quizrealm.ts`). Aici rămâne doar livrarea
/// bundle-ului — Vite în development, fișiere statice în producție.
async function startServer() {
  const app = express();
  const server = createServer(app);

  if (process.env.NODE_ENV === "development") {
    // Import dinamic, ca bundle-ul de producție (construit cu NODE_ENV fixat
    // pe "production") să elimine ramura asta cu tot cu Vite.
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Portul e fix, nu căutat: în container maparea din compose așteaptă exact
  // portul ăsta, iar o mutare tăcută pe altul ar însemna un serviciu pornit
  // dar inaccesibil.
  const port = Number.parseInt(process.env.PORT ?? "3000", 10);
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch((error) => {
  console.error("[Server] Failed to start:", error);
  process.exit(1);
});
