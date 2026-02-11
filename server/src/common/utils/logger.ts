// server/src/common/utils/logger.ts
import { Logger } from '@nestjs/common';

export interface LogContext {
  context: string;
  method?: string;
  data?: any;
}

export class AppLogger {
  private logger: Logger;

  constructor(context: string) {
    this.logger = new Logger(context);
  }

  /**
   * Log información general
   */
  info(message: string, data?: any) {
    if (data) {
      this.logger.log(`${message} - ${JSON.stringify(data)}`);
    } else {
      this.logger.log(message);
    }
  }

  /**
   * Log de warning
   */
  warn(message: string, data?: any) {
    if (data) {
      this.logger.warn(`${message} - ${JSON.stringify(data)}`);
    } else {
      this.logger.warn(message);
    }
  }

  /**
   * Log de error
   */
  error(message: string, error?: Error | any) {
    if (error instanceof Error) {
      this.logger.error(`${message} - ${error.message}`, error.stack);
    } else {
      this.logger.error(`${message}`, error);
    }
  }

  /**
   * Log de debug
   */
  debug(message: string, data?: any) {
    if (data) {
      this.logger.debug(`${message} - ${JSON.stringify(data)}`);
    } else {
      this.logger.debug(message);
    }
  }
}
