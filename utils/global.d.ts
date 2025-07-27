// global.d.ts or types/global.d.ts
interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    image?: string;
    order_id: string;
    handler: (response: RazorpayResponse) => void;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    notes?: {
      [key: string]: string;
    };
    theme?: {
      color?: string;
    };
  }
  
  interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }
  
  interface RazorpayInstance {
    open(): void;
    on(event: string, callback: Function): void;
    close(): void;
  }
  
  interface RazorpayStatic {
    new(options: RazorpayOptions): RazorpayInstance;
  }
  
  // Extend the Window interface in the global namespace
  declare global {
    interface Window {
      Razorpay: RazorpayStatic;
    }
  }