import { IsBoolean, IsIn, IsOptional, IsUUID } from "class-validator";
export class CaseMessageDto {
  @IsIn(["MATCH", "DETAILS"])
  kind!: "MATCH" | "DETAILS";
  @IsOptional()
  @IsUUID()
  matchId?: string;
  @IsOptional()
  @IsBoolean()
  reviewed?: boolean;
}
