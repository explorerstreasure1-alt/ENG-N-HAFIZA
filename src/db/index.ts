import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

let poolInstance: Pool | null = null;

export function getPool(): Pool {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
  if (!poolInstance) {
    poolInstance = new Pool({ connectionString: databaseUrl });
  }
  return poolInstance;
}

// Veritabanı olmadan da modülün import edilebilmesi için db'i lazy tutuyoruz.
export const db = new Proxy({} as any, {
  get(_target, prop: string) {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required. Vercel Blob kullanılıyor; PostgreSQL gerektirilmiyor.");
    }
    if (!poolInstance) {
      poolInstance = new Pool({ connectionString: databaseUrl });
    }
    return drizzle(poolInstance)[prop as keyof ReturnType<typeof drizzle>];
  },
});
