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

## 📚 Database Setup

1. Create a new project on [Supabase](https://supabase.com)
2. Go to the SQL editor in your Supabase dashboard
3. Run the following migrations (available in the `/supabase/migrations` folder):
   - User profiles
   - Wins table
   - Friendships
   - Notifications

## 🚀 Deployment

This project is deployed on [Vercel](https://vercel.com). To deploy your own instance:

1. Fork this repository
2. Create a new project on Vercel
3. Connect your forked repository
4. Add the following environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`
5. Deploy!

## 💭 Philosophy

Win of the Day embodies the belief that meaningful connections should be maintained through small, consistent interactions rather than periodic catch-ups. By sharing our daily wins and reflections, we create a continuous thread of connection with the people who matter most.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/noelhayes/win-of-the-day/issues).

## 📝 License

This project is [MIT](LICENSE) licensed.