import { motion } from "framer-motion";
import { Ticket, ChevronRight, BadgeCheck, GraduationCap, ShieldCheck, Briefcase, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";

export const VoucherPromoSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />

      <div className="container mx-auto px-4 md:px-6">
        <ScrollReveal>
          <div className="relative group">
            {/* Animated Glow Border */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-blue-500/30 to-indigo-600/30 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            
            <div className="relative bg-card/80 backdrop-blur-2xl border border-border/50 rounded-[2.5rem] p-8 md:p-16 shadow-2xl overflow-hidden">
              {/* Content Grid */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                
                <div className="space-y-8">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                  >
                    <BadgeCheck className="w-4 h-4" />
                    <span>Invested in Your Success</span>
                  </motion.div>
                  
                  <h2 className="text-4xl md:text-6xl font-bold leading-tight">
                    Focus on learning, <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-indigo-600">
                      not the price tag.
                    </span>
                  </h2>
                  
                  <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                    We're now offering discounted certification vouchers for AWS, Azure, GCP, GitHub, and more. Apply today and let Yatri Cloud support your professional growth.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button asChild size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-blue-600 hover:opacity-90">
                      <a href="/requestvoucher" className="flex items-center gap-2">
                        Request Voucher <ChevronRight className="w-5 h-5" />
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold border-2">
                      <a href="/reviews">View Reviews</a>
                    </Button>
                  </div>
                </div>

                {/* Features Display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    {
                      icon: Ticket,
                      title: "Up to 50% Off",
                      desc: "Significant discounts on major cloud & DevOps certifications.",
                      color: "bg-amber-500/10 text-amber-500"
                    },
                    {
                      icon: Briefcase,
                      title: "Career Growth",
                      desc: "Get certified and stand out in the competitive job market.",
                      color: "bg-blue-500/10 text-blue-500"
                    },
                    {
                      icon: ShieldCheck,
                      title: "Verified codes",
                      desc: "100% authentic vouchers from official training partners.",
                      color: "bg-green-500/10 text-green-500"
                    },
                    {
                      icon: Globe,
                      title: "Community First",
                      desc: "Designed to help students and early-career professionals.",
                      color: "bg-red-500/10 text-red-500"
                    }
                  ].map((feature, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -5 }}
                      className="p-6 rounded-3xl bg-background/50 border border-border/50 backdrop-blur-sm"
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${feature.color}`}>
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold mb-2">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Decorative Shine */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
