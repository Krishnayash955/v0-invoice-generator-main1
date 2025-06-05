"use client";

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatDate } from "../utils/format-utils";
import type { InvoiceData } from "../types/invoice-types";
import axios from "axios";
import { z } from "zod";

// API base URL - will be used for all API calls
const API_BASE_URL = "/api";

const lineItemSchemaInternal = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive"),
});

const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  // Keep dates as strings from form, validate they are valid date strings
  invoiceDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid invoice date" }),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid due date" }),
  companyName: z.string().min(1, "Company name is required"),
  companyAddress: z.string().min(1, "Company address is required"),
  companyEmail: z.string().email("Invalid company email"),
  companyPhone: z.string().min(1, "Company phone is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientAddress: z.string().min(1, "Client address is required"),
  clientEmail: z.string().email("Invalid client email"),
  totalAmount: z.number().positive("Total amount must be positive"),
  lineItems: z.array(lineItemSchemaInternal).min(1, "At least one line item is required"),
  status: z.string().optional().default('draft'),
});

export async function saveInvoice(inputData: unknown) {
  console.log("Starting saveInvoice with MongoDB API, raw inputData:", inputData);

  const validationResult = invoiceFormSchema.safeParse(inputData);
  if (!validationResult.success) {
    console.error("Invoice data validation failed:", validationResult.error.flatten().fieldErrors);
    return {
      success: false,
      message: "Invalid invoice data.",
      errors: validationResult.error.flatten().fieldErrors,
    };
  }
  
  const validatedData = validationResult.data;
  console.log("Validated data:", validatedData);

  try {
    // Send the validated data to the API
    const response = await axios.post(`${API_BASE_URL}/invoices`, validatedData);
    
    console.log("Invoice saved successfully:", response.data);
    
    return { 
      success: true, 
      invoiceId: response.data._id,
      message: "Invoice saved successfully" 
    };
  } catch (error: unknown) {
    console.error("Error saving invoice:", error);
    
    // Handle axios error responses
    if (axios.isAxiosError(error) && error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("API error response:", error.response.data);
      
      return { 
        success: false, 
        message: error.response.data.message || "Failed to save invoice",
        errors: error.response.data.errors 
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      let message = "Failed to save invoice.";
      if (error instanceof Error && error.message) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      return { success: false, message: message };
    }
  }
}

export async function updateInvoice(id: string, inputData: unknown) {
  console.log(`Starting updateInvoice for ID: ${id}, raw inputData:`, inputData);

  const validationResult = invoiceFormSchema.safeParse(inputData);
  if (!validationResult.success) {
    console.error("Invoice data validation failed:", validationResult.error.flatten().fieldErrors);
    return {
      success: false,
      message: "Invalid invoice data.",
      errors: validationResult.error.flatten().fieldErrors,
    };
  }
  
  const validatedData = validationResult.data;
  console.log("Validated data:", validatedData);

  try {
    // Send the validated data to the API
    const response = await axios.put(`${API_BASE_URL}/invoices/${id}`, validatedData);
    
    console.log("Invoice updated successfully:", response.data);
    
    return { 
      success: true, 
      invoiceId: response.data._id,
      message: "Invoice updated successfully" 
    };
  } catch (error: unknown) {
    console.error("Error updating invoice:", error);
    
    // Handle axios error responses
    if (axios.isAxiosError(error) && error.response) {
      console.error("API error response:", error.response.data);
      
      return { 
        success: false, 
        message: error.response.data.message || "Failed to update invoice",
        errors: error.response.data.errors 
      };
    } else {
      let message = "Failed to update invoice.";
      if (error instanceof Error && error.message) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      return { success: false, message: message };
    }
  }
}

export async function deleteInvoice(id: string) {
  console.log(`Starting deleteInvoice for ID: ${id}`);

  try {
    // Send the delete request to the API
    const response = await axios.delete(`${API_BASE_URL}/invoices/${id}`);
    
    console.log("Invoice deleted successfully:", response.data);
    
    return { 
      success: true, 
      message: "Invoice deleted successfully" 
    };
  } catch (error: unknown) {
    console.error("Error deleting invoice:", error);
    
    // Handle axios error responses
    if (axios.isAxiosError(error) && error.response) {
      console.error("API error response:", error.response.data);
      
      return { 
        success: false, 
        message: error.response.data.message || "Failed to delete invoice"
      };
    } else {
      let message = "Failed to delete invoice.";
      if (error instanceof Error && error.message) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      return { success: false, message: message };
    }
  }
}

export async function fetchInvoices() {
  console.log("Starting fetchInvoices");

  try {
    const response = await axios.get(`${API_BASE_URL}/invoices`);
    console.log("Invoices fetched successfully:", response.data);
    
    return { 
      success: true, 
      invoices: response.data,
      message: "Invoices fetched successfully" 
    };
  } catch (error: unknown) {
    console.error("Error fetching invoices:", error);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error("API error response:", error.response.data);
      
      return { 
        success: false, 
        message: error.response.data.message || "Failed to fetch invoices",
        invoices: []
      };
    } else {
      let message = "Failed to fetch invoices.";
      if (error instanceof Error && error.message) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      return { success: false, message: message, invoices: [] };
    }
  }
}

