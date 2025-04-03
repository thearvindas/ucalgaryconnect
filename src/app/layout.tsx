import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UCalgaryConnect",
  description: "Connect with fellow University of Calgary students",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
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
