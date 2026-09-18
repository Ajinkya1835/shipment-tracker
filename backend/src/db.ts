import { PrismaClient } from "@prisma/client";
import { process } from "zod/v4/core/to-json-schema.cjs";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"],
});