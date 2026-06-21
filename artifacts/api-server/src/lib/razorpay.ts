import Razorpay from "razorpay";
import crypto from "crypto";

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 1f8f56d (Feat: add admin announcement system, match auto-updater, and UI navigation tweaks)
let _razorpay: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (_razorpay) return _razorpay;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set to use payments");
<<<<<<< HEAD
  }
  _razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return _razorpay;
=======
function getRazorpayClient(): Razorpay {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
>>>>>>> b614d52 (Make Razorpay initialization lazy to allow server startup without credentials)
=======
  }
  _razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return _razorpay;
>>>>>>> 1f8f56d (Feat: add admin announcement system, match auto-updater, and UI navigation tweaks)
}

export const razorpay = new Proxy({} as Razorpay, {
  get(_target, prop) {
<<<<<<< HEAD
<<<<<<< HEAD
    return (getRazorpay() as any)[prop];
=======
    return (getRazorpayClient() as unknown as Record<string | symbol, unknown>)[prop];
>>>>>>> b614d52 (Make Razorpay initialization lazy to allow server startup without credentials)
=======
    return (getRazorpay() as any)[prop];
>>>>>>> 1f8f56d (Feat: add admin announcement system, match auto-updater, and UI navigation tweaks)
  },
});

export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("RAZORPAY_KEY_SECRET must be set");
  const body = `${params.orderId}|${params.paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === params.signature;
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET must be set");
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}
