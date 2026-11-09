import type { Metadata } from "next";
import { Checkout } from "./Checkout";

export const metadata: Metadata = { title: "Secure checkout", robots: { index: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  return (
    <div className="container-page py-8">
      <h1 className="mb-6 font-display text-3xl font-semibold">Secure checkout</h1>
      <Checkout bookingId={bookingId} />
    </div>
  );
}
