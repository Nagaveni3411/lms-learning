import dotenv from "dotenv";

dotenv.config();

const frontendOrigins = (process.env.FRONTEND_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  frontendOrigins,
};
