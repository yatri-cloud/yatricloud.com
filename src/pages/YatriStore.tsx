import { useState, useMemo, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, PackageOpen, BadgeCheck, Zap, LifeBuoy, Tag, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ListPager } from "@/components/ui/list-pager";
import { CartProvider, useCart } from "@/contexts/CartContext";

const PAGE_SIZE = 9;

const YatriStore = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const rise = prefersReducedMotion ? 0 : 18;
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "All">("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { setPage(1); }, [selectedCategory, search, sort]);

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
    const q = search.trim().toLowerCase();
    const list = products.filter((product) => {
      if (selectedCategory !== "All" && product.category !== selectedCategory) return false;
      if (!q) return true;
      return product.title.toLowerCase().includes(q)
        || (product.description || "").toLowerCase().includes(q)
        || (product.examCode || "").toLowerCase().includes(q)
        || product.category.toLowerCase().includes(q)
        || (product.level || "").toLowerCase().includes(q);
    });
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.discountedPrice - b.discountedPrice);
    else if (sort === "price-desc") sorted.sort((a, b) => b.discountedPrice - a.discountedPrice);
    else if (sort === "name") sorted.sort((a, b) => a.title.localeCompare(b.title));
    return sorted;
  }, [selectedCategory, search, sort, products]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
    <>
      <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0">
        <SEO
          title="Yatri Store · Practice Tests and Study Packs"
          description="Affordable practice tests and study packs for AWS, Azure, GCP and Kubernetes exams. Prepare well, spend less and pass with confidence."
          jsonLd={
            products.length > 0
              ? {
                  "@context": "https://schema.org",
                  "@type": "ItemList",
                  name: "Yatri Store Practice Tests and Study Packs",
                  itemListElement: products.slice(0, 20).map((p, i) => ({
                    "@type": "ListItem",
                    position: i + 1,
                    name: p.title,
                    url: "https://www.yatricloud.com/yatristore",
                  })),
                }
              : undefined
          }
        />
        <div className="noise-overlay" />
        <Navbar />

        {/* Store Header */}
        <section className="relative pt-28 pb-16 overflow-hidden">
          {/* Soft blue wash — white canvas, no black */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-50 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,124,255,0.06),transparent_55%)]" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: rise }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-center mb-8"
            >

              <motion.div
                initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm font-semibold text-primary mb-6 shadow-sm"
              >
                <Tag className="w-4 h-4" aria-hidden="true" />
                Up to 50% OFF · verified vouchers
              </motion.div>

              <h1 className="font-display font-bold tracking-tight text-4xl md:text-5xl lg:text-6xl mb-4">
                Exam vouchers that put{" "}
                <span className="gradient-text">certification in reach</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Focus on learning, not the price tag. Grab a verified, discounted voucher and book your exam with confidence — you're not doing this alone.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewProcedure}
                  className="rounded-full px-5 h-11 text-sm font-medium"
                >
                  How exam scheduling works
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/reviews")}
                  className="rounded-full px-5 h-11 text-sm font-medium"
                >
                  Read Yatri reviews
                </Button>
              </div>
            </motion.div>

          </div>
        </section>

        {/* Category Filters + Cart CTA */}
        <section className="sticky top-16 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:items-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search vouchers by exam, provider or code"
                  aria-label="Search vouchers"
                  className="h-10 rounded-full pl-9"
                />
              </div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-10 w-full rounded-full sm:w-[190px]" aria-label="Sort vouchers">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-asc">Price: low to high</SelectItem>
                  <SelectItem value="price-desc">Price: high to low</SelectItem>
                  <SelectItem value="name">Name: A to Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-4 py-4"
            >
              {/* Filters */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground whitespace-nowrap">
                  <span>Browse by track:</span>
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
                      Your cart
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Secure checkout, instant delivery
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
                <Loader2 className="h-14 w-14 text-primary mx-auto mb-5 animate-spin" aria-hidden="true" />
                <h3 className="font-display font-bold tracking-tight text-2xl mb-2">Loading your vouchers…</h3>
                <p className="text-muted-foreground">
                  Fetching today's verified deals — just a moment, Yatris.
                </p>
              </motion.div>
            ) : filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: rise }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-center py-20 max-w-md mx-auto"
              >
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/5 border border-primary/15 mb-5">
                  <PackageOpen className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-display font-bold tracking-tight text-2xl mb-2">
                  No vouchers in this track yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Fresh verified deals drop often, Yatris. Explore another track or browse every voucher we have.
                </p>
                <Button onClick={() => { setSelectedCategory("All"); setSearch(""); }} className="h-11 rounded-full px-6 font-semibold shadow-inset-btn">
                  View all vouchers
                </Button>
              </motion.div>
            ) : (
              <>
                {/* Results count */}
                <div className="mb-8 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{filteredProducts.length}</span>{" "}
                    verified {filteredProducts.length === 1 ? "voucher" : "vouchers"}
                    {selectedCategory !== "All" && <> in <span className="font-semibold text-foreground">{selectedCategory}</span></>}
                    {" "}— every one 50% OFF, ready to book.
                  </p>
                </div>

                {/* Products Grid - 3 Columns, staggered reveal */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  {pagedProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: rise }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.45, delay: Math.min(index, 5) * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
                <ListPager page={currentPage} pageCount={pageCount} onPageChange={setPage} />
              </>
            )}
          </div>
        </section>

        {/* Trust Section — grouped light-blue tint band */}
        <section className="py-20 band-tint">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: rise }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl mx-auto text-center"
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-primary mb-3">
                Trusted by 50,000+ Yatris
              </p>
              <h2 className="font-display font-bold tracking-tight text-3xl md:text-4xl mb-4">
                Why Yatris buy their vouchers here
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Real savings, real support — so nothing stands between you and your first-attempt pass.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-10 text-left">
                {[
                  {
                    icon: Tag,
                    title: "Half the price, none of the doubt",
                    description: "Up to 50% OFF every certification voucher — so you can focus on learning, not the price tag.",
                  },
                  {
                    icon: Zap,
                    title: "Delivered the moment you pay",
                    description: "Your verified voucher lands right after payment — book your exam without the wait.",
                  },
                  {
                    icon: LifeBuoy,
                    title: "Real support, always on",
                    description: "Stuck on scheduling? Our team walks the certification journey with you, 24/7.",
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: rise }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition-colors"
                  >
                    <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary/10 text-primary mb-4">
                      <feature.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-primary">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                Verified vouchers · 4.8★ from 50K+ Yatris
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />

        <MobileCartBar />
      </div>
    </>
  );
};

export default YatriStore;

