import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Restaurantes de prueba. Es idempotente: omite los que ya existen (por admin y nombre).
// Uso: npm run seed:demo [-- correo-del-admin]
const prisma = new PrismaClient();

type MesaDef = [etiqueta: string, capacidad: number, forma: string, x: number, y: number];
type AreaDef = { nombre: string; x: number; y: number; ancho: number; alto: number; mesas: MesaDef[] };
type RestDef = {
  nombre: string;
  tipoCocina: string;
  ubicacion: string;
  apertura: number; // minutos desde medianoche
  cierre: number;
  piso: string;
  areas: AreaDef[];
  modalidades: Record<string, number | null>; // código -> importe (null = gratuita)
};

const restaurantes: RestDef[] = [
  {
    nombre: "La Trattoria del Sol",
    tipoCocina: "Italiana",
    ubicacion: "Calle Madero 45, Centro, CDMX",
    apertura: 780,
    cierre: 1380,
    piso: "Planta Baja",
    areas: [
      { nombre: "Salón", x: 4, y: 6, ancho: 56, alto: 88, mesas: [
        ["S-1", 2, "cuadrada", 16, 20], ["S-2", 2, "cuadrada", 16, 45], ["S-3", 4, "redonda", 38, 25],
        ["S-4", 4, "cuadrada", 38, 55], ["S-5", 6, "rectangular", 30, 80],
      ] },
      { nombre: "Patio", x: 64, y: 6, ancho: 32, alto: 88, mesas: [
        ["P-1", 4, "redonda", 80, 25], ["P-2", 4, "redonda", 80, 55], ["P-3", 8, "grupal", 80, 82],
      ] },
    ],
    modalidades: { AUTO_FREE: null, TABLE_FREE: null, TABLE_FIXED: 150 },
  },
  {
    nombre: "Sushi Kaze",
    tipoCocina: "Japonesa",
    ubicacion: "Av. Álvaro Obregón 120, Roma Norte, CDMX",
    apertura: 840,
    cierre: 1410,
    piso: "Salón",
    areas: [
      { nombre: "Barra", x: 4, y: 6, ancho: 92, alto: 28, mesas: [
        ["B-1", 2, "cuadrada", 14, 20], ["B-2", 2, "cuadrada", 30, 20], ["B-3", 2, "cuadrada", 46, 20],
        ["B-4", 2, "cuadrada", 62, 20], ["B-5", 2, "cuadrada", 78, 20],
      ] },
      { nombre: "Comedor", x: 4, y: 40, ancho: 92, alto: 54, mesas: [
        ["C-1", 4, "cuadrada", 18, 55], ["C-2", 4, "cuadrada", 40, 55], ["C-3", 6, "rectangular", 66, 55],
        ["C-4", 4, "cuadrada", 18, 82], ["C-5", 8, "grupal", 60, 82],
      ] },
    ],
    modalidades: { AUTO_FREE: null, ZONE_FREE: null, AUTO_FIXED: 100, PER_PERSON: 50 },
  },
  {
    nombre: "Mar y Brasas",
    tipoCocina: "Mariscos y parrilla",
    ubicacion: "Blvd. Kukulcán Km 9, Cancún, Q. Roo",
    apertura: 720,
    cierre: 1320,
    piso: "Terraza Frente al Mar",
    areas: [
      { nombre: "Terraza", x: 4, y: 6, ancho: 60, alto: 88, mesas: [
        ["T-1", 2, "redonda", 16, 20], ["T-2", 2, "redonda", 16, 50], ["T-3", 4, "redonda", 40, 25],
        ["T-4", 4, "redonda", 40, 55], ["T-5", 6, "rectangular", 30, 82],
      ] },
      { nombre: "Palapa VIP", x: 68, y: 6, ancho: 28, alto: 88, mesas: [
        ["V-1", 6, "rectangular", 82, 30], ["V-2", 8, "grupal", 82, 70],
      ] },
    ],
    modalidades: { AUTO_FREE: null, TABLE_FREE: null, TABLE_FIXED: 300, TABLE_PER_PERSON: 120 },
  },
  {
    nombre: "Café Origen",
    tipoCocina: "Cafetería y desayunos",
    ubicacion: "Calle Francisco I. Madero 310, Guadalajara, Jal.",
    apertura: 420,
    cierre: 1200,
    piso: "Planta Baja",
    areas: [
      { nombre: "Interior", x: 4, y: 6, ancho: 62, alto: 88, mesas: [
        ["I-1", 2, "cuadrada", 16, 20], ["I-2", 2, "cuadrada", 16, 45], ["I-3", 2, "cuadrada", 16, 70],
        ["I-4", 4, "cuadrada", 42, 30], ["I-5", 4, "cuadrada", 42, 65],
      ] },
      { nombre: "Jardín", x: 70, y: 6, ancho: 26, alto: 88, mesas: [
        ["J-1", 4, "redonda", 83, 30], ["J-2", 6, "rectangular", 83, 70],
      ] },
    ],
    modalidades: { AUTO_FREE: null, ZONE_FREE: null, TABLE_FREE: null },
  },
  {
    nombre: "Taquería El Faro",
    tipoCocina: "Mexicana",
    ubicacion: "Calle Hidalgo 18, Coyoacán, CDMX",
    apertura: 600,
    cierre: 1410,
    piso: "Planta Baja",
    areas: [
      { nombre: "Salón", x: 4, y: 6, ancho: 60, alto: 88, mesas: [
        ["S-1", 2, "cuadrada", 16, 20], ["S-2", 4, "cuadrada", 16, 50], ["S-3", 4, "cuadrada", 40, 25],
        ["S-4", 6, "rectangular", 40, 60], ["S-5", 8, "grupal", 30, 85],
      ] },
      { nombre: "Banqueta", x: 68, y: 6, ancho: 28, alto: 88, mesas: [
        ["B-1", 2, "redonda", 82, 25], ["B-2", 4, "redonda", 82, 60],
      ] },
    ],
    modalidades: { AUTO_FREE: null, TABLE_FREE: null, PER_PERSON: 40 },
  },
  {
    nombre: "Oaxaca en Brasas",
    tipoCocina: "Mexicana",
    ubicacion: "Av. Juárez 300, Centro, Oaxaca, Oax.",
    apertura: 780,
    cierre: 1380,
    piso: "Casona",
    areas: [
      { nombre: "Patio Central", x: 4, y: 6, ancho: 56, alto: 88, mesas: [
        ["P-1", 4, "redonda", 18, 25], ["P-2", 4, "redonda", 40, 25], ["P-3", 6, "rectangular", 28, 60], ["P-4", 8, "grupal", 30, 85],
      ] },
      { nombre: "Salón Colonial", x: 64, y: 6, ancho: 32, alto: 88, mesas: [
        ["C-1", 2, "cuadrada", 80, 25], ["C-2", 4, "cuadrada", 80, 55], ["C-3", 4, "cuadrada", 80, 82],
      ] },
    ],
    modalidades: { AUTO_FREE: null, ZONE_FREE: null, TABLE_FIXED: 200 },
  },
  {
    nombre: "Pasta & Vino",
    tipoCocina: "Italiana",
    ubicacion: "Calle Amberes 14, Juárez, CDMX",
    apertura: 840,
    cierre: 1410,
    piso: "Salón",
    areas: [
      { nombre: "Cava", x: 4, y: 6, ancho: 44, alto: 88, mesas: [
        ["V-1", 2, "cuadrada", 16, 22], ["V-2", 2, "cuadrada", 16, 50], ["V-3", 4, "redonda", 32, 78],
      ] },
      { nombre: "Terraza", x: 52, y: 6, ancho: 44, alto: 88, mesas: [
        ["T-1", 4, "redonda", 66, 25], ["T-2", 4, "redonda", 66, 55], ["T-3", 6, "rectangular", 80, 82],
      ] },
    ],
    modalidades: { AUTO_FREE: null, TABLE_FREE: null, AUTO_FIXED: 120, TABLE_PER_PERSON: 80 },
  },
  {
    nombre: "Ramen Ichiban",
    tipoCocina: "Japonesa",
    ubicacion: "Av. Chapultepec 480, Americana, Guadalajara, Jal.",
    apertura: 780,
    cierre: 1320,
    piso: "Local",
    areas: [
      { nombre: "Barra", x: 4, y: 6, ancho: 92, alto: 30, mesas: [
        ["B-1", 2, "cuadrada", 14, 22], ["B-2", 2, "cuadrada", 32, 22], ["B-3", 2, "cuadrada", 50, 22], ["B-4", 2, "cuadrada", 68, 22],
      ] },
      { nombre: "Mesas", x: 4, y: 42, ancho: 92, alto: 52, mesas: [
        ["M-1", 4, "cuadrada", 20, 62], ["M-2", 4, "cuadrada", 45, 62], ["M-3", 6, "rectangular", 72, 62], ["M-4", 4, "cuadrada", 32, 86],
      ] },
    ],
    modalidades: { AUTO_FREE: null, ZONE_FREE: null, TABLE_FREE: null },
  },
  {
    nombre: "Puerto Azul",
    tipoCocina: "Mariscos y parrilla",
    ubicacion: "Malecón 215, Puerto Vallarta, Jal.",
    apertura: 720,
    cierre: 1380,
    piso: "Muelle",
    areas: [
      { nombre: "Deck", x: 4, y: 6, ancho: 62, alto: 88, mesas: [
        ["D-1", 2, "redonda", 16, 22], ["D-2", 4, "redonda", 38, 25], ["D-3", 4, "redonda", 16, 58], ["D-4", 6, "rectangular", 40, 62], ["D-5", 8, "grupal", 30, 86],
      ] },
      { nombre: "Interior", x: 70, y: 6, ancho: 26, alto: 88, mesas: [
        ["I-1", 4, "cuadrada", 83, 30], ["I-2", 4, "cuadrada", 83, 65],
      ] },
    ],
    modalidades: { AUTO_FREE: null, TABLE_FREE: null, AUTO_FIXED: 150, TABLE_FIXED: 250 },
  },
  {
    nombre: "Hojas Verdes",
    tipoCocina: "Vegetariana",
    ubicacion: "Calle Durango 90, Roma Norte, CDMX",
    apertura: 480,
    cierre: 1260,
    piso: "Planta Baja",
    areas: [
      { nombre: "Invernadero", x: 4, y: 6, ancho: 56, alto: 88, mesas: [
        ["G-1", 2, "redonda", 16, 22], ["G-2", 2, "redonda", 16, 52], ["G-3", 4, "redonda", 40, 30], ["G-4", 6, "rectangular", 34, 74],
      ] },
      { nombre: "Barra de Jugos", x: 64, y: 6, ancho: 32, alto: 88, mesas: [
        ["J-1", 2, "cuadrada", 80, 25], ["J-2", 2, "cuadrada", 80, 50], ["J-3", 4, "cuadrada", 80, 78],
      ] },
    ],
    modalidades: { AUTO_FREE: null, ZONE_FREE: null, TABLE_FREE: null, PER_PERSON: 35 },
  },
  {
    nombre: "Brasa Argentina",
    tipoCocina: "Carnes y parrilla",
    ubicacion: "Av. Presidente Masaryk 250, Polanco, CDMX",
    apertura: 840,
    cierre: 1410,
    piso: "Salón Principal",
    areas: [
      { nombre: "Salón", x: 4, y: 6, ancho: 60, alto: 88, mesas: [
        ["S-1", 2, "cuadrada", 16, 22], ["S-2", 4, "cuadrada", 16, 52], ["S-3", 4, "cuadrada", 40, 28], ["S-4", 6, "rectangular", 40, 62], ["S-5", 8, "grupal", 32, 86],
      ] },
      { nombre: "Reservado", x: 68, y: 6, ancho: 28, alto: 88, mesas: [
        ["R-1", 8, "grupal", 82, 35], ["R-2", 10, "grupal", 82, 75],
      ] },
    ],
    modalidades: { AUTO_FREE: null, TABLE_FIXED: 400, TABLE_PER_PERSON: 150 },
  },
  {
    nombre: "Dulce Amanecer",
    tipoCocina: "Cafetería y desayunos",
    ubicacion: "Calle 60 #480, Centro, Mérida, Yuc.",
    apertura: 420,
    cierre: 1260,
    piso: "Casona",
    areas: [
      { nombre: "Patio", x: 4, y: 6, ancho: 56, alto: 88, mesas: [
        ["P-1", 2, "redonda", 16, 22], ["P-2", 2, "redonda", 16, 52], ["P-3", 4, "redonda", 40, 30], ["P-4", 4, "redonda", 40, 62],
      ] },
      { nombre: "Salón", x: 64, y: 6, ancho: 32, alto: 88, mesas: [
        ["S-1", 4, "cuadrada", 80, 30], ["S-2", 6, "rectangular", 80, 70],
      ] },
    ],
    modalidades: { AUTO_FREE: null, ZONE_FREE: null, TABLE_FREE: null },
  },
];

