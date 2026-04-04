// [DEFINE:CheckoutForm/types]

/**
 * Individual cart item for order submission
 */
export interface CartItem {
  menuItemId: string;
  name: string;
  price: string; // Formatted price e.g. "$12.99"
  quantity: number;
  specialInstructions?: string;
}

/**
 * Customer delivery information
 */
export interface DeliveryInfo {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  apartment?: string;
  city: string;
  zipCode: string;
  deliveryInstructions?: string;
}

/**
 * Payment details
 */
export interface PaymentInfo {
  cardNumber: string;
  expiryDate: string; // "MM/YY" format
  cvv: string;
  cardholderName: string;
  saveCard?: boolean;
}

/**
 * Tip selection
 */
export type TipOption = "none" | "15" | "18" | "20" | "custom";

/**
 * Order submission payload - sent to POST /api/orders
 */
export interface OrderSubmissionPayload {
  restaurantId: string;
  items: CartItem[];
  delivery: DeliveryInfo;
  payment: PaymentInfo;
  tip: string; // Formatted tip amount e.g. "$5.00"
  subtotal: string;
  deliveryFee: string;
  tax: string;
  total: string;
  scheduledTime?: string; // ISO timestamp for scheduled orders
}

/**
 * API response after successful order creation
 */
export interface OrderResponse {
  orderId: string;
  status: "confirmed" | "pending" | "failed";
  estimatedDelivery: string; // ISO timestamp
  restaurantName: string;
  items: CartItem[];
  subtotal: string;
  deliveryFee: string;
  tax: string;
  tip: string;
  total: string;
  trackingUrl: string;
  createdAt: string; // ISO timestamp
}

/**
 * API error response shape
 */
export interface OrderErrorResponse {
  error: string;
  code: string;
  field?: string; // Which field caused the error
}

/**
 * Form validation state
 */
export interface CheckoutFormErrors {
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardholderName?: string;
}
