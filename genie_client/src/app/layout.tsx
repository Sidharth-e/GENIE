"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { ThreadProvider } from "@/contexts/ThreadContext";
import { UISettingsProvider } from "@/contexts/UISettingsContext";
import { config } from "@/constants/config";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>{config.NAME}</title>
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <UISettingsProvider>
              <ThreadProvider>{children}</ThreadProvider>
            </UISettingsProvider>
          </SessionProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
