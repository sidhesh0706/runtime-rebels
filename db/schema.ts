import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const companies = sqliteTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
})

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  loginId: text('login_id').notNull(),
  phone: text('phone'),
  role: text('role').notNull(),
  avatar: text('avatar'),
  passwordHash: text('password_hash').notNull(),
  passwordSalt: text('password_salt').notNull(),
  mustChangePassword: integer('must_change_password', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
}, table => [uniqueIndex('users_email_uq').on(table.email), uniqueIndex('users_login_id_uq').on(table.loginId), index('users_company_idx').on(table.companyId)])

export const sessions = sqliteTable('sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
}, table => [index('sessions_user_idx').on(table.userId), index('sessions_expiry_idx').on(table.expiresAt)])

export const workspaceSnapshots = sqliteTable('workspace_snapshots', {
  workspaceId: text('workspace_id').primaryKey(),
  payload: text('payload').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  ownerId: text('owner_id').notNull(),
  objectKey: text('object_key').notNull(),
  fileName: text('file_name').notNull(),
  contentType: text('content_type').notNull(),
  size: integer('size').notNull(),
  createdAt: text('created_at').notNull(),
}, table => [uniqueIndex('documents_object_key_uq').on(table.objectKey), index('documents_owner_idx').on(table.ownerId)])

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  readAt: text('read_at'),
  createdAt: text('created_at').notNull(),
}, table => [index('notifications_user_read_idx').on(table.userId, table.readAt)])

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  metadata: text('metadata'),
  createdAt: text('created_at').notNull(),
}, table => [index('audit_company_time_idx').on(table.companyId, table.createdAt), index('audit_entity_idx').on(table.entityType, table.entityId)])
