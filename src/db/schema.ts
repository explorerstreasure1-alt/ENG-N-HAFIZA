import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const publications = pgTable("eh_publications", {
  id: varchar("id", { length: 120 }).primaryKey(),
  languageId: varchar("language_id", { length: 40 }).notNull(),
  level: varchar("level", { length: 8 }).notNull(),
  topicId: varchar("topic_id", { length: 40 }).notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appMeta = pgTable("eh_app_meta", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: text("value").notNull(),
});
