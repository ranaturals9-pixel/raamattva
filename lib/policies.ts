/**
 * Draft policy text, shown until the owner publishes approved wording from the
 * admin area (Site text → policy.privacy etc.). "To be confirmed" marks owner decisions.
 * Format: "## Heading" lines and blank-line paragraphs.
 */
export const POLICIES = {
  privacy: {
    title: "Privacy policy",
    draft: `## What we collect
We collect only what is needed: your name, and your WhatsApp number or email. For shop orders we also collect a delivery address. For Gurukul registrations we collect the parent or guardian's details and the child's first name, age and city.

## How we use it
To confirm registrations, share session links, process and deliver orders, and reply to enquiries. We do not sell personal information.

## Children's information and photographs
Children are registered only by a parent or guardian, who confirms this when registering. Photographs of children are published only with the guardian's consent, which can be withdrawn at any time.

## Payments
Payments are handled by Razorpay. We do not store card or UPI details.

## Your choices
You can ask us to correct or delete your information through the contact page.

## Contact for privacy questions
To be confirmed.`,
  },
  terms: {
    title: "Terms of use",
    draft: `## Using this website
By using this website you agree to these terms. Raamattva Vidya Peeth may update them from time to time.

## Courses and sessions
Course content, recordings and study material are for the registered participant's personal use and may not be shared or redistributed.

## Shop
Product descriptions state only verified details. We do not promise health, wealth, protection or spiritual results from any product.

## Governing law
To be confirmed.`,
  },
  shipping: {
    title: "Shipping policy",
    draft: `## Where we ship
To be confirmed.

## Dispatch and delivery times
To be confirmed.

## Charges
Shipping charges are shown in the cart before you pay.

## Tracking
Once an order is dispatched, tracking details are sent by WhatsApp or email and shown in your account.`,
  },
  refunds: {
    title: "Cancellations, refunds and returns",
    draft: `## Paid courses and sessions
Cancellation window and refund terms: to be confirmed.

If we cancel or reschedule a session, everyone registered is told directly and offered the new date or a refund.

## Free sessions
You can cancel a free registration at any time by replying to your confirmation or contacting us.

## Shop returns
Return window and conditions: to be confirmed.

## How refunds are paid
Refunds go back to the original payment method. Processing time: to be confirmed.`,
  },
} as const;

export type PolicyKey = keyof typeof POLICIES;
