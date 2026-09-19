import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { AuthService, type LocalUser } from "./auth.service";

export interface AuthenticatedRequest extends Request { user: LocalUser }

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) throw new UnauthorizedException("Authentication is required.");
    request.user = await this.auth.authenticate(token);
    return true;
  }
}

