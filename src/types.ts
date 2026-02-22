export interface CustomerState {
  phone: string;
  name: string;
  current_state: string;
  current_order: OrderItem[];
  order_total: number;
  selected_item?: MenuItem;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  available: boolean;
}

export interface OrderItem {
  item_id: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id?: number;
  customer_phone: string;
  customer_name: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

export interface WebhookMessage {
  From: string;
  To: string;
  Body: string;
  ProfileName?: string;
  MessageSid: string;
}