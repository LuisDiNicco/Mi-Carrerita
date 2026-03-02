import { Module, type Provider } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule } from '@nestjs/config';
import authConfig from './config/auth.config';

const authProviders: Provider[] = [AuthService, JwtStrategy];
// Usamos process.env aquí por limitación de registro síncrono de Providers en NestJS
if (process.env.GOOGLE_CLIENT_ID) {
  authProviders.push(GoogleStrategy);
}

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forFeature(authConfig),
    PassportModule.register({ session: false }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: authProviders,
  exports: [AuthService],
})
export class AuthModule { }
