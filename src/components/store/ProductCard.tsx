import { motion } from "framer-motion";
import { ShoppingCart, Tag, ExternalLink } from "lucide-react";
import { Product } from "@/data/store-products";
import { StoreProduct } from "@/lib/store-products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

interface ProductCardProps {
  product: Product | StoreProduct;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
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
      <Card className="group relative h-full flex flex-col overflow-hidden border-border/60 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-lg">
        {/* Discount Badge */}
        <div className="absolute top-4 right-4 z-10">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Badge className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-sm px-3 py-1.5 shadow-lg">
              {product.discount}% OFF
            </Badge>
          </motion.div>
        </div>

        {/* Category Badge */}
        <div className="absolute top-4 left-4 z-10">
          <Badge variant="secondary" className="font-semibold backdrop-blur-sm bg-secondary/80">
            {product.category}
          </Badge>
        </div>

        {/* Product Image */}
        <div className="relative overflow-hidden bg-muted/30 aspect-[4/3]">
          <motion.img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500" />
        </div>

        <CardHeader className="flex-1 p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <CardTitle className="text-lg font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
              {product.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {product.examCode && (
              <Badge variant="outline" className="text-xs font-medium">
                {product.examCode}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {product.level}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-4 space-y-4">
          {/* Pricing */}
          <div className="flex items-baseline gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold text-foreground">
                ₹{product.discountedPrice.toLocaleString("en-IN")}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                ₹{product.originalPrice.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Limited Time Offer Badge */}
          <div className="flex items-center gap-2 text-xs text-amber-500 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-md">
            <Tag className="h-3.5 w-3.5" />
            <span>Limited Time Offer</span>
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
                <DialogTitle className="text-xl">{product.title}</DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge>{product.category}</Badge>
                    {product.examCode && <Badge variant="outline">{product.examCode}</Badge>}
                    <Badge variant="secondary">{product.level}</Badge>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="relative aspect-video rounded-lg overflow-hidden border">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-foreground">
                    ₹{product.discountedPrice.toLocaleString("en-IN")}
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    ₹{product.originalPrice.toLocaleString("en-IN")}
                  </span>
                  <Badge className="bg-red-500 hover:bg-red-600 text-white">
                    {product.discount}% OFF
                  </Badge>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {product.description}
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
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

