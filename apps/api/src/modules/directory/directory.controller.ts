import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { VerifySchoolRecordDto } from "./dto/verify-school-record.dto";
import { AuthService } from "../auth/auth.service";

@ApiTags("directory")
@Controller("directory")
export class DirectoryController {
  constructor(private readonly auth: AuthService) {}

  @Post("verify")
  @ApiOperation({ summary: "Verify a user against the official CBEA directory" })
  async verify(@Body() request: VerifySchoolRecordDto) {
    const record = await this.auth.findDirectoryRecord(request.role, request.schoolId, request.fullName);
    return { verified: true, role: record.role, emailRequired: Boolean(record.email) };
  }
}
