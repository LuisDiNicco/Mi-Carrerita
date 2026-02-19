import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TrophyService } from '../services/trophy.service';
import { TrophyCaseDto, TrophyDto, TrophyCheckResultDto } from '../dto';
import { EnvironmentAuthGuard } from '../../../common/guards/environment-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('trophies')
@UseGuards(EnvironmentAuthGuard)
export class TrophyController {
  constructor(private readonly trophyService: TrophyService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener la colección completa de trofeos del usuario',
  })
  @ApiResponse({ status: 200, description: 'User trophy case' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getTrophyCase(
    @CurrentUser('email') userEmail: string,
  ): Promise<TrophyCaseDto> {
    return this.trophyService.getTrophyCase(userEmail);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Obtener detalles de un trofeo específico' })
  @ApiResponse({ status: 200, description: 'Trophy details' })
  @ApiResponse({ status: 404, description: 'Trophy not found' })
  async getTrophy(
    @Param('code') code: string,
    @CurrentUser('email') userEmail: string,
  ): Promise<TrophyDto> {
    return this.trophyService.getTrophy(userEmail, code);
  }

  @Post('check')
  @ApiOperation({
    summary: 'Verificar y desbloquear trofeos elegibles',
  })
  @ApiResponse({
    status: 200,
    description: 'List of newly unlocked trophies',
  })
  async checkAndUnlock(
    @CurrentUser('email') userEmail: string,
  ): Promise<TrophyDto[]> {
    return this.trophyService.checkAndUnlockTrophies(userEmail);
  }
}
