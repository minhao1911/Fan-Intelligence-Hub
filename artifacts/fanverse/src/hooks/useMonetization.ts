import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";

async function apiFetch(url: string, getToken: () => Promise<string | null>, options?: RequestInit) {
  const token = await getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

export function usePaymentsStatus() {
  return useQuery({
    queryKey: ["monetization", "status"],
    queryFn: async () => {
      const res = await fetch("/api/monetization/status");
      return res.json() as Promise<{ paymentsEnabled: boolean; message: string }>;
    },
    staleTime: 60_000,
  });
}

export function useUserEntitlements() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["monetization", "me"],
    queryFn: () => apiFetch("/api/monetization/me", getToken),
    staleTime: 30_000,
  });
}

export function useProducts() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["monetization", "products"],
    queryFn: () => apiFetch("/api/monetization/products", getToken),
    staleTime: 60_000 * 5,
  });
}

export function useRevenueDashboard() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["admin", "revenue"],
    queryFn: () => apiFetch("/api/admin/revenue", getToken),
    staleTime: 30_000,
  });
}

export function useBuyFounderPass() {
  const { getToken } = useAuth();
  return async () => apiFetch("/api/monetization/founder-pass/order", getToken, { method: "POST" });
}

export function useBuyPremium() {
  const { getToken } = useAuth();
  return async () => apiFetch("/api/monetization/subscription/order", getToken, { method: "POST" });
}

export function usePurchaseProduct() {
  const { getToken } = useAuth();
  return async (productId: number) =>
    apiFetch("/api/monetization/cosmetic/order", getToken, {
      method: "POST",
      body: JSON.stringify({ productId }),
    });
}

export function useCancelSubscription() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch("/api/monetization/subscription/cancel", getToken, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monetization", "me"] }),
  });
}

export function useEquipCosmetic() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, equip }: { productId: number; equip: boolean }) =>
      apiFetch(`/api/monetization/cosmetic/${productId}/equip`, getToken, {
        method: "PATCH",
        body: JSON.stringify({ equip }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monetization", "me"] }),
  });
}

export function useVerifyPayment() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  return {
    verifyFounderPass: async (orderId: string, paymentId: string, signature: string) => {
      const result = await apiFetch("/api/monetization/founder-pass/verify", getToken, {
        method: "POST",
        body: JSON.stringify({ orderId, paymentId, signature }),
      });
      qc.invalidateQueries({ queryKey: ["monetization", "me"] });
      return result;
    },
    verifySubscription: async (orderId: string, paymentId: string, signature: string) => {
      const result = await apiFetch("/api/monetization/subscription/verify", getToken, {
        method: "POST",
        body: JSON.stringify({ orderId, paymentId, signature }),
      });
      qc.invalidateQueries({ queryKey: ["monetization", "me"] });
      return result;
    },
    verifyCosmetic: async (orderId: string, paymentId: string, signature: string) => {
      const result = await apiFetch("/api/monetization/cosmetic/verify", getToken, {
        method: "POST",
        body: JSON.stringify({ orderId, paymentId, signature }),
      });
      qc.invalidateQueries({ queryKey: ["monetization", "me"] });
      return result;
    },
  };
}
