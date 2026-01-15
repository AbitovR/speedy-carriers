"use client"

import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Truck, 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  Calendar,
  MapPin,
  DollarSign,
  User,
  Car,
  Phone,
  Mail,
  Hash,
  Edit,
  Save,
  X
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency } from "@/lib/utils"

interface Vehicle {
  id: string
  make: string
  model: string
  year: string
  vin: string
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

interface InvoiceData {
  invoiceNumber: string
  date: string
  dueDate: string
  customerName: string
  customerEmail: string
  customerPhone: string
  pickupLocation: string
  deliveryLocation: string
  vehicles: Vehicle[]
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  notes: string
}

const defaultInvoice: InvoiceData = {
  invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  pickupLocation: "",
  deliveryLocation: "",
  vehicles: [],
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
  notes: ""
}

export default function InvoiceBuilderPage() {
  const [invoice, setInvoice] = useState<InvoiceData>(defaultInvoice)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<string | null>(null)

  const addVehicle = () => {
    const newVehicle: Vehicle = {
      id: `vehicle-${Date.now()}`,
      make: "",
      model: "",
      year: "",
      vin: ""
    }
    setInvoice(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, newVehicle]
    }))
    setEditingVehicle(newVehicle.id)
  }

  const updateVehicle = (id: string, field: keyof Vehicle, value: string) => {
    setInvoice(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => 
        v.id === id ? { ...v, [field]: value } : v
      )
    }))
  }

  const removeVehicle = (id: string) => {
    setInvoice(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(v => v.id !== id)
    }))
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0
    }
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
    setEditingItem(newItem.id)
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setInvoice(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          if (field === 'quantity' || field === 'rate') {
            updated.amount = updated.quantity * updated.rate
          }
          return updated
        }
        return item
      })
      
      const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0)
      const tax = subtotal * 0.08
      const total = subtotal + tax
      
      return {
        ...prev,
        items: updatedItems,
        subtotal,
        tax,
        total
      }
    })
  }

  const removeItem = (id: string) => {
    setInvoice(prev => {
      const updatedItems = prev.items.filter(item => item.id !== id)
      const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0)
      const tax = subtotal * 0.08
      const total = subtotal + tax
      
      return {
        ...prev,
        items: updatedItems,
        subtotal,
        tax,
        total
      }
    })
  }

  const generatePDF = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const printContent = document.getElementById('invoice-preview')
      if (printContent) {
        const printWindow = window.open('', '', 'height=800,width=800')
        if (printWindow) {
          printWindow.document.write('<html><head><title>Invoice</title>')
          printWindow.document.write('<style>')
          printWindow.document.write(`
            body { font-family: Arial, sans-serif; padding: 40px; }
            .invoice-header { text-align: center; margin-bottom: 30px; }
            .invoice-details { margin-bottom: 20px; }
            .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .invoice-table th { background-color: #f4f4f4; }
            .totals { text-align: right; margin-top: 20px; }
            .totals div { margin: 5px 0; }
          `)
          printWindow.document.write('</style></head><body>')
          printWindow.document.write(printContent.innerHTML)
          printWindow.document.write('</body></html>')
          printWindow.document.close()
          printWindow.print()
        }
      }
      setIsGenerating(false)
    }, 1000)
  }

  const resetInvoice = () => {
    setInvoice({
      ...defaultInvoice,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    })
  }

  return (
    <div className="min-h-screen w-full bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
              <Truck className="h-8 w-8 text-primary" />
              Auto Carrier Invoice Builder
            </h1>
            <p className="text-muted-foreground mt-2">Create and manage invoices for car hauling services</p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <FileText className="h-4 w-4 mr-2" />
            {invoice.invoiceNumber}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    placeholder="John Doe"
                    value={invoice.customerName}
                    onChange={(e) => setInvoice(prev => ({ ...prev, customerName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder="john@example.com"
                      className="pl-10"
                      value={invoice.customerEmail}
                      onChange={(e) => setInvoice(prev => ({ ...prev, customerEmail: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customerPhone"
                      placeholder="(555) 123-4567"
                      className="pl-10"
                      value={invoice.customerPhone}
                      onChange={(e) => setInvoice(prev => ({ ...prev, customerPhone: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Route Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pickupLocation">Pickup Location</Label>
                  <Input
                    id="pickupLocation"
                    placeholder="123 Main St, City, State ZIP"
                    value={invoice.pickupLocation}
                    onChange={(e) => setInvoice(prev => ({ ...prev, pickupLocation: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryLocation">Delivery Location</Label>
                  <Input
                    id="deliveryLocation"
                    placeholder="456 Oak Ave, City, State ZIP"
                    value={invoice.deliveryLocation}
                    onChange={(e) => setInvoice(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Invoice Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={invoice.date}
                      onChange={(e) => setInvoice(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={invoice.dueDate}
                      onChange={(e) => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Vehicles
                  </CardTitle>
                  <Button size="sm" onClick={addVehicle}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vehicle
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {invoice.vehicles.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No vehicles added yet</p>
                    ) : (
                      invoice.vehicles.map((vehicle) => (
                        <motion.div
                          key={vehicle.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="border border-border rounded-lg p-4 space-y-3"
                        >
                          {editingVehicle === vehicle.id ? (
                            <>
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  placeholder="Make"
                                  value={vehicle.make}
                                  onChange={(e) => updateVehicle(vehicle.id, 'make', e.target.value)}
                                />
                                <Input
                                  placeholder="Model"
                                  value={vehicle.model}
                                  onChange={(e) => updateVehicle(vehicle.id, 'model', e.target.value)}
                                />
                                <Input
                                  placeholder="Year"
                                  value={vehicle.year}
                                  onChange={(e) => updateVehicle(vehicle.id, 'year', e.target.value)}
                                />
                                <Input
                                  placeholder="VIN"
                                  value={vehicle.vin}
                                  onChange={(e) => updateVehicle(vehicle.id, 'vin', e.target.value)}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => setEditingVehicle(null)}>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => removeVehicle(vehicle.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                                  <p className="text-sm text-muted-foreground">VIN: {vehicle.vin}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => setEditingVehicle(vehicle.id)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => removeVehicle(vehicle.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Line Items
                  </CardTitle>
                  <Button size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {invoice.items.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No items added yet</p>
                    ) : (
                      invoice.items.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="border border-border rounded-lg p-4 space-y-3"
                        >
                          {editingItem === item.id ? (
                            <>
                              <Input
                                placeholder="Description"
                                value={item.description}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              />
                              <div className="grid grid-cols-3 gap-2">
                                <Input
                                  type="number"
                                  placeholder="Qty"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                />
                                <Input
                                  type="number"
                                  placeholder="Rate"
                                  value={item.rate}
                                  onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                />
                                <Input
                                  type="number"
                                  placeholder="Amount"
                                  value={item.amount}
                                  disabled
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => setEditingItem(null)}>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => removeItem(item.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold">{item.description}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.quantity} × {formatCurrency(item.rate)} = {formatCurrency(item.amount)}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => setEditingItem(item.id)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => removeItem(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Preview</CardTitle>
                <CardDescription>Review your invoice before generating PDF</CardDescription>
              </CardHeader>
              <CardContent>
                <div id="invoice-preview" className="space-y-6 p-6 bg-muted/30 rounded-lg">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">AUTO CARRIER INVOICE</h2>
                    <p className="text-muted-foreground">Invoice #{invoice.invoiceNumber}</p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold mb-2">Bill To:</p>
                      <p>{invoice.customerName || "Customer Name"}</p>
                      <p>{invoice.customerEmail || "customer@email.com"}</p>
                      <p>{invoice.customerPhone || "(555) 123-4567"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold mb-2">Invoice Details:</p>
                      <p>Date: {invoice.date}</p>
                      <p>Due: {invoice.dueDate}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Route:</p>
                    <p>From: {invoice.pickupLocation || "Pickup Location"}</p>
                    <p>To: {invoice.deliveryLocation || "Delivery Location"}</p>
                  </div>

                  {invoice.vehicles.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="font-semibold text-sm">Vehicles:</p>
                        {invoice.vehicles.map((vehicle) => (
                          <div key={vehicle.id} className="text-sm bg-background p-2 rounded">
                            <p>{vehicle.year} {vehicle.make} {vehicle.model}</p>
                            <p className="text-muted-foreground text-xs">VIN: {vehicle.vin}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {invoice.items.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="font-semibold text-sm">Items:</p>
                        {invoice.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm bg-background p-2 rounded">
                            <div>
                              <p>{item.description}</p>
                              <p className="text-muted-foreground text-xs">
                                {item.quantity} × {formatCurrency(item.rate)}
                              </p>
                            </div>
                            <p className="font-semibold">{formatCurrency(item.amount)}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <p>Subtotal:</p>
                      <p className="font-semibold">{formatCurrency(invoice.subtotal)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p>Tax (8%):</p>
                      <p className="font-semibold">{formatCurrency(invoice.tax)}</p>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <p className="font-bold">Total:</p>
                      <p className="font-bold text-primary">{formatCurrency(invoice.total)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-3">
                <Button 
                  className="flex-1" 
                  onClick={generatePDF}
                  disabled={isGenerating || invoice.items.length === 0}
                >
                  {isGenerating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2"
                      >
                        <Download className="h-4 w-4" />
                      </motion.div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={resetInvoice}>
                  <X className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Vehicles</p>
                    <p className="text-2xl font-bold">{invoice.vehicles.length}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Line Items</p>
                    <p className="text-2xl font-bold">{invoice.items.length}</p>
                  </div>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(invoice.total)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
