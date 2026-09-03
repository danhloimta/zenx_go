import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { AdminRole } from '../src/common/domain';
import { normalizeEmail } from '../src/common/normalize';

const prisma = new PrismaClient();

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const email = argument(args, '--email');
  const role = (argument(args, '--role') ?? AdminRole.SUPER_ADMIN).toUpperCase();
  if (!['grant', 'revoke'].includes(command ?? '') || !email || role !== AdminRole.SUPER_ADMIN) {
    throw new Error(
      'Usage: pnpm admin:role <grant|revoke> --email=<existing-user-email> [--role=SUPER_ADMIN]',
    );
  }

  const user = await prisma.user.findUnique({
    where: { emailNormalized: normalizeEmail(email) },
    select: { id: true, email: true },
  });
  if (!user) throw new Error(`No user exists with email ${email}`);

  if (command === 'grant') {
    await prisma.userRole.upsert({
      where: { userId_role: { userId: user.id, role } },
      update: {},
      create: { userId: user.id, role },
    });
    console.log(`Granted ${role} to ${user.email}`);
    return;
  }

  const activeSuperAdmins = await prisma.user.count({
    where: { status: 'ACTIVE', roles: { some: { role: AdminRole.SUPER_ADMIN } } },
  });
  const hasRole = await prisma.userRole.findUnique({
    where: { userId_role: { userId: user.id, role } },
  });
  if (
    hasRole &&
    activeSuperAdmins <= 1 &&
    (await prisma.user.findUnique({ where: { id: user.id }, select: { status: true } }))?.status ===
      'ACTIVE'
  ) {
    throw new Error('Cannot revoke the last active SUPER_ADMIN');
  }
  await prisma.userRole.deleteMany({ where: { userId: user.id, role } });
  console.log(`Revoked ${role} from ${user.email}`);
}

function argument(args: string[], name: string) {
  const inline = args.find((value) => value.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1).trim();
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1]?.trim() : undefined;
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
