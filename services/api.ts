import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * DataPlug API Client
 * Handles all communication between the mobile app and the Express backend.
 * Uses JWT Bearer tokens for authentication (cross-domain safe).
 */

// Use LAN IP so physical devices on the same network can access the server
// On Web, use the same hostname as the browser to prevent cross-site cookie blocking
const getDevBase = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3001`;
  }
  return "http://192.168.0.158:3001";
};

const DEV_BASE = getDevBase();

const PROD_BASE = process.env.EXPO_PUBLIC_API_URL || "https://dataplug-prwt.onrender.com"; // Updated for actual production

const BASE_URL = __DEV__ ? DEV_BASE : PROD_BASE;

const TOKEN_KEY = "dataplug_auth_token";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
};

/** Simple token storage that works on both web and native */
const tokenStore = {
  async get(): Promise<string | null> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        return localStorage.getItem(TOKEN_KEY);
      }
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  async set(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
        return;
      }
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Silently fail
    }
  },
  async remove(): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        return;
      }
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch {
      // Silently fail
    }
  },
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, headers = {} } = options;

    // Get stored JWT token
    const token = await tokenStore.get();

    const config: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      credentials: "include", // Keep for backward compat with session cookies
    };

    if (body && method !== "GET") {
      config.body = JSON.stringify(body);
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(data.error || "Request failed", response.status, data);
      }

      return data;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError("Network error. Please check your connection.", 0);
    }
  }

  // ─── Auth ────────────────────────────────────────────────────────────────
  auth = {
    sendOtp: (phone: string) =>
      this.request("/api/auth/send-otp", { method: "POST", body: { phone } }),

    verifyOtp: (phone: string, code: string) =>
      this.request("/api/auth/verify-otp", { method: "POST", body: { phone, code } }),

    register: async (data: { phone: string; password: string; pin: string; fullName?: string }) => {
      const result = await this.request("/api/auth/register", { method: "POST", body: data });
      // Store the JWT token returned from registration
      if (result.token) {
        await tokenStore.set(result.token);
      }
      return result;
    },

    login: async (phone: string, password: string) => {
      const result = await this.request("/api/auth/login", { method: "POST", body: { phone, password } });
      // Store the JWT token returned from login
      if (result.token) {
        await tokenStore.set(result.token);
      }
      return result;
    },

    logout: async () => {
      const result = await this.request("/api/auth/logout", { method: "POST" });
      // Clear stored token
      await tokenStore.remove();
      return result;
    },

    me: () =>
      this.request("/api/auth/me"),
  };

  // ─── Wallet ──────────────────────────────────────────────────────────────
  wallet = {
    getBalance: () =>
      this.request("/api/wallet"),

    fund: (amount: number) =>
      this.request("/api/wallet/fund", { method: "POST", body: { amount } }),

    generateStaticAccount: (bvn: string) =>
      this.request("/api/wallet/static-account", { method: "POST", body: { bvn } }),

    getBanks: () =>
      this.request("/api/wallet/banks"),

    initiateUSSD: (amount: number, bankCode: string) =>
      this.request("/api/wallet/ussd-v2", { method: "POST", body: { amount, bankCode } }),

    initiateOPay: (amount: number) =>
      this.request("/api/wallet/opay", { method: "POST", body: { amount } }),
  };

  // ─── Transactions ────────────────────────────────────────────────────────
  transactions = {
    getPlans: () =>
      this.request("/api/transactions/plans/data"),

    buyData: (data: { planId: number; phoneNumber: string; pin: string }) =>
      this.request("/api/transactions/buy-data", { method: "POST", body: data }),

    buyAirtime: (data: { amount: number; network: string; phoneNumber: string; pin: string }) =>
      this.request("/api/transactions/buy-airtime", { method: "POST", body: data }),

    getHistory: (params?: { type?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.type) query.set("type", params.type);
      if (params?.page) query.set("page", params.page.toString());
      if (params?.limit) query.set("limit", params.limit.toString());
      return this.request(`/api/transactions/history?${query.toString()}`);
    },

    getById: (id: number) =>
      this.request(`/api/transactions/history/${id}`),
  };

  // ─── Rewards ─────────────────────────────────────────────────────────────
  rewards = {
    get: () =>
      this.request("/api/rewards"),

    checkIn: () =>
      this.request("/api/rewards/check-in", { method: "POST" }),

    redeem: (points: number) =>
      this.request("/api/rewards/redeem", { method: "POST", body: { points } }),
  };

  // ─── Admin ───────────────────────────────────────────────────────────────
  admin = {
    getStats: () =>
      this.request("/api/admin/stats"),

    getUsers: (params?: { page?: number; limit?: number; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", params.page.toString());
      if (params?.limit) query.set("limit", params.limit.toString());
      if (params?.search) query.set("search", params.search);
      return this.request(`/api/admin/users?${query.toString()}`);
    },

    getUser: (id: number) =>
      this.request(`/api/admin/users/${id}`),

    updateUser: (id: number, data: { isAdmin?: boolean; bonusAmount?: number }) =>
      this.request(`/api/admin/users/${id}`, { method: "PATCH", body: data }),

    getTransactions: (params?: { page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", params.page.toString());
      if (params?.limit) query.set("limit", params.limit.toString());
      return this.request(`/api/admin/transactions?${query.toString()}`);
    },

    addPlan: (data: { network: string; name: string; dataAmount: string; validity: string; price: number }) =>
      this.request("/api/admin/plans", { method: "POST", body: data }),

    updatePlan: (id: number, data: { isActive?: boolean; price?: number }) =>
      this.request(`/api/admin/plans/${id}`, { method: "PATCH", body: data }),
  };
}

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export const api = new ApiClient(BASE_URL);
