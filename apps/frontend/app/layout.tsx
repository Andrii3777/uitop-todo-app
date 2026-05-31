import type { Metadata } from 'next';
import { ToastContainer } from 'react-toastify';
import { TOAST_AUTO_CLOSE_DURATION } from '@/lib/constants';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Todo App',
  description: 'Todo app with categories',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
        <ToastContainer position="bottom-right" autoClose={TOAST_AUTO_CLOSE_DURATION} />
      </body>
    </html>
  );
}
