import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

jest.setTimeout(30_000);

const prisma = new PrismaClient();
const repoRoot = resolve(__dirname, '../../../..');

describe('Auth settings persistence', () => {
  afterAll(async () => {
    await prisma.authSettings.update({
      where: { id: 1 },
      data: {
        googleLoginRegistrationEnabled: true,
        facebookLoginRegistrationEnabled: true,
      },
    });
    await prisma.$disconnect();
  });

  it('seeds the enabled singleton defaults', async () => {
    const settings = await prisma.authSettings.findUniqueOrThrow({ where: { id: 1 } });

    expect(settings).toMatchObject({
      googleLoginRegistrationEnabled: true,
      facebookLoginRegistrationEnabled: true,
    });
  });

  it('grants auth settings management only to SUPER_ADMIN', async () => {
    const permission = await prisma.permission.findUniqueOrThrow({
      where: { code: 'settings.auth.manage' },
      include: { roles: { include: { role: true } } },
    });

    expect(permission).toMatchObject({ action: 'manage', subject: 'AuthSettings' });
    expect(permission.roles.map(({ role }) => role.code).sort()).toEqual(['SUPER_ADMIN']);
  });

  it('rejects a second settings row', async () => {
    await expect(prisma.authSettings.create({ data: { id: 2 } })).rejects.toThrow();
  });

  it('preserves live choices when seed is rerun', async () => {
    await prisma.authSettings.update({
      where: { id: 1 },
      data: {
        googleLoginRegistrationEnabled: false,
        facebookLoginRegistrationEnabled: false,
      },
    });

    execFileSync('pnpm', ['--filter', 'api', 'prisma:seed'], {
      cwd: repoRoot,
      env: process.env,
    });

    await expect(prisma.authSettings.findUniqueOrThrow({ where: { id: 1 } })).resolves.toMatchObject({
      googleLoginRegistrationEnabled: false,
      facebookLoginRegistrationEnabled: false,
    });
  });
});
