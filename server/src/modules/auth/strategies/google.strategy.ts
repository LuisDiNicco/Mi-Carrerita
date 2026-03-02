import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('auth.googleClientId') ?? '',
      clientSecret: configService.get<string>('auth.googleClientSecret') ?? '',
      callbackURL:
        configService.get<string>('auth.googleCallbackUrl') ??
        'http://localhost:3000/auth/google/callback',
      scope: ['profile', 'email'],
    });
  }

  async validate(_: string, __: string, profile: Profile) {
    const email = profile.emails?.[0]?.value ?? '';
    const name = profile.displayName ?? null;
    const avatarUrl = profile.photos?.[0]?.value ?? null;

    const user = await this.authService.validateGoogleUser({
      googleId: profile.id,
      email,
      name,
      avatarUrl,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  }
}
