import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useEffect } from 'react';
import { initializeWebSocket, disconnectWebSocket } from '../../store/websocket';

export function AppShell() {
  useEffect(() => {
    initializeWebSocket();
    return () => disconnectWebSocket();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FA]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopBar />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-[1280px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
