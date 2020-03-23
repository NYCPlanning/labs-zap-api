import { Injectable, NestMiddleware } from '@nestjs/common';
import { AuthService } from './auth/auth.service';

function proceedNoAuth(res, next) {
  // TODO: understand why this was necessary
  res.clearCookie('token');
  next();
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: any, res: any, next: () => void) {
    req.session = false;

    const { token } = req.cookies;

    // skip for the login route
    if (req.originalUrl.includes('login')) {
      next();

      return;
    }

    try {
      req.session = await this.authService.validateCurrentToken(token);

      next();
    } catch (e) {
      proceedNoAuth(res, next);
    }
  }
}
