import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  Max,
  Min,
  ValidateNested,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class ReportImageDto {
  @IsString() @IsNotEmpty() storageKey!: string;
  @IsIn(["image/jpeg", "image/png", "image/webp"]) mimeType!: string;
  @IsInt() @Min(1) @Max(10485760) sizeBytes!: number;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

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

  @ApiPropertyOptional({
    description: "Details safe to show to authenticated searchers",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  publicDescription?: string;

  @ApiPropertyOptional({
    description:
      "Confidential ownership details visible only during verification",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  privateVerificationDetails?: string;

  @ApiPropertyOptional({ description: "Uploaded image details" })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReportImageDto)
  images?: ReportImageDto[];
}
