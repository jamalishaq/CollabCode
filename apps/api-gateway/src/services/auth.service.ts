import type { JwtPayload } from '@collabcode/shared-types';

import { config } from '../config';
import { AppError } from '../utils/app-error';

interface ValidateTokenResponse {
  data: {
    userId: string;
    email: string;
    iat: number;
    exp: number;
  } | null;
  error: {
    code: string;
    message: string;
    statusCode?: number;
  } | null;
}

export class AuthService {
  static async validate(token: string): Promise<JwtPayload> {
    const response = await fetch(`${config.AUTH_SERVICE_URL}/auth/validate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const payload = (await response.json()) as ValidateTokenResponse;

    if (!response.ok || payload.data === null) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
    }

    return {
      sub: payload.data.userId,
      email: payload.data.email,
      iat: payload.data.iat,
      exp: payload.data.exp
    };
  }
}
