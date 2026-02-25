import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const isDev = process.env.NODE_ENV !== "production";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: isDev
      ? "postgresql://postgres:postgres@localhost:5432/overlaply"
      : env("DATABASE_URL"),
  },
});
