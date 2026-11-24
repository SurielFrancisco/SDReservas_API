import { Router } from "express";
import argon2 from "argon2";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { signToken } from "../../lib/jwt.js";
import { conflict, forbidden, unauthorized, unprocessable } from "../../lib/errors.js";
import { requireAuth } from "../../middlewares/auth.js";

export const authRouter = Router();

const registerSchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

const updateMeSchema = z
  .object({
    nombre: z.string().trim().min(2).max(100).optional(),
    email: z.string().trim().toLowerCase().email().max(254).optional(),
    password: z.string().min(8).max(128).optional(),
    // Obligatoria para cambiar el correo o la contraseña
    passwordActual: z.string().min(1).max(128).optional(),
  })
  .refine(
    (data) => data.nombre !== undefined || data.email !== undefined || data.password !== undefined,
    "Envía al menos un campo",
  );

const publico = (u: { id: string; email: string; nombre: string; rol: string }) => ({
  id: u.id,
  email: u.email,
  nombre: u.nombre,
  rol: u.rol,
});

// Para personal (recepcionista/mesero): restaurantes a los que está asignado
async function restaurantesAsignados(u: { id: string; rol: string }) {
  if (u.rol !== "RECEPCIONISTA" && u.rol !== "MESERO") return undefined;
  const filas = await prisma.restauranteEmpleado.findMany({
    where: { usuarioId: u.id, restaurante: { activo: true } },
    select: { restaurante: { select: { id: true, nombre: true } } },
    orderBy: { createdAt: "asc" },
  });
  return filas.map((f) => f.restaurante);
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const passwordHash = await argon2.hash(data.password, { type: argon2.argon2id });

    try {
      const user = await prisma.usuario.create({
        data: { nombre: data.nombre, email: data.email, passwordHash, rol: "CLIENTE" },
      });
      res.status(201).json({ token: signToken({ sub: user.id, rol: user.rol }), user: publico(user) });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw conflict("Ya existe una cuenta con ese correo");
      }
      throw e;
    }
  } catch (e) {
    next(e);
  }
});

authRouter.post("/register-admin", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const passwordHash = await argon2.hash(data.password, { type: argon2.argon2id });
    try {
      const user = await prisma.usuario.create({
        data: { nombre: data.nombre, email: data.email, passwordHash, rol: "ADMIN" },
      });
      res.status(201).json({ token: signToken({ sub: user.id, rol: user.rol }), user: publico(user) });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw conflict("Ya existe una cuenta con ese correo");
      }
      throw e;
    }
  } catch (e) {
    next(e);
  }
});

// Hash falso para que el tiempo de respuesta sea similar si el correo no existe
const DUMMY_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$Zm9vYmFyYmF6cXV4Zm9vYmFyYmF6cXV4Zm9vYmFyYmE";

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.usuario.findUnique({ where: { email } });

    let ok = false;
    try {
      ok = await argon2.verify(user?.passwordHash ?? DUMMY_HASH, password);
    } catch {
      ok = false;
    }

    if (!user || !ok || !user.activo) throw unauthorized("Correo o contraseña incorrectos");

    const restaurantes = await restaurantesAsignados(user);
    res.json({
      token: signToken({ sub: user.id, rol: user.rol }),
      user: publico(user),
      ...(restaurantes ? { restaurantes } : {}),
    });
  } catch (e) {
    next(e);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const restaurantes = await restaurantesAsignados(req.user!);
    res.json({ user: req.user, ...(restaurantes ? { restaurantes } : {}) });
  } catch (e) {
    next(e);
  }
});

authRouter.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const data = updateMeSchema.parse(req.body);
    // El personal no puede cambiar su correo ni su contraseña: los administra el administrador
    if (
      (req.user!.rol === "MESERO" || req.user!.rol === "RECEPCIONISTA") &&
      (data.nombre !== undefined || data.email !== undefined || data.password !== undefined)
    ) {
      throw forbidden("Tu nombre, correo y contraseña los administra el administrador del restaurante");
    }
    const actual = await prisma.usuario.findUniqueOrThrow({ where: { id: req.user!.id } });
    const cambiaCorreo = data.email !== undefined && data.email !== actual.email;

    // Cambiar correo o contraseña exige confirmar la contraseña actual.
    // Se responde 422 (no 401) para que el cliente no cierre la sesión por error.
    if (cambiaCorreo || data.password) {
      let ok = false;
      try {
        ok = !!data.passwordActual && (await argon2.verify(actual.passwordHash, data.passwordActual));
      } catch {
        ok = false;
      }
      if (!ok) throw unprocessable("La contraseña actual es incorrecta");
    }

    const passwordHash = data.password
      ? await argon2.hash(data.password, { type: argon2.argon2id })
      : undefined;
    try {
      const user = await prisma.usuario.update({
        where: { id: actual.id },
        data: {
          ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
          ...(cambiaCorreo ? { email: data.email } : {}),
          ...(passwordHash ? { passwordHash } : {}),
        },
      });
      res.json({ user: publico(user) });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw conflict("Ya existe una cuenta con ese correo");
      }
      throw e;
    }
  } catch (e) {
    next(e);
  }
});
