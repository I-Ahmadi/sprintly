import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Prisma CLI commands (including migrations) need a session/direct
    // connection. The running app uses the pooled DATABASE_URL separately.
    url: env("DIRECT_URL"),
  },
});
