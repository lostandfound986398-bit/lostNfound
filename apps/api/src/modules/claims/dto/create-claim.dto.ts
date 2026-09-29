import { ApiProperty } from "@nestjs/swagger";
import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class CreateClaimDto {
  @ApiProperty() @IsUUID() reportId!: string;
  @ApiProperty({ example: { distinguishingMarks: "Initials inside" } })
  @IsObject()
  ownershipAnswers!: Record<string, string>;
}

export class ReviewClaimDto {
  @ApiProperty({
    enum: ["NEEDS_INFORMATION", "APPROVED", "REJECTED", "RELEASED"],
  })
  @IsIn(["NEEDS_INFORMATION", "APPROVED", "REJECTED", "RELEASED"])
  status!: "NEEDS_INFORMATION" | "APPROVED" | "REJECTED" | "RELEASED";
  @ApiProperty({ required: false }) @IsString() @MaxLength(2000) notes = "";
}

export class ReplyClaimDto {
  @IsString() @IsNotEmpty() @MaxLength(2000) message!: string;
}
