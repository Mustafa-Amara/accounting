import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
async function main() {
  const c1 = await prisma.client.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "زبون تجريبي — أحمد", phone: "07xxxxxxxxx", address: "بغداد", notes: "" },
  });

  const s1 = await prisma.supplier.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "مورد تجريبي — دار الدواء", phone: "0780000000", address: "بغداد", notes: "مورد أدوية بيطرية" },
  });

  const products = [
    { nameAr: "أميكس 100 مل", category: "أدوية بيطرية", price: 8000, unit: "زجاجة" },
    { nameAr: "فينبنت 250 مل", category: "أدوية بيطرية", price: 12000, unit: "زجاجة" },
    { nameAr: "فيتامينات أسماك", category: "مكملات", price: 7000, unit: "علبة" },
    { nameAr: "مضاد طفيليات", category: "أدوية بيطرية", price: 15000, unit: "علبة" },
  ];

  products.forEach(async (p, index) => {
    await prisma.product.upsert({
      where: { id: index + 1 },
      update: { ...p, stock: 100 },
      create: { ...p, stock: 100 },
    });
  });

  console.log("seed ok", { client: c1.id, supplier: s1.id });
}
main().finally(() => prisma.$disconnect());
