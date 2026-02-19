// server/src/common/utils/api-response.ts
/**
 * Formato de respuesta estándar para API
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  timestamp: string;
}

/**
 * Helper para crear respuestas API consistentes
 */
export class ApiResponseBuilder {
  static success<T>(
    data: T,
    message: string = 'Success',
    statusCode: number = 200,
  ): ApiResponse<T> {
    return {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static error(
    message: string = 'Error',
    statusCode: number = 400,
  ): ApiResponse<undefined> {
    return {
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Success',
  ): ApiResponse<{
    items: T[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const pages = Math.ceil(total / limit);
    return {
      success: true,
      statusCode: 200,
      message,
      data: {
        items: data,
        total,
        page,
        limit,
        pages,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
