import { Module, type Provider } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

const authProviders: Provider[] = [AuthService, JwtStrategy];
if (process.env.GOOGLE_CLIENT_ID) {
  authProviders.push(GoogleStrategy);
}

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ session: false }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: authProviders,
  exports: [AuthService],
})
export class AuthModule {}
