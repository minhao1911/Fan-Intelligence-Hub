import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

export function useUserEntitlements() {
  return useQuery({
    queryKey: ["monetization", "me"],
    queryFn: () => apiFetch("/api/monetization/me"),
    staleTime: 30_000,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["monetization", "products"],
    queryFn: () => apiFetch("/api/monetization/products"),
    staleTime: 60_000 * 5,
  });
}

export function useRevenueDashboard() {
  return useQuery({
    queryKey: ["admin", "revenue"],
    queryFn: () => apiFetch("/api/admin/revenue"),
    staleTime: 30_000,
  });
}

export function useBuyFounderPass() {
  return async () => apiFetch("/api/monetization/founder-pass/order", { method: "POST" });
}

export function useBuyPremium() {
  return async () => apiFetch("/api/monetization/subscription/order", { method: "POST" });
}

export function usePurchaseProduct() {
  return async (productId: number) =>
    apiFetch("/api/monetization/cosmetic/order", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch("/api/monetization/subscription/cancel", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monetization", "me"] }),
  });
}

export function useEquipCosmetic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, equip }: { productId: number; equip: boolean }) =>
      apiFetch(`/api/monetization/cosmetic/${productId}/equip`, {
        method: "PATCH",
        body: JSON.stringify({ equip }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monetization", "me"] }),
  });
}

export function useVerifyPayment() {
  const qc = useQueryClient();
  return {
    verifyFounderPass: async (orderId: string, paymentId: string, signature: string) => {
      const result = await apiFetch("/api/monetization/founder-pass/verify", {
        method: "POST",
        body: JSON.stringify({ orderId, paymentId, signature }),
      });
      qc.invalidateQueries({ queryKey: ["monetization", "me"] });
      return result;
    },
    verifySubscription: async (orderId: string, paymentId: string, signature: string) => {
      const result = await apiFetch("/api/monetization/subscription/verify", {
        method: "POST",
        body: JSON.stringify({ orderId, paymentId, signature }),
      });
      qc.invalidateQueries({ queryKey: ["monetization", "me"] });
      return result;
    },
    verifyCosmetic: async (orderId: string, paymentId: string, signature: string) => {
      const result = await apiFetch("/api/monetization/cosmetic/verify", {
        method: "POST",
        body: JSON.stringify({ orderId, paymentId, signature }),
      });
      qc.invalidateQueries({ queryKey: ["monetization", "me"] });
      return result;
    },
  };
}
