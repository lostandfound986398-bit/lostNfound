import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
export class CreateAnnouncementDto {
  @IsString() @IsNotEmpty() @MaxLength(160) title!: string;
  @IsString() @IsNotEmpty() @MaxLength(4000) body!: string;
  @IsOptional() @IsIn(["STUDENT", "FACULTY", "STAFF"]) audience?: "STUDENT" | "FACULTY" | "STAFF";
}
