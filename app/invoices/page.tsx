"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Loader2, Pencil, Trash2, FileDown, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { formatDate } from "../utils/format-utils"
import type { InvoiceData } from "../types/invoice-types"

interface Invoice extends InvoiceData {
  _id: string
  createdAt: string
  updatedAt: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/invoices')
      setInvoices(response.data)
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast({
        title: "Error",
        description: "Failed to fetch invoices. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (id: string) => {
    router.push(`/invoices/edit/${id}`)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      setIsDeleting(true)
      await axios.delete(`/api/invoices/${deleteId}`)
      
      // Update the local state to remove the deleted invoice
      setInvoices(invoices.filter(invoice => invoice._id !== deleteId))
      
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast({
        title: "Error",
        description: "Failed to delete invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const getStatusColor = (status: string = 'draft') => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-500 hover:bg-green-600'
      case 'sent':
        return 'bg-blue-500 hover:bg-blue-600'
      case 'overdue':
        return 'bg-red-500 hover:bg-red-600'
      case 'cancelled':
        return 'bg-gray-500 hover:bg-gray-600'
      default:
        return 'bg-amber-500 hover:bg-amber-600'
    }
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <Toaster />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Invoices</h1>
          <p className="text-gray-400">Manage your created invoices</p>
        </div>
        <div className="flex gap-4">
          <Button asChild variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Generator
            </Link>
          </Button>
        </div>
      </div>

      <Card className="bg-gray-900 border-gray-800 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">All Invoices</CardTitle>
          <CardDescription className="text-gray-400">
            View, edit or delete your invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>No invoices found. Create your first invoice!</p>
              <Button asChild className="mt-4 bg-orange-500 hover:bg-orange-600">
                <Link href="/">Create Invoice</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-gray-800/50">
                    <TableHead className="text-gray-400">Invoice #</TableHead>
                    <TableHead className="text-gray-400">Client</TableHead>
                    <TableHead className="text-gray-400">Date</TableHead>
                    <TableHead className="text-gray-400">Due Date</TableHead>
                    <TableHead className="text-gray-400">Amount</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice._id} className="border-gray-800 hover:bg-gray-800/50">
                      <TableCell className="font-medium text-white">{invoice.invoiceNumber}</TableCell>
                      <TableCell className="text-gray-300">{invoice.clientName}</TableCell>
                      <TableCell className="text-gray-300">{formatDate(invoice.invoiceDate)}</TableCell>
                      <TableCell className="text-gray-300">{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell className="text-gray-300">${invoice.totalAmount?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(invoice.status)} text-white`}>
                          {invoice.status || 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                            onClick={() => handleEdit(invoice._id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 border-gray-700 text-red-500 hover:bg-red-900/20 hover:text-red-400"
                                onClick={() => setDeleteId(invoice._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gray-900 border-gray-800">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-400">
                                  This action cannot be undone. This will permanently delete the invoice.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-500 hover:bg-red-600 text-white"
                                  onClick={handleDelete}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    "Delete"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
  )
}