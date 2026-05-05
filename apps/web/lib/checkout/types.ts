export interface CheckoutCartItem {
  product_id: string;
  farmer_id: string;
  farmer_name: string;
  farmer_avatar: string;
  farmer_city: string;
  product_name: string;
  product_emoji: string;
  unit: string;
  qty: number;
  price_per_unit: number;
  subtotal: number;
  is_wholesale?: boolean;
  notes?: string;
}

export interface BuyerAddress {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  postal_code?: string;
  is_primary: boolean;
}

export interface OrderDraftPayload {
  buyer_id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  address_id: string;
  courier: string;
  delivery_type: 'reguler' | 'express';
  delivery_fee: number;
  estimated_days: string;
  payment_method: 'transfer_bank' | 'qris' | 'cod' | 'ewallet';
  promo_code?: string;
  discount_amount?: number;
  notes?: string;
  items: CheckoutCartItem[];
}
