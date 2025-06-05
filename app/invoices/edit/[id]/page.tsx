"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Loader2, Plus, Trash2, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { InvoiceData, LineItem } from "../../../types/invoice-types"

interface EditInvoiceProps {
  params: {
    id: string
  }
}

export default function EditInvoicePage({ params }: EditInvoiceProps) {
  const { id } = params
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }])
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset
  } = useForm<InvoiceData>()

  useEffect(() => {
    fetchInvoice()
  }, [id])

  const fetchInvoice = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get(`/api/invoices/${id}`)
      const invoice = response.data

      // Format dates for form inputs (YYYY-MM-DD)
      const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString)
        return date.toISOString().split('T')[0]
      }

      // Reset form with invoice data
      reset({
        companyName: invoice.companyName,
        companyAddress: invoice.companyAddress,
        companyEmail: invoice.companyEmail,
        companyPhone: invoice.companyPhone,
        clientName: invoice.clientName,
        clientAddress: invoice.clientAddress,
        clientEmail: invoice.clientEmail,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: formatDateForInput(invoice.invoiceDate),
        dueDate: formatDateForInput(invoice.dueDate),
        status: invoice.status || 'draft',
        totalAmount: invoice.totalAmount
      })

      // Set line items
      setLineItems(invoice.lineItems || [{ description: "", quantity: 1, unitPrice: 0 }])
    } catch (error) {
      console.error('Error fetching invoice:', error)
      toast({
        title: "Error",
        description: "Failed to fetch invoice details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updatedItems = [...lineItems]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === "description" ? value : Number(value),
    }
    setLineItems(updatedItems)
  }

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }

  const onSubmit = async (data: InvoiceData) => {
    try {
      setIsSaving(true)
      const invoiceData = {
        ...data,
        lineItems,
        totalAmount: calculateTotal(),
      }

      await axios.put(`/api/invoices/${id}`, invoiceData)

      toast({
        title: "Success",
        description: "Invoice updated successfully",
      })

      // Navigate back to invoices page
      router.push('/invoices')
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast({
        title: "Error",
        description: "Failed to update invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <Toaster />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Edit Invoice</h1>
          <p className="text-gray-400">Update invoice details</p>
        </div>
        <Button asChild variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
          <Link href="/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Company Information */}
          <Card className="bg-gray-900 border-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">Company Information</CardTitle>
              <CardDescription className="text-gray-400">
                Your company details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-gray-300">Company Name</Label>
                <Input
                  id="companyName"
                  className="bg-gray-800 border-gray-700 text-white"
                  {...register("companyName", { required: "Company name is required" })}
                />
                {errors.companyName && (
                  <p className="text-red-500 text-sm">{errors.companyName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyAddress" className="text-gray-300">Company Address</Label>
                <Textarea
                  id="companyAddress"
                  className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                  {...register("companyAddress", { required: "Company address is required" })}
                />
                {errors.companyAddress && (
                  <p className="text-red-500 text-sm">{errors.companyAddress.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyEmail" className="text-gray-300">Company Email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  className="bg-gray-800 border-gray-700 text-white"
                  {...register("companyEmail", { 
                    required: "Company email is required",
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: "Invalid email format"
                    }
                  })}
                />
                {errors.companyEmail && (
                  <p className="text-red-500 text-sm">{errors.companyEmail.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyPhone" className="text-gray-300">Company Phone</Label>
                <Input
                  id="companyPhone"
                  className="bg-gray-800 border-gray-700 text-white"
                  {...register("companyPhone", { required: "Company phone is required" })}
                />
                {errors.companyPhone && (
                  <p className="text-red-500 text-sm">{errors.companyPhone.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card className="bg-gray-900 border-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">Client Information</CardTitle>
              <CardDescription className="text-gray-400">
                Your client details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-gray-300">Client Name</Label>
                <Input
                  id="clientName"
                  className="bg-gray-800 border-gray-700 text-white"
                  {...register("clientName", { required: "Client name is required" })}
                />
                {errors.clientName && (
                  <p className="text-red-500 text-sm">{errors.clientName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientAddress" className="text-gray-300">Client Address</Label>
                <Textarea
                  id="clientAddress"
                  className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                  {...register("clientAddress", { required: "Client address is required" })}
                />
                {errors.clientAddress && (
                  <p className="text-red-500 text-sm">{errors.clientAddress.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientEmail" className="text-gray-300">Client Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  className="bg-gray-800 border-gray-700 text-white"
                  {...register("clientEmail", { 
                    required: "Client email is required",
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: "Invalid email format"
                    }
                  })}
                />
                {errors.clientEmail && (
                  <p className="text-red-500 text-sm">{errors.clientEmail.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Details */}
        <Card className="bg-gray-900 border-gray-800 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-white">Invoice Details</CardTitle>
            <CardDescription className="text-gray-400">
              Invoice information and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber" className="text-gray-300">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  className="bg-gray-800 border-gray-700 text-white"
                  {...register("invoiceNumber", { required: "Invoice number is required" })}
                />
                {errors.invoiceNumber && (
                  <p className="text-red-500 text-sm">{errors.invoiceNumber.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invoiceDate" className="text-gray-300">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  className="bg-gray-800 border-gray-700 text-white"
                  {...register("invoiceDate", { required: "Invoice date is required" })}
                />
                {errors.invoiceDate && (
                  <p className="text-red-500 text-sm">{errors.invoiceDate.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-gray-300">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  className="bg-gray-800 border-gray-700 text-white"
                  {...register("dueDate", { required: "Due date is required" })}
                />
                {errors.dueDate && (
                  <p className="text-red-500 text-sm">{errors.dueDate.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-300">Status</Label>
              <Select 
                defaultValue="draft" 
                onValueChange={(value) => setValue("status", value)}
                {...register("status")}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card className="bg-gray-900 border-gray-800 shadow-lg mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Line Items</CardTitle>
              <CardDescription className="text-gray-400">
                Products or services provided
              </CardDescription>
            </div>
            <Button 
              type="button"
              onClick={addLineItem}
              variant="outline" 
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 rounded-lg bg-gray-800/50 border border-gray-800">
                  <div className="col-span-12 md:col-span-6 space-y-2">
                    <Label htmlFor={`item-${index}-description`} className="text-gray-300">Description</Label>
                    <Input
                      id={`item-${index}-description`}
                      value={item.description}
                      onChange={(e) => updateLineItem(index, "description", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Item description"
                    />
                  </div>
                  
                  <div className="col-span-6 md:col-span-2 space-y-2">
                    <Label htmlFor={`item-${index}-quantity`} className="text-gray-300">Quantity</Label>
                    <Input
                      id={`item-${index}-quantity`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  
                  <div className="col-span-6 md:col-span-3 space-y-2">
                    <Label htmlFor={`item-${index}-price`} className="text-gray-300">Unit Price ($)</Label>
                    <Input
                      id={`item-${index}-price`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(index, "unitPrice", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  
                  <div className="col-span-12 md:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length <= 1}
                      className="h-10 w-10 text-red-500 hover:text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end pt-4">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 w-full md:w-1/3">
                  <div className="flex justify-between text-gray-400 mb-2">
                    <span>Subtotal:</span>
                    <span className="text-white">${calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 mb-2">
                    <span>Tax (5%):</span>
                    <span className="text-white">${(calculateTotal() * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold mt-2 pt-2 border-t border-gray-700">
                    <span className="text-gray-300">Total:</span>
                    <span className="text-white">${(calculateTotal() * 1.05).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white py-6 px-8"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Update Invoice
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}