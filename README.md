# BlackBuck Operations Dashboard

A modern, production-ready internal dashboard built for field agents to record fuel dispositions, track vehicle status, and access operations analytics seamlessly.

![Dashboard Preview](https://github.com/arshnoorkirmani/blackbuck-dashboard/assets/placeholder.png)

## 🚀 Features

- **Google Workspace Authentication:** Fully integrated `NextAuth v5` (Auth.js) secure sign-in with Google OAuth.
- **Offline Data Syncing:** Form drafts are auto-saved to `localStorage` preventing accidental data loss during active field calls.
- **Dynamic Zod Validation:** Complete end-to-end data safety using Zod and `react-hook-form` across complex conditional logic flows.
- **Premium Design System:** Built with Tailwind CSS v4 and `shadcn/ui`. Includes fully accessible modals, unified color tokens, and smooth micro-interactions.
- **Dark/Light Mode:** First-class support for `next-themes` offering an eye-strain-friendly dark layout for extended operation usage.

## 🛠️ Tech Stack

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router, Server Actions, React Server Components)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **State Management & Validation:** `react-hook-form` & `zod`
- **Authentication:** `next-auth@beta` (Auth.js)
- **Icons:** `lucide-react`
- **Typography:** DM Sans, Syne, JetBrains Mono

## 📦 Local Setup

1. **Clone the repository:**
```bash
git clone https://github.com/arshnoorkirmani/blackbuck-dashboard.git
cd blackbuck-dashboard
```

2. **Install dependencies:**
```bash
npm install
```

3. **Environment Setup:**
Create a `.env.local` file at the root of the project with the following credentials (required for Google Login):
```env
AUTH_SECRET="your-super-secret-key-for-nextauth"
AUTH_GOOGLE_ID="your-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-client-secret"
```

4. **Run the development server:**
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Repository Structure

- `app/`: Next.js App Router definitions, Page layouts, and API Routes (`api/auth`).
- `components/`: Isolated React components, containing the `AppHeader`, forms, and `shadcn/ui` atomic elements.
- `lib/services/`: Core business logic, mock DB integration, and local caching singletons (`disposition.service.ts`).

## 🛡️ License

Private - For internal BlackBuck Operations usage.
