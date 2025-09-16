import { relations } from 'drizzle-orm';
import {
  pgTable,
  integer,
  varchar,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const NodeType = {
  user: 'user',
  group: 'group',
} as const;

export const node = pgTable('node', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  email: varchar('email', { length: 300 }).unique('user_email_uq', {
    nulls: 'distinct',
  }),
  type: varchar('type', {
    enum: ['user', 'group'],
  }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const edges = pgTable(
  'edges',
  {
    id: uuid('id').primaryKey(),
    parentId: uuid('parent_id')
      .references(() => node.id)
      .notNull(),
    childId: uuid('child_id')
      .references(() => node.id)
      .notNull(),
    depth: integer('depth'),
  },
  (table) => [uniqueIndex('edge_uq').on(table.parentId, table.childId)],
);

export const nodeRelations = relations(node, ({ many }) => ({
  descendants: many(edges),
  ancestors: many(edges),
}));

export const edgeRelations = relations(edges, ({ one }) => ({
  descendants: one(node, {
    fields: [edges.parentId],
    references: [node.id],
    relationName: 'descendants_edges_rel',
  }),
  ancestors: one(node, {
    fields: [edges.childId],
    references: [node.id],
    relationName: 'ancestors_edges_rel',
  }),
}));
