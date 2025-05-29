export type LineItem = {
  description: string
  quantity: number
  unitPrice: number
}

export type InvoiceData = {
  companyName: string
  companyAddress: string
  companyEmail: string
  companyPhone: string
  clientName: string
  clientAddress: string
  clientEmail: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  notes: string
  lineItems: LineItem[]
  totalAmount?: number
}
