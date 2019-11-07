import { Injectable, NestMiddleware } from '@nestjs/common';
import { AuthService } from './auth/auth.service';

function proceedNoAuth(res, next) {
  res.clearCookie('token');
  next();
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: any, res: any, next: () => void) {
    req.session = false;

    const { token } = req.cookies;

    try {
      req.session = await this.authService.validateCRMToken(token);
      next();
    } catch (e) {
      // console.log(e);
      proceedNoAuth(res, next);
    }
  }
}
