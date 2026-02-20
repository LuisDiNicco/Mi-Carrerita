import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as Joi from 'joi';
import { PrismaModule } from './prisma/prisma.module';
import { AcademicCareerModule } from './modules/academic-career/academic-career.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { AcademicHistoryModule } from './modules/academic-history/academic-history.module';
import { TrophyModule } from './modules/trophy/trophy.module';
import { PdfParserModule } from './shared/pdf-parser/pdf-parser.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().min(1).required(),
        CLIENT_URL: Joi.string().min(1).required(),
        JWT_SECRET: Joi.string().min(1).required(),
        JWT_REFRESH_SECRET: Joi.string().min(1).required(),
        GOOGLE_CLIENT_ID: Joi.string().allow('').optional(),
        GOOGLE_CLIENT_SECRET: Joi.string().allow('').optional(),
        GOOGLE_CALLBACK_URL: Joi.string().allow('').optional(),
        ACCESS_TOKEN_TTL: Joi.string().default('15m'),
        REFRESH_TOKEN_TTL: Joi.string().default('7d'),
        HASH_SALT: Joi.number().integer().min(1).default(10),
      }),
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AcademicCareerModule,
    AuthModule,
    DashboardModule,
    ScheduleModule,
    AcademicHistoryModule,
    TrophyModule,
    PdfParserModule,
  ],
})
export class AppModule { }
