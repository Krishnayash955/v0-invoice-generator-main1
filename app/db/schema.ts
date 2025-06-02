import { pgTable, serial, varchar, text, date, decimal, timestamp, integer, index } from 'drizzle-orm/pg-core';

// Invoices Table
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(), // Auto-incrementing primary key
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  invoiceDate: date('invoice_date').notNull(),
  dueDate: date('due_date').notNull(),
  
  companyName: varchar('company_name', { length: 255 }).notNull(),
  companyAddress: text('company_address').notNull(),
  companyEmail: varchar('company_email', { length: 255 }).notNull(), // Consider .unique() if emails should be unique
  companyPhone: varchar('company_phone', { length: 50 }).notNull(),
  
  clientName: varchar('client_name', { length: 255 }).notNull(),
  clientAddress: text('client_address').notNull(),
  clientEmail: varchar('client_email', { length: 255 }).notNull(),
  
  notes: text('notes'), // Can be null
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(), // e.g., 12345678.90
  status: varchar('status', { length: 50 }).default('draft'), // e.g., 'draft', 'sent', 'paid'
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

// Line Items Table
export const lineItems = pgTable('line_items', {
  id: serial('id').primaryKey(),
  // Foreign key to link to the invoices table
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }), // if an invoice is deleted, its line items are also deleted
  description: text('description').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(), // This is usually (quantity * unitPrice)
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => {
  // Optional: Create an index on invoiceId for faster lookups of line items for a specific invoice
  return {
    invoiceIdIdx: index('idx_line_items_invoice_id').on(table.invoiceId),
  };
});