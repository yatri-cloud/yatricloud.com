import { motion } from "framer-motion";
import { ShoppingCart, ExternalLink } from "lucide-react";
import { EntityReviews } from "@/components/reviews/EntityReviews";
import { ExamDump, getProviderGlowColor } from "@/lib/exam-dumps";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ExamDumpCardProps {
  dump: ExamDump;
}

export const ExamDumpCard = ({ dump }: ExamDumpCardProps) => {
  const { addToCart } = useCart();
  const [isDialogOpen, setIsDialogOpen] = useState(false);



  const handleAddToCart = () => {
    // Adapter for cart context which expects StoreProduct
    const cartItem = {
      ...dump,
      discountedPrice: dump.price,
      category: dump.provider as any, // Cast for compatibility
      level: "Associate" as any, // Default for compatibility
      discount: Math.round(((dump.originalPrice - dump.price) / dump.originalPrice) * 100)
    };
    addToCart(cartItem as any);
  };

  // Buy Now means BUY now: add the item, then open the checkout sheet
  // immediately (the page's CartSheet or the floating pill listens; the
  // sessionStorage flag covers a lazily mounted listener).
  const handleBuyNow = () => {
    handleAddToCart();
    try {
      sessionStorage.setItem("yc:open-cart-pending", "1");
    } catch {
      /* private mode */
    }
    window.setTimeout(() => window.dispatchEvent(new Event("yc:open-cart")), 120);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      <Card className="group relative h-full flex flex-col rounded-2xl border border-slate-200/80 transition-all duration-300 hover:border-transparent outline-none focus:outline-none">
        {/* Static Soft Glow Layer */}
        <div 
          className="absolute -inset-1 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[24px] blur-xl"
          style={{ backgroundColor: getProviderGlowColor(dump.provider) }}
        />

        {/* Content Wrapper to mask inner shadow and clip corners */}
        <div className="relative z-10 flex flex-col flex-1 rounded-2xl overflow-hidden bg-card h-full">
        {/* Dump Image -- square tile, logo shown in full. Clicking it opens
            the details dialog, same as the View Details button. */}
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          aria-label={`View details of ${dump.title}`}
          className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-muted/20 p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <motion.img
            src={dump.image}
            alt=""
            className="max-h-full max-w-full rounded-2xl object-contain transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </button>

        <CardHeader className="flex-1 px-5 pt-4 pb-2">
          {dump.provider && dump.provider.toUpperCase() !== "OTHER" && (
            <div className="mb-2">
              <span className="inline-flex items-center rounded-full border border-slate-200/90 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                {dump.provider}
              </span>
            </div>
          )}

          <CardTitle className="text-lg font-bold leading-snug group-hover:text-primary transition-colors">
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="w-full rounded text-left line-clamp-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {dump.title}
            </button>
          </CardTitle>
        </CardHeader>

        <CardContent className="px-5 pt-1 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {"₹"}{dump.price.toLocaleString("en-IN")}
              </span>
              {dump.originalPrice > dump.price && (
                <span className="text-sm text-muted-foreground line-through">
                  {"₹"}{dump.originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {dump.originalPrice > dump.price && (
              <span className="inline-flex items-center rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-2xs">
                {Math.round(((dump.originalPrice - dump.price) / dump.originalPrice) * 100)}% OFF
              </span>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 p-5 pt-0">
          <Button
            onClick={handleBuyNow}
            className="w-full font-semibold shadow-inset-btn"
            size="lg"
          >
            Buy Now
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-foreground" size="sm">
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">{dump.title}</DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge>{dump.provider}</Badge>
                    <Badge variant="outline">Verified Dumps</Badge>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden border aspect-square flex items-center justify-center bg-muted p-4">
                  <img
                    src={dump.image}
                    alt={dump.title}
                    className="max-w-full max-h-full rounded-2xl object-contain"
                  />
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-foreground">
                    {"₹"}{dump.price.toLocaleString("en-IN")}
                  </span>
                  {dump.originalPrice > dump.price && (
                    <span className="text-lg text-muted-foreground line-through">
                      {"₹"}{dump.originalPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {dump.description}
                  </p>
                </div>
                <div className="border-t border-border pt-4">
                  <h3 className="font-display font-semibold mb-3">Ratings & reviews</h3>
                  <EntityReviews
                    entityType="exam_dump"
                    entityId={dump.id}
                    entityName={dump.title}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardFooter>
        </div>
      </Card>
    </motion.div>
  );
};
