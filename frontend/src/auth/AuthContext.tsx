import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { apiGet, apiPost } from "@/api/client";
import type { TokenResponse } from "@/api/types";
import type { User } from "@/api/types";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/utils/constants";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const roles = user?.roles?.map((r) => r.name) ?? [];
  const isAuthenticated = user !== null;

  const clearTokens = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  const fetchUser = useCallback(async () => {
    const profile = await apiGet<User>("/users/me");
    setUser(profile);
  }, []);

  const refreshToken = useCallback(async () => {
    const token = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!token) throw new Error("No refresh token");
    const data = await apiPost<TokenResponse>("/auth/refresh", { refresh_token: token });
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  }, []);

  useEffect(() => {
    async function init() {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        await fetchUser();
      } catch {
        try {
          await refreshToken();
          await fetchUser();
        } catch {
          clearTokens();
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [fetchUser, refreshToken, clearTokens]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiPost<TokenResponse>("/auth/login", { email, password });
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
      await fetchUser();
    },
    [fetchUser],
  );

  const signup = useCallback(
    async (formData: { name: string; email: string; password: string; confirm_password: string }) => {
      await apiPost("/auth/signup", formData);
    },
    [],
  );

  const logout = useCallback(() => {
    apiPost("/auth/logout").catch(() => {});
    clearTokens();
    setUser(null);
  }, [clearTokens]);

  return (
    <AuthContext.Provider
      value={{ user, roles, isAuthenticated, isLoading, login, signup, logout, refreshToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}
