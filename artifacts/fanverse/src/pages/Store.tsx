import { useState } from "react";
import { Crown, Star, Sparkles, ShieldCheck, Zap, Check, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useUserEntitlements,
  useProducts,
  useBuyFounderPass,
  useBuyPremium,
  usePurchaseProduct,
  useVerifyPayment,
} from "@/hooks/useMonetization";
import { toast } from "sonner";

declare global {
  interface Window { Razorpay: any; }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function openRazorpay(options: {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  name: string;
  description: string;
  onSuccess: (paymentId: string, orderId: string, signature: string) => void;
  onFailure: () => void;
}) {
  const rzp = new window.Razorpay({
    key: options.keyId,
    amount: options.amount,
    currency: options.currency,
    order_id: options.orderId,
    name: "FanVerse",
    description: options.description,
    image: "/fanverse-logo.png",
    theme: { color: "#FBBF24" },
    handler: (response: any) => {
      options.onSuccess(
        response.razorpay_payment_id,
        response.razorpay_order_id,
        response.razorpay_signature,
      );
    },
    modal: { ondismiss: options.onFailure },
  });
  rzp.open();
}

const CATEGORY_LABELS: Record<string, string> = {
  nation_frame: "Nation Frames",
  animated_flag: "Animated Flags",
  worldcup_theme: "World Cup Themes",
  special_theme: "Special Themes",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  nation_frame: <Star className="h-4 w-4" />,
  animated_flag: <Sparkles className="h-4 w-4" />,
  worldcup_theme: <Crown className="h-4 w-4" />,
  special_theme: <Zap className="h-4 w-4" />,
};

export default function Store() {
  const { data: entitlements, refetch: refetchEntitlements } = useUserEntitlements();
  const { data: products } = useProducts();
  const buyFounderPass = useBuyFounderPass();
  const buyPremium = useBuyPremium();
  const purchaseCosmetic = usePurchaseProduct();
  const { verifyFounderPass, verifySubscription, verifyCosmetic } = useVerifyPayment();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleFounderPass() {
    setLoading("founder");
    const ok = await loadRazorpay();
    if (!ok) { toast.error("Failed to load payment gateway"); setLoading(null); return; }
    try {
      const order = await buyFounderPass();
      openRazorpay({
        ...order,
        name: "FanVerse Founder Pass",
        description: "Lifetime Founder recognition — only 1,000 available",
        onSuccess: async (paymentId, orderId, signature) => {
          try {
            const data = await verifyFounderPass(orderId, paymentId, signature);
            if (data.success) {
              toast.success(`🏆 You're Founder #${data.founderNumber}!`);
              refetchEntitlements();
            } else {
              toast.error(data.error ?? "Verification failed");
            }
          } catch (e: any) { toast.error(e.message ?? "Payment verification failed"); }
          setLoading(null);
        },
        onFailure: () => setLoading(null),
      });
    } catch (e: any) {
      toast.error(e.message ?? "Could not create order");
      setLoading(null);
    }
  }

  async function handlePremium() {
    setLoading("premium");
    const ok = await loadRazorpay();
    if (!ok) { toast.error("Failed to load payment gateway"); setLoading(null); return; }
    try {
      const order = await buyPremium();
      openRazorpay({
        ...order,
        name: "FanVerse Premium",
        description: "Monthly premium — ad-free, advanced analytics",
        onSuccess: async (paymentId, orderId, signature) => {
          try {
            const data = await verifySubscription(orderId, paymentId, signature);
            if (data.success) {
              toast.success("🌟 FanVerse Premium activated!");
              refetchEntitlements();
            } else {
              toast.error(data.error ?? "Verification failed");
            }
          } catch (e: any) { toast.error(e.message ?? "Payment verification failed"); }
          setLoading(null);
        },
        onFailure: () => setLoading(null),
      });
    } catch (e: any) {
      toast.error(e.message ?? "Could not create order");
      setLoading(null);
    }
  }

  async function handleCosmeticPurchase(productId: number, name: string) {
    setLoading(`cosmetic-${productId}`);
    const ok = await loadRazorpay();
    if (!ok) { toast.error("Failed to load payment gateway"); setLoading(null); return; }
    try {
      const order = await purchaseCosmetic(productId);
      openRazorpay({
        ...order,
        name,
        description: `Purchase ${name} for your FanVerse profile`,
        onSuccess: async (paymentId, orderId, signature) => {
          try {
            const data = await verifyCosmetic(orderId, paymentId, signature);
            if (data.success) {
              toast.success(`✨ ${name} added to your collection!`);
              refetchEntitlements();
            } else {
              toast.error(data.error ?? "Verification failed");
            }
          } catch (e: any) { toast.error(e.message ?? "Payment verification failed"); }
          setLoading(null);
        },
        onFailure: () => setLoading(null),
      });
    } catch (e: any) {
      toast.error(e.message ?? "Could not create order");
      setLoading(null);
    }
  }

  const byCategory = (products ?? []).reduce<Record<string, any[]>>((acc, p) => {
    (acc[p.category] = acc[p.category] ?? []).push(p);
    return acc;
  }, {});
  const categories = Object.keys(byCategory);

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-heading font-bold uppercase text-foreground tracking-wide">
          Fan<span className="text-primary">Store</span>
        </h1>
        <p className="text-muted-foreground mt-1">Unlock exclusive benefits, badges, and profile cosmetics.</p>
      </div>

      {/* ── Premium Tier Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Founder Pass */}
        <div className="relative rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 via-card to-card p-6 overflow-hidden">
          <div className="absolute top-3 right-3">
            <Badge className="bg-yellow-500 text-black text-xs font-bold">LIMITED — 1,000 ONLY</Badge>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Crown className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-foreground uppercase">Founder Pass</h2>
              <p className="text-yellow-500 font-bold text-lg">₹999 <span className="text-muted-foreground text-sm font-normal">one-time</span></p>
            </div>
          </div>
          <ul className="space-y-2 mb-6 text-sm">
            {["Founder Badge on your profile", "Exclusive Founder Profile Frame", "Your Founder Number (e.g. #001)", "Lifetime recognition on FanVerse"].map((b) => (
              <li key={b} className="flex items-center gap-2 text-foreground/80">
                <Check className="h-4 w-4 text-yellow-500 shrink-0" /> {b}
              </li>
            ))}
          </ul>
          {entitlements?.isFounder ? (
            <div className="flex items-center gap-2 text-yellow-500 font-bold">
              <Award className="h-5 w-5" /> You're Founder #{entitlements.founderNumber}
            </div>
          ) : (
            <Button
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-heading font-bold uppercase tracking-wide"
              onClick={handleFounderPass}
              disabled={loading === "founder"}
            >
              {loading === "founder" ? "Opening Checkout…" : "Claim Founder Pass — ₹999"}
            </Button>
          )}
        </div>

        {/* Premium Subscription */}
        <div className="relative rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-6 overflow-hidden">
          <div className="absolute top-3 right-3">
            <Badge className="bg-primary text-primary-foreground text-xs font-bold">MONTHLY</Badge>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-foreground uppercase">FanVerse Premium</h2>
              <p className="text-primary font-bold text-lg">₹99 <span className="text-muted-foreground text-sm font-normal">/month</span></p>
            </div>
          </div>
          <ul className="space-y-2 mb-6 text-sm">
            {[
              "Ad-Free experience",
              "Advanced Nation Pulse Analytics",
              "Premium Badge on your profile",
              "Historical Confidence Trends",
              "Premium Profile Customization",
            ].map((b) => (
              <li key={b} className="flex items-center gap-2 text-foreground/80">
                <Check className="h-4 w-4 text-primary shrink-0" /> {b}
              </li>
            ))}
          </ul>
          {entitlements?.isPremium ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold">
                <ShieldCheck className="h-5 w-5" /> Premium Active
              </div>
              {entitlements.subscription && (
                <p className="text-xs text-muted-foreground">
                  Expires {new Date(entitlements.subscription.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          ) : (
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-bold uppercase tracking-wide"
              onClick={handlePremium}
              disabled={loading === "premium"}
            >
              {loading === "premium" ? "Opening Checkout…" : "Get Premium — ₹99/month"}
            </Button>
          )}
        </div>
      </div>

      {/* ── Cosmetics Marketplace ─────────────────────────────── */}
      {categories.length > 0 && (
        <div>
          <h2 className="text-2xl font-heading font-bold uppercase text-foreground tracking-wide mb-4">
            Profile <span className="text-primary">Cosmetics</span>
          </h2>
          <Tabs defaultValue={categories[0]}>
            <TabsList className="mb-4 bg-muted flex-wrap h-auto gap-1">
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="flex items-center gap-1.5 text-xs uppercase font-bold">
                  {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat] ?? cat}
                </TabsTrigger>
              ))}
            </TabsList>
            {categories.map((cat) => (
              <TabsContent key={cat} value={cat}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {byCategory[cat].map((product) => {
                    const owned = (entitlements?.ownedProductIds ?? []).includes(product.id);
                    const isLoadingThis = loading === `cosmetic-${product.id}`;
                    return (
                      <div
                        key={product.id}
                        className={`rounded-xl border p-4 flex flex-col gap-3 transition-all ${owned ? "border-primary/50 bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}
                      >
                        <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-muted to-muted/30 flex items-center justify-center">
                          <div className="scale-[3] opacity-60">{CATEGORY_ICONS[product.category]}</div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-foreground leading-tight">{product.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{product.description}</p>
                        </div>
                        {owned ? (
                          <div className="flex items-center gap-1 text-xs text-primary font-bold">
                            <Check className="h-3.5 w-3.5" /> Owned
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs font-bold border-primary/40 hover:bg-primary/10 hover:border-primary"
                            onClick={() => handleCosmeticPurchase(product.id, product.name)}
                            disabled={!!isLoadingThis}
                          >
                            {isLoadingThis ? "Opening…" : `Buy — ₹${(product.price / 100).toFixed(0)}`}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
}
