"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Pencil, Trash2, Plus, ArrowLeft } from "lucide-react"
import { formatDate } from "../utils/format-utils"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import axios from "axios"
import { InvoiceData } from "../types/invoice-types"

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<(InvoiceData & { _id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/api/invoices")
      setInvoices(response.data)
    } catch (error) {
      console.error("Error fetching invoices:", error)
      toast({
        title: "Error",
        description: "Failed to load invoices. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id)
      await axios.delete(`/api/invoices/${id}`)
      
      // Update the local state to remove the deleted invoice
      setInvoices(invoices.filter(invoice => invoice._id !== id))
      
      toast({
        title: "Invoice Deleted",
        description: "The invoice has been successfully deleted.",
      })
    } catch (error) {
      console.error("Error deleting invoice:", error)
      toast({
        title: "Error",
        description: "Failed to delete invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return "bg-green-500 hover:bg-green-600"
      case 'sent':
        return "bg-blue-500 hover:bg-blue-600"
      case 'overdue':
        return "bg-red-500 hover:bg-red-600"
      case 'cancelled':
        return "bg-gray-500 hover:bg-gray-600"
      default:
        return "bg-amber-500 hover:bg-amber-600" // draft
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <main className="min-h-screen bg-black">
        <div className="container mx-auto py-8 px-4">
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Invoices</h1>
            <div className="flex justify-center mb-4">
              <div className="h-1 w-20 bg-orange-500 rounded-full"></div>
            </div>
            <p className="text-gray-400 text-center max-w-2xl text-lg mb-6">
              Manage your invoices - view, edit, or delete existing invoices.
            </p>
            <div className="flex gap-4">
              <Button asChild className="bg-gray-800 hover:bg-gray-700">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Generator
                </Link>
              </Button>
              <Button asChild className="bg-orange-500 hover:bg-orange-600">
                <Link href="/">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Invoice
                </Link>
              </Button>
            </div>
          </div>

          <Card className="border-0 shadow-lg bg-gray-900">
            <CardHeader>
              <CardTitle className="text-xl text-white">Your Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="mb-4">You haven't created any invoices yet.</p>
                  <Button asChild className="bg-orange-500 hover:bg-orange-600">
                    <Link href="/">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Invoice
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800">
                        <TableHead className="text-gray-400">Invoice #</TableHead>
                        <TableHead className="text-gray-400">Client</TableHead>
                        <TableHead className="text-gray-400">Date</TableHead>
                        <TableHead className="text-gray-400">Amount</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice._id} className="border-gray-800">
                          <TableCell className="font-medium text-white">{invoice.invoiceNumber}</TableCell>
                          <TableCell>{invoice.clientName}</TableCell>
                          <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                          <TableCell>${invoice.totalAmount?.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(invoice.status || 'draft')}>
                              {invoice.status?.toUpperCase() || 'DRAFT'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                                onClick={() => router.push(`/invoices/edit/${invoice._id}`)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-700 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                                onClick={() => handleDelete(invoice._id)}
                                disabled={deleting === invoice._id}
                              >
                                {deleting === invoice._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <Toaster />
      </main>
    </ThemeProvider>
  )
}