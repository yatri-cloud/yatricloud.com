import Review from "./pages/Review";
import Reviews from "./pages/Reviews";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { YatriAI } from "@/components/YatriAI";
import { CalendlyPopup } from "@/components/CalendlyPopup";
import { CartProvider } from "@/contexts/CartContext";
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
import UpcomingEventDetail from "./pages/UpcomingEventDetail";
import VenueSubmissionForm from "./pages/VenueSubmissionForm";
import SpeakerSubmissionForm from "./pages/SpeakerSubmissionForm";
import SponsorSubmissionForm from "./pages/SponsorSubmissionForm";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import EventMediaUpload from "./pages/EventMediaUpload";
import MyEvents from "./pages/MyEvents";
import AdminAttendees from "./pages/admin/AdminAttendees";
import EventRegistrationsList from "./pages/admin/EventRegistrationsList";
import { Bot } from "lucide-react"; // Import Bot icon
import { SpeedInsights } from "@vercel/speed-insights/react";
import EventFeedback from "./pages/EventFeedback";
import AdminTraining from "./pages/admin/AdminTraining";
import AdminEditTraining from "./pages/admin/AdminEditTraining";
import AdminProviders from "./pages/admin/AdminProviders";
import AdminEnrollments from "./pages/admin/AdminEnrollments";
import Training from "./pages/Training";
import TrainingDetail from "./pages/TrainingDetail";
import AdminTrainingList from "@/pages/admin/AdminTrainingList";
import MyTrainings from "@/pages/MyTrainings";
import StudentTrainingDashboard from "@/pages/StudentTrainingDashboard";
import BecomeTrainer from "@/pages/BecomeTrainer";
import AdminTrainers from "@/pages/admin/AdminTrainers";
import TrainerLogin from "@/pages/trainer/TrainerLogin";
import TrainerDashboard from "@/pages/trainer/TrainerDashboard";
import TrainerCourseEditor from "@/pages/trainer/TrainerCourseEditor";
import GuideView from "@/pages/GuideView";
import ExamDumps from "./pages/ExamDumps";
import AdminExamDumps from "./pages/admin/AdminExamDumps";
import AdminAddExamDump from "./pages/admin/AdminAddExamDump";
import AdminEditExamDump from "./pages/admin/AdminEditExamDump";
import RequestVoucher from "./pages/RequestVoucher";


import TrainerCreateCourse from "@/pages/trainer/TrainerCreateCourse";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="dark">
    <SpeedInsights />
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* ... all routes ... */}
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
              <Route path="/examdumps" element={<ExamDumps />} />
              <Route path="/training" element={<Training />} />
              <Route path="/training/:id/dashboard" element={<StudentTrainingDashboard />} />
              <Route path="/training/:id" element={<TrainingDetail />} />
              <Route path="/training/:certification/:courseSlug" element={<TrainingDetail />} />
              <Route path="/addproduct" element={<AddProduct />} />
              <Route path="/feedback" element={<Review />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/creator" element={<BecomeTrainer />} />
              <Route path="/requestvoucher" element={<RequestVoucher />} />

              {/* ... inside Routes ... */}
              <Route path="/createevent" element={<CreateEvent />} />
              <Route path="/events/:eventName/feedback" element={<EventFeedback />} />

              {/* Upcoming Event Routes */}
              <Route path="/upcoming-event/:slug" element={<UpcomingEventDetail />} />
              <Route path="/upcoming-event/:slug/venue" element={<VenueSubmissionForm />} />
              <Route path="/upcoming-event/:slug/speakers" element={<SpeakerSubmissionForm />} />
              <Route path="/upcoming-event/:slug/sponsors" element={<SponsorSubmissionForm />} />

              {/* Event Media Upload Route */}
              <Route path="/event/:slug/media" element={<EventMediaUpload />} />

              {/* Profile Routes */}
              <Route path="/profile/my-events" element={<MyEvents />} />
              <Route path="/my-trainings" element={<MyTrainings />} />
              <Route path="/profile/guide" element={<GuideView type="user" />} />
              <Route path="/profile/sitemap" element={<GuideView type="user-access" />} />

              {/* Trainer Routes */}
              <Route path="/trainer/login" element={<TrainerLogin />} />
              <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
              <Route path="/trainer/course/create" element={<TrainerCreateCourse />} />
              <Route path="/trainer/course/:courseId/edit" element={<TrainerCourseEditor />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />}>
                <Route index element={<Navigate to="/admin/events" replace />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="events/:eventId/registrations" element={<EventRegistrationsList />} />
                <Route path="attendees" element={<AdminAttendees />} />
                <Route path="udemy" element={<UdemyAdmin />} />
                <Route path="ai" element={<AdminYatriAI />} />
                <Route path="submissions" element={<AdminSubmissions />} />
                <Route path="products/add" element={<AdminAddProduct />} />
                <Route path="training">
                  <Route index element={<AdminTrainingList />} />
                  <Route path="create" element={<AdminTraining />} />
                  <Route path="edit/:id" element={<AdminEditTraining />} />
                </Route>
                <Route path="providers" element={<AdminProviders />} />
                <Route path="enrollments" element={<AdminEnrollments />} />
                <Route path="trainers" element={<AdminTrainers />} />
                <Route path="exam-dumps" element={<AdminExamDumps />} />
                <Route path="exam-dumps/add" element={<AdminAddExamDump />} />
                <Route path="exam-dumps/edit/:id" element={<AdminEditExamDump />} />
                <Route path="guide" element={<GuideView type="admin" />} />
                <Route path="sitemap" element={<GuideView type="admin-access" />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CalendlyPopup />
            {/* <YatriAI /> */}
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>

  </ThemeProvider >
);

export default App;
