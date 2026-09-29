import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard";
import { ClaimsService } from "./claims.service";
import {
  CreateClaimDto,
  ReviewClaimDto,
  ReplyClaimDto,
} from "./dto/create-claim.dto";

@ApiTags("claims")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("claims")
export class ClaimsController {
  constructor(private readonly claims: ClaimsService) {}
  @Post() create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateClaimDto,
  ) {
    return this.claims.create(req.user, dto);
  }
  @Get("mine") mine(@Req() req: AuthenticatedRequest) {
    return this.claims.mine(req.user.id);
  }
  @Get() all(@Req() req: AuthenticatedRequest) {
    return this.claims.all(req.user);
  }
  @Post(":id/reply") reply(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: ReplyClaimDto,
  ) {
    return this.claims.reply(req.user, id, dto.message);
  }
  @Patch(":id") review(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: ReviewClaimDto,
  ) {
    return this.claims.review(req.user, id, dto);
  }
}
