import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsIn, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ enum: ["STUDENT", "FACULTY", "STAFF"] })
  @IsIn(["STUDENT", "FACULTY", "STAFF"])
  role!: "STUDENT" | "FACULTY" | "STAFF";

  @ApiProperty({ example: "TEST-STU-0001" })
  @Matches(/^[A-Za-z0-9-]{4,32}$/)
  schoolId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  fullName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;
}

