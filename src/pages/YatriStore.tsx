import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, ShoppingCart, IndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { ProductCard } from "@/components/store/ProductCard";
import { CartSheet } from "@/components/store/CartSheet";
import { MobileCartBar } from "@/components/store/MobileCartBar";
import { categories, ProductCategory } from "@/data/store-products";
import { fetchStoreProducts, StoreProduct } from "@/lib/store-products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartProvider, useCart } from "@/contexts/CartContext";

const YatriStore = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "All">("All");
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products from Google Sheets on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const fetchedProducts = await fetchStoreProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error loading products:", error);
        // Do not use dummy data – show empty state instead
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") {
      return products;
    }
    return products.filter((product) => product.category === selectedCategory);
  }, [selectedCategory, products]);

  const handleViewProcedure = () => {
    // Navigate to home and scroll to the 3-step certification process section
    navigate("/");
    setTimeout(() => {
      const el = document.querySelector("#certification-process");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0">
        <SEO />
        <div className="noise-overlay" />
        <Navbar />
        
        {/* Store Header */}
        <section className="relative pt-28 pb-16 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,124,255,0.05),transparent_50%)]" />
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm font-medium text-primary mb-6 shadow-sm"
              >
                Yatri Store
              </motion.div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  Certification Vouchers
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Get certified with our exclusive exam vouchers. Limited time offers with amazing discounts!
              </p>
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewProcedure}
                  className="rounded-full px-5 text-sm font-medium"
                >
                  See process to get scheduled exam
                </Button>
              </div>
            </motion.div>

          </div>
        </section>

        {/* Category Filters + Cart CTA */}
        <section className="sticky top-16 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-4 py-4"
            >
              {/* Filters */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground whitespace-nowrap">
                  <span>Filter by:</span>
                </div>
                <Button
                  variant={selectedCategory === "All" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("All")}
                  className="whitespace-nowrap font-medium"
                >
                  All
                  {selectedCategory === "All" && (
                    <Badge variant="secondary" className="ml-2">
                      {products.length}
                    </Badge>
                  )}
                </Button>
                {categories.map((category) => {
                  const count = products.filter((p) => p.category === category).length;
                  if (count === 0) return null;
                  return (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="whitespace-nowrap font-medium"
                    >
                      {category}
                      {selectedCategory === category && (
                        <Badge variant="secondary" className="ml-2">
                          {count}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>

              {/* Cart CTA - right side, \"best buying\" style (desktop only) */}
              <div className="hidden md:block">
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 shadow-sm px-3 py-2 flex items-center gap-2"
                >
                  <div className="flex flex-col items-end mr-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">
                      Smart Cart
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Review & checkout securely
                    </span>
                  </div>
                  <CartSheet />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Loader2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
                <h3 className="text-2xl font-semibold mb-2">Loading certificates...</h3>
                <p className="text-muted-foreground">
                  Pleasewait for few seconds...
                </p>
              </motion.div>
            ) : filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground">
                  Try selecting a different category
                </p>
              </motion.div>
            ) : (
              <>
                {/* Results count */}
                <div className="mb-8 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span>{" "}
                    {filteredProducts.length === 1 ? "product" : "products"}
                    {selectedCategory !== "All" && ` in ${selectedCategory}`}
                  </p>
                </div>

                {/* Products Grid - 3 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  {filteredProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center"
            >
              <h2 className="text-3xl font-bold mb-6">Why Choose Yatri Cloud Vouchers?</h2>
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                {[
                  {
                    title: "Best Prices",
                    description: "Exclusive discounts up to 50% OFF on all certification vouchers",
                  },
                  {
                    title: "Instant Delivery",
                    description: "Receive your voucher immediately after payment confirmation",
                  },
                  {
                    title: "24/7 Support",
                    description: "Our team is always ready to help you with your certification journey",
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 rounded-lg bg-card border border-border/60"
                  >
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
        
        {/* Mobile Cart Bar - Fixed at bottom */}
        <MobileCartBar />
      </div>
    </CartProvider>
  );
};

export default YatriStore;

