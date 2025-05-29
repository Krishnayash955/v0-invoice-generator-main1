"use client"

import { formatDate } from "../utils/format-utils"
import type { InvoiceData } from "../types/invoice-types"

export default function InvoicePreview({ formData }: { formData: InvoiceData }) {
  const calculateSubtotal = () => {
    return formData.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }

  const subtotal = calculateSubtotal()
  const total = subtotal

  return (
    <div className="p-8 bg-gray-900 text-white">
      {/* Header with decorative elements */}
      <div className="relative mb-12">
        <div className="absolute top-0 left-0 w-full h-24 overflow-hidden">
          <div className="absolute -top-10 left-0 w-32 h-32 bg-orange-500 rounded-full opacity-80"></div>
          <div className="absolute -top-5 left-20 w-24 h-24 bg-amber-500 rounded-full opacity-70"></div>
          <div className="absolute top-5 left-40 w-16 h-16 bg-blue-600 rounded-full opacity-80"></div>
          <div className="absolute -top-10 right-20 w-32 h-32 bg-blue-600 rounded-full opacity-70"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500 rounded-full opacity-80"></div>
        </div>

        {/* Header content */}
        <div className="flex flex-col md:flex-row justify-between items-start pt-28 relative z-10">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{formData.companyName || "Company Name"}</h1>
            <div className="text-sm text-gray-400 whitespace-pre-line">
              {formData.companyAddress || "Company Address"}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              {formData.companyEmail && <div>{formData.companyEmail}</div>}
              {formData.companyPhone && <div>{formData.companyPhone}</div>}
            </div>
          </div>
          <div className="text-right mt-4 md:mt-0">
            <div className="text-3xl font-bold text-orange-500 mb-2">INVOICE</div>
            <div className="text-sm">
              <div className="font-medium text-white">Invoice #: {formData.invoiceNumber || "INV-0001"}</div>
              <div className="text-gray-400">
                Date: {formData.invoiceDate ? formatDate(formData.invoiceDate) : formatDate(new Date().toISOString())}
              </div>
              <div className="text-gray-400">
                Due Date: {formData.dueDate ? formatDate(formData.dueDate) : formatDate(new Date().toISOString())}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="mb-10 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-sm font-medium text-gray-400 mb-2">BILL TO:</div>
        <div className="font-medium text-lg text-white">{formData.clientName || "Client Name"}</div>
        <div className="text-sm text-gray-400 whitespace-pre-line">{formData.clientAddress || "Client Address"}</div>
        {formData.clientEmail && <div className="text-sm text-gray-400 mt-1">{formData.clientEmail}</div>}
      </div>

      {/* Line Items */}
      <div className="mb-10">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="py-3 px-4 bg-amber-500 text-left font-semibold text-black rounded-tl-lg">Description</th>
              <th className="py-3 px-4 bg-amber-500 text-right font-semibold text-black">Qty</th>
              <th className="py-3 px-4 bg-amber-500 text-right font-semibold text-black">Unit Price</th>
              <th className="py-3 px-4 bg-amber-500 text-right font-semibold text-black rounded-tr-lg">Amount</th>
            </tr>
          </thead>
          <tbody>
            {formData.lineItems.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-gray-800" : "bg-gray-850"}>
                <td className="py-4 px-4 text-left border-b border-gray-700">
                  {item.description || "Item description"}
                </td>
                <td className="py-4 px-4 text-right border-b border-gray-700">{item.quantity}</td>
                <td className="py-4 px-4 text-right border-b border-gray-700">${item.unitPrice.toFixed(2)}</td>
                <td className="py-4 px-4 text-right font-medium border-b border-gray-700">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-10">
        <div className="w-64 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex justify-between py-2">
            <div className="font-medium text-gray-400">Subtotal:</div>
            <div className="font-medium text-white">${subtotal.toFixed(2)}</div>
          </div>
          <div className="border-t border-gray-700 my-2"></div>
          <div className="flex justify-between py-2 text-lg font-bold">
            <div className="text-white">Total:</div>
            <div className="text-orange-500">${total.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {formData.notes && (
        <div className="mt-8 pt-4 border-t border-gray-700">
          <div className="text-sm font-medium text-gray-400 mb-2">NOTES:</div>
          <div className="text-sm text-gray-300 whitespace-pre-line p-4 bg-gray-800 rounded-lg border border-gray-700">
            {formData.notes}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
        Thank you for your business!
      </div>
    </div>
  )
}
