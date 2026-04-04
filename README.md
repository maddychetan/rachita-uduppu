# Rachita Uduppu — Product Showcase & Inventory

A modern product showcase website for **Rachita Uduppu**, an Indian clothing brand based in Davangere, Karnataka. Features a public storefront with WhatsApp ordering and a private admin panel for inventory management.

## Features

### Public Storefront
- Hero section with brand identity
- Category filter (Kurtis, Two Piece Cord Sets, Three Piece Cord Sets, Sarees, Gowns)
- Product grid with images, pricing, and WhatsApp "Order" buttons
- Dark mode toggle
- Fully responsive (mobile + desktop)
- Social media links (Instagram, Facebook, YouTube)

### Admin Panel (`/admin`)
- Dashboard with inventory overview stats
- Product CRUD (add, edit, delete)
- Variant management (size × color × stock)
- Low stock alerts

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Netlify Functions (serverless)
- **Storage:** Netlify Blobs (key-value store)
- **Routing:** wouter with hash-based routing

## Deploy to Netlify

1. Push this repo to GitHub
2. Go to [netlify.com](https://netlify.com) → "Add new site" → "Import an existing project"
3. Connect your GitHub repo
4. Netlify auto-detects settings from `netlify.toml`
5. Click "Deploy site"

## Local Development

```bash
npm install
npm run dev
```

For local Netlify Functions testing:
```bash
npx netlify dev
```

## Project Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/       # Storefront, Dashboard, Products, Inventory
│   │   ├── components/  # shadcn/ui components
│   │   └── lib/         # API client, utilities
│   └── index.html
├── netlify/
│   └── functions/
│       └── api.ts       # Serverless API (all routes)
├── shared/
│   └── types.ts         # TypeScript interfaces + Zod schemas
├── netlify.toml         # Netlify build & redirect config
└── vite.config.ts
```

## Brand Info

- **WhatsApp:** +91 7829441004
- **Location:** Davangere, Karnataka, India
- **Tagline:** "Crafted with Tradition"
