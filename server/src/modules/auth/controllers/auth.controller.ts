import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RegisterDto, LoginDto, ChangePasswordDto } from '../dto/auth.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

const ACCESS_TOKEN_PARAM = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const REFRESH_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) { }

  private getRefreshCookieOptions() {
    const isProd = this.configService.get('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? ('none' as const) : ('strict' as const),
      maxAge: REFRESH_DAYS * MS_PER_DAY,
      path: '/',
    };
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    const result = await this.authService.register(dto);

    res.cookie(REFRESH_COOKIE, result.refreshToken, this.getRefreshCookieOptions());

    return res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(dto);

    res.cookie(REFRESH_COOKIE, result.refreshToken, this.getRefreshCookieOptions());

    return res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
    @Res() res: Response,
  ) {
    const result = await this.authService.changePassword(userId, dto);
    return res.json(result);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    return;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as {
      id: string;
      email: string;
      name?: string | null;
      avatarUrl?: string | null;
    };
    const { accessToken, refreshToken } =
      await this.authService.issueTokens(user);
    const clientUrl = this.configService.get('CLIENT_URL') ?? 'http://localhost:5173';

    res.cookie(REFRESH_COOKIE, refreshToken, this.getRefreshCookieOptions());

    return res.redirect(`${clientUrl}/?${ACCESS_TOKEN_PARAM}=${accessToken}`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    return req.user;
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body?: { refreshToken?: string },
  ) {
    // Intenta obtener el refresh token del body primero (para cross-domain)
    // Si no está, intenta obtenerlo del cookie (para mismo dominio)
    const refreshToken = body?.refreshToken || req.cookies?.[REFRESH_COOKIE];
    const result = await this.authService.refreshAccessToken(refreshToken);

    // Actualiza el cookie con el nuevo refresh token
    res.cookie(REFRESH_COOKIE, result.refreshToken, this.getRefreshCookieOptions());

    return res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    await this.authService.revokeRefreshToken(refreshToken);
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    return res.json({ ok: true });
  }
}
