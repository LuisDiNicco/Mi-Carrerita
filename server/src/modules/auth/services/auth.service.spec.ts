import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
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
      create: jest.fn(),
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

  describe('register', () => {
    const validDto = { email: 'new@test.com', password: 'ValidPass1', name: 'Test' };

    it('debería registrar un nuevo usuario exitosamente', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'new-id',
        email: validDto.email,
        name: validDto.name,
        avatarUrl: null,
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.register(validDto);

      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(result.accessToken).toBeDefined();
      expect(result.user.email).toBe(validDto.email);
    });

    it('debería lanzar ConflictException si el email ya existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.register(validDto)).rejects.toThrow('ya está registrado');
    });

    it('debería lanzar BadRequestException si la contraseña es demasiado corta', async () => {
      await expect(
        service.register({ email: 'x@x.com', password: 'Sh0rt' })
      ).rejects.toThrow('8 caracteres');
    });

    it('debería lanzar BadRequestException si falta mayúscula', async () => {
      await expect(
        service.register({ email: 'x@x.com', password: 'nouppercase1' })
      ).rejects.toThrow('mayúscula');
    });

    it('debería lanzar BadRequestException si falta minúscula', async () => {
      await expect(
        service.register({ email: 'x@x.com', password: 'NOLOWERCASE1' })
      ).rejects.toThrow('minúscula');
    });

    it('debería lanzar BadRequestException si falta dígito', async () => {
      await expect(
        service.register({ email: 'x@x.com', password: 'NoDigitPwd' })
      ).rejects.toThrow('dígito');
    });
  });

  describe('login', () => {
    it('debería autenticar un usuario correctamente', async () => {
      const user = { id: 'u1', email: 'u@t.com', name: 'U', avatarUrl: null, passwordHash: 'hash' };
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign
        .mockReturnValueOnce('acc-tok')
        .mockReturnValueOnce('ref-tok');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-ref');

      const result = await service.login({ email: 'u@t.com', password: 'Pass1' });

      expect(result.accessToken).toBe('acc-tok');
      expect(result.user.email).toBe('u@t.com');
    });

    it('debería lanzar UnauthorizedException si el usuario no existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexist@t.com', password: 'Pass1' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debería lanzar UnauthorizedException si el usuario no tiene passwordHash (solo Google)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'u2', email: 'g@t.com', passwordHash: null,
      });

      await expect(
        service.login({ email: 'g@t.com', password: 'any' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debería lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'u3', email: 'u@t.com', passwordHash: 'hash',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'u@t.com', password: 'WrongPass1' })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    const userId = 'uid-1';
    const dto = { currentPassword: 'OldPass1', newPassword: 'NewPass1' };

    it('debería cambiar la contraseña correctamente', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId, email: 'u@t.com', passwordHash: 'old-hash',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

      const result = await service.changePassword(userId, dto);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { passwordHash: 'new-hash' } })
      );
      expect(result.ok).toBe(true);
    });

    it('debería lanzar UnauthorizedException si el usuario no existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.changePassword(userId, dto)).rejects.toThrow(UnauthorizedException);
    });

    it('debería lanzar UnauthorizedException si la contraseña actual es incorrecta', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId, email: 'u@t.com', passwordHash: 'hash',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(userId, dto)).rejects.toThrow(UnauthorizedException);
    });

    it('debería lanzar BadRequestException si la nueva contraseña no cumple los requisitos', async () => {
      await expect(
        service.changePassword(userId, { currentPassword: 'OldPass1', newPassword: 'weak' })
      ).rejects.toThrow(BadRequestException);
    });
  });
});
