import Review from "./pages/Review";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CertifiedYatris from "./pages/CertifiedYatris";
import Achievements from "./pages/Achievements";
import Udemy from "./pages/Udemy";
import YatriStore from "./pages/YatriStore";
import AddProduct from "./pages/AddProduct";
import ManageCertifications from "./pages/ManageCertifications";
import EditProfile from "./pages/EditProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="dark">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/certifiedyatris" element={<CertifiedYatris />} />
            <Route path="/manage-certifications" element={<ManageCertifications />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/udemy" element={<Udemy />} />
            <Route path="/yatristore" element={<YatriStore />} />
            <Route path="/addproduct" element={<AddProduct />} />
            <Route path="/review" element={<Review />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
