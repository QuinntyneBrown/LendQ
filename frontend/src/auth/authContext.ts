import { createContext } from "react";
import type { User } from "@/api/types";

export interface AuthContextValue {
  user: User | null;
  roles: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; confirm_password: string }) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
