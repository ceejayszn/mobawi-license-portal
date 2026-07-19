import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

async function main() {
  const passwordHash = hashPassword('kali');
  
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
