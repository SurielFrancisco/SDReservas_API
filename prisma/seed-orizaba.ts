import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { esImagenValida, subirImagenRestaurante } from "../src/lib/cloudinary.js";

// Restaurantes ficticios de Orizaba, Veracruz (nombres y direcciones inventados, solo para pruebas).
// Idempotente: omite los que ya existen (por admin y nombre). Si hay CLOUDINARY_URL, sube una foto de ejemplo.
// Uso: tsx prisma/seed-orizaba.ts [correo-del-admin]
const prisma = new PrismaClient();

type MesaDef = [etiqueta: string, capacidad: number, forma: string, x: number, y: number];
type AreaDef = { nombre: string; x: number; y: number; ancho: number; alto: number; mesas: MesaDef[] };

// Plantillas de plano (misma distribución que seed-demo). `p` es el prefijo de las etiquetas de mesa.
type Plantilla = "salonPatio" | "barraComedor" | "terrazaVip" | "interiorJardin";
function plano(tpl: Plantilla, a: [nombre: string, p: string], b: [nombre: string, p: string]): AreaDef[] {
  const m = (p: string, filas: Array<[number, string, number, number]>): MesaDef[] =>
    filas.map(([cap, forma, x, y], i) => [`${p}-${i + 1}`, cap, forma, x, y]);
  switch (tpl) {
    case "salonPatio":
      return [
        { nombre: a[0], x: 4, y: 6, ancho: 56, alto: 88, mesas: m(a[1], [[2, "cuadrada", 16, 20], [2, "cuadrada", 16, 45], [4, "redonda", 38, 25], [4, "cuadrada", 38, 55], [6, "rectangular", 30, 80]]) },
        { nombre: b[0], x: 64, y: 6, ancho: 32, alto: 88, mesas: m(b[1], [[4, "redonda", 80, 25], [4, "redonda", 80, 55], [8, "grupal", 80, 82]]) },
      ];
    case "barraComedor":
      return [
        { nombre: a[0], x: 4, y: 6, ancho: 92, alto: 28, mesas: m(a[1], [[2, "cuadrada", 14, 20], [2, "cuadrada", 30, 20], [2, "cuadrada", 46, 20], [2, "cuadrada", 62, 20], [2, "cuadrada", 78, 20]]) },
        { nombre: b[0], x: 4, y: 40, ancho: 92, alto: 54, mesas: m(b[1], [[4, "cuadrada", 18, 55], [4, "cuadrada", 40, 55], [6, "rectangular", 66, 55], [4, "cuadrada", 18, 82], [8, "grupal", 60, 82]]) },
      ];
    case "terrazaVip":
      return [
        { nombre: a[0], x: 4, y: 6, ancho: 60, alto: 88, mesas: m(a[1], [[2, "redonda", 16, 20], [2, "redonda", 16, 50], [4, "redonda", 40, 25], [4, "redonda", 40, 55], [6, "rectangular", 30, 82]]) },
        { nombre: b[0], x: 68, y: 6, ancho: 28, alto: 88, mesas: m(b[1], [[6, "rectangular", 82, 30], [8, "grupal", 82, 70]]) },
      ];
    case "interiorJardin":
      return [
        { nombre: a[0], x: 4, y: 6, ancho: 62, alto: 88, mesas: m(a[1], [[2, "cuadrada", 16, 20], [2, "cuadrada", 16, 45], [2, "cuadrada", 16, 70], [4, "cuadrada", 42, 30], [4, "cuadrada", 42, 65]]) },
        { nombre: b[0], x: 70, y: 6, ancho: 26, alto: 88, mesas: m(b[1], [[4, "redonda", 83, 30], [6, "rectangular", 83, 70]]) },
      ];
  }
}

type RestDef = {
  nombre: string;
  tipoCocina: string;
  direccion: string; // se completa con ", Orizaba, Ver."
  horario: [apertura: string, cierre: string]; // HH:MM
  piso: string;
  areas: AreaDef[];
  modalidades: Record<string, number | null>; // código -> importe (null = gratuita)
  foto: string; // id de foto de Unsplash
};

