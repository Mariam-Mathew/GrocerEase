import useStore from "@/zustand/store";
import { ReactNode, useEffect } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { initializeAuth } = useStore();

  useEffect(() => {
    // Initialize auth when the app starts
    initializeAuth().catch((error) => {
      console.error("Failed to initialize auth:", error);
    });
  }, [initializeAuth]);

  return <>{children}</>;
}
