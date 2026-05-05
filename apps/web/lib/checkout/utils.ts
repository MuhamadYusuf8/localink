import type { CheckoutCartItem } from './types';

export function formatRupiah(value: number) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value || 0)}`;
}

export function validatePhoneID(phone: string) {
  return /^0\d{8,13}$/.test(phone.replace(/[-\s]/g, ''));
}

export function groupItemsByFarmer(items: CheckoutCartItem[]) {
  const map = new Map<string, CheckoutCartItem[]>();
  items.forEach((item) => {
    const key = item.farmer_id;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  });
  return Array.from(map.entries()).map(([farmerId, groupedItems]) => ({
    farmerId,
    farmerName: groupedItems[0]?.farmer_name ?? '-',
    farmerCity: groupedItems[0]?.farmer_city ?? '-',
    items: groupedItems,
    subtotal: groupedItems.reduce((acc, it) => acc + Number(it.subtotal || 0), 0),
  }));
}

export function calculateTotals(items: CheckoutCartItem[], deliveryFee: number, discount = 0) {
  const subtotal = items.reduce((acc, it) => acc + Number(it.subtotal || 0), 0);
  const total = subtotal + deliveryFee - discount;
  return { subtotal, deliveryFee, discount, total };
}

export function estimateArrival(deliveryType: 'reguler' | 'express') {
  const now = new Date();
  const days = deliveryType === 'express' ? 2 : 5;
  now.setDate(now.getDate() + days);
  return now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}
