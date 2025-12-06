import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { Pool } from 'pg';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const email =
    process.env.SEED_SUPERADMIN_EMAIL ?? 'superadmin@memberflow.local';
  const password = process.env.SEED_SUPERADMIN_PASSWORD ?? 'ChangeMe123!@#';

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool, { disposeExternalPool: true });
  const prisma = new PrismaClient({ adapter, log: ['warn', 'error'] });

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`Superadmin already exists (${email}); skipping creation.`);
      return;
    }

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'SUPERADMIN',
      },
    });

    console.log(
      `Superadmin created. Email: ${email} | Password: ${password} (change after first login)`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Failed to seed superadmin:', error);
  process.exit(1);
});
