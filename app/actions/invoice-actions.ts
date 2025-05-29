"use server";

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { revalidatePath } from "next/cache";
import { formatDate } from "../utils/format-utils"; // Renamed for clarity from your original formatDate
import type { InvoiceData } from "../types/invoice-types";

import { db } from "@/app/db"; // Ensure this path is correct
import { invoices, lineItems } from "@/app/db/schema"; // Ensure this path is correct
import { z } from "zod";

// Helper to format Date to YYYY-MM-DD string for DB insertion
function formatDateToYYYYMMDD(date: Date | string): string {
  const d = new Date(date); // Handles both Date objects and date strings
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
  notes: z.string().optional(),
  totalAmount: z.number().positive("Total amount must be positive"),
  lineItems: z.array(lineItemSchemaInternal).min(1, "At least one line item is required"),
  status: z.string().optional().default('draft'),
});


export async function saveInvoice(inputData: unknown) { // Receive unknown, then validate
  console.log("Starting saveInvoice with Drizzle, raw inputData:", inputData);

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
    const newInvoiceResult = await db.transaction(async (tx) => {
      const [insertedInvoice] = await tx.insert(invoices).values({
        invoiceNumber: validatedData.invoiceNumber,
        invoiceDate: formatDateToYYYYMMDD(validatedData.invoiceDate), // Format to YYYY-MM-DD string
        dueDate: formatDateToYYYYMMDD(validatedData.dueDate),         // Format to YYYY-MM-DD string
        companyName: validatedData.companyName,
        companyAddress: validatedData.companyAddress,
        companyEmail: validatedData.companyEmail,
        companyPhone: validatedData.companyPhone,
        clientName: validatedData.clientName,
        clientAddress: validatedData.clientAddress,
        clientEmail: validatedData.clientEmail,
        notes: validatedData.notes || "", // Ensure notes is not undefined
        totalAmount: validatedData.totalAmount.toString(), // Drizzle decimal often expects string
        status: validatedData.status,
        // createdAt and updatedAt have defaultNow() in schema, so not needed here explicitly
      }).returning({ insertedId: invoices.id });

      if (!insertedInvoice || !insertedInvoice.insertedId) {
        console.error("Failed to insert invoice into DB or get ID back");
        throw new Error("Failed to insert invoice record.");
      }
      const invoiceId = insertedInvoice.insertedId;
      console.log("Invoice inserted with Drizzle, ID:", invoiceId);

      if (validatedData.lineItems && validatedData.lineItems.length > 0) {
        const itemsToInsert = validatedData.lineItems.map(item => ({
          invoiceId: invoiceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(), // Drizzle decimal
          amount: (item.quantity * item.unitPrice).toString(), // Drizzle decimal
        }));
        await tx.insert(lineItems).values(itemsToInsert);
        console.log("Line items inserted for invoice ID:", invoiceId);
      }
      return { invoiceId };
    });

    console.log("Transaction committed successfully with Drizzle");

    revalidatePath("/");
    revalidatePath(`/invoices/${newInvoiceResult.invoiceId}`);
    return { success: true, invoiceId: newInvoiceResult.invoiceId };

  } catch (error) {
    console.error("Error saving invoice with Drizzle:", error);
    let message = "Failed to save invoice.";
    if (error instanceof Error && error.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    return { success: false, message: message };
  }
}

// Assuming InvoiceData type is defined such that totalAmount is number (not optional for PDF)
export async function generateInvoice(data: InvoiceData): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const titleFontSize = 24;
  const headerFontSize = 12;
  const normalFontSize = 10;

  page.drawText("INVOICE", {
    x: 50,
    y: height - 50,
    size: titleFontSize,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
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

  page.drawRectangle({
    x: tableLeft,
    y: tableTop - 25,
    width: tableRight - tableLeft,
    height: 25,
    color: rgb(0.9, 0.9, 0.9),
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });

  page.drawText("Description", {
    x: tableLeft + 10,
    y: tableTop - 15,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText("Quantity", {
    x: tableLeft + columnWidths[0] + 10,
    y: tableTop - 15,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText("Unit Price", {
    x: tableLeft + columnWidths[0] + columnWidths[1] + 10,
    y: tableTop - 15,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText("Amount", {
    x: tableLeft + columnWidths[0] + columnWidths[1] + columnWidths[2] + 10,
    y: tableTop - 15,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  let yPosition = tableTop - 45; // Start items lower
  // let currentTotal = 0; // Calculate from line items for PDF accuracy

  data.lineItems.forEach((item, index) => {
    const amount = item.quantity * item.unitPrice;
    // currentTotal += amount;

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

  yPosition -= 5; // Space before total line

  page.drawRectangle({
    x: tableLeft + columnWidths[0] + columnWidths[1],
    y: yPosition - 15 + 2, // Adjust y
    width: tableRight - (tableLeft + columnWidths[0] + columnWidths[1]),
    height: 30,
    color: rgb(0.95, 0.95, 0.95),
  });

  page.drawText("Total:", {
    x: tableLeft + columnWidths[0] + columnWidths[1] + 10,
    y: yPosition,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  // Use data.totalAmount for the PDF as it's likely pre-calculated and validated
  page.drawText(`$${(data.totalAmount ?? 0).toFixed(2)}`, {
    x: tableLeft + columnWidths[0] + columnWidths[1] + columnWidths[2] + 10,
    y: yPosition,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPosition -= 30; // Space after total

  if (data.notes && data.notes.trim() !== "") {
    yPosition -= 20;
    page.drawText("NOTES:", {
      x: tableLeft,
      y: yPosition,
      size: headerFontSize,
      font: helveticaBold,
      color: rgb(0.4, 0.4, 0.4),
    });
    yPosition -= 20;

    const notesLines = data.notes.split("\n");
    notesLines.forEach((line) => {
      page.drawText(line, {
        x: tableLeft + 10,
        y: yPosition,
        size: normalFontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
    });
  }

  page.drawText("Thank you for your business!", {
    x: width / 2 - 80,
    y: 50,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}