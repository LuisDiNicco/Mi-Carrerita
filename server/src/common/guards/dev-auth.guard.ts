import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
// 1. Importamos la constante que ya usabas antes para asegurar que coincida con tu Seed
import { APP_DEFAULTS } from '../../config/app.constants';

@Injectable()
export class DevAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const email = APP_DEFAULTS.defaultUserEmail;

    // Ensure a dev user exists to avoid 404s during development.
    const user = await this.prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: 'Dev User',
        googleId: null,
      },
    });

    // 2. Usamos la constante en lugar del string hardcodeado 'admin@admin.com'
    request.user = {
      id: user.id,
      email: user.email,
      roles: ['ADMIN'],
    };

    return true;
  }
}
