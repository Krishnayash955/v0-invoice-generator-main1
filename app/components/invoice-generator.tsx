"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { generateInvoice, saveInvoice } from "../actions/invoice-actions"
import {
  Loader2,
  Plus,
  Trash2,
  FileDown,
  Building,
  User,
  CalendarDays,
  ListChecks,
  Info,
  ChevronRight,
  Download,
  Eye,
  Save,
} from "lucide-react"
import InvoicePreview from "./invoice-preview"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "../utils/cn"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useMobile } from "../hooks/use-mobile"
import type { InvoiceData, LineItem } from "../types/invoice-types"

// Define accent colors
const accentColors = {
  primary: "bg-orange-500",
  secondary: "bg-blue-600",
  tertiary: "bg-purple-600",
  quaternary: "bg-amber-500",
  quinary: "bg-teal-500",
}

export default function InvoiceGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }])
  const [activeSection, setActiveSection] = useState<string>("company")
  const [previewMode, setPreviewMode] = useState<boolean>(false)
  const isMobile = useMobile()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<InvoiceData>({
    defaultValues: {
      companyName: "",
      companyAddress: "",
      companyEmail: "",
      companyPhone: "",
      clientName: "",
      clientAddress: "",
      clientEmail: "",
      invoiceNumber: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(
        new Date().getDate(),
      ).padStart(2, "0")}-001`,
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: "",
    },
    mode: "onChange",
  })

  // Watch all form values for the preview
  const formValues = watch()

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }])
    toast({
      title: "Item added",
      description: "A new line item has been added to your invoice.",
      duration: 2000,
    })
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
      toast({
        title: "Item removed",
        description: "The line item has been removed from your invoice.",
        duration: 2000,
      })
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
      setIsGenerating(true)
      const invoiceData = {
        ...data,
        lineItems,
      }

      const pdfBlob = await generateInvoice(invoiceData)

      // Create a download link for the PDF
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `invoice-${data.invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Success!",
        description: "Your invoice PDF has been successfully created and downloaded.",
        duration: 5000,
      })
    } catch (error) {
      console.error("Error generating invoice:", error)
      toast({
        title: "Error",
        description: "There was a problem generating your invoice. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveInvoice = async (data: InvoiceData) => {
    try {
      setIsSaving(true)
      const invoiceData = {
        ...data,
        lineItems,
        totalAmount: calculateTotal(),
      }

      await saveInvoice(invoiceData)

      toast({
        title: "Invoice Saved",
        description: "Your invoice has been successfully saved to the database.",
        duration: 5000,
      })
    } catch (error) {
      console.error("Error saving invoice:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "There was a problem saving your invoice. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Scroll to section when activeSection changes
  useEffect(() => {
    const element = document.getElementById(activeSection)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [activeSection])

  const sections = [
    { id: "company", label: "Company Details", icon: <Building className="h-5 w-5" />, color: accentColors.primary },
    { id: "client", label: "Client Information", icon: <User className="h-5 w-5" />, color: accentColors.secondary },
    {
      id: "details",
      label: "Invoice Details",
      icon: <CalendarDays className="h-5 w-5" />,
      color: accentColors.tertiary,
    },
    { id: "items", label: "Line Items", icon: <ListChecks className="h-5 w-5" />, color: accentColors.quaternary },
    { id: "notes", label: "Additional Notes", icon: <Info className="h-5 w-5" />, color: accentColors.quinary },
  ]

  const togglePreviewMode = () => {
    setPreviewMode(!previewMode)
  }

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center mb-8 md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Invoice Generator</h1>
            <div className="flex justify-center mb-4">
              <div className="h-1 w-20 bg-orange-500 rounded-full"></div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-gray-400 text-center max-w-2xl text-lg">
              Create professional invoices in seconds and deliver them to your clients with ease.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Navigation Sidebar */}
          <div className={cn("lg:col-span-3 order-2 lg:order-1", previewMode && !isMobile ? "hidden" : "")}>
            <div className="lg:sticky lg:top-8">
              <Card className="overflow-hidden border-0 shadow-md bg-gray-900">
                <div className="p-5 border-b border-gray-800">
                  <h2 className="text-xl font-semibold text-white">Invoice Sections</h2>
                </div>
                <nav className="p-2">
                  {sections.map((section) => (
                    <Button
                      key={section.id}
                      variant={activeSection === section.id ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start text-left font-normal my-1 py-5 rounded-lg transition-all duration-200",
                        activeSection === section.id
                          ? `${section.color} text-white`
                          : "text-gray-400 hover:text-white hover:bg-gray-800",
                      )}
                      onClick={() => setActiveSection(section.id)}
                    >
                      <div className="flex items-center w-full">
                        <div
                          className={cn(
                            "mr-3 p-2 rounded-md",
                            activeSection === section.id ? "bg-black/20" : "bg-gray-800",
                          )}
                        >
                          {section.icon}
                        </div>
                        <span className="text-base flex-1">{section.label}</span>
                        {activeSection === section.id && <ChevronRight className="h-5 w-5 ml-2" />}
                      </div>
                    </Button>
                  ))}
                </nav>

                <div className="p-5 border-t border-gray-800">
                  <h3 className="text-lg font-semibold mb-3 text-white">Invoice Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Items:</span>
                      <Badge variant="outline" className="font-medium text-white border-gray-700">
                        {lineItems.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Amount:</span>
                      <Badge variant="outline" className="font-medium text-white border-gray-700">
                        ${calculateTotal().toFixed(2)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Due Date:</span>
                      <Badge variant="outline" className="font-medium text-white border-gray-700">
                        {formValues.dueDate ? new Date(formValues.dueDate).toLocaleDateString() : "Not set"}
                      </Badge>
                    </div>
                    <Separator className="my-3 bg-gray-800" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Status:</span>
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-black">Draft</Badge>
                    </div>
                  </div>

                  <div className="mt-5 pt-5 border-t border-gray-800 space-y-3">
                    <Button
                      onClick={handleSubmit(onSubmit)}
                      disabled={isGenerating || !isValid}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-5 w-5" />
                          Download Invoice
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleSubmit(handleSaveInvoice)}
                      disabled={isSaving || !isValid}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-5 w-5" />
                          Save Invoice
                        </>
                      )}
                    </Button>

                    {isMobile && (
                      <Button
                        onClick={togglePreviewMode}
                        variant="outline"
                        className="w-full mt-3 py-6 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                      >
                        {previewMode ? (
                          <>
                            <Building className="mr-2 h-5 w-5" />
                            Edit Invoice
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-5 w-5" />
                            Preview Invoice
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Form */}
          <div
            className={cn(
              "lg:col-span-5 order-1 lg:order-2",
              previewMode && isMobile ? "hidden" : "",
              previewMode && !isMobile ? "lg:col-span-9" : "",
            )}
          >
            <form id="invoiceForm" onSubmit={handleSubmit(onSubmit)}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Company Information */}
                <Card
                  id="company"
                  className={cn(
                    "overflow-hidden border-0 shadow-md transition-all duration-300 bg-gray-900",
                    activeSection === "company" ? "ring-2 ring-orange-500" : "",
                  )}
                >
                  <div className="bg-orange-500 px-6 py-4 flex items-center gap-2">
                    <Building className="h-5 w-5 text-white" />
                    <h2 className="text-lg font-semibold text-white">Company Information</h2>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-gray-300">
                          Company Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="companyName"
                          {...register("companyName", { required: true })}
                          className={cn(
                            "bg-gray-800 border-gray-700 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-transparent",
                            errors.companyName ? "border-red-500" : "",
                          )}
                          aria-invalid={errors.companyName ? "true" : "false"}
                        />
                        {errors.companyName && (
                          <p className="text-red-500 text-sm" role="alert">
                            Company name is required
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyEmail" className="text-gray-300">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="companyEmail"
                          type="email"
                          {...register("companyEmail", { required: true })}
                          className={cn(
                            "bg-gray-800 border-gray-700 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-transparent",
                            errors.companyEmail ? "border-red-500" : "",
                          )}
                          aria-invalid={errors.companyEmail ? "true" : "false"}
                        />
                        {errors.companyEmail && (
                          <p className="text-red-500 text-sm" role="alert">
                            Email is required
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyAddress" className="text-gray-300">
                          Address <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="companyAddress"
                          {...register("companyAddress", { required: true })}
                          className={cn(
                            "bg-gray-800 border-gray-700 text-white min-h-[100px] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-transparent",
                            errors.companyAddress ? "border-red-500" : "",
                          )}
                          aria-invalid={errors.companyAddress ? "true" : "false"}
                        />
                        {errors.companyAddress && (
                          <p className="text-red-500 text-sm" role="alert">
                            Address is required
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyPhone" className="text-gray-300">
                          Phone <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="companyPhone"
                          {...register("companyPhone", { required: true })}
                          className={cn(
                            "bg-gray-800 border-gray-700 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-transparent",
                            errors.companyPhone ? "border-red-500" : "",
                          )}
                          aria-invalid={errors.companyPhone ? "true" : "false"}
                        />
                        {errors.companyPhone && (
                          <p className="text-red-500 text-sm" role="alert">
                            Phone is required
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Client Information */}
                <Card
                  id="client"
                  className={cn(
                    "overflow-hidden border-0 shadow-md transition-all duration-300 bg-gray-900",
                    activeSection === "client" ? "ring-2 ring-blue-600" : "",
                  )}
                >
                  <div className="bg-blue-600 px-6 py-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-white" />
                    <h2 className="text-lg font-semibold text-white">Client Information</h2>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="clientName" className="text-gray-300">
                          Client Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="clientName"
                          {...register("clientName", { required: true })}
                          className={cn(
                            "bg-gray-800 border-gray-700 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-transparent",
                            errors.clientName ? "border-red-500" : "",
                          )}
                          aria-invalid={errors.clientName ? "true" : "false"}
                        />
                        {errors.clientName && (
                          <p className="text-red-500 text-sm" role="alert">
                            Client name is required
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="clientEmail" className="text-gray-300">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="clientEmail"
                          type="email"
                          {...register("clientEmail", { required: true })}
                          className={cn(
                            "bg-gray-800 border-gray-700 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-transparent",
                            errors.clientEmail ? "border-red-500" : "",
                          )}
                          aria-invalid={errors.clientEmail ? "true" : "false"}
                        />
                        {errors.clientEmail && (
                          <p className="text-red-500 text-sm" role="alert">
                            Email is required
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientAddress" className="text-gray-300">
                        Address <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="clientAddress"
                        {...register("clientAddress", { required: true })}
                        className={cn(
                          "bg-gray-800 border-gray-700 text-white min-h-[100px] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-transparent",
                          errors.clientAddress ? "border-red-500" : "",
                        )}
                        aria-invalid={errors.clientAddress ? "true" : "false"}
                      />
                      {errors.clientAddress && (
                        <p className="text-red-500 text-sm" role="alert">
                          Address is required
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Invoice Details */}
                <Card
                  id="details"
                  className={cn(
                    "overflow-hidden border-0 shadow-md transition-all duration-300 bg-gray-900",
                    activeSection === "details" ? "ring-2 ring-purple-600" : "",
                  )}
                >
                  <div className="bg-purple-600 px-6 py-4 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-white" />
                    <h2 className="text-lg font-semibold text-white">Invoice Details</h2>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="invoiceNumber" className="text-gray-300">
                          Invoice Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="invoiceNumber"
                          {...register("invoiceNumber", { required: true })}
                          className={cn(
                            "bg-gray-800 border-gray-700 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:border-transparent",
                            errors.invoiceNumber ? "border-red-500" : "",
                          )}
                          aria-invalid={errors.invoiceNumber ? "true" : "false"}
                        />
                        {errors.invoiceNumber && (
                          <p className="text-red-500 text-sm" role="alert">
                            Invoice number is required
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invoiceDate" className="text-gray-300">
                          Invoice Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="invoiceDate"
                          type="date"
                          {...register("invoiceDate", { required: true })}
                          className={cn(
                            "bg-gray-800 border-gray-700 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:border-transparent",
                            errors.invoiceDate ? "border-red-500" : "",
                          )}
                          aria-invalid={errors.invoiceDate ? "true" : "false"}
                        />
                        {errors.invoiceDate && (
                          <p className="text-red-500 text-sm" role="alert">
                            Invoice date is required
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dueDate" className="text-gray-300">
                          Due Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="dueDate"
                          type="date"
                          {...register("dueDate", { required: true })}
                          className={cn(
                            "bg-gray-800 border-gray-700 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:border-transparent",
                            errors.dueDate ? "border-red-500" : "",
                          )}
                          aria-invalid={errors.dueDate ? "true" : "false"}
                        />
                        {errors.dueDate && (
                          <p className="text-red-500 text-sm" role="alert">
                            Due date is required
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Line Items */}
                <Card
                  id="items"
                  className={cn(
                    "overflow-hidden border-0 shadow-md transition-all duration-300 bg-gray-900",
                    activeSection === "items" ? "ring-2 ring-amber-500" : "",
                  )}
                >
                  <div className="bg-amber-500 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-white" />
                      <h2 className="text-lg font-semibold text-white">Line Items</h2>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            onClick={addLineItem}
                            variant="outline"
                            size="sm"
                            className="bg-black/20 hover:bg-black/30 text-white border-transparent"
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add Item
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add a new line item to your invoice</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <CardContent className="p-6">
                    <AnimatePresence>
                      {lineItems.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                          transition={{ duration: 0.3 }}
                          className="mb-4"
                        >
                          <Card className="overflow-hidden border-0 shadow-sm bg-gray-800">
                            <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
                              <div className="flex items-center">
                                <Badge variant="outline" className="mr-2 bg-gray-900 border-gray-700 text-gray-300">
                                  #{index + 1}
                                </Badge>
                                <h3 className="font-medium text-gray-300">Item Details</h3>
                              </div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeLineItem(index)}
                                      disabled={lineItems.length === 1}
                                      className="text-gray-400 hover:text-red-500"
                                      aria-label="Remove item"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Remove this item</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6 space-y-2">
                                  <Label htmlFor={`item-${index}-description`} className="text-gray-300">
                                    Description <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    id={`item-${index}-description`}
                                    value={item.description}
                                    onChange={(e) => updateLineItem(index, "description", e.target.value)}
                                    required
                                    placeholder="Item description"
                                    className="bg-gray-800 border-gray-700 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:border-transparent"
                                  />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                  <Label htmlFor={`item-${index}-quantity`} className="text-gray-300">
                                    Quantity
                                  </Label>
                                  <Input
                                    id={`item-${index}-quantity`}
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                                    required
                                    className="bg-gray-800 border-gray-700 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:border-transparent"
                                  />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                  <Label htmlFor={`item-${index}-price`} className="text-gray-300">
                                    Unit Price ($)
                                  </Label>
                                  <Input
                                    id={`item-${index}-price`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.unitPrice}
                                    onChange={(e) => updateLineItem(index, "unitPrice", e.target.value)}
                                    required
                                    className="bg-gray-800 border-gray-700 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:border-transparent"
                                  />
                                </div>
                              </div>
                              <div className="mt-4 flex justify-end">
                                <div className="bg-gray-900 px-4 py-2 rounded-md">
                                  <span className="text-sm font-medium text-gray-300">
                                    Item Total: ${(item.quantity * item.unitPrice).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    <div className="mt-6">
                      <Card className="overflow-hidden border-0 bg-gray-800">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row justify-between items-center">
                            <div className="text-gray-400 mb-4 md:mb-0">
                              <span className="text-sm">Total Items: {lineItems.length}</span>
                            </div>
                            <div className="bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-700">
                              <div className="flex justify-between items-center font-bold text-lg">
                                <span className="text-gray-300 mr-8">Total:</span>
                                <span className="text-amber-500">${calculateTotal().toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card
                  id="notes"
                  className={cn(
                    "overflow-hidden border-0 shadow-md transition-all duration-300 bg-gray-900",
                    activeSection === "notes" ? "ring-2 ring-teal-500" : "",
                  )}
                >
                  <div className="bg-teal-500 px-6 py-4 flex items-center gap-2">
                    <Info className="h-5 w-5 text-white" />
                    <h2 className="text-lg font-semibold text-white">Additional Notes</h2>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-gray-300">
                        Notes
                      </Label>
                      <Textarea
                        id="notes"
                        {...register("notes")}
                        placeholder="Payment terms, thank you message, etc."
                        className="min-h-[120px] bg-gray-800 border-gray-700 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-transparent"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </form>
          </div>

          {/* Preview */}
          <div
            className={cn(
              "lg:col-span-4 order-3",
              previewMode && isMobile ? "block" : "",
              !previewMode && isMobile ? "hidden" : "",
            )}
          >
            <div className="lg:sticky lg:top-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="overflow-hidden border-0 shadow-lg bg-gray-900">
                  <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileDown className="h-5 w-5 text-white" />
                      <h2 className="text-lg font-semibold text-white">Invoice Preview</h2>
                    </div>
                    {!isMobile && (
                      <Button
                        onClick={togglePreviewMode}
                        variant="outline"
                        size="sm"
                        className="bg-black/20 hover:bg-black/30 text-white border-transparent"
                      >
                        {previewMode ? "Show Form" : "Expand Preview"}
                      </Button>
                    )}
                  </div>
                  <div
                    className={cn("overflow-hidden", previewMode ? "h-[calc(100vh-150px)]" : "h-[calc(100vh-200px)]")}
                  >
                    <ScrollArea className="h-full">
                      <InvoicePreview formData={{ ...formValues, lineItems }} />
                    </ScrollArea>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </TooltipProvider>
  )
}
