const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('A iniciar o seed do administrador...');

  const adminEmail = 'admin@triagify.com';
  const adminPassword = 'adminpassword123'; // Use uma senha forte num ambiente real

  // Encripta a senha
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Usa upsert para criar o utilizador apenas se ele não existir
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {}, // Não faz nada se o admin já existir
    create: {
      email: adminEmail,
      fullName: 'Administrador do Sistema',
      password: hashedPassword,
      role: 'ADMIN', // Define o perfil como ADMIN
    },
  });

  console.log(`Utilizador administrador "${adminEmail}" criado ou já existente.`);
  console.log(`Senha: ${adminPassword}`);
  console.log('Seed do administrador concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
