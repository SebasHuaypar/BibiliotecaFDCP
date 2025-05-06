
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BiblioStatic - Virtual Library',
  description: 'A static virtual library website',
};

export default function RootLayout({
  children,
}: { // Corrected props type definition syntax
  readonly children: React.ReactNode;
}) {
  return (
    // Removed dark class to use light theme by default
    <html lang="en">
      <head>
         {/* Removed Bootstrap CSS CDN */}
         {/* Removed PDF.js script tag - it's loaded dynamically in PdfViewer */}
      </head>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          {children}
          <Toaster /> {/* Add Toaster component here */}
        </AuthProvider>
        {/* Removed Bootstrap JS CDN */}
      </body>
    </html>
  );
}
