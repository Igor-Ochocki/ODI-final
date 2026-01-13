"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import {
  GenericResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from "@/types/interfaces";
import { getCryptoKeyPairByEmail, migrateKeyFromEmailToUserId } from "@/lib/indexeddb";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<LoginResponse>;
  register: (data: RegisterRequest) => Promise<GenericResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.getCurrentUser();
      if (response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      const token = localStorage.getItem("access_token");
      if (token) {
        await refreshUser();
      }

      setIsLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  const login = async (data: LoginRequest) => {
    try {
      const response = await api.login(data);

      if (response.error) {
        const isRequires2FA =
          response.message?.includes("2FA code required") || response.error === "totp_required";

        if (isRequires2FA && !data.totp_code) {
          return { success: false, requires2FA: true };
        }

        return {
          success: false,
          error: response.message || "Invalid login data",
        };
      }

      if (response.data) {
        await refreshUser();

        const userResponse = await api.getCurrentUser();
        if (userResponse.data) {
          try {
            const keyByEmail = await getCryptoKeyPairByEmail(data.email);
            if (keyByEmail) {
              await migrateKeyFromEmailToUserId(data.email, userResponse.data.id);
            }
          } catch (keyError) {
            console.error("Failed to migrate private key:", keyError);
          }
        }

        return { success: true };
      }

      return { success: false, error: "Unknown error" };
    } catch (error) {
      return { success: false, error: "Connection error" };
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await api.register(data);

      if (response.error) {
        return { success: false, error: response.message || "Unknown error" };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "Connection error" };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
