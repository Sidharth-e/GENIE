"use client";

import React, { useState } from "react";
import {
  PanelLeftClose,
  Settings,
  Bot,
  LogOut,
  User,
  SquarePen,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { config } from "@/constants/config";

interface HeaderProps {
  toggleSidebar: () => void;
  onCreateThread: () => Promise<{ id: string }>;
  onOpenMCPConfig: () => void;
  onOpenAgentList: () => void;
}

export const Header = ({
  toggleSidebar,
  onCreateThread,
  onOpenMCPConfig,
  onOpenAgentList,
}: HeaderProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const handleCreateThread = async () => {
    setIsCreating(true);
    try {
      const newThread = await onCreateThread();
      router.push(`/thread/${newThread.id}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <header className="sticky top-0 z-10 flex items-center px-4 py-3">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="mr-4 cursor-pointer rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Toggle navigation"
          >
            <PanelLeftClose size={25} />
          </button>

          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="hidden text-xl font-semibold text-gray-800 sm:block">
                {config.NAME}
              </span>
            </Link>
          </div>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCreateThread}
            disabled={isCreating}
            variant="default"
            size="sm"
            className="h-8 gap-2 px-3 text-xs"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SquarePen className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">New Chat</span>
          </Button>

          <Button
            onClick={onOpenAgentList}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-gray-700"
            title="Agents"
          >
            <Bot className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="relative flex h-8 w-8 select-none items-center justify-center rounded-full outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">
              <Avatar className="h-8 w-8 cursor-pointer hover:opacity-90 transition-opacity">
                {session?.user?.image ? (
                  <AvatarImage
                    src={session.user.image}
                    alt={session.user.name || "User"}
                  />
                ) : (
                  <AvatarFallback className="bg-slate-200 text-slate-600">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                )}
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* Removed Agents from dropdown since it's now in the header */}
              <DropdownMenuItem
                onClick={onOpenMCPConfig}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>MCP Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
