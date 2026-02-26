import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import BottomNavigation from './BottomNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { identity } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background">
      <div className="app-container">
        {children}
        {identity && <BottomNavigation />}
      </div>
    </div>
  );
}
