import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// Users Table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});

// Rooms Table
export const rooms = pgTable('rooms', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.username),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});

// Messages Table
export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  roomId: text('room_id')
    .notNull()
    .references(() => rooms.id, { onDelete: 'cascade' }),
  username: text('username')
    .notNull()
    .references(() => users.username),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});
