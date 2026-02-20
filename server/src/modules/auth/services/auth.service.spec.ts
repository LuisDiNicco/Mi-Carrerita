import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockPrismaService = {
    user: {
      upsert: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: any) => {
      const config = {
        ACCESS_TOKEN_TTL: '15m',
        REFRESH_TOKEN_TTL: '7d',
        HASH_SALT: 10,
      };
      return config[key] || defaultValue;
    }),
    getOrThrow: jest.fn((key: string) => {
      const config = {
        JWT_SECRET: 'secret',
        JWT_REFRESH_SECRET: 'refresh-secret',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateGoogleUser', () => {
    it('debería hacer upsert del usuario de Google', async () => {
      const profile = { googleId: '123', email: 'test@test.com', name: 'Test' };
      mockPrismaService.user.upsert.mockResolvedValue({ id: 'u1', ...profile });

      const result = await service.validateGoogleUser(profile);

      expect(mockPrismaService.user.upsert).toHaveBeenCalledWith({
        where: { email: profile.email },
        update: {
          googleId: profile.googleId,
          name: profile.name,
          avatarUrl: undefined,
        },
        create: {
          email: profile.email,
          googleId: profile.googleId,
          name: profile.name,
          avatarUrl: undefined,
        },
      });
      expect(result.id).toBe('u1');
    });
  });

  describe('issueTokens', () => {
    it('debería generar y devolver tokens y hashear el refreshToken', async () => {
      const user = { id: 'u1', email: 't@t.com' };
      mockJwtService.sign
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_refresh');

      const result = await service.issueTokens(user);

      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(bcrypt.hash).toHaveBeenCalledWith('refresh_token', 10);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { refreshTokenHash: 'hashed_refresh' },
      });
      expect(result.accessToken).toBe('access_token');
      expect(result.refreshToken).toBe('refresh_token');
    });
  });

  describe('refreshAccessToken', () => {
    it('debería lanzar Unauthorized si no se provee refreshToken', async () => {
      await expect(service.refreshAccessToken()).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debería lanzar Unauthorized si falla validacion JWT del refresh token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid');
      });
      await expect(service.refreshAccessToken('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debería lanzar Unauthorized si el user no existe o no tiene refreshTokenHash', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'u1' });
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.refreshAccessToken('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debería lanzar Unauthorized si el bcrypt compare falla', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'u1' });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'u1',
        refreshTokenHash: 'hash',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshAccessToken('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debería retornar un nuevo access token si todo esta correcto', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'u1' });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'test@test.com',
        refreshTokenHash: 'hash',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('new_access_token');

      const result = await service.refreshAccessToken('token');

      expect(result).toBe('new_access_token');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: 'u1',
          email: 'test@test.com',
          name: undefined,
          avatarUrl: undefined,
        },
        { secret: 'secret', expiresIn: '15m' },
      );
    });
  });

  describe('revokeRefreshToken', () => {
    it('no debería hacer nada si no se provee refresh token', async () => {
      await service.revokeRefreshToken();
      expect(mockJwtService.verify).not.toHaveBeenCalled();
    });

    it('debería anular el token (setear null en user) de la DB', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'u1' });
      await service.revokeRefreshToken('token');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { refreshTokenHash: null },
      });
    });

    it('debería ignorar la devolucion (warn de logger) si verify falla en revocacion', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Bad token');
      });
      await expect(service.revokeRefreshToken('bad')).resolves.toBeUndefined(); // Logs warn internal
    });
  });
});
