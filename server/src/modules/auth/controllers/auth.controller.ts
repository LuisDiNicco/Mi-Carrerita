import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const ACCESS_TOKEN_PARAM = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const REFRESH_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';

    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_DAYS * MS_PER_DAY,
      path: '/',
    });

    return res.redirect(`${clientUrl}/?${ACCESS_TOKEN_PARAM}=${accessToken}`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    return req.user;
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    const accessToken = await this.authService.refreshAccessToken(refreshToken);
    return res.json({ accessToken });
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    await this.authService.revokeRefreshToken(refreshToken);
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    return res.json({ ok: true });
  }
}
