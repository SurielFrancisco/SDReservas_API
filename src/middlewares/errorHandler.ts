import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Revisa los datos ingresados",
        details: err.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message })),
      },
    });
  }
  if (err instanceof AppError) {
    return res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: { code: "BAD_JSON", message: "No se pudo procesar tu solicitud" } });
  }
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL", message: "Algo salió mal. Inténtalo de nuevo en unos minutos" } });
}
