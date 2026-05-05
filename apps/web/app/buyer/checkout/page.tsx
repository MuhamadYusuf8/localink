'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, MapPin, CreditCard, ShieldCheck } from 'lucide-react'
import apiClient from '@/lib/api/client'
import { useCartStore } from '@/lib/store/cartStore'
import { Button } from '@/components/ui/Button'
import { PriceDisplay } from '@/components/ui/PriceDisplay'

interface Address {
  id: string
  label: string
  recipient_name: string
  phone: string
  full_address: string
  is_default: boolean
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, grouped, summary, clearCart } = useCartStore()
  
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Fetch user addresses (Mocking or real if endpoint exists)
    apiClient.get('/buyer/addresses')
      .then(res => {
        setAddresses(res.data.data)
        const def = res.data.data.find((a: Address) => a.is_default)
        if (def) setSelectedAddressId(def.id)
        else if (res.data.data.length > 0) setSelectedAddressId(res.data.data[0].id)
      })
      .catch(console.error)
  }, [])

  // Validasi item keranjang
  const checkoutItems = items.filter(i => i.is_available && i.meets_wholesale_min)
  
  if (items.length === 0) {
    router.push('/cart')
    return null
  }

  // Hitung ulang dengan ongkir per petani (Mock: Rp 15.000 per petani)
  const numFarmers = Object.keys(grouped).length
  const totalShipping = numFarmers * 15000
  const grandTotal = summary.subtotal + totalShipping

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      alert('Pilih alamat pengiriman terlebih dahulu.')
      return
    }

    setIsLoading(true)
    try {
      const res = await apiClient.post('/buyer/checkout', {
        address_id: selectedAddressId,
        cart_item_ids: checkoutItems.map(i => i.id),
        payment_method: paymentMethod,
        notes: ''
      })
      
      // Bersihkan keranjang
      clearCart()
      
      // Redirect ke mock payment URL atau success page
      const paymentUrl = res.data.data.payment_url
      router.push(paymentUrl || '/buyer/orders')
      
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Checkout gagal')
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-fade-in">
      <h1 className="font-display font-bold text-3xl text-text-primary mb-8">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          
          {/* Alamat Pengiriman */}
          <section className="p-6 rounded-card bg-dark-surface border border-dark-border space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-text-primary">
              <MapPin className="text-emerald-500" /> Alamat Pengiriman
            </div>
            
            {addresses.length === 0 ? (
              <div className="text-sm text-text-muted">
                Belum ada alamat. Silakan tambah alamat di pengaturan profil.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map(addr => (
                  <div 
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-button border cursor-pointer transition-colors ${
                      selectedAddressId === addr.id 
                        ? 'bg-emerald-900/20 border-emerald-500' 
                        : 'bg-dark-void border-dark-border hover:border-dark-muted'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-text-primary">{addr.label}</span>
                      {selectedAddressId === addr.id && <CheckCircle size={18} className="text-emerald-500" />}
                    </div>
                    <p className="text-sm text-text-secondary font-medium">{addr.recipient_name} • {addr.phone}</p>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">{addr.full_address}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Ringkasan Pesanan */}
          <section className="p-6 rounded-card bg-dark-surface border border-dark-border space-y-6">
            <h2 className="text-lg font-semibold text-text-primary border-b border-dark-border pb-4">Pesanan Anda</h2>
            
            <div className="space-y-6">
              {Object.keys(grouped).map(farmerName => (
                <div key={farmerName} className="space-y-4">
                  <h3 className="font-medium text-text-primary">{farmerName}</h3>
                  <div className="space-y-3">
                    {grouped[farmerName].map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div className="flex gap-3">
                          <span className="text-text-muted">{item.quantity}x</span>
                          <span className="text-text-secondary">{item.product?.name}</span>
                        </div>
                        <PriceDisplay amount={item.current_price * item.quantity} size="sm" />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm text-text-muted pt-2 border-t border-dark-border/50">
                    <span>Ongkos Kirim</span>
                    <span>Rp 15.000</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Metode Pembayaran */}
          <section className="p-6 rounded-card bg-dark-surface border border-dark-border space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-text-primary">
              <CreditCard className="text-emerald-500" /> Metode Pembayaran
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'bank_transfer', label: 'Transfer Bank (VA)' },
                { id: 'ewallet', label: 'E-Wallet (Gopay/OVO)' },
                { id: 'qris', label: 'QRIS' },
              ].map(method => (
                <div 
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-4 rounded-button border text-center cursor-pointer transition-colors ${
                    paymentMethod === method.id 
                      ? 'bg-emerald-900/20 border-emerald-500 text-emerald-400' 
                      : 'bg-dark-void border-dark-border hover:border-dark-muted text-text-secondary'
                  }`}
                >
                  <span className="text-sm font-medium">{method.label}</span>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Total Ringkasan */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="rounded-card bg-dark-surface border border-dark-border p-6 sticky top-24 space-y-6">
            <h2 className="font-semibold text-text-primary">Ringkasan Pembayaran</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Total Harga ({checkoutItems.length} barang)</span>
                <PriceDisplay amount={summary.subtotal} size="sm" showCurrency={false} />
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Total Ongkos Kirim</span>
                <PriceDisplay amount={totalShipping} size="sm" showCurrency={false} />
              </div>
            </div>
            
            <div className="pt-4 border-t border-dark-border flex justify-between items-center">
              <span className="font-medium text-text-primary">Total Tagihan</span>
              <PriceDisplay amount={grandTotal} size="lg" className="text-emerald-400" />
            </div>

            <div className="bg-emerald-900/10 border border-emerald-500/20 rounded p-3 flex items-start gap-3 mt-4">
              <ShieldCheck className="text-emerald-500 flex-shrink-0" size={18} />
              <p className="text-xs text-text-muted leading-relaxed">
                Pembayaran Anda aman. Dana baru diteruskan ke petani setelah pesanan tiba di tujuan.
              </p>
            </div>
            
            <Button 
              variant="primary" 
              size="lg" 
              fullWidth 
              onClick={handleCheckout}
              isLoading={isLoading}
              disabled={checkoutItems.length === 0 || !selectedAddressId}
            >
              Bayar Sekarang
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
