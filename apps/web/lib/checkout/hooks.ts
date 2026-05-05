'use client';

import { useEffect, useMemo, useState } from 'react';
import type { BuyerAddress, CheckoutCartItem } from './types';
import { calculateTotals } from './utils';

export function useAddresses() {
  const [addresses, setAddresses] = useState<BuyerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/buyer/addresses');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || 'Gagal memuat alamat');
      setAddresses(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);
  return { addresses, setAddresses, loading, error, reload: load };
}

export function useCheckout() {
  const [items, setItems] = useState<CheckoutCartItem[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(35000);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('buyer_cart_items');
      const parsed = raw ? JSON.parse(raw) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
  }, []);

  const totals = useMemo(() => calculateTotals(items, deliveryFee, discount), [items, deliveryFee, discount]);
  return { items, setItems, deliveryFee, setDeliveryFee, discount, setDiscount, totals };
}
