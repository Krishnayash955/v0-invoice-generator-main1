import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// MongoDB connection
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  try {
    // Connect to MongoDB with auto-create options
    await mongoose.connect(process.env.MONGODB_URI || '', {
      autoCreate: true, // Automatically create the database if it doesn't exist
      autoIndex: true   // Build indexes
    });
    
    isConnected = true;
    console.log('Connected to MongoDB');
    
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

// Define the schema for line items (same as in the main route file)
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

// Define the schema for invoices (same as in the main route file)
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

// GET handler to fetch a single invoice by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const id = params.id;
    
    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid invoice ID' },
        { status: 400 }
      );
    }
    
    const invoice = await Invoice.findById(id);
    
    if (!invoice) {
      return NextResponse.json(
        { message: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { message: 'Failed to fetch invoice', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT handler to update an invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const id = params.id;
    const data = await request.json();
    
    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid invoice ID' },
        { status: 400 }
      );
    }
    
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );
    
    if (!updatedInvoice) {
      return NextResponse.json(
        { message: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { message: 'Failed to update invoice', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE handler to delete an invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const id = params.id;
    
    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid invoice ID' },
        { status: 400 }
      );
    }
    
    const deletedInvoice = await Invoice.findByIdAndDelete(id);
    
    if (!deletedInvoice) {
      return NextResponse.json(
        { message: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { message: 'Failed to delete invoice', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}