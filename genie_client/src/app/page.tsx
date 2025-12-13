"use client";
import { MainLayout } from "@/components/MainLayout";
import { NewChatView } from "@/components/NewChatView";

export default function Home() {
  return (
    <MainLayout>
      <NewChatView />
    </MainLayout>
  );
}
