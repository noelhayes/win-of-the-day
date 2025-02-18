# 🌟 Win of the Day

> "Friendship isn't about catching up, it's about never falling behind in the first place."

Win of the Day is a modern social platform that transforms how we maintain meaningful connections. Instead of catching up after long periods, users share their daily wins and reflections, fostering continuous connection with friends and loved ones.

🌐 [Visit Win of the Day](https://www.dailywin.app)

## 🚀 Features

- **📝 Daily Reflections**: Share your daily wins and experiences
- **👥 Friend Connections**: Connect with friends and follow their journey
- **🔄 Real-time Updates**: Stay connected with instant feed updates
- **🔒 Secure Authentication**: Powered by Supabase with email and social login
- **💅 Modern Design**: Clean, responsive interface built with Tailwind CSS
- **📱 Mobile-First**: Optimized for both desktop and mobile experiences
- **🌈 Progressive Web App**: Install on your device for a native app feel

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Frontend**: React 18.2
- **Styling**: 
  - [Tailwind CSS](https://tailwindcss.com/)
  - [HeadlessUI](https://headlessui.com/) for accessible components
- **Backend & Database**: 
  - [Supabase](https://supabase.com/) for authentication and database
  - PostgreSQL for data storage
- **Date Handling**: [date-fns](https://date-fns.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🌐 Environments

- Production: [dailywin.app](https://www.dailywin.app)
- Preview: [preview.dailywin.app](https://preview.dailywin.app)
- Development: `localhost:3000`

## 🚀 Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/noelhayes/win-of-the-day.git
   cd win-of-the-day
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Required environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=supabase_service_role_key
   NEXT_PUBLIC_SITE_URL=https://www.dailywin.app
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

## 🔒 Authentication

The app uses Supabase Auth with Google OAuth. The auth flow varies by environment:

- Development: Redirects to localhost:3000
- Preview: Uses preview.dailywin.app
- Production: Uses www.dailywin.app