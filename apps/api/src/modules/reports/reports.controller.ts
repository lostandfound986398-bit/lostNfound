import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard";
import { CreateReportDto } from "./dto/create-report.dto";
import { ReportsService } from "./reports.service";

@ApiTags("reports")
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
    return this.reports.findAll({ query, category, location, color, type, dateFrom, dateTo });
  }

  @Get("options")
  @ApiOperation({ summary: "Get active report categories and campus locations" })
  options() {
    return this.reports.options();
  }

  @Get("mine")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  mine(@Req() request: AuthenticatedRequest) { return this.reports.findMine(request.user.id); }

  @Get(":id")
  @ApiOperation({ summary: "Get detailed report information" })
  findOne(@Param("id") id: string) {
    return this.reports.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Submit a lost or found item report" })
  @ApiCreatedResponse({ description: "The report was submitted and queued for matching." })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateReportDto) {
    return this.reports.create(request.user, input);
  }
}

