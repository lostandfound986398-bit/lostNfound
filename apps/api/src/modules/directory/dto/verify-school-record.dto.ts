import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";

export class VerifySchoolRecordDto {
  @ApiProperty({ example: "STUDENT", enum: ["STUDENT", "FACULTY", "STAFF"] })
  @IsIn(["STUDENT", "FACULTY", "STAFF"])
  role!: "STUDENT" | "FACULTY" | "STAFF";

  @ApiProperty({ example: "2026-00123" })
  @IsString()
  @Matches(/^[A-Za-z0-9-]{4,32}$/)
  schoolId!: string;

  @ApiProperty({ example: "Jupiter D. Student" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;
}

