/**
 * Payment service for sending USDC payments after feedback session
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface PaymentRequest {
  amount?: number;
  recipient_address?: string;
  memo?: string;
}

export interface PaymentResponse {
  success: boolean;
  amount?: number;
  recipient?: string;
  memo?: string;
  response?: string;
  transaction_details?: any;
  error?: string;
}

class PaymentService {
  /**
   * Send USDC payment after feedback session completes
   */
  async sendPayment(
    amount?: number,
    recipientAddress?: string,
    memo?: string
  ): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          recipient_address: recipientAddress,
          memo: memo || "Feedback session payment",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.detail || error.error || "Failed to send payment"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Payment service error:", error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();

