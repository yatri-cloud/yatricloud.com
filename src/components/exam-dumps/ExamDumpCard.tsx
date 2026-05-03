import { motion } from "framer-motion";
import { ShoppingCart, ExternalLink, Download } from "lucide-react";
import { ExamDump } from "@/lib/exam-dumps";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -8 }}
      className="h-full"
    >
      <Card className="group relative h-full flex flex-col overflow-hidden rounded-2xl border-2 border-border bg-card/95 hover:border-primary/70 transition-all duration-300 shadow-sm hover:shadow-lg">
        {/* Discount Badge */}
        {dump.originalPrice > dump.price && (
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-red-500 text-white font-bold text-xs px-2 py-1 shadow-md">
              {Math.round(((dump.originalPrice - dump.price) / dump.originalPrice) * 100)}% OFF
            </Badge>
          </div>
        )}

        {/* Provider Badge */}
        <div className="absolute top-4 left-4 z-10">
          <Badge variant="secondary" className="font-semibold shadow-sm">
            {dump.provider}
          </Badge>
        </div>

        {/* Dump Image */}
        <div className="relative overflow-hidden bg-muted/30 aspect-[4/3]">
          <motion.img
            src={dump.image}
            alt={dump.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />
        </div>

        <CardHeader className="flex-1 px-5 pt-5 pb-2">
          <CardTitle className="text-lg font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {dump.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="px-5 pt-1 pb-4 space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              ₹{dump.price.toLocaleString("en-IN")}
            </span>
            {dump.originalPrice > dump.price && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{dump.originalPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-green-600 font-semibold bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded w-fit">
            <Download className="w-3 h-3" />
            Instant Delivery via Email
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 p-5 pt-0">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full text-sm" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
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
                <div className="relative w-full max-w-sm mx-auto rounded-lg overflow-hidden border aspect-square flex items-center justify-center bg-muted">
                  <img
                    src={dump.image}
                    alt={dump.title}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-foreground">
                    ₹{dump.price.toLocaleString("en-IN")}
                  </span>
                  {dump.originalPrice > dump.price && (
                    <span className="text-lg text-muted-foreground line-through">
                      ₹{dump.originalPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {dump.description}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleAddToCart}
            className="w-full group/btn font-semibold"
            size="lg"
          >
            <ShoppingCart className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
            Buy Now
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
