import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const modalidades = [
  { codigo: "AUTO_FREE", nombre: "Asignación automática de mesa", esPagada: false },
  { codigo: "ZONE_FREE", nombre: "Elección de zona", esPagada: false },
  { codigo: "TABLE_FREE", nombre: "Elección gratuita de mesa", esPagada: false },
  { codigo: "AUTO_FIXED", nombre: "Asignación automática con tarifa fija", esPagada: true },
  { codigo: "TABLE_FIXED", nombre: "Selección de mesa con tarifa fija", esPagada: true },
  { codigo: "PER_PERSON", nombre: "Tarifa por persona", esPagada: true },
  { codigo: "TABLE_PER_PERSON", nombre: "Selección de mesa con tarifa por persona", esPagada: true },
  { codigo: "ZONE_TABLE_RATE", nombre: "Tarifa por zona o mesa", esPagada: true },
  {
    codigo: "DEPOSIT",
    nombre: "Selección de mesa con depósito anticipado",
    esPagada: true,
    descripcion: "Se descuenta del consumo",
  },
  {
    codigo: "REFUNDABLE_GUARANTEE",
    nombre: "Reservación con garantía reembolsable",
    esPagada: true,
    descripcion: "Devolución según condiciones",
  },
  {
    codigo: "MEMBER_ONLY",
    nombre: "Selección exclusiva para miembros",
    esPagada: false,
    descripcion: "Condicionada a membresía (pendiente de definir)",
  },
];

async function main() {
  for (const m of modalidades) {
    await prisma.modalidadReserva.upsert({
      where: { codigo: m.codigo },
      update: { nombre: m.nombre, esPagada: m.esPagada, descripcion: m.descripcion ?? null },
      create: m,
    });
  }
  console.log(`Catálogo sembrado: ${modalidades.length} modalidades`);

  const admin = await prisma.usuario.findFirst({ where: { rol: "ADMIN" } });
  if (admin) {
    const existingRestaurant = await prisma.restaurante.findFirst({
      where: { adminId: admin.id, nombre: "Casa del Olivo" },
    });
    if (!existingRestaurant) {
      const rest = await prisma.restaurante.create({
        data: {
          adminId: admin.id,
          nombre: "Casa del Olivo",
          tipoCocina: "Mexicana contemporánea",
          ubicacion: "Av. Reforma 222, CDMX",
          rfc: "XAXX010101000",
          limiteMesas: 15,
          zonaHoraria: "America/Mexico_City",
          activo: true,
        },
      });

      // Horarios lunes a domingo 12:00 a 23:00 (720 a 1380 minutos)
      for (let dia = 0; dia <= 6; dia++) {
        await prisma.horarioRestaurante.create({
          data: {
            restauranteId: rest.id,
            diaSemana: dia,
            aperturaMin: 720,
            cierreMin: 1380,
          },
        });
      }

      // Piso y áreas
      const piso = await prisma.piso.create({
        data: {
          restauranteId: rest.id,
          nombre: "Salón Principal",
          orden: 0,
        },
      });

      const areaTerraza = await prisma.area.create({
        data: { pisoId: piso.id, nombre: "Terraza" },
      });

      const areaInterior = await prisma.area.create({
        data: { pisoId: piso.id, nombre: "Salón Central" },
      });

      // Mesas
      await prisma.mesa.createMany({
        data: [
          {
            restauranteId: rest.id,
            areaId: areaTerraza.id,
            etiqueta: "T-1",
            capacidad: 2,
            forma: "cuadrada",
            estado: "AVAILABLE",
          },
          {
            restauranteId: rest.id,
            areaId: areaTerraza.id,
            etiqueta: "T-2",
            capacidad: 4,
            forma: "redonda",
            estado: "AVAILABLE",
          },
          {
            restauranteId: rest.id,
            areaId: areaInterior.id,
            etiqueta: "M-1",
            capacidad: 4,
            forma: "cuadrada",
            estado: "AVAILABLE",
          },
          {
            restauranteId: rest.id,
            areaId: areaInterior.id,
            etiqueta: "M-2",
            capacidad: 6,
            forma: "rectangular",
            estado: "AVAILABLE",
          },
          {
            restauranteId: rest.id,
            areaId: areaInterior.id,
            etiqueta: "M-3",
            capacidad: 8,
            forma: "grupal",
            estado: "AVAILABLE",
          },
        ],
      });

      // Habilitar modalidades gratuitas
      const autoFree = await prisma.modalidadReserva.findUnique({ where: { codigo: "AUTO_FREE" } });
      const tableFree = await prisma.modalidadReserva.findUnique({ where: { codigo: "TABLE_FREE" } });
      if (autoFree) {
        await prisma.restauranteModalidad.create({
          data: { restauranteId: rest.id, modalidadId: autoFree.id, activa: true },
        });
      }
      if (tableFree) {
        await prisma.restauranteModalidad.create({
          data: { restauranteId: rest.id, modalidadId: tableFree.id, activa: true },
        });
      }

      console.log(`Restaurante demo creado: "${rest.nombre}" (${rest.id}) con mesas y horarios`);
    }
  }
}

main().finally(() => prisma.$disconnect());
