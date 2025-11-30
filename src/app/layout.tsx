import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import React from "react";
import BootstrapJS from "@/components/BootstrapJS";
import AuthProvider from "@/components/AuthProvider";
import { Layout } from "@/components/Layout";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Me In Gym",
  description:
    "Приложение по планированию и учету результатов тренировок в зале",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Layout>{children}</Layout>
        </AuthProvider>
        <BootstrapJS />
      </body>
    </html>
  );
}
