import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DirectoryModule } from "./modules/directory/directory.module";
import { HealthModule } from "./modules/health/health.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ClaimsModule } from "./modules/claims/claims.module";
import { AdminModule } from "./modules/admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    HealthModule,
    DirectoryModule,
    ReportsModule,
    ClaimsModule,
    AdminModule,
  ],
})
export class AppModule {}
