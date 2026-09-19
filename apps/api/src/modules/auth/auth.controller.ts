import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard, type AuthenticatedRequest } from "./auth.guard";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";

@ApiTags("authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register an account verified by the official master list" })
  register(@Body() input: RegisterDto) { return this.auth.register(input); }

  @Get("me")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the active local profile for the current session" })
  me(@Req() request: AuthenticatedRequest) { return request.user; }
}

