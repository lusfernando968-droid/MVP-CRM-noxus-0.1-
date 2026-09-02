const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash('NOXUS-MASTER', 10);
  const testPass = await bcrypt.hash('NOXUS-TEST', 10);

  // 1. Criar ou Atualizar ADMIN
  const admin = await prisma.user.upsert({
    where: { email: 'admin@noxus.local' },
    update: { role: 'SUPERADMIN', name: 'Administrador Noxus' },
    create: {
      email: 'admin@noxus.local',
      password: adminPass,
      name: 'Administrador Noxus',
      role: 'SUPERADMIN',
      isActive: true
    }
  });

  // 2. Criar ou Atualizar Usuário de Teste
  const testUser = await prisma.user.upsert({
    where: { email: 'test@noxus.local' },
    update: { role: 'USER', name: 'Usuário de Teste' },
    create: {
      email: 'test@noxus.local',
      password: testPass,
      name: 'Usuário de Teste',
      role: 'USER',
      isActive: true
    }
  });

  // 3. Vincular códigos de acesso
  await prisma.accessCode.upsert({
    where: { code: 'NOXUS-MASTER' },
    update: { status: 'used', usedById: admin.id, clientName: 'Admin' },
    create: {
      code: 'NOXUS-MASTER',
      status: 'used',
      usedById: admin.id,
      clientName: 'Admin'
    }
  });

  await prisma.accessCode.upsert({
    where: { code: 'NOXUS-TEST' },
    update: { status: 'used', usedById: testUser.id, clientName: 'Teste' },
    create: {
      code: 'NOXUS-TEST',
      status: 'used',
      usedById: testUser.id,
      clientName: 'Teste'
    }
  });

  console.log('Admin e Test user gerados com sucesso!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
