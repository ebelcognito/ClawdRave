// [DEFINE:CheckoutForm]

import React, { useState } from "react";
import {
  CartItem,
  DeliveryInfo,
  PaymentInfo,
  OrderSubmissionPayload,
  OrderResponse,
  CheckoutFormErrors,
  TipOption,
} from "./types";

interface CheckoutFormProps {
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: string;
  deliveryFee: string;
  tax: string;
  onOrderSuccess: (order: OrderResponse) => void;
  onOrderError: (error: string) => void;
}

const tipPercentages: Record<TipOption, number> = {
  none: 0,
  "15": 0.15,
  "18": 0.18,
  "20": 0.2,
  custom: 0,
};

const formatPrice = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

const parsePrice = (price: string): number => {
  return Math.round(parseFloat(price.replace("$", "")) * 100);
};

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  restaurantId,
  restaurantName,
  items,
  subtotal,
  deliveryFee,
  tax,
  onOrderSuccess,
  onOrderError,
}) => {
  const [delivery, setDelivery] = useState<DeliveryInfo>({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    apartment: "",
    city: "",
    zipCode: "",
    deliveryInstructions: "",
  });

  const [payment, setPayment] = useState<PaymentInfo>({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    saveCard: false,
  });

  const [tipOption, setTipOption] = useState<TipOption>("18");
  const [customTip, setCustomTip] = useState("");
  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateTip = (): string => {
    const subtotalCents = parsePrice(subtotal);
    if (tipOption === "custom" && customTip) {
      return `$${parseFloat(customTip).toFixed(2)}`;
    }
    const tipCents = Math.round(subtotalCents * tipPercentages[tipOption]);
    return formatPrice(tipCents);
  };

  const calculateTotal = (): string => {
    const subtotalCents = parsePrice(subtotal);
    const deliveryCents = parsePrice(deliveryFee);
    const taxCents = parsePrice(tax);
    const tipCents = parsePrice(calculateTip());
    return formatPrice(subtotalCents + deliveryCents + taxCents + tipCents);
  };

  const validateForm = (): boolean => {
    const newErrors: CheckoutFormErrors = {};

    if (!delivery.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    if (!delivery.phone.match(/^\+?[\d\s-]{10,}$/)) {
      newErrors.phone = "Valid phone number is required";
    }
    if (!delivery.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "Valid email is required";
    }
    if (!delivery.address.trim()) {
      newErrors.address = "Address is required";
    }
    if (!delivery.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!delivery.zipCode.match(/^\d{5}(-\d{4})?$/)) {
      newErrors.zipCode = "Valid ZIP code is required";
    }
    if (!payment.cardNumber.match(/^[\d\s]{16,19}$/)) {
      newErrors.cardNumber = "Valid card number is required";
    }
    if (!payment.expiryDate.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
      newErrors.expiryDate = "Valid expiry date (MM/YY) is required";
    }
    if (!payment.cvv.match(/^\d{3,4}$/)) {
      newErrors.cvv = "Valid CVV is required";
    }
    if (!payment.cardholderName.trim()) {
      newErrors.cardholderName = "Cardholder name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const payload: OrderSubmissionPayload = {
      restaurantId,
      items,
      delivery,
      payment,
      tip: calculateTip(),
      subtotal,
      deliveryFee,
      tax,
      total: calculateTotal(),
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Order submission failed");
      }

      onOrderSuccess(data as OrderResponse);
    } catch (error) {
      onOrderError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeliveryChange = (field: keyof DeliveryInfo, value: string) => {
    setDelivery((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof CheckoutFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePaymentChange = (field: keyof PaymentInfo, value: string | boolean) => {
    setPayment((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof CheckoutFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      {/* Order Summary */}
      <section className="checkout-section">
        <h2>Order from {restaurantName}</h2>
        <div className="order-items">
          {items.map((item) => (
            <div key={item.menuItemId} className="order-item">
              <span className="item-quantity">{item.quantity}x</span>
              <span className="item-name">{item.name}</span>
              <span className="item-price">{item.price}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Delivery Information */}
      <section className="checkout-section">
        <h2>Delivery Information</h2>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="fullName">Full Name *</label>
            <input
              id="fullName"
              type="text"
              value={delivery.fullName}
              onChange={(e) => handleDeliveryChange("fullName", e.target.value)}
              className={errors.fullName ? "error" : ""}
            />
            {errors.fullName && <span className="error-text">{errors.fullName}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="phone">Phone *</label>
            <input
              id="phone"
              type="tel"
              value={delivery.phone}
              onChange={(e) => handleDeliveryChange("phone", e.target.value)}
              className={errors.phone ? "error" : ""}
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>

          <div className="form-field full-width">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              value={delivery.email}
              onChange={(e) => handleDeliveryChange("email", e.target.value)}
              className={errors.email ? "error" : ""}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-field full-width">
            <label htmlFor="address">Street Address *</label>
            <input
              id="address"
              type="text"
              value={delivery.address}
              onChange={(e) => handleDeliveryChange("address", e.target.value)}
              className={errors.address ? "error" : ""}
            />
            {errors.address && <span className="error-text">{errors.address}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="apartment">Apt/Suite (Optional)</label>
            <input
              id="apartment"
              type="text"
              value={delivery.apartment}
              onChange={(e) => handleDeliveryChange("apartment", e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="city">City *</label>
            <input
              id="city"
              type="text"
              value={delivery.city}
              onChange={(e) => handleDeliveryChange("city", e.target.value)}
              className={errors.city ? "error" : ""}
            />
            {errors.city && <span className="error-text">{errors.city}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="zipCode">ZIP Code *</label>
            <input
              id="zipCode"
              type="text"
              value={delivery.zipCode}
              onChange={(e) => handleDeliveryChange("zipCode", e.target.value)}
              className={errors.zipCode ? "error" : ""}
            />
            {errors.zipCode && <span className="error-text">{errors.zipCode}</span>}
          </div>

          <div className="form-field full-width">
            <label htmlFor="deliveryInstructions">Delivery Instructions (Optional)</label>
            <textarea
              id="deliveryInstructions"
              value={delivery.deliveryInstructions}
              onChange={(e) => handleDeliveryChange("deliveryInstructions", e.target.value)}
              placeholder="Gate code, leave at door, etc."
            />
          </div>
        </div>
      </section>

      {/* Payment Information */}
      <section className="checkout-section">
        <h2>Payment</h2>
        <div className="form-grid">
          <div className="form-field full-width">
            <label htmlFor="cardNumber">Card Number *</label>
            <input
              id="cardNumber"
              type="text"
              value={payment.cardNumber}
              onChange={(e) => handlePaymentChange("cardNumber", e.target.value)}
              placeholder="1234 5678 9012 3456"
              className={errors.cardNumber ? "error" : ""}
            />
            {errors.cardNumber && <span className="error-text">{errors.cardNumber}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="expiryDate">Expiry Date *</label>
            <input
              id="expiryDate"
              type="text"
              value={payment.expiryDate}
              onChange={(e) => handlePaymentChange("expiryDate", e.target.value)}
              placeholder="MM/YY"
              className={errors.expiryDate ? "error" : ""}
            />
            {errors.expiryDate && <span className="error-text">{errors.expiryDate}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="cvv">CVV *</label>
            <input
              id="cvv"
              type="text"
              value={payment.cvv}
              onChange={(e) => handlePaymentChange("cvv", e.target.value)}
              placeholder="123"
              className={errors.cvv ? "error" : ""}
            />
            {errors.cvv && <span className="error-text">{errors.cvv}</span>}
          </div>

          <div className="form-field full-width">
            <label htmlFor="cardholderName">Cardholder Name *</label>
            <input
              id="cardholderName"
              type="text"
              value={payment.cardholderName}
              onChange={(e) => handlePaymentChange("cardholderName", e.target.value)}
              className={errors.cardholderName ? "error" : ""}
            />
            {errors.cardholderName && <span className="error-text">{errors.cardholderName}</span>}
          </div>

          <div className="form-field full-width checkbox-field">
            <input
              id="saveCard"
              type="checkbox"
              checked={payment.saveCard}
              onChange={(e) => handlePaymentChange("saveCard", e.target.checked)}
            />
            <label htmlFor="saveCard">Save card for future orders</label>
          </div>
        </div>
      </section>

      {/* Tip Selection */}
      <section className="checkout-section">
        <h2>Add a Tip</h2>
        <div className="tip-options">
          {(["none", "15", "18", "20", "custom"] as TipOption[]).map((option) => (
            <button
              key={option}
              type="button"
              className={`tip-button ${tipOption === option ? "selected" : ""}`}
              onClick={() => setTipOption(option)}
            >
              {option === "none" ? "No Tip" : option === "custom" ? "Custom" : `${option}%`}
            </button>
          ))}
        </div>
        {tipOption === "custom" && (
          <div className="form-field custom-tip">
            <label htmlFor="customTip">Custom Tip Amount</label>
            <input
              id="customTip"
              type="number"
              min="0"
              step="0.01"
              value={customTip}
              onChange={(e) => setCustomTip(e.target.value)}
              placeholder="0.00"
            />
          </div>
        )}
      </section>

      {/* Order Total */}
      <section className="checkout-section order-total">
        <div className="total-row">
          <span>Subtotal</span>
          <span>{subtotal}</span>
        </div>
        <div className="total-row">
          <span>Delivery Fee</span>
          <span>{deliveryFee}</span>
        </div>
        <div className="total-row">
          <span>Tax</span>
          <span>{tax}</span>
        </div>
        <div className="total-row">
          <span>Tip</span>
          <span>{calculateTip()}</span>
        </div>
        <div className="total-row total-final">
          <span>Total</span>
          <span>{calculateTotal()}</span>
        </div>
      </section>

      <button type="submit" className="submit-button" disabled={isSubmitting}>
        {isSubmitting ? "Placing Order..." : `Place Order • ${calculateTotal()}`}
      </button>
    </form>
  );
};

export default CheckoutForm;
