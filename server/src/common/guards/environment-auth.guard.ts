import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DevAuthGuard } from './dev-auth.guard';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';

@Injectable()
export class EnvironmentAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly devAuthGuard: DevAuthGuard,
    private readonly jwtAuthGuard: JwtAuthGuard,
  ) {}

  canActivate(context: ExecutionContext) {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const isProduction = nodeEnv === 'production';

    return isProduction
      ? this.jwtAuthGuard.canActivate(context)
      : this.devAuthGuard.canActivate(context);
  }
}
