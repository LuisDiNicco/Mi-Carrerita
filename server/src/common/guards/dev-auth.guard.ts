import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
// 1. Importamos la constante que ya usabas antes para asegurar que coincida con tu Seed
import { DEFAULT_USER_EMAIL } from '../../modules/academic-career/academic-career.constants';

@Injectable()
export class DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // 2. Usamos la constante en lugar del string hardcodeado 'admin@admin.com'
    request.user = {
      email: DEFAULT_USER_EMAIL, 
      roles: ['ADMIN'],
    };

    return true;
  }
}