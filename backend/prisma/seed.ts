import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Limpar os dados
  await prisma.financialTransaction.deleteMany({});
  await prisma.anamnesis.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.accessCode.deleteMany({});
  await prisma.user.deleteMany({});

  // Recriar o código
  await prisma.accessCode.create({
    data: {
      code: 'NOXUS-998069655',
      status: 'available'
    }
  });

  console.log('Sistema limpo e Código NOXUS-998069655 recriado com sucesso!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
