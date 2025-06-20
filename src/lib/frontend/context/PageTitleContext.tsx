"use client";
import { createContext, ReactNode, useContext, useState } from "react";

const PageTitleContext = createContext<{
  title: string;
  setTitle: (title: string) => void;
}>({ title: "Dashboard", setTitle: () => {} });

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState("Dashboard");
  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle() {
  return useContext(PageTitleContext);
}
