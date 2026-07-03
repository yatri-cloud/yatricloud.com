import Review from "./pages/Review";
import Reviews from "./pages/Reviews";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CalendlyPopup } from "@/components/CalendlyPopup";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CertifiedYatris from "./pages/CertifiedYatris";
import Achievements from "./pages/Achievements";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Community from "./pages/Community";
import Partners from "./pages/Partners";
import Udemy from "./pages/Udemy";
import YatriStore from "./pages/YatriStore";
import AddProduct from "./pages/AddProduct";
import ManageCertifications from "./pages/ManageCertifications";
import EditProfile from "./pages/EditProfile";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents from "./pages/admin/AdminEvents";
import UdemyAdmin from "./pages/admin/UdemyAdmin";
import AdminAddProduct from "./pages/admin/AdminAddProduct";
import CreateEvent from "./pages/CreateEvent";
import UpcomingEventDetail from "./pages/UpcomingEventDetail";
import VenueSubmissionForm from "./pages/VenueSubmissionForm";
import SpeakerSubmissionForm from "./pages/SpeakerSubmissionForm";
import SponsorSubmissionForm from "./pages/SponsorSubmissionForm";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import EventMediaUpload from "./pages/EventMediaUpload";
import MyEvents from "./pages/MyEvents";
import MyPurchases from "./pages/MyPurchases";
import ReceiptView from "./pages/ReceiptView";
import AdminAttendees from "./pages/admin/AdminAttendees";
import EventRegistrationsList from "./pages/admin/EventRegistrationsList";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import EventFeedback from "./pages/EventFeedback";
import AdminTraining from "./pages/admin/AdminTraining";
import AdminEditTraining from "./pages/admin/AdminEditTraining";
import AdminProviders from "./pages/admin/AdminProviders";
import AdminEnrollments from "./pages/admin/AdminEnrollments";
import AdminPayments from "./pages/admin/AdminPayments";
import Training from "./pages/Training";
import TrainingDetail from "./pages/TrainingDetail";
import AdminTrainingList from "@/pages/admin/AdminTrainingList";
import MyTrainings from "@/pages/MyTrainings";
import StudentTrainingDashboard from "@/pages/StudentTrainingDashboard";
import CertificateView from "@/pages/CertificateView";
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
import AdminSiteContent from "./pages/admin/AdminSiteContent";
import AdminCertCatalog from "./pages/admin/AdminCertCatalog";
import RequestVoucher from "./pages/RequestVoucher";
import MentorshipDirectory from "./pages/mentorship/MentorshipDirectory";
import BecomeMentor from "./pages/mentorship/BecomeMentor";
import MentorProfile from "./pages/mentorship/MentorProfile";
import MentorServiceDetail from "./pages/mentorship/MentorServiceDetail";
import MyMentorshipBookings from "./pages/mentorship/MyMentorshipBookings";
import MentorDashboard from "./pages/mentor/MentorDashboard";
import MentorLogin from "./pages/mentor/MentorLogin";
import AdminMentors from "./pages/admin/AdminMentors";
import AdminMentorApplications from "./pages/admin/AdminMentorApplications";
import AdminMentorshipServices from "./pages/admin/AdminMentorshipServices";
import AdminMentorshipBookings from "./pages/admin/AdminMentorshipBookings";
import AdminMentorReviews from "./pages/admin/AdminMentorReviews";
import AdminTrainingReviews from "./pages/admin/AdminTrainingReviews";
import AdminMentorshipOverview from "./pages/admin/AdminMentorshipOverview";


import TrainerCreateCourse from "@/pages/trainer/TrainerCreateCourse";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <SpeedInsights />
    <Analytics />
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
              <Route path="/events/:slug" element={<EventDetail />} />
              <Route path="/community" element={<Community />} />
              <Route path="/partners" element={<Partners />} />
              <Route path="/udemy" element={<Udemy />} />
              <Route path="/yatristore" element={<YatriStore />} />
              <Route path="/examdumps" element={<ExamDumps />} />
              <Route path="/training" element={<Training />} />
              <Route path="/training/:slug/dashboard" element={<StudentTrainingDashboard />} />
              {/* Backward-compatible fallback: resolves by slug or id so old bookmarks keep working */}
              <Route path="/training/:id" element={<TrainingDetail />} />
              <Route path="/training/:certification/:courseSlug" element={<TrainingDetail />} />
              <Route path="/certificate/:serial" element={<CertificateView />} />
              <Route path="/addproduct" element={<AddProduct />} />
              <Route path="/feedback" element={<Review />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/creator" element={<BecomeTrainer />} />
              <Route path="/requestvoucher" element={<RequestVoucher />} />

              {/* Mentorship Routes — /mentorship/apply and /mentorship/bookings stay above /mentorship/:mentorSlug */}
              <Route path="/mentorship" element={<MentorshipDirectory />} />
              <Route path="/mentorship/apply" element={<BecomeMentor />} />
              <Route path="/mentorship/bookings" element={<MyMentorshipBookings />} />
              <Route path="/mentorship/:mentorSlug" element={<MentorProfile />} />
              <Route path="/mentorship/:mentorSlug/:serviceSlug" element={<MentorServiceDetail />} />

              {/* Mentor Self Service */}
              <Route path="/mentor/login" element={<MentorLogin />} />
              <Route path="/mentor/dashboard" element={<MentorDashboard />} />

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
              <Route path="/profile/purchases" element={<MyPurchases />} />
              <Route path="/receipt/:invoiceNumber" element={<ReceiptView />} />
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
                <Route path="site" element={<AdminSiteContent />} />
                <Route path="certifications" element={<AdminCertCatalog />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="events/:eventId/registrations" element={<EventRegistrationsList />} />
                <Route path="attendees" element={<AdminAttendees />} />
                <Route path="udemy" element={<UdemyAdmin />} />
                <Route path="submissions" element={<AdminSubmissions />} />
                <Route path="products/add" element={<AdminAddProduct />} />
                <Route path="training">
                  <Route index element={<AdminTrainingList />} />
                  <Route path="create" element={<AdminTraining />} />
                  <Route path="edit/:id" element={<AdminEditTraining />} />
                  <Route path="reviews" element={<AdminTrainingReviews />} />
                </Route>
                <Route path="providers" element={<AdminProviders />} />
                <Route path="enrollments" element={<AdminEnrollments />} />
                <Route path="trainers" element={<AdminTrainers />} />
                <Route path="mentorship/overview" element={<AdminMentorshipOverview />} />
                <Route path="mentorship/applications" element={<AdminMentorApplications />} />
                <Route path="mentorship/mentors" element={<AdminMentors />} />
                <Route path="mentorship/services" element={<AdminMentorshipServices />} />
                <Route path="mentorship/bookings" element={<AdminMentorshipBookings />} />
                <Route path="mentorship/reviews" element={<AdminMentorReviews />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="exam-dumps" element={<AdminExamDumps />} />
                <Route path="exam-dumps/add" element={<AdminAddExamDump />} />
                <Route path="exam-dumps/edit/:id" element={<AdminEditExamDump />} />
                <Route path="guide" element={<GuideView type="admin" />} />
                <Route path="sitemap" element={<GuideView type="admin-access" />} />
              </Route>

              <Route path="/reset-password" element={<ResetPassword />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CalendlyPopup />
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>

  </ThemeProvider >
);

export default App;
