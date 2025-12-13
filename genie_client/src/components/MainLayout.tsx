"use client";
import { ReactNode, useCallback, useState } from "react";
import { ThreadList } from "./ThreadList";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { MCPServerList } from "./MCPServerList";
import { AgentList } from "./AgentList";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showMCPConfig, setShowMCPConfig] = useState(false);
  const [showAgentList, setShowAgentList] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const openMCPConfig = useCallback(() => setShowMCPConfig(true), []);
  const closeMCPConfig = useCallback(() => setShowMCPConfig(false), []);
  const openAgentList = useCallback(() => setShowAgentList(true), []);
  const closeAgentList = useCallback(() => setShowAgentList(false), []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar}>
        <ThreadList />
      </Sidebar>

      {/* Main content area */}
      <div className="bg-gray-150 flex min-w-0 flex-1 flex-col">
        <div className="z-10">
          <Header
            toggleSidebar={toggleSidebar}
            onOpenMCPConfig={openMCPConfig}
            onOpenAgentList={openAgentList}
          />
        </div>

        {/* Main content */}
        <div className="relative h-[calc(100vh-4rem)] flex-1">{children}</div>
      </div>

      {/* MCP Configuration Modal */}
      <MCPServerList isOpen={showMCPConfig} onClose={closeMCPConfig} />
      <AgentList isOpen={showAgentList} onClose={closeAgentList} />
    </div>
  );
}
