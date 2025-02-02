import './globals.css';

export const metadata = {
  title: 'Win of the Day',
  description: 'Share your wins, inspire others, and maintain meaningful connections',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
