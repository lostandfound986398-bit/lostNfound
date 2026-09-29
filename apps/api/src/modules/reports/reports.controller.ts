import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard";
import { CreateReportDto } from "./dto/create-report.dto";
import { ReportsService } from "./reports.service";

@ApiTags("reports")
@UseGuards(AuthGuard)
@ApiBearerAuth()
@Controller("reports")
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  @ApiOperation({ summary: "Search reports visible to the current user" })
  findAll(
    @Query("q") query?: string,
    @Query("category") category?: string,
    @Query("location") location?: string,
    @Query("color") color?: string,
    @Query("type") type?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
  ) {
    return this.reports.findAll({
      query,
      category,
      location,
      color,
      type,
      dateFrom,
      dateTo,
    });
  }

  @Get("options")
  @ApiOperation({
    summary: "Get active report categories and campus locations",
  })
  options() {
    return this.reports.options();
  }

  @Get("mine")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  mine(@Req() request: AuthenticatedRequest) {
    return this.reports.findMine(request.user.id);
  }

  @Get("updates")
  updates(@Req() req: AuthenticatedRequest) {
    return this.reports.updates(req.user.id);
  }

  @Get("updates/count")
  unreadUpdates(@Req() req: AuthenticatedRequest) {
    return this.reports.unreadUpdates(req.user.id);
  }

  @Post("updates/:id/read")
  readUpdate(
    @Req() req: AuthenticatedRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.reports.readUpdate(req.user.id, id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get detailed report information" })
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reports.findOne(id, req.user);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() input: CreateReportDto,
  ) {
    return this.reports.update(req.user, id, input);
  }

  @Post("photo/discard")
  discardPhoto(@Req() req: AuthenticatedRequest, @Body("key") key: string) {
    return this.reports.discardPhoto(req.user, key);
  }

  @Post(":id/close")
  close(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reports.close(req.user, id);
  }

  @Post()
  @ApiOperation({ summary: "Submit a lost or found item report" })
  @ApiCreatedResponse({
    description: "The report was submitted and queued for matching.",
  })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateReportDto) {
    return this.reports.create(request.user, input);
  }
}
