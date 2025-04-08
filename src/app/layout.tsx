import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";

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
        <NavbarWrapper />
        <main className="pt-16">
          {children}
        </main>
        <footer className="bg-white border-t py-8">
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p>Built by Arvin, Graham, Jasper, Joshua, and Rebecca for the ENTI 674 class at the Haskayne School of Business, University of Calgary.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
