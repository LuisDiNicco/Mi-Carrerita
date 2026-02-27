import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
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

    // Generar un nuevo refresh token
    const newRefreshToken = this.jwtService.sign(
      { sub: user.id },
      { secret: this.jwtRefreshSecret, expiresIn: this.refreshTokenTtl },
    );

    // Guardar el hash del nuevo refresh token
    const refreshTokenHash = await hash(newRefreshToken, this.hashSalt);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    return { accessToken, refreshToken: newRefreshToken };
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

  /**
   * Validate password requirements:
   * - Minimum 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   */
  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException(
        'La contraseña debe tener al menos 8 caracteres.',
      );
    }

    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException(
        'La contraseña debe contener al menos una mayúscula.',
      );
    }

    if (!/[a-z]/.test(password)) {
      throw new BadRequestException(
        'La contraseña debe contener al menos una minúscula.',
      );
    }

    if (!/\d/.test(password)) {
      throw new BadRequestException(
        'La contraseña debe contener al menos un dígito.',
      );
    }
  }

  /**
   * Register a new user with email and password
   */
  async register(dto: { email: string; password: string; name?: string }) {
    const { email, password, name } = dto;

    // Validate password strength
    this.validatePasswordStrength(password);

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(
        'El correo electrónico ya está registrado. Intenta con otro o inicia sesión.',
      );
    }

    // Hash password
    const passwordHash = await hash(password, this.hashSalt);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name ?? undefined,
      },
    });

    // Issue tokens
    const tokens = await this.issueTokens({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  /**
   * Authenticate user with email and password
   */
  async login(dto: { email: string; password: string }) {
    const { email, password } = dto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    // Verify password
    const isPasswordValid = await compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    // Issue tokens
    const tokens = await this.issueTokens({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(
    userId: string,
    dto: { currentPassword: string; newPassword: string },
  ) {
    const { currentPassword, newPassword } = dto;

    // Validate new password strength
    this.validatePasswordStrength(newPassword);

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(
        'No tienes permiso para realizar esta acción.',
      );
    }

    // Verify current password
    const isCurrentValid = await compare(currentPassword, user.passwordHash);

    if (!isCurrentValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta.');
    }

    // Hash new password
    const newPasswordHash = await hash(newPassword, this.hashSalt);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { ok: true, message: 'Contraseña actualizada exitosamente.' };
  }
}
