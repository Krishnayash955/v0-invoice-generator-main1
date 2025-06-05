import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';

// MongoDB connection
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  try {
    // Use a default MongoDB URI if not provided in environment variables
    const uri = process.env.MONGODB_URI || 'mongodb+srv://krishnayash955:krishnayash955@cluster0.mongodb.net/invoice-generator?retryWrites=true&w=majority';
    
    console.log('Connecting to MongoDB with URI:', uri.substring(0, 20) + '...');
    
    // Connect to MongoDB with auto-create options
    await mongoose.connect(uri);
    
    isConnected = true;
    console.log('Connected to MongoDB successfully');
    
    // Ensure the Invoice model is initialized which will create the collection if it doesn't exist
    if (mongoose.models.Invoice) {
      // Force a simple operation to ensure the collection exists
      const count = await mongoose.models.Invoice.countDocuments({});
      console.log(`Found ${count} existing invoices in the database`);
    }
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
};

// Define the schema for line items
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
  }
}, { timestamps: true });

// Define the schema for invoices
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

// Create the model
const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);

// Validation schema for input data
const lineItemSchemaZod = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive"),
});

const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid invoice date" }),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid due date" }),
  companyName: z.string().min(1, "Company name is required"),
  companyAddress: z.string().min(1, "Company address is required"),
  companyEmail: z.string().email("Invalid company email"),
  companyPhone: z.string().min(1, "Company phone is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientAddress: z.string().min(1, "Client address is required"),
  clientEmail: z.string().email("Invalid client email"),
  notes: z.string().optional(),
  totalAmount: z.number().positive("Total amount must be positive"),
  lineItems: z.array(lineItemSchemaZod).min(1, "At least one line item is required"),
  status: z.string().optional().default('draft'),
});

// GET handler to fetch all invoices
export async function GET() {
  try {
    await connectToDatabase();
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { message: 'Failed to fetch invoices', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST handler to create a new invoice
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate the input data
    const validationResult = invoiceFormSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Validation error', 
          errors: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    
    // Connect to the database
    await connectToDatabase();
    
    // Create a new invoice
    const invoice = new Invoice(validatedData);
    const savedInvoice = await invoice.save();
    
    return NextResponse.json(savedInvoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { message: 'Failed to create invoice', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}