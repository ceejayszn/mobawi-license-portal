import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('kali');
  
  const user = await prisma.user.upsert({
    where: { username: 'root' },
    update: { passwordHash },
    create: {
      username: 'root',
      passwordHash,
    },
  });

  console.log(`Default user configured. Username: ${user.username}, Password: kali`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