async function main() {
  const correo = process.argv[2];
  const admin = correo
    ? await prisma.usuario.findFirst({ where: { email: correo, rol: "ADMIN" } })
    : await prisma.usuario.findFirst({ where: { rol: "ADMIN" }, orderBy: { createdAt: "asc" } });
  if (!admin) throw new Error("No se encontró un usuario ADMIN. Crea uno antes con el seed de admin.");

  const catalogo = await prisma.modalidadReserva.findMany();
  const porCodigo = new Map(catalogo.map((m) => [m.codigo, m.id]));
  if (!porCodigo.has("TABLE_PER_PERSON")) throw new Error("Falta el catálogo de modalidades: ejecuta `npm run seed` primero.");

  for (const def of restaurantes) {
    const existe = await prisma.restaurante.findFirst({ where: { adminId: admin.id, nombre: def.nombre } });
    if (existe) {
      console.log(`Omitido (ya existe): ${def.nombre}`);
      continue;
    }
    const totalMesas = def.areas.reduce((n, a) => n + a.mesas.length, 0);
    const rest = await prisma.restaurante.create({
      data: {
        adminId: admin.id,
        nombre: def.nombre,
        tipoCocina: def.tipoCocina,
        ubicacion: def.ubicacion,
        rfc: "XAXX010101000",
        limiteMesas: Math.max(15, totalMesas),
        zonaHoraria: "America/Mexico_City",
        activo: true,
      },
    });

    await prisma.horarioRestaurante.createMany({
      data: Array.from({ length: 7 }, (_, dia) => ({
        restauranteId: rest.id,
        diaSemana: dia,
        aperturaMin: def.apertura,
        cierreMin: def.cierre,
      })),
    });

    const piso = await prisma.piso.create({ data: { restauranteId: rest.id, nombre: def.piso, orden: 0 } });
    for (const a of def.areas) {
      const area = await prisma.area.create({
        data: { pisoId: piso.id, nombre: a.nombre, posX: a.x, posY: a.y, ancho: a.ancho, alto: a.alto },
      });
      await prisma.mesa.createMany({
        data: a.mesas.map(([etiqueta, capacidad, forma, posX, posY]) => ({
          restauranteId: rest.id,
          areaId: area.id,
          etiqueta,
          capacidad,
          forma,
          posX,
          posY,
          estado: "AVAILABLE" as const,
        })),
      });
    }

    for (const [codigo, importe] of Object.entries(def.modalidades)) {
      await prisma.restauranteModalidad.create({
        data: { restauranteId: rest.id, modalidadId: porCodigo.get(codigo)!, activa: true, importe },
      });
    }
    console.log(`Creado: ${def.nombre} (${totalMesas} mesas, ${Object.keys(def.modalidades).length} modalidades)`);
  }
  console.log(`Administrador: ${admin.email}`);
}

main().finally(() => prisma.$disconnect());
