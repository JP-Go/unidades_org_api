import { pgTable, integer, varchar, timestamp } from 'drizzle-orm/pg-core';

export const NodeType = {
  user: 'user',
  group: 'group',
} as const;

export const node = pgTable('node', {
  id: integer('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  email: varchar('email', { length: 300 }).unique('user_email_uq', {
    nulls: 'not distinct',
  }),
  type: varchar('type', {
    enum: ['user', 'group'],
  }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const nodesClosure = pgTable('nodes_closure', {
  id: integer('id').primaryKey(),
  parentId: integer('parent_id')
    .references(() => node.id)
    .notNull(),
  childId: integer('child_id')
    .references(() => node.id)
    .notNull(),
  depth: integer('depth'),
});

export type CreateNode = typeof node.$inferInsert;
export type SelectNode = typeof node.$inferSelect;