const min = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const restaurantes: RestDef[] = [
  {
    nombre: "Huachinango del Borrego",
    tipoCocina: "Veracruzana",
    direccion: "Oriente 6 #142, Centro",
    horario: ["12:00", "22:00"],
    piso: "Planta Baja",
    areas: plano("salonPatio", ["Salón", "S"], ["Patio", "P"]),
    modalidades: { AUTO_FREE: null, TABLE_FREE: null, TABLE_FIXED: 120 },
    foto: "1559847844-5315695dadae",
  },
  {
    nombre: "La Casona del Río",
    tipoCocina: "Veracruzana",
    direccion: "Madero Sur #58, Centro",
    horario: ["13:00", "23:00"],
    piso: "Casona",
    areas: plano("terrazaVip", ["Corredor", "C"], ["Salón Colonial", "V"]),
    modalidades: { AUTO_FREE: null, ZONE_FREE: null, TABLE_FIXED: 200 },
    foto: "1517248135467-4c7edcad34c4",
  },
  {
    nombre: "El Fogón Jarocho",
    tipoCocina: "Mariscos y parrilla",
    direccion: "Poniente 7 #315, Centro",
    horario: ["12:00", "21:30"],
    piso: "Salón",
    areas: plano("salonPatio", ["Comedor", "C"], ["Terraza", "T"]),
    modalidades: { AUTO_FREE: null, TABLE_FREE: null, AUTO_FIXED: 100 },
    foto: "1534080564583-6be75777b70a",
  },
  {
    nombre: "Café de la Sierra",
    tipoCocina: "Cafetería y desayunos",
    direccion: "Colón Oriente #90, Centro",
    horario: ["07:30", "21:00"],
    piso: "Planta Baja",
    areas: plano("interiorJardin", ["Interior", "I"], ["Terraza", "T"]),
    modalidades: { AUTO_FREE: null, ZONE_FREE: null, TABLE_FREE: null },
    foto: "1559925393-8be0ec4767c8",
  },
  {
    nombre: "Pan de Pueblo Mágico",
    tipoCocina: "Cafetería y desayunos",
    direccion: "Sur 5 #221, Centro",
    horario: ["07:00", "20:00"],
    piso: "Local",
    areas: plano("interiorJardin", ["Panadería", "P"], ["Patio", "J"]),
    modalidades: { AUTO_FREE: null, TABLE_FREE: null },
    foto: "1509440159596-0249088772ff",
  },
  {
    nombre: "Dulce Tentación",
    tipoCocina: "Cafetería y desayunos",
    direccion: "Poniente 3 #77, Centro",
    horario: ["08:00", "21:30"],
    piso: "Planta Baja",
    areas: plano("interiorJardin", ["Salón", "S"], ["Terraza", "T"]),
    modalidades: { AUTO_FREE: null, ZONE_FREE: null, PER_PERSON: 30 },
    foto: "1504754524776-8f4f37790ca0",
  },
  {
    nombre: "Desayunos La Alameda",
    tipoCocina: "Cafetería y desayunos",
    direccion: "Av. Oriente 2 #410, Centro",
    horario: ["07:00", "17:00"],
    piso: "Planta Baja",
    areas: plano("salonPatio", ["Salón", "S"], ["Jardín", "J"]),
    modalidades: { AUTO_FREE: null, ZONE_FREE: null, TABLE_FREE: null },
    foto: "1493770348161-369560ae357d",
  },
  {
    nombre: "Antojitos Doña Chavela",
    tipoCocina: "Antojitos",
    direccion: "Norte 4 #36, Centro",
    horario: ["09:00", "22:00"],
    piso: "Planta Baja",
    areas: plano("salonPatio", ["Fonda", "F"], ["Banqueta", "B"]),
    modalidades: { AUTO_FREE: null, TABLE_FREE: null },
    foto: "1618040996337-56904b7850b9",
  },
  {
    nombre: "Picadas y Tamales Citlaltépetl",
    tipoCocina: "Antojitos",
    direccion: "Oriente 10 #188, Centro",
    horario: ["08:00", "21:00"],
    piso: "Local",
    areas: plano("interiorJardin", ["Cocina Abierta", "C"], ["Patio", "P"]),
    modalidades: { AUTO_FREE: null, ZONE_FREE: null, PER_PERSON: 25 },
    foto: "1565299585323-38d6b0865b47",
  },
  {
    nombre: "Mole y Tradición",
    tipoCocina: "Mexicana",
    direccion: "Poniente 5 #264, Centro",
    horario: ["13:00", "22:30"],
    piso: "Casona",
    areas: plano("salonPatio", ["Salón", "S"], ["Patio", "P"]),
    modalidades: { AUTO_FREE: null, TABLE_FREE: null, TABLE_FIXED: 150, TABLE_PER_PERSON: 60 },
    foto: "1504674900247-0877df9cc836",
  },
  {
    nombre: "El Mirador del Cerro",
    tipoCocina: "Mexicana",
    direccion: "Camino al Cerro del Borrego s/n, Col. Los Pinos",
    horario: ["12:00", "20:00"],
    piso: "Mirador",
    areas: plano("terrazaVip", ["Terraza", "T"], ["Palapa", "P"]),
    modalidades: { AUTO_FREE: null, TABLE_FREE: null, TABLE_FIXED: 180 },
    foto: "1544148103-0773bf10d330",
  },
  {
    nombre: "Parrilla Pico de Orizaba",
    tipoCocina: "Carnes y parrilla",
    direccion: "Av. Oriente 6 #502, Centro",
    horario: ["14:00", "23:30"],
    piso: "Salón Principal",
    areas: plano("terrazaVip", ["Salón", "S"], ["Reservado", "R"]),
    modalidades: { AUTO_FREE: null, TABLE_FIXED: 300, TABLE_PER_PERSON: 120 },
    foto: "1600891964092-4316c288032e",
  },
  {
    nombre: "Brasas del Teleférico",
    tipoCocina: "Carnes y parrilla",
    direccion: "Sur 11 #95, Centro",
    horario: ["13:30", "23:00"],
    piso: "Planta Baja",
    areas: plano("salonPatio", ["Salón", "S"], ["Terraza", "T"]),
    modalidades: { AUTO_FREE: null, TABLE_FREE: null, AUTO_FIXED: 100, PER_PERSON: 45 },
    foto: "1555939594-58d7cb561ad1",
  },
  {
    nombre: "Pizzería Cumbres",
    tipoCocina: "Pizzería",
    direccion: "Poniente 1 #130, Centro",
    horario: ["14:00", "23:00"],
    piso: "Local",
    areas: plano("barraComedor", ["Barra", "B"], ["Comedor", "C"]),
    modalidades: { AUTO_FREE: null, ZONE_FREE: null, TABLE_FREE: null },
    foto: "1513104890138-7c749659a591",
  },
  {
    nombre: "Trattoria Monte Bello",
    tipoCocina: "Italiana",
    direccion: "Oriente 4 #205, Centro",
    horario: ["13:00", "22:30"],
    piso: "Salón",
    areas: plano("salonPatio", ["Salón", "S"], ["Terraza", "T"]),
    modalidades: { AUTO_FREE: null, TABLE_FREE: null, AUTO_FIXED: 120 },
    foto: "1476224203421-9ac39bcb3327",
  },
  {
    nombre: "Raíces Vegetarianas",
    tipoCocina: "Vegetariana",
    direccion: "Sur 3 #48, Centro",
    horario: ["08:30", "20:30"],
    piso: "Planta Baja",
    areas: plano("interiorJardin", ["Invernadero", "G"], ["Jardín", "J"]),
    modalidades: { AUTO_FREE: null, ZONE_FREE: null, TABLE_FREE: null },
    foto: "1490645935967-10de6ba17061",
  },
  {
    nombre: "Sakura Orizaba",
    tipoCocina: "Japonesa",
    direccion: "Av. Madero Norte #340, Centro",
    horario: ["13:30", "22:30"],
    piso: "Salón",
    areas: plano("barraComedor", ["Barra", "B"], ["Comedor", "C"]),
    modalidades: { AUTO_FREE: null, ZONE_FREE: null, AUTO_FIXED: 100, PER_PERSON: 50 },
    foto: "1519708227418-c8fd9a32b7a2",
  },
];

