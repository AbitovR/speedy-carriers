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
  brokerCompanyName: string
  brokerEmail: string
  brokerPhone: string
  brokerAddress: string
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
  brokerCompanyName: "",
  brokerEmail: "",
  brokerPhone: "",
  brokerAddress: "",
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
      const printWindow = window.open('', '', 'width=900,height=800')
      if (printWindow) {
        const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: letter;
      margin: 0.5in;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
      padding: 40px;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #1a1a1a;
    }
    
    .company-info {
      flex: 1;
    }
    
    .company-name {
      font-size: 28px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    
    .company-address {
      font-size: 11px;
      color: #6b7280;
      line-height: 1.5;
      margin-top: 8px;
    }
    
    .payment-section {
      background: #f0f9ff;
      border: 2px solid #3b82f6;
      padding: 16px;
      border-radius: 6px;
      margin-top: 30px;
    }
    
    .payment-title {
      font-size: 14px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .payment-info {
      color: #374151;
      line-height: 1.8;
    }
    
    .payment-method {
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .payment-email {
      color: #3b82f6;
      font-weight: 600;
    }
    
    .invoice-title {
      font-size: 32px;
      font-weight: bold;
      color: #1a1a1a;
      text-align: right;
      margin-bottom: 8px;
    }
    
    .invoice-number {
      font-size: 14px;
      color: #666;
      text-align: right;
    }
    
    .details-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      gap: 40px;
    }
    
    .bill-to, .invoice-info {
      flex: 1;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .info-row {
      margin-bottom: 6px;
      color: #374151;
    }
    
    .info-label {
      font-weight: 600;
      display: inline-block;
      min-width: 80px;
    }
    
    .route-section {
      background: #f9fafb;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 30px;
    }
    
    .route-title {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 12px;
      color: #1a1a1a;
    }
    
    .route-item {
      display: flex;
      margin-bottom: 8px;
      color: #374151;
    }
    
    .route-label {
      font-weight: 600;
      min-width: 100px;
    }
    
    .vehicles-section, .items-section {
      margin-bottom: 30px;
    }
    
    .section-header {
      font-size: 16px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .vehicle-item {
      background: #f9fafb;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 10px;
      border-left: 4px solid #3b82f6;
    }
    
    .vehicle-name {
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    
    .vehicle-vin {
      font-size: 11px;
      color: #6b7280;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .items-table thead {
      background: #1a1a1a;
      color: white;
    }
    
    .items-table th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
    }
    
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .items-table tbody tr:hover {
      background: #f9fafb;
    }
    
    .items-table .text-right {
      text-align: right;
    }
    
    .items-table .text-center {
      text-align: center;
    }
    
    .totals-section {
      margin-top: 30px;
      margin-left: auto;
      width: 300px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .total-row.total-final {
      border-top: 3px solid #1a1a1a;
      border-bottom: 3px solid #1a1a1a;
      margin-top: 10px;
      padding: 15px 0;
      font-size: 16px;
      font-weight: bold;
    }
    
    .total-label {
      font-weight: 600;
    }
    
    .total-amount {
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 11px;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .invoice-container {
        max-width: 100%;
      }
      
      @page {
        margin: 0.5in;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        <div class="company-name">Speedy Carriers</div>
        <div class="info-row">Auto Carrier Services</div>
        <div class="info-row">Professional Car Hauling</div>
        <div class="company-address">
          414 PARLIN ST FL 1<br>
          Philadelphia, PA 19116
        </div>
      </div>
      <div>
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">Invoice #${invoice.invoiceNumber}</div>
      </div>
    </div>
    
    <div class="details-section">
      <div class="bill-to">
        <div class="section-title">Bill To:</div>
        <div class="info-row"><span class="info-label">Company:</span>${invoice.brokerCompanyName || 'N/A'}</div>
        <div class="info-row"><span class="info-label">Email:</span>${invoice.brokerEmail || 'N/A'}</div>
        <div class="info-row"><span class="info-label">Phone:</span>${invoice.brokerPhone || 'N/A'}</div>
        <div class="info-row"><span class="info-label">Address:</span>${invoice.brokerAddress || 'N/A'}</div>
      </div>
      <div class="invoice-info">
        <div class="section-title">Invoice Details:</div>
        <div class="info-row"><span class="info-label">Date:</span>${new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div class="info-row"><span class="info-label">Due Date:</span>${new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
    </div>
    
    <div class="route-section">
      <div class="route-title">Route Information</div>
      <div class="route-item">
        <span class="route-label">Pickup:</span>
        <span>${invoice.pickupLocation || 'N/A'}</span>
      </div>
      <div class="route-item">
        <span class="route-label">Delivery:</span>
        <span>${invoice.deliveryLocation || 'N/A'}</span>
      </div>
    </div>
    
    ${invoice.vehicles.length > 0 ? `
    <div class="vehicles-section">
      <div class="section-header">Vehicles Transported</div>
      ${invoice.vehicles.map(vehicle => `
        <div class="vehicle-item">
          <div class="vehicle-name">${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}</div>
          <div class="vehicle-vin">VIN: ${vehicle.vin || 'N/A'}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${invoice.items.length > 0 ? `
    <div class="items-section">
      <div class="section-header">Line Items</div>
      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-center">Quantity</th>
            <th class="text-right">Rate</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td style="background-color: #fef3c7; color: #92400e; font-weight: 600; padding: 12px;">${item.description || 'N/A'}</td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-right">${formatCurrency(item.rate)}</td>
              <td class="text-right">${formatCurrency(item.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
    
    <div class="totals-section">
      <div class="total-row">
        <span class="total-label">Subtotal:</span>
        <span class="total-amount">${formatCurrency(invoice.subtotal)}</span>
      </div>
      <div class="total-row">
        <span class="total-label">Tax (8%):</span>
        <span class="total-amount">${formatCurrency(invoice.tax)}</span>
      </div>
      <div class="total-row total-final">
        <span class="total-label">Total:</span>
        <span class="total-amount">${formatCurrency(invoice.total)}</span>
      </div>
    </div>
    
    ${invoice.notes ? `
    <div class="route-section" style="margin-top: 30px;">
      <div class="route-title">Notes</div>
      <div style="color: #374151; white-space: pre-wrap;">${invoice.notes}</div>
    </div>
    ` : ''}
    
    <div class="payment-section">
      <div class="payment-title">💳 Payment Information</div>
      <div class="payment-info">
        <div style="margin-bottom: 8px;">
          <span class="payment-method">Zelle Payment:</span>
        </div>
        <div>
          Send payment to: <span class="payment-email">info@spdcarriers.com</span>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <div>Thank you for your business!</div>
      <div style="margin-top: 8px;">This is an official invoice from Speedy Carriers</div>
    </div>
  </div>
</body>
</html>
        `
        
        printWindow.document.write(invoiceHTML)
        printWindow.document.close()
        
        // Wait for content to load before printing
        setTimeout(() => {
          printWindow.print()
        }, 250)
      }
      setIsGenerating(false)
    }, 500)
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
                  Broker Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brokerCompanyName">Company Name</Label>
                  <Input
                    id="brokerCompanyName"
                    placeholder="Broker Company Name"
                    value={invoice.brokerCompanyName}
                    onChange={(e) => setInvoice(prev => ({ ...prev, brokerCompanyName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brokerEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="brokerEmail"
                      type="email"
                      placeholder="broker@example.com"
                      className="pl-10"
                      value={invoice.brokerEmail}
                      onChange={(e) => setInvoice(prev => ({ ...prev, brokerEmail: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brokerPhone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="brokerPhone"
                      placeholder="(555) 123-4567"
                      className="pl-10"
                      value={invoice.brokerPhone}
                      onChange={(e) => setInvoice(prev => ({ ...prev, brokerPhone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brokerAddress">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="brokerAddress"
                      placeholder="123 Main St, City, State ZIP"
                      className="pl-10"
                      value={invoice.brokerAddress}
                      onChange={(e) => setInvoice(prev => ({ ...prev, brokerAddress: e.target.value }))}
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
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Description (Order Number)</Label>
                                <Input
                                  placeholder="Enter order number or description"
                                  value={item.description}
                                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                  className="bg-yellow-50 border-yellow-300 focus:border-yellow-500"
                                />
                              </div>
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
                                  <p className="font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded inline-block">{item.description}</p>
                                  <p className="text-sm text-muted-foreground mt-1">
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
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold">Speedy Carriers</h2>
                      <p className="text-sm text-muted-foreground">Auto Carrier Services</p>
                      <p className="text-sm text-muted-foreground">Professional Car Hauling</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        414 PARLIN ST FL 1<br />
                        Philadelphia, PA 19116
                      </p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl font-bold">INVOICE</h2>
                      <p className="text-muted-foreground">Invoice #{invoice.invoiceNumber}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold mb-2">Bill To:</p>
                      <p>{invoice.brokerCompanyName || "Broker Company Name"}</p>
                      <p>{invoice.brokerEmail || "broker@email.com"}</p>
                      <p>{invoice.brokerPhone || "(555) 123-4567"}</p>
                      <p>{invoice.brokerAddress || "Broker Address"}</p>
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
                              <p className="bg-yellow-100 text-yellow-800 font-semibold px-2 py-1 rounded inline-block">{item.description}</p>
                              <p className="text-muted-foreground text-xs mt-1">
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

                  <Separator />

                  <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
                    <p className="font-semibold mb-2 text-sm flex items-center gap-2">
                      💳 Payment Information
                    </p>
                    <div className="text-sm space-y-1">
                      <p><span className="font-semibold">Zelle Payment:</span></p>
                      <p>Send payment to: <span className="text-blue-600 font-semibold">info@spdcarriers.com</span></p>
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
