import Review from "./pages/Review";
import Reviews from "./pages/Reviews";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { YatriAI } from "@/components/YatriAI";
import Index from "./pages/Index";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CertifiedYatris from "./pages/CertifiedYatris";
import Achievements from "./pages/Achievements";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Udemy from "./pages/Udemy";
import YatriStore from "./pages/YatriStore";
import AddProduct from "./pages/AddProduct";
import ManageCertifications from "./pages/ManageCertifications";
import EditProfile from "./pages/EditProfile";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents from "./pages/admin/AdminEvents";
import UdemyAdmin from "./pages/admin/UdemyAdmin";
import AdminAddProduct from "./pages/admin/AdminAddProduct";
import CreateEvent from "./pages/CreateEvent";
import AdminYatriAI from "./pages/admin/AdminYatriAI"; // Import AdminYatriAI
import { Bot } from "lucide-react"; // Import Bot icon

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
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/udemy" element={<Udemy />} />
            <Route path="/yatristore" element={<YatriStore />} />
            <Route path="/addproduct" element={<AddProduct />} />
            <Route path="/feedback" element={<Review />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/createevent" element={<CreateEvent />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />}>
              <Route index element={<Navigate to="/admin/events" replace />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="udemy" element={<UdemyAdmin />} />
              <Route path="ai" element={<AdminYatriAI />} />
              <Route path="products/add" element={<AdminAddProduct />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <YatriAI />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
