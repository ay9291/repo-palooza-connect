export interface PremiumProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  category: string | null;
  is_active: boolean;
}

export interface PremiumCartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: PremiumProduct;
}

export interface PremiumOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
}

export interface DeliveryAssignment {
  id: string;
  order_id: string;
  partner_id: string;
  delivery_status: string;
}
