import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtPayload } from '../types/jwt-payload';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private get accessTokenTtl(): JwtSignOptions['expiresIn'] {
    return this.configService.get<string>(
      'ACCESS_TOKEN_TTL',
      '15m',
    ) as JwtSignOptions['expiresIn'];
  }

  private get refreshTokenTtl(): JwtSignOptions['expiresIn'] {
    return this.configService.get<string>(
      'REFRESH_TOKEN_TTL',
      '7d',
    ) as JwtSignOptions['expiresIn'];
  }

  private get hashSalt() {
    return this.configService.get<number>('HASH_SALT', 10);
  }

  private get jwtSecret() {
    return this.configService.getOrThrow<string>('JWT_SECRET');
  }

  private get jwtRefreshSecret() {
    return this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  async validateGoogleUser(profile: {
    googleId: string;
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
  }) {
    return this.prisma.user.upsert({
      where: { email: profile.email },
      update: {
        googleId: profile.googleId,
        name: profile.name ?? undefined,
        avatarUrl: profile.avatarUrl ?? undefined,
      },
      create: {
        email: profile.email,
        name: profile.name ?? undefined,
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl ?? undefined,
      },
    });
  }

  async issueTokens(user: {
    id: string;
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: this.accessTokenTtl,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.jwtRefreshSecret,
      expiresIn: this.refreshTokenTtl,
    });

    const refreshTokenHash = await hash(refreshToken, this.hashSalt);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token faltante.');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalido.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Sesion expirada.');
    }

    const isValid = await compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token invalido.');
    }

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name ?? undefined,
        avatarUrl: user.avatarUrl ?? undefined,
      },
      { secret: this.jwtSecret, expiresIn: this.accessTokenTtl },
    );

    return accessToken;
  }

  async revokeRefreshToken(refreshToken?: string) {
    if (!refreshToken) return;

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.jwtRefreshSecret,
      });
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { refreshTokenHash: null },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Fallo al revocar refresh token: ${message}`);
      return;
    }
  }
}
