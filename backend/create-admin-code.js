const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminId = 'df46ea4f-a0e6-405f-98ba-de3045426534';
  
  // check if code exists
  let code = await prisma.accessCode.findUnique({ where: { code: 'NOXUS-MASTER' }});
  
  if (!code) {
    code = await prisma.accessCode.create({
      data: {
        code: 'NOXUS-MASTER',
        status: 'used',
        clientName: 'Luiz Fernando',
        usedById: adminId
      }
    });
    console.log('Created NOXUS-MASTER access code for admin.');
  } else {
    console.log('NOXUS-MASTER access code already exists.');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
