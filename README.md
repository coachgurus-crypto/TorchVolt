This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

### Shop inventory

Open **Admin → Products** to create a listing, set a price in whole naira, and update stock. A draft is private until you check **Publish in the shop**. To remove a listing from the shop while keeping its record, uncheck publication. Low stock means one to five units.

The inventory table is created by `migrations/0006_products.sql`. Apply the migration to the intended D1 database before enabling this feature there. For local testing, use Wrangler's local D1 and Pages preview with the same persistence directory. Provide a local dashboard PIN via the preview configuration. The static preview alone cannot save inventory.

Checkout is a demo: cart quantities respect the catalog's reported stock, but checkout does not reserve stock, create an order or take payment.

Product photos can be uploaded from the product editor as JPEG, PNG or WebP files up to 512 KB. Photos are stored with the product in D1 and only published products' uploads are publicly visible. Apply `migrations/0007_product_images.sql` after the inventory migration before deploying upload support. Existing image URLs still work.

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
