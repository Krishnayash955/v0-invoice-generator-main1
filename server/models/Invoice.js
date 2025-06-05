const mongoose = require('mongoose');

// Line Item Schema (Sub-document)
const lineItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be positive']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price must be positive']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required']
  }
}, { timestamps: true });

// Invoice Schema
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    trim: true
  },
  invoiceDate: {
    type: Date,
    required: [true, 'Invoice date is required']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  companyAddress: {
    type: String,
    required: [true, 'Company address is required'],
    trim: true
  },
  companyEmail: {
    type: String,
    required: [true, 'Company email is required'],
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  companyPhone: {
    type: String,
    required: [true, 'Company phone is required'],
    trim: true
  },
  
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  clientAddress: {
    type: String,
    required: [true, 'Client address is required'],
    trim: true
  },
  clientEmail: {
    type: String,
    required: [true, 'Client email is required'],
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount must be positive']
  },
  status: {
    type: String,
    default: 'draft',
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled']
  },
  
  lineItems: [lineItemSchema]
}, { timestamps: true });

// Create and export the model
const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;