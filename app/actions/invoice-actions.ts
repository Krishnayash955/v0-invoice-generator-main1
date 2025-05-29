"use server"

import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import mysql, { ResultSetHeader } from "mysql2/promise"
import { revalidatePath } from "next/cache"
import { initializeDatabase } from "../db/init-db"
import { formatDate } from "../utils/format-utils"
import type { InvoiceData } from "../types/invoice-types"

// Configure the local MySQL connection
const pool = mysql.createPool({
  host: "localhost", // Replace with your database host
  user: "root", // Replace with your MySQL username
  password: "", // Replace with your MySQL password
  database: "invoice_generator", // Replace with your database name
  port: 3306, // Replace with your MySQL port if different
})

export async function saveInvoice(data: InvoiceData) {
  const connection = await pool.getConnection()
  try {
    console.log("Starting saveInvoice with data:", data)

    // Initialize database tables if they don't exist
    const dbInit = await initializeDatabase()
    console.log("Database initialization result:", dbInit)
    if (!dbInit.success) {
      throw new Error(`Database initialization failed: ${dbInit.message}`)
    }

    // Start a transaction
    await connection.beginTransaction()

    // Insert the invoice
    const [result] = await connection.query(
      `
      INSERT INTO invoices (
        invoice_number, 
        invoice_date, 
        due_date, 
        company_name, 
        company_address, 
        company_email, 
        company_phone, 
        client_name, 
        client_address, 
        client_email, 
        notes, 
        total_amount
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.invoiceNumber,
        data.invoiceDate,
        data.dueDate,
        data.companyName,
        data.companyAddress,
        data.companyEmail,
        data.companyPhone,
        data.clientName,
        data.clientAddress,
        data.clientEmail,
        data.notes || "",
        data.totalAmount || 0,
      ]
    )
    console.log("Invoice inserted, result:", result)

    const invoiceId = (result as ResultSetHeader).insertId

    // Insert line items
    for (const item of data.lineItems) {
      console.log("Inserting line item:", item)
      await connection.query(
        `
        INSERT INTO line_items (
          invoice_id, 
          description, 
          quantity, 
          unit_price, 
          amount
        ) 
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          invoiceId,
          item.description,
          item.quantity,
          item.unitPrice,
          item.quantity * item.unitPrice,
        ]
      )
    }

    // Commit the transaction
    await connection.commit()
    console.log("Transaction committed successfully")

    revalidatePath("/")
    return { success: true, invoiceId }
  } catch (error) {
    // Rollback the transaction in case of an error
    await connection.rollback()
    console.error("Error saving invoice:", error)
    throw new Error(`Failed to save invoice: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    connection.release()
  }
}
export async function generateInvoice(data: InvoiceData): Promise<Blob> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
  const { width, height } = page.getSize()

  // Load fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Set font sizes
  const titleFontSize = 24
  const headerFontSize = 12
  const normalFontSize = 10

  // Draw company information
  page.drawText("INVOICE", {
    x: 50,
    y: height - 50,
    size: titleFontSize,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  })

  // Company details
  page.drawText(data.companyName, {
    x: 50,
    y: height - 90,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  })

  const companyAddressLines = data.companyAddress.split("\n")
  companyAddressLines.forEach((line, index) => {
    page.drawText(line, {
      x: 50,
      y: height - 110 - index * 15,
      size: normalFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    })
  })

  page.drawText(`Email: ${data.companyEmail}`, {
    x: 50,
    y: height - 110 - companyAddressLines.length * 15,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  })

  page.drawText(`Phone: ${data.companyPhone}`, {
    x: 50,
    y: height - 125 - companyAddressLines.length * 15,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  })

  // Invoice details
  page.drawText(`Invoice #: ${data.invoiceNumber}`, {
    x: width - 200,
    y: height - 90,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  })

  page.drawText(`Date: ${formatDate(data.invoiceDate)}`, {
    x: width - 200,
    y: height - 105,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  })

  page.drawText(`Due Date: ${formatDate(data.dueDate)}`, {
    x: width - 200,
    y: height - 120,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  })

  // Draw a decorative line
  page.drawLine({
    start: { x: 50, y: height - 150 },
    end: { x: width - 50, y: height - 150 },
    thickness: 2,
    color: rgb(0.8, 0.8, 0.8),
  })

  // Bill To
  page.drawText("BILL TO:", {
    x: 50,
    y: height - 180,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(0.4, 0.4, 0.4),
  })

  page.drawText(data.clientName, {
    x: 50,
    y: height - 200,
    size: normalFontSize,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  })

  const clientAddressLines = data.clientAddress.split("\n")
  clientAddressLines.forEach((line, index) => {
    page.drawText(line, {
      x: 50,
      y: height - 215 - index * 15,
      size: normalFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    })
  })

  page.drawText(`Email: ${data.clientEmail}`, {
    x: 50,
    y: height - 215 - clientAddressLines.length * 15,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  })

  // Line items header
  const tableTop = height - 280
  const tableLeft = 50
  const tableRight = width - 50
  const columnWidths = [300, 80, 80, 80]

  // Draw table header with a background
  page.drawRectangle({
    x: tableLeft,
    y: tableTop - 25,
    width: tableRight - tableLeft,
    height: 25,
    color: rgb(0.9, 0.9, 0.9),
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  })

  page.drawText("Description", {
    x: tableLeft + 10,
    y: tableTop - 15,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  })

  page.drawText("Quantity", {
    x: tableLeft + columnWidths[0],
    y: tableTop - 15,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  })

  page.drawText("Unit Price", {
    x: tableLeft + columnWidths[0] + columnWidths[1],
    y: tableTop - 15,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  })

  page.drawText("Amount", {
    x: tableLeft + columnWidths[0] + columnWidths[1] + columnWidths[2],
    y: tableTop - 15,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  })

  // Draw line items
  let yPosition = tableTop - 40
  let total = 0

  data.lineItems.forEach((item, index) => {
    const amount = item.quantity * item.unitPrice
    total += amount

    // Alternate row background for better readability
    if (index % 2 === 0) {
      page.drawRectangle({
        x: tableLeft,
        y: yPosition - 15,
        width: tableRight - tableLeft,
        height: 25,
        color: rgb(0.97, 0.97, 0.97),
        borderColor: rgb(0.9, 0.9, 0.9),
        borderWidth: 0,
      })
    }

    page.drawText(item.description, {
      x: tableLeft + 10,
      y: yPosition,
      size: normalFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    })

    page.drawText(item.quantity.toString(), {
      x: tableLeft + columnWidths[0],
      y: yPosition,
      size: normalFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    })

    page.drawText(`$${item.unitPrice.toFixed(2)}`, {
      x: tableLeft + columnWidths[0] + columnWidths[1],
      y: yPosition,
      size: normalFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    })

    page.drawText(`$${amount.toFixed(2)}`, {
      x: tableLeft + columnWidths[0] + columnWidths[1] + columnWidths[2],
      y: yPosition,
      size: normalFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    })

    yPosition -= 25
  })

  // Draw total section with background
  page.drawRectangle({
    x: tableLeft + columnWidths[0],
    y: yPosition - 15,
    width: tableRight - tableLeft - columnWidths[0],
    height: 30,
    color: rgb(0.95, 0.95, 0.95),
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
  })

  // Draw total
  page.drawText("Total:", {
    x: tableLeft + columnWidths[0] + 10,
    y: yPosition,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  })

  page.drawText(`$${total.toFixed(2)}`, {
    x: tableLeft + columnWidths[0] + columnWidths[1] + columnWidths[2],
    y: yPosition,
    size: headerFontSize,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  })

  // Notes
  if (data.notes) {
    page.drawText("NOTES:", {
      x: tableLeft,
      y: yPosition - 50,
      size: headerFontSize,
      font: helveticaBold,
      color: rgb(0.4, 0.4, 0.4),
    })

    // Draw a background for notes
    page.drawRectangle({
      x: tableLeft,
      y: yPosition - 70 - data.notes.split("\n").length * 15,
      width: tableRight - tableLeft,
      height: data.notes.split("\n").length * 15 + 20,
      color: rgb(0.97, 0.97, 0.97),
      borderColor: rgb(0.95, 0.95, 0.95),
      borderWidth: 1,
    })

    const notesLines = data.notes.split("\n")
    notesLines.forEach((line, index) => {
      page.drawText(line, {
        x: tableLeft + 10,
        y: yPosition - 70 - index * 15,
        size: normalFontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      })
    })
  }

  // Add a footer
  page.drawText("Thank you for your business!", {
    x: width / 2 - 80,
    y: 50,
    size: normalFontSize,
    font: helveticaFont,
    color: rgb(0.4, 0.4, 0.4),
  })

  // Serialize the PDFDocument to bytes
  const pdfBytes = await pdfDoc.save()

  // Convert to Blob
  return new Blob([pdfBytes], { type: "application/pdf" })
}
