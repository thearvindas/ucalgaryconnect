import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UCalgaryConnect",
  description: "Connect with fellow University of Calgary students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen flex flex-col")}>
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-purple-600">UCalgaryConnect</span>
            </div>
            <nav className="flex items-center space-x-4">
              <a href="/" className="text-gray-600 hover:text-purple-600">Home</a>
              <a href="/find-partners" className="text-gray-600 hover:text-purple-600">Find Partners</a>
              <a href="/login" className="text-gray-600 hover:text-purple-600">Login</a>
              <a href="/register" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
                Get Started
              </a>
            </nav>
          </div>
        </header>
        <main className="flex-grow">
          {children}
        </main>
        <footer className="bg-gray-50 border-t">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">UCalgaryConnect</h3>
                <p className="text-gray-600">Connecting University of Calgary students for academic and extracurricular collaboration.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li><a href="/" className="text-gray-600 hover:text-purple-600">Home</a></li>
                  <li><a href="/find-partners" className="text-gray-600 hover:text-purple-600">Find Partners</a></li>
                  <li><a href="/about" className="text-gray-600 hover:text-purple-600">About</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
                <p className="text-gray-600">Email: support@ucalgaryconnect.ca</p>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t text-center text-gray-600">
              <p>&copy; {new Date().getFullYear()} UCalgaryConnect. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
