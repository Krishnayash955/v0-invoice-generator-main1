"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2, Save, ArrowLeft } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import axios from "axios"
import { InvoiceData, LineItem } from "../../../types/invoice-types"

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }])
  const router = useRouter()
  const { id } = params

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InvoiceData>({
    defaultValues: {
      companyName: "",
      companyAddress: "",
      companyEmail: "",
      companyPhone: "",
      clientName: "",
      clientAddress: "",
      clientEmail: "",
      invoiceNumber: "",
      invoiceDate: "",
      dueDate: "",
      status: "draft",
    },
  })

  // Watch form values
  const formValues = watch()

  useEffect(() => {
    fetchInvoice()
  }, [id])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/invoices/${id}`)
      const invoice = response.data

      // Set form values
      Object.keys(invoice).forEach((key) => {
        if (key !== "lineItems" && key !== "_id" && key !== "__v") {
          setValue(key as keyof InvoiceData, invoice[key])
        }
      })

      // Set line items
      if (invoice.lineItems && Array.isArray(invoice.lineItems)) {
        setLineItems(invoice.lineItems)
      }
    } catch (error) {
      console.error("Error fetching invoice:", error)
      toast({
        title: "Error",
        description: "Failed to load invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
      setSaving(true)
      const invoiceData = {
        ...data,
        lineItems,
        totalAmount: calculateTotal(),
      }

      await axios.put(`/api/invoices/${id}`, invoiceData)

      toast({
        title: "Invoice Updated",
        description: "Your invoice has been successfully updated.",
      })

      // Redirect to invoices list after successful update
      setTimeout(() => {
        router.push("/invoices")
      }, 1500)
    } catch (error) {
      console.error("Error updating invoice:", error)
      toast({
        title: "Error",
        description: "Failed to update invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
        <main className="min-h-screen bg-black">
          <div className="container mx-auto py-8 px-4 flex justify-center items-center h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
          </div>
        </main>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <main className="min-h-screen bg-black">
        <div className="container mx-auto py-8 px-4">
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Edit Invoice</h1>
            <div className="flex justify-center mb-4">
              <div className="h-1 w-20 bg-orange-500 rounded-full"></div>
            </div>
            <p className="text-gray-400 text-center max-w-2xl text-lg mb-6">
              Update your invoice information below.
            </p>
            <Button asChild className="bg-gray-800 hover:bg-gray-700">
              <Link href="/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Invoices
              </Link>
            </Button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Company Information */}
              <Card className="border-0 shadow-lg bg-gray-900">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Company Information</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        className="bg-gray-800 border-gray-700"
                        {...register("companyName", { required: "Company name is required" })}
                      />
                      {errors.companyName && (
                        <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="companyAddress">Company Address</Label>
                      <Textarea
                        id="companyAddress"
                        className="bg-gray-800 border-gray-700"
                        {...register("companyAddress", { required: "Company address is required" })}
                      />
                      {errors.companyAddress && (
                        <p className="text-red-500 text-sm mt-1">{errors.companyAddress.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="companyEmail">Company Email</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        className="bg-gray-800 border-gray-700"
                        {...register("companyEmail", {
                          required: "Company email is required",
                          pattern: {
                            value: /^\S+@\S+\.\S+$/,
                            message: "Please enter a valid email",
                          },
                        })}
                      />
                      {errors.companyEmail && (
                        <p className="text-red-500 text-sm mt-1">{errors.companyEmail.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="companyPhone">Company Phone</Label>
                      <Input
                        id="companyPhone"
                        className="bg-gray-800 border-gray-700"
                        {...register("companyPhone", { required: "Company phone is required" })}
                      />
                      {errors.companyPhone && (
                        <p className="text-red-500 text-sm mt-1">{errors.companyPhone.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client Information */}
              <Card className="border-0 shadow-lg bg-gray-900">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Client Information</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="clientName">Client Name</Label>
                      <Input
                        id="clientName"
                        className="bg-gray-800 border-gray-700"
                        {...register("clientName", { required: "Client name is required" })}
                      />
                      {errors.clientName && (
                        <p className="text-red-500 text-sm mt-1">{errors.clientName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="clientAddress">Client Address</Label>
                      <Textarea
                        id="clientAddress"
                        className="bg-gray-800 border-gray-700"
                        {...register("clientAddress", { required: "Client address is required" })}
                      />
                      {errors.clientAddress && (
                        <p className="text-red-500 text-sm mt-1">{errors.clientAddress.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="clientEmail">Client Email</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        className="bg-gray-800 border-gray-700"
                        {...register("clientEmail", {
                          required: "Client email is required",
                          pattern: {
                            value: /^\S+@\S+\.\S+$/,
                            message: "Please enter a valid email",
                          },
                        })}
                      />
                      {errors.clientEmail && (
                        <p className="text-red-500 text-sm mt-1">{errors.clientEmail.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Invoice Details */}
            <Card className="border-0 shadow-lg bg-gray-900 mb-6">
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold text-white mb-4">Invoice Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input
                      id="invoiceNumber"
                      className="bg-gray-800 border-gray-700"
                      {...register("invoiceNumber", { required: "Invoice number is required" })}
                    />
                    {errors.invoiceNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.invoiceNumber.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="invoiceDate">Invoice Date</Label>
                    <Input
                      id="invoiceDate"
                      type="date"
                      className="bg-gray-800 border-gray-700"
                      {...register("invoiceDate", { required: "Invoice date is required" })}
                    />
                    {errors.invoiceDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.invoiceDate.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      className="bg-gray-800 border-gray-700"
                      {...register("dueDate", { required: "Due date is required" })}
                    />
                    {errors.dueDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.dueDate.message}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    defaultValue={formValues.status || "draft"}
                    onValueChange={(value) => setValue("status", value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
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
            <Card className="border-0 shadow-lg bg-gray-900 mb-6">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white">Line Items</h2>
                  <Button
                    type="button"
                    onClick={addLineItem}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 mb-4 items-end">
                    <div className="col-span-12 md:col-span-5">
                      <Label htmlFor={`item-description-${index}`}>Description</Label>
                      <Input
                        id={`item-description-${index}`}
                        className="bg-gray-800 border-gray-700"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, "description", e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Label htmlFor={`item-quantity-${index}`}>Quantity</Label>
                      <Input
                        id={`item-quantity-${index}`}
                        type="number"
                        min="1"
                        className="bg-gray-800 border-gray-700"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-5 md:col-span-3">
                      <Label htmlFor={`item-price-${index}`}>Unit Price ($)</Label>
                      <Input
                        id={`item-price-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        className="bg-gray-800 border-gray-700"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(index, "unitPrice", e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1 text-right">
                      <p className="text-sm text-gray-400 mb-1 hidden md:block">Amount</p>
                      <p className="text-white">${(item.quantity * item.unitPrice).toFixed(2)}</p>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-400"
                        onClick={() => removeLineItem(index)}
                        disabled={lineItems.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end mt-6">
                  <div className="w-full md:w-1/3">
                    <div className="flex justify-between py-2 border-t border-gray-800">
                      <span className="text-gray-400">Subtotal:</span>
                      <span className="text-white">${calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t border-gray-800">
                      <span className="text-gray-400">Tax (5%):</span>
                      <span className="text-white">${(calculateTotal() * 0.05).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t border-gray-800 font-bold">
                      <span className="text-white">Total:</span>
                      <span className="text-white">${(calculateTotal() * 1.05).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white py-6 px-8"
                disabled={saving}
              >
                {saving ? (
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
        <Toaster />
      </main>
    </ThemeProvider>
  )
}