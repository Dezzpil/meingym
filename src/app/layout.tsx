import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import React from "react";
import BootstrapJS from "@/components/BootstrapJS";
import AuthProvider from "@/components/AuthProvider";
import { Layout } from "@/components/Layout";

const inter = Inter({ subsets: ["latin"] });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Me in Gym",
  description: "Приложение по планированию и исполнению программы тренировок",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Layout>{children}</Layout>
        </AuthProvider>
        <BootstrapJS />
      </body>
    </html>
  );
}