// Assuming InvoiceData type is defined such that totalAmount is number (not optional for PDF)
export async function generateInvoice(data: InvoiceData): Promise<Blob> {
  // Calculate total amount if not provided
  if (data.totalAmount === undefined) {
    data.totalAmount = data.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const titleFontSize = 24;
  const headerFontSize = 12;
  const normalFontSize = 10;

  // Draw header background
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width: width,
    height: 80,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  // Draw invoice title
  page.drawText("INVOICE", {
    x: 50,
    y: height - 50,
    size: titleFontSize,
    font: helveticaBold,
    color: rgb(1, 1, 1), // White text
  });

  page.drawText(data.companyName, {
    x: 50,
    y: height - 90,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  const companyAddressLines = data.companyAddress.split("\n");
  companyAddressLines.forEach((line, index) => {
    page.drawText(line, {
      x: 50,
      y: height - 110 - index * 15,
      size: normalFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
  });

  page.drawText(`Email: ${data.companyEmail}`, {
    x: 50,
    y: height - 110 - companyAddressLines.length * 15,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Phone: ${data.companyPhone}`, {
    x: 50,
    y: height - 125 - companyAddressLines.length * 15,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Invoice #: ${data.invoiceNumber}`, {
    x: width - 200,
    y: height - 90,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  // Use formatDateForDisplay (or your original formatDate if it handles Date objects or valid date strings)
  page.drawText(`Date: ${formatDate(data.invoiceDate)}`, {
    x: width - 200,
    y: height - 105,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Due Date: ${formatDate(data.dueDate)}`, {
    x: width - 200,
    y: height - 120,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  // Add status with background
  const status = data.status?.toUpperCase() || 'UNPAID';
  const statusColor = status === 'PAID' ? rgb(0.2, 0.7, 0.2) : rgb(0.8, 0.2, 0.2); // Green for paid, red for unpaid
  
  page.drawText(`Status:`, {
    x: width - 200,
    y: height - 135,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  // Status background
  page.drawRectangle({
    x: width - 150,
    y: height - 145,
    width: 70,
    height: 18,
    color: statusColor,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });
  
  // Status text
  page.drawText(status, {
    x: width - 145,
    y: height - 135,
    size: normalFontSize,
    font: helveticaBold,
    color: rgb(1, 1, 1), // White text
  });

  page.drawLine({
    start: { x: 50, y: height - 150 },
    end: { x: width - 50, y: height - 150 },
    thickness: 2,
    color: rgb(0.8, 0.8, 0.8),
  });

  page.drawText("BILL TO:", {
    x: 50,
    y: height - 180,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText(data.clientName, {
    x: 50,
    y: height - 200,
    size: normalFontSize,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  const clientAddressLines = data.clientAddress.split("\n");
  clientAddressLines.forEach((line, index) => {
    page.drawText(line, {
      x: 50,
      y: height - 215 - index * 15,
      size: normalFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
  });

  page.drawText(`Email: ${data.clientEmail}`, {
    x: 50,
    y: height - 215 - clientAddressLines.length * 15,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  const tableTop = height - 280;
  const tableLeft = 50;
  const tableRight = width - 50;
  const columnWidths = [280, 70, 80, 90]; // Adjusted for potentially wider content

  // Draw table header with a darker background
  page.drawRectangle({
    x: tableLeft,
    y: tableTop - 25,
    width: tableRight - tableLeft,
    height: 25,
    color: rgb(0.2, 0.2, 0.2), // Darker background
    borderColor: rgb(0.1, 0.1, 0.1),
    borderWidth: 1,
  });

  // Table headers with white text
  page.drawText("Description", {
    x: tableLeft + 10,
    y: tableTop - 15,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(1, 1, 1), // White text
  });
  page.drawText("Quantity", {
    x: tableLeft + columnWidths[0] + 10,
    y: tableTop - 15,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(1, 1, 1), // White text
  });
  page.drawText("Unit Price", {
    x: tableLeft + columnWidths[0] + columnWidths[1] + 10,
    y: tableTop - 15,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(1, 1, 1), // White text
  });
  page.drawText("Amount", {
    x: tableLeft + columnWidths[0] + columnWidths[1] + columnWidths[2] + 10,
    y: tableTop - 15,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(1, 1, 1), // White text
  });

  let yPosition = tableTop - 45; // Start items lower

  data.lineItems.forEach((item, index) => {
    const amount = item.quantity * item.unitPrice;

    if (index % 2 === 0) {
      page.drawRectangle({
        x: tableLeft,
        y: yPosition - 15 + 5, // Adjust y
        width: tableRight - tableLeft,
        height: 25,
        color: rgb(0.97, 0.97, 0.97),
      });
    }

    page.drawText(item.description, {
      x: tableLeft + 10,
      y: yPosition,
      size: normalFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    page.drawText(item.quantity.toString(), {
      x: tableLeft + columnWidths[0] + 10,
      y: yPosition,
      size: normalFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    page.drawText(`$${item.unitPrice.toFixed(2)}`, {
      x: tableLeft + columnWidths[0] + columnWidths[1] + 10,
      y: yPosition,
      size: normalFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    page.drawText(`$${amount.toFixed(2)}`, {
      x: tableLeft + columnWidths[0] + columnWidths[1] + columnWidths[2] + 10,
      y: yPosition,
      size: normalFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 25;
  });

  yPosition -= 5; // Space before totals section

  // Calculate tax and total
  const subtotal = data.totalAmount ?? 0;
  const taxRate = 0.05; // 5% tax
  const taxAmount = subtotal * taxRate;
  const grandTotal = subtotal + taxAmount;

  // Subtotal
  page.drawText("Subtotal:", {
    x: tableLeft + columnWidths[0] + columnWidths[1] + 10,
    y: yPosition,
    size: normalFontSize,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  page.drawText(`$${subtotal.toFixed(2)}`, {
    x: tableLeft + columnWidths[0] + columnWidths[1] + columnWidths[2] + 10,
    y: yPosition,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  yPosition -= 20;

  // Tax (5%)
  page.drawText("Tax (5%):", {
    x: tableLeft + columnWidths[0] + columnWidths[1] + 10,
    y: yPosition,
    size: normalFontSize,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  page.drawText(`$${taxAmount.toFixed(2)}`, {
    x: tableLeft + columnWidths[0] + columnWidths[1] + columnWidths[2] + 10,
    y: yPosition,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  yPosition -= 20;

  // Total with background
  page.drawRectangle({
    x: tableLeft + columnWidths[0] + columnWidths[1],
    y: yPosition - 15 + 2, // Adjust y
    width: tableRight - (tableLeft + columnWidths[0] + columnWidths[1]),
    height: 30,
    color: rgb(0.2, 0.2, 0.2), // Darker background for total
  });

  page.drawText("TOTAL:", {
    x: tableLeft + columnWidths[0] + columnWidths[1] + 10,
    y: yPosition,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(1, 1, 1), // White text
  });
  
  page.drawText(`$${grandTotal.toFixed(2)}`, {
    x: tableLeft + columnWidths[0] + columnWidths[1] + columnWidths[2] + 10,
    y: yPosition,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(1, 1, 1), // White text
  });
  
  yPosition -= 30; // Space after total

  // Add payment information section
  yPosition -= 20;
  page.drawText("PAYMENT INFORMATION", {
    x: tableLeft,
    y: yPosition,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPosition -= 20;

  page.drawText("Please make payment via bank transfer to:", {
    x: tableLeft + 10,
    y: yPosition,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 20;

  // Bank details
  page.drawText("Bank Name:", {
    x: tableLeft + 10,
    y: yPosition,
    size: normalFontSize,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  page.drawText("International Bank", {
    x: tableLeft + 100,
    y: yPosition,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 15;

  page.drawText("Account Name:", {
    x: tableLeft + 10,
    y: yPosition,
    size: normalFontSize,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  page.drawText(data.companyName, {
    x: tableLeft + 100,
    y: yPosition,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 15;

  page.drawText("Account Number:", {
    x: tableLeft + 10,
    y: yPosition,
    size: normalFontSize,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  page.drawText("1234567890", {
    x: tableLeft + 100,
    y: yPosition,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 30;

  // Footer
  const footerY = 50;
  
  page.drawLine({
    start: { x: 50, y: footerY + 30 },
    end: { x: width - 50, y: footerY + 30 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  page.drawText("Thank you for your business!", {
    x: width / 2 - 80,
    y: footerY + 15,
    size: normalFontSize,
    font: helveticaBold,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  // Add invoice generation date with consistent formatting
  const date = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentDate = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  page.drawText(`Invoice generated on ${currentDate}`, {
    x: width / 2 - 100,
    y: footerY,
    size: 8, // Smaller font
    font: helveticaFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  // Add payment terms
  page.drawText("Payment terms: Due within 30 days of issue", {
    x: width / 2 - 120,
    y: footerY - 15,
    size: 8, // Smaller font
    font: helveticaFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}