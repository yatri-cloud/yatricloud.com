import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Ticket, 
  Send, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  BadgeCheck, 
  Globe, 
  GraduationCap, 
  ShieldCheck,
  ChevronRight,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { submitVoucherRequest } from "@/lib/voucher-api";
import { ScrollReveal } from "@/components/ScrollReveal";
import { HomeReviewsSection } from "@/components/sections/HomeReviewsSection";

const PROVIDERS = [
  "AWS (Amazon Web Services)",
  "Microsoft Azure",
  "Google Cloud (GCP)",
  "GitHub",
  "Oracle Cloud",
  "Salesforce",
  "ServiceNow",
  "OpenAI",
  "HashiCorp Certified",
  "Kubernetes Certified",
  "Other"
];

const RequestVoucher = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [exams, setExams] = useState([""]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    whatsapp: "",
    contactNumber: "",
    country: "",
    provider: "",
    reason: ""
  });
  const [customProvider, setCustomProvider] = useState("");

  const addExam = () => setExams([...exams, ""]);
  const removeExam = (index: number) => {
    if (exams.length > 1) {
      const newExams = exams.filter((_, i) => i !== index);
      setExams(newExams);
    }
  };

  const updateExam = (index: number, value: string) => {
    const newExams = [...exams];
    newExams[index] = value;
    setExams(newExams);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validExams = exams.filter(e => e.trim() !== "");
    if (validExams.length === 0) {
      toast.error("Please enter at least one exam name");
      return;
    }

    if (!formData.provider) {
      toast.error("Please select an exam provider");
      return;
    }

    if (formData.provider === "Other" && !customProvider.trim()) {
      toast.error("Please enter the provider name");
      return;
    }

    setIsLoading(true);
    try {
      await submitVoucherRequest({
        ...formData,
        provider: formData.provider === "Other" ? customProvider : formData.provider,
        exams: validExams
      });
      setIsSubmitted(true);
      toast.success("Request submitted with love! We'll get back to you soon.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error("Failed to submit request. Please try again or contact support.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-20">
        {/* Background Decorative Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="container max-w-4xl px-4 mx-auto">
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="form-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6 }}
              >
                {/* Emotional Header */}
                <div className="text-center mb-12">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Your Potential is Priceless</span>
                  </motion.div>
                  
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
                    Certification should <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-indigo-600">
                      be for everyone.
                    </span>
                  </h1>
                  
                  <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    At Yatri Cloud, we believe every dream deserves a chance. Request a discounted certification voucher and let us help you take the next big step in your career.
                  </p>
                </div>

                {/* Form Card */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-blue-500/20 to-indigo-600/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-75 transition duration-500" />
                  <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-[2rem] p-8 md:p-12 shadow-2xl overflow-hidden">
                    
                    {/* Progress indicator (decorative) */}
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-primary"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                        />
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-secondary-foreground border border-border">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                      {/* Personal Info Grid */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="fullName" className="text-sm font-semibold flex items-center gap-2">
                            Full Name <span className="text-primary">*</span>
                          </Label>
                          <Input
                            id="fullName"
                            placeholder="e.g. Yatharth Chauhan"
                            required
                            value={formData.fullName}
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                            className="bg-background/50 border-border/50 focus:border-primary h-12 px-4 rounded-xl transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                            Email Address <span className="text-primary">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="e.g. name@example.com"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="bg-background/50 border-border/50 focus:border-primary h-12 px-4 rounded-xl transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp" className="text-sm font-semibold flex items-center gap-2">
                            WhatsApp / Phone Number <span className="text-primary">*</span>
                          </Label>
                          <Input
                            id="whatsapp"
                            placeholder="e.g. +91 9876543210"
                            required
                            value={formData.whatsapp}
                            onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                            className="bg-background/50 border-border/50 focus:border-primary h-12 px-4 rounded-xl transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactNumber" className="text-sm font-semibold flex items-center gap-2">
                            Secondary Contact Number (Optional)
                          </Label>
                          <Input
                            id="contactNumber"
                            placeholder="e.g. +91 9876543211"
                            value={formData.contactNumber}
                            onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                            className="bg-background/50 border-border/50 focus:border-primary h-12 px-4 rounded-xl transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-sm font-semibold flex items-center gap-2">
                            Country <span className="text-primary">*</span>
                          </Label>
                          <Input
                            id="country"
                            placeholder="e.g. India, USA, UK"
                            required
                            value={formData.country}
                            onChange={(e) => setFormData({...formData, country: e.target.value})}
                            className="bg-background/50 border-border/50 focus:border-primary h-12 px-4 rounded-xl transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="provider" className="text-sm font-semibold flex items-center gap-2">
                            Exam Provider <span className="text-primary">*</span>
                          </Label>
                          <Select 
                            value={formData.provider}
                            onValueChange={(value) => setFormData({...formData, provider: value})}
                          >
                            <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary h-12 px-4 rounded-xl transition-all">
                              <SelectValue placeholder="Select Provider" />
                            </SelectTrigger>
                            <SelectContent>
                              {PROVIDERS.map(p => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <AnimatePresence>
                        {formData.provider === "Other" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-2 overflow-hidden"
                          >
                            <Label htmlFor="customProvider" className="text-sm font-semibold flex items-center gap-2">
                              Custom Provider Name <span className="text-primary">*</span>
                            </Label>
                            <Input
                              id="customProvider"
                              placeholder="e.g. Red Hat, LPI, Oracle, etc."
                              required
                              value={customProvider}
                              onChange={(e) => setCustomProvider(e.target.value)}
                              className="bg-background/50 border-border/50 focus:border-primary h-12 px-4 rounded-xl transition-all"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Dynamic Exam Fields */}
                      <div className="space-y-4">
                        <Label className="text-sm font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-2">Specific Exam Names <span className="text-primary">*</span></span>
                          <span className="text-xs text-muted-foreground font-normal">Add multiple if needed</span>
                        </Label>
                        <div className="space-y-3">
                          {exams.map((exam, index) => (
                            <motion.div 
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex gap-2"
                            >
                              <Input
                                placeholder={`e.g. ${formData.provider.includes("AWS") ? "AWS Solutions Architect Associate" : "Exam Name"}`}
                                value={exam}
                                onChange={(e) => updateExam(index, e.target.value)}
                                className="bg-background/50 border-border/50 focus:border-primary h-12 px-4 rounded-xl transition-all"
                              />
                              {exams.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeExam(index)}
                                  className="h-12 w-12 rounded-xl text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </Button>
                              )}
                            </motion.div>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addExam}
                          className="w-full h-12 border-dashed border-2 hover:border-primary hover:bg-primary/5 rounded-xl transition-all flex items-center gap-2 text-muted-foreground hover:text-primary"
                        >
                          <Plus className="w-4 h-4" />
                          Add Another Exam
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reason" className="text-sm font-semibold">
                          Why do you need this discount? (Optional)
                        </Label>
                        <Textarea
                          id="reason"
                          placeholder="Tell us a bit about your journey or any challenges you're facing. We're here to listen."
                          className="bg-background/50 border-border/50 focus:border-primary min-h-[120px] rounded-xl p-4 transition-all"
                          value={formData.reason}
                          onChange={(e) => setFormData({...formData, reason: e.target.value})}
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-14 bg-gradient-to-r from-primary via-blue-500 to-indigo-600 hover:opacity-90 text-white font-bold text-lg rounded-2xl transition-all shadow-xl shadow-primary/20 hover:shadow-primary/40 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Sending with Love...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Send className="w-5 h-5" />
                            <span>Request Discount Voucher</span>
                          </div>
                        )}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
                        <ShieldCheck className="w-3 h-3" />
                        We respect your privacy. Your details are safe with us.
                      </p>
                    </form>
                  </div>
                </div>

                {/* Direct Reviews Section */}
                <div className="mt-20">
                  <HomeReviewsSection />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success-message"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto text-center py-20"
              >
                <div className="relative inline-block mb-10">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 100 }}
                    className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center text-white shadow-2xl shadow-green-500/20"
                  >
                    <CheckCircle2 className="w-12 h-12" />
                  </motion.div>
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.2, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-green-500/30 blur-2xl -z-10"
                  />
                </div>
                
                <h2 className="text-4xl font-bold mb-6">Request Received!</h2>
                <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
                  Thank you for sharing your journey with us, <span className="text-primary font-semibold">{formData.fullName}</span>. 
                  We've received your request for <span className="text-foreground font-semibold">{formData.provider === "Other" ? customProvider : formData.provider}</span> vouchers.
                </p>
                
                <div className="bg-secondary/30 border border-border rounded-3xl p-8 mb-12 text-left">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    What happens next?
                  </h3>
                  <ul className="space-y-4 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center text-primary text-xs">1</div>
                      <span>Our team will review your request and check for available discount codes (up to 50% or more).</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center text-primary text-xs">2</div>
                      <span>We will contact you via WhatsApp or Email within 2-3 business days.</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center text-primary text-xs">3</div>
                      <span>Once verified, we'll guide you on how to apply the voucher and book your exam.</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="rounded-2xl h-14 px-8">
                    <a href="/">Back to Home</a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-2xl h-14 px-8">
                    <a href="/reviews">Explore Reviews <ChevronRight className="ml-2 w-4 h-4" /></a>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer simple={true} />
    </div>
  );
};

export default RequestVoucher;
