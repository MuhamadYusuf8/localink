'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriceDisplay } from '@/components/ui/PriceDisplay';

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/buyer/orders');
        const json = await res.json();
        if (json.success) {
          setOrders(json.data);
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 animate-pulse space-y-4">
        <div className="h-32 bg-dark-surface rounded-card" />
        <div className="h-32 bg-dark-surface rounded-card" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <Package size={48} className="mx-auto text-dark-muted mb-4" />
        <h1 className="font-display font-bold text-2xl text-text-primary mb-2">Belum Ada Pesanan</h1>
        <p className="text-text-secondary mb-8">Anda belum pernah melakukan pemesanan.</p>
        <Link href="/products">
          <Button variant="primary">Mulai Belanja</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in space-y-6">
      <h1 className="font-display font-bold text-3xl text-text-primary mb-8">Daftar Pesanan</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Link 
            key={order.id} 
            href={`/buyer/orders/${order.id}`}
            className="block rounded-card bg-dark-surface border border-dark-border overflow-hidden transition-all hover:border-emerald-500/50 hover:bg-dark-muted/20"
          >
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Package size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-text-primary text-lg">{order.order_number || `Order #${order.id.slice(0, 8)}`}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-text-muted mt-1">
                    {new Date(order.created_at).toLocaleDateString('id-ID', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 sm:text-right">
                <div>
                  <p className="text-xs text-text-muted mb-1">Total Pesanan</p>
                  <PriceDisplay amount={order.total_amount} size="md" />
                </div>
                <ChevronRight className="text-dark-muted" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
