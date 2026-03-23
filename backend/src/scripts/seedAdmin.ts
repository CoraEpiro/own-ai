import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';

// Load repo-root .env before importing config/database modules
dotenv.config({ path: path.join(process.cwd(), '..', '.env') });

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to seed admin user in production.');
    process.exit(1);
  }

  const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@local.test';
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin';

  const { createUser, getUserByEmail } = await import('../services/databaseService');

  const existing = await getUserByEmail(email);
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await createUser({ email, password: hashedPassword, isAdmin: true });
  } catch (err) {
    console.error('Could not create admin user (is Supabase reachable and configured?):', err);
    process.exit(1);
  }

  console.log(`Seeded admin user: ${email}`);
  console.log(`Password: ${password}`);
}

main().catch((err) => {
  console.error('Failed to seed admin user:', err);
  process.exit(1);
});
