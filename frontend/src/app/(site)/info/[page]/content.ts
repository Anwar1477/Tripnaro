export interface InfoPage {
  title: string;
  description: string;
  sections: { h: string; p: string[] }[];
}

/** Static company / policy pages. Replace with your legal team's final wording before launch. */
export const INFO_PAGES: Record<string, InfoPage> = {
  about: {
    title: "About Tripnaro",
    description: "Tripnaro is a Bangladesh-born travel platform for flights, stays, tours, buses and visas.",
    sections: [
      { h: "Our mission", p: ["We want every trip, whether a weekend in Sylhet or a honeymoon in Bali, to be simple to plan and fair to pay for. Tripnaro brings flights, hotels, tour packages, intercity buses and visa processing into one transparent checkout."] },
      { h: "How we work", p: ["We partner with hotels, tour operators, bus operators and licensed travel suppliers. Prices are re-checked by our servers before you pay, and bookings are confirmed only after the payment provider confirms the transaction."] },
      { h: "Where we are", p: ["Our team is based in Dhaka and supports travellers by phone, email and chat every day of the year."] },
    ],
  },
  contact: {
    title: "Contact us",
    description: "We're here to help before, during and after your trip.",
    sections: [
      { h: "Customer support", p: ["Email support@tripnaro.com or call +880 9612-000000 (24/7). For an existing booking, please include your booking reference (for example TNH-AB12CD34)."] },
      { h: "Office", p: ["Level 7, Gulshan Avenue, Dhaka 1212, Bangladesh. Visits by appointment."] },
      { h: "Partnerships", p: ["Hotels, tour operators and bus companies can reach our supply team at partners@tripnaro.com."] },
    ],
  },
  careers: {
    title: "Careers",
    description: "Help us build the easiest way to travel from Bangladesh.",
    sections: [
      { h: "Open roles", p: ["We hire across engineering, travel operations, customer experience and partnerships. Send your CV to careers@tripnaro.com with the role in the subject line."] },
    ],
  },
  terms: {
    title: "Terms & conditions",
    description: "The rules that apply when you use Tripnaro and make a booking.",
    sections: [
      { h: "Bookings", p: ["A booking is confirmed only when you receive a confirmation from Tripnaro after successful, verified payment. Unpaid bookings are held for 30 minutes and then released."] },
      { h: "Prices", p: ["Prices are shown in Bangladeshi Taka (BDT) and include applicable taxes and the Tripnaro service fee unless stated otherwise. Supplier prices can change until payment is completed."] },
      { h: "Traveller responsibility", p: ["You are responsible for providing accurate traveller names and travel documents (NID, passport, visa) that meet the requirements of airlines, operators and immigration authorities."] },
      { h: "Visa services", p: ["Tripnaro assists with documentation and submission. The decision to grant a visa rests solely with the relevant embassy or authority, and embassy fees are non-refundable once submitted."] },
    ],
  },
  privacy: {
    title: "Privacy policy",
    description: "How Tripnaro collects, uses and protects your personal information.",
    sections: [
      { h: "What we collect", p: ["Account details (name, email, phone), traveller details you enter for bookings, uploaded visa documents, and payment status information from our payment partners. We never store full card numbers."] },
      { h: "How we use it", p: ["To create and manage your bookings, communicate updates, prevent fraud, and, if you opt in, send offers. Visa documents are stored privately and are only accessible to you and authorised staff."] },
      { h: "Your choices", p: ["You can update your profile and notification preferences in My account, and request deletion of your data by contacting support."] },
    ],
  },
  "refund-policy": {
    title: "Cancellation & refund policy",
    description: "What happens when plans change.",
    sections: [
      { h: "Unpaid bookings", p: ["You can cancel an unpaid booking at any time from My account. Its hold is released immediately."] },
      { h: "Paid bookings", p: ["Cancellation requests for paid bookings are reviewed against the supplier's policy shown at the time of booking (e.g. free cancellation, partial refund or non-refundable)."] },
      { h: "Refund timing", p: ["Approved refunds are returned to the original payment method. Mobile wallets typically take 3–7 working days and cards 7–15 working days depending on your bank."] },
    ],
  },
  "payment-security": {
    title: "Payment security",
    description: "How we keep your payments safe.",
    sections: [
      { h: "Hosted payment pages", p: ["Card and wallet details are entered on the payment provider's secure page (SSLCommerz, bKash, Nagad or Stripe), never on Tripnaro's servers."] },
      { h: "Server-side verification", p: ["After you pay, our servers verify the transaction directly with the provider before confirming your booking. A redirect alone is never treated as proof of payment."] },
    ],
  },
};
