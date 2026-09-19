import { Controller, Get, Module } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("system")
@Controller("health")
class HealthController {
  @Get()
  @ApiOperation({ summary: "Check API availability" })
  check() {
    return {
      status: "ok",
      service: "cbea-lost-and-found-api",
      timestamp: new Date().toISOString(),
    };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}

