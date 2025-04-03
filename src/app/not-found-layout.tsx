import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "404 - Page Not Found | UCalgaryConnect",
  description: "The page you're looking for doesn't exist",
};

export default function NotFoundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <footer className="bg-white border-t py-8">
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p>&copy; 2024 UCalgaryConnect. All rights reserved.</p>
            <p className="mt-2">Contact us: support@ucalgaryconnect.ca</p>
          </div>
        </footer>
      </body>
    </html>
  );
} 