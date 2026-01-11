import './globals.css';

export const metadata = {
  title: 'Smart Interviewer - AI-Powered Interview Practice',
  description: 'Prepare for your next interview with AI-powered practice sessions',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
