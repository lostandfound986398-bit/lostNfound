import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateReportDto {
  @ApiProperty({ enum: ["LOST", "FOUND"] })
  @IsIn(["LOST", "FOUND"])
  type!: "LOST" | "FOUND";

  @ApiProperty({ example: "Brown leather wallet" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @ApiProperty({ example: "Wallets" })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ example: "Brown" })
  @IsString()
  @IsNotEmpty()
  color!: string;

  @ApiProperty({ example: "Main Library" })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiProperty({ example: "2026-08-01T10:00:00.000Z" })
  @IsDateString()
  occurredAt!: string;

  @ApiPropertyOptional({ description: "Details safe to show to authenticated searchers" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  publicDescription?: string;

  @ApiPropertyOptional({ description: "Confidential ownership details visible only during verification" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  privateVerificationDetails?: string;

  @ApiPropertyOptional({ description: "Uploaded image details" })
  @IsOptional()
  images?: { storageKey: string; mimeType: string; sizeBytes: number; isPrimary?: boolean }[];
}


