import { Module } from "@nestjs/common";
import { DirectoryController } from "./directory.controller";
import { AuthModule } from "../auth/auth.module";

@Module({ imports: [AuthModule], controllers: [DirectoryController] })
export class DirectoryModule {}
