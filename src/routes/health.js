import { Router } from "express";

export function createHealthRouter() {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({
      ok: true,
      service: "xsaas-api",
      at: new Date().toISOString()
    });
  });

  return router;
}
