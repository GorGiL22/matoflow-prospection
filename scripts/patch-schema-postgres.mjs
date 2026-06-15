import fs from "node:fs";

const path = "prisma/schema.prisma";
const source = fs.readFileSync(path, "utf8");

if (source.includes('provider = "postgresql"')) {
  process.exit(0);
}

const postgresDatasource = `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}`;

const updated = source.replace(/datasource db \{[^}]+\}/s, postgresDatasource);
fs.writeFileSync(path, updated);
