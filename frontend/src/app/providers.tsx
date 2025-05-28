'use client';

import React from 'react';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Not yet installed/configured
// import { ThemeProvider } from 'next-themes'; // Not yet installed/configured

// const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
