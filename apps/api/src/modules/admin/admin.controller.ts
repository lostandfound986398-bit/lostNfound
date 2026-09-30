import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard";
import { AdminService } from "./admin.service";
import { CreateAnnouncementDto } from "./dto/create-announcement.dto";
import { CaseMessageDto } from "./dto/case-message.dto";

@UseGuards(AuthGuard)
@Controller("admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("reports/:id")
  report(@Req() req: AuthenticatedRequest, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.admin.reportDetail(req.user, id);
  }

  @Get("dashboard")
  dashboard(@Req() req: AuthenticatedRequest) {
    return this.admin.dashboard(req.user);
  }

  @Post("reports/:id/message")
  messageReporter(@Req() req: AuthenticatedRequest, @Param("id", new ParseUUIDPipe()) id: string, @Body() input: CaseMessageDto) {
    return this.admin.messageReporter(req.user, id, input);
  }

  @Get("users")
  users(@Req() req: AuthenticatedRequest) {
    return this.admin.users(req.user);
  }

  @Patch("users/:id")
  userStatus(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body("active") active: boolean) {
    return this.admin.setUserStatus(req.user, id, active);
  }

  @Get("master-list")
  masterList(@Req() req: AuthenticatedRequest) {
    return this.admin.masterList(req.user);
  }

  @Get("announcements")
  announcements(@Req() req: AuthenticatedRequest) {
    return this.admin.announcements(req.user);
  }

  @Post("announcements")
  announcement(@Req() req: AuthenticatedRequest, @Body() dto: CreateAnnouncementDto) {
    return this.admin.createAnnouncement(req.user, dto);
  }

  @Get("categories")
  categories(@Req() req: AuthenticatedRequest) {
    return this.admin.getCategories(req.user);
  }

  @Post("categories")
  createCategory(@Req() req: AuthenticatedRequest, @Body("name") name: string) {
    return this.admin.createCategory(req.user, name);
  }

  @Patch("categories/:id")
  toggleCategory(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body("active") active: boolean) {
    return this.admin.toggleCategory(req.user, id, active);
  }

  @Get("locations")
  locations(@Req() req: AuthenticatedRequest) {
    return this.admin.getLocations(req.user);
  }

  @Post("locations")
  createLocation(@Req() req: AuthenticatedRequest, @Body("name") name: string) {
    return this.admin.createLocation(req.user, name);
  }

  @Patch("locations/:id")
  toggleLocation(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body("active") active: boolean) {
    return this.admin.toggleLocation(req.user, id, active);
  }

  @Get("export")
  async export(@Req() req: AuthenticatedRequest, @Query("kind") kind = "reports", @Res() res: Response) {
    const rows = await this.admin.exportRows(req.user, kind);
    const keys = Object.keys(rows[0] ?? {});
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [keys.join(","), ...rows.map((row) => keys.map((key) => escape(row[key])).join(","))].join("\n");
    const filename = `${kind.replace(/_/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
    res.type("text/csv").attachment(filename).send(csv);
  }
}