async function descargarFoto(id: string): Promise<Buffer | null> {
  try {
    const res = await fetch(`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`);
    const buf = Buffer.from(await res.arrayBuffer());
    return res.ok && esImagenValida(buf) ? buf : null;
  } catch {
    return null;
  }
}

async function main() {
  const correo = process.argv[2];
  const admin = correo
    ? await prisma.usuario.findFirst({ where: { email: correo, rol: "ADMIN" } })
    : await prisma.usuario.findFirst({ where: { rol: "ADMIN" }, orderBy: { createdAt: "asc" } });
  if (!admin) throw new Error("No se encontró un usuario ADMIN. Crea uno antes con el seed de admin.");

  const catalogo = await prisma.modalidadReserva.findMany();
  const porCodigo = new Map(catalogo.map((m) => [m.codigo, m.id]));
  if (!porCodigo.has("TABLE_PER_PERSON")) throw new Error("Falta el catálogo de modalidades: ejecuta `npm run seed` primero.");
  const conImagenes = Boolean(process.env.CLOUDINARY_URL);

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
        ubicacion: `${def.direccion}, Orizaba, Ver.`,
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
        aperturaMin: min(def.horario[0]),
        cierreMin: min(def.horario[1]),
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

    let imagen = "sin imagen";
    if (conImagenes) {
      const buf = await descargarFoto(def.foto);
      if (buf) {
        const imagenUrl = await subirImagenRestaurante(rest.id, buf);
        await prisma.restaurante.update({ where: { id: rest.id }, data: { imagenUrl } });
        imagen = "con imagen";
      }
    }
    console.log(`Creado: ${def.nombre} (${totalMesas} mesas, ${Object.keys(def.modalidades).length} modalidades, ${imagen})`);
  }
  console.log(`Administrador: ${admin.email}`);
}

main().finally(() => prisma.$disconnect());
