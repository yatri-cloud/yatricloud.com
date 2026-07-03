import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CalendlyPopup } from "@/components/CalendlyPopup";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

// Route-level code splitting: every page below loads on demand, so the
// initial bundle carries only the homepage and the shared shell.
const Review = lazy(() => import("./pages/Review"));
const Reviews = lazy(() => import("./pages/Reviews"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CertifiedYatris = lazy(() => import("./pages/CertifiedYatris"));
const Achievements = lazy(() => import("./pages/Achievements"));
const CertificationPaths = lazy(() => import("./pages/CertificationPaths"));
const YatriProfile = lazy(() => import("./pages/YatriProfile"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const Community = lazy(() => import("./pages/Community"));
const Partners = lazy(() => import("./pages/Partners"));
const PartnerApply = lazy(() => import("./pages/PartnerApply"));
const Udemy = lazy(() => import("./pages/Udemy"));
const YatriStore = lazy(() => import("./pages/YatriStore"));
const AddProduct = lazy(() => import("./pages/AddProduct"));
const ManageCertifications = lazy(() => import("./pages/ManageCertifications"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const UdemyAdmin = lazy(() => import("./pages/admin/UdemyAdmin"));
const AdminAddProduct = lazy(() => import("./pages/admin/AdminAddProduct"));
const CreateEvent = lazy(() => import("./pages/CreateEvent"));
const UpcomingEventDetail = lazy(() => import("./pages/UpcomingEventDetail"));
const VenueSubmissionForm = lazy(() => import("./pages/VenueSubmissionForm"));
const SpeakerSubmissionForm = lazy(() => import("./pages/SpeakerSubmissionForm"));
const SponsorSubmissionForm = lazy(() => import("./pages/SponsorSubmissionForm"));
const AdminSubmissions = lazy(() => import("./pages/admin/AdminSubmissions"));
const EventMediaUpload = lazy(() => import("./pages/EventMediaUpload"));
const MyEvents = lazy(() => import("./pages/MyEvents"));
const MyPurchases = lazy(() => import("./pages/MyPurchases"));
const ReceiptView = lazy(() => import("./pages/ReceiptView"));
const AdminAttendees = lazy(() => import("./pages/admin/AdminAttendees"));
const EventRegistrationsList = lazy(() => import("./pages/admin/EventRegistrationsList"));
const EventFeedback = lazy(() => import("./pages/EventFeedback"));
const AdminTraining = lazy(() => import("./pages/admin/AdminTraining"));
const AdminEditTraining = lazy(() => import("./pages/admin/AdminEditTraining"));
const AdminProviders = lazy(() => import("./pages/admin/AdminProviders"));
const AdminEnrollments = lazy(() => import("./pages/admin/AdminEnrollments"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminRazorpayInvoices = lazy(() => import("./pages/admin/AdminRazorpayInvoices"));
const AdminTransactions = lazy(() => import("./pages/admin/AdminTransactions"));
const AdminSitemapView = lazy(() => import("./pages/admin/AdminSitemapView"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const UserSitemapView = lazy(() => import("./pages/UserSitemapView"));
const YatriDashboard = lazy(() => import("./pages/YatriDashboard"));
const MyCertificates = lazy(() => import("./pages/MyCertificates"));
const Training = lazy(() => import("./pages/Training"));
const TrainingDetail = lazy(() => import("./pages/TrainingDetail"));
const AdminTrainingList = lazy(() => import("@/pages/admin/AdminTrainingList"));
const MyTrainings = lazy(() => import("@/pages/MyTrainings"));
const StudentTrainingDashboard = lazy(() => import("@/pages/StudentTrainingDashboard"));
const CertificateView = lazy(() => import("@/pages/CertificateView"));
const BecomeTrainer = lazy(() => import("@/pages/BecomeTrainer"));
const AdminTrainers = lazy(() => import("@/pages/admin/AdminTrainers"));
const TrainerLogin = lazy(() => import("@/pages/trainer/TrainerLogin"));
const TrainerDashboard = lazy(() => import("@/pages/trainer/TrainerDashboard"));
const TrainerCourseEditor = lazy(() => import("@/pages/trainer/TrainerCourseEditor"));
const GuideView = lazy(() => import("@/pages/GuideView"));
const ExamDumps = lazy(() => import("./pages/ExamDumps"));
const AdminExamDumps = lazy(() => import("./pages/admin/AdminExamDumps"));
const AdminAddExamDump = lazy(() => import("./pages/admin/AdminAddExamDump"));
const AdminEditExamDump = lazy(() => import("./pages/admin/AdminEditExamDump"));
const AdminSiteContent = lazy(() => import("./pages/admin/AdminSiteContent"));
const AdminCommunity = lazy(() => import("./pages/admin/AdminCommunity"));
const AdminInquiries = lazy(() => import("./pages/admin/AdminInquiries"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminAchievements = lazy(() => import("./pages/admin/AdminAchievements"));
const AdminCertCatalog = lazy(() => import("./pages/admin/AdminCertCatalog"));
const RequestVoucher = lazy(() => import("./pages/RequestVoucher"));
const MentorshipDirectory = lazy(() => import("./pages/mentorship/MentorshipDirectory"));
const BecomeMentor = lazy(() => import("./pages/mentorship/BecomeMentor"));
const MentorProfile = lazy(() => import("./pages/mentorship/MentorProfile"));
const MentorServiceDetail = lazy(() => import("./pages/mentorship/MentorServiceDetail"));
const MyMentorshipBookings = lazy(() => import("./pages/mentorship/MyMentorshipBookings"));
const MentorDashboard = lazy(() => import("./pages/mentor/MentorDashboard"));
const MentorLogin = lazy(() => import("./pages/mentor/MentorLogin"));
const AdminMentors = lazy(() => import("./pages/admin/AdminMentors"));
const AdminMentorApplications = lazy(() => import("./pages/admin/AdminMentorApplications"));
const AdminMentorshipServices = lazy(() => import("./pages/admin/AdminMentorshipServices"));
const AdminMentorshipBookings = lazy(() => import("./pages/admin/AdminMentorshipBookings"));
const AdminMentorReviews = lazy(() => import("./pages/admin/AdminMentorReviews"));
const AdminTrainingReviews = lazy(() => import("./pages/admin/AdminTrainingReviews"));
const AdminMentorshipOverview = lazy(() => import("./pages/admin/AdminMentorshipOverview"));
const TrainerCreateCourse = lazy(() => import("@/pages/trainer/TrainerCreateCourse"));
const queryClient = new QueryClient();

/** Shown for the instant a lazy route chunk is fetched. */
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div aria-label="Loading page" role="status" className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent motion-reduce:animate-none" />
  </div>
);

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
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ... all routes ... */}
              <Route path="/" element={<Index />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/certifiedyatris" element={<CertifiedYatris />} />
              <Route path="/manage-certifications" element={<ManageCertifications />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/paths" element={<CertificationPaths />} />
              <Route path="/yatri/:slug" element={<YatriProfile />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:slug" element={<EventDetail />} />
              <Route path="/community" element={<Community />} />
              <Route path="/partners" element={<Partners />} />
              <Route path="/partners/:kind" element={<PartnerApply />} />
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
              <Route path="/dashboard" element={<YatriDashboard />} />
              <Route path="/certificates" element={<MyCertificates />} />
              <Route path="/profile/my-events" element={<MyEvents />} />
              <Route path="/my-trainings" element={<MyTrainings />} />
              <Route path="/profile/purchases" element={<MyPurchases />} />
              <Route path="/receipt/:invoiceNumber" element={<ReceiptView />} />
              <Route path="/profile/guide" element={<GuideView type="user" />} />
              <Route path="/profile/sitemap" element={<UserSitemapView />} />

              {/* Trainer Routes */}
              <Route path="/trainer/login" element={<TrainerLogin />} />
              <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
              <Route path="/trainer/course/create" element={<TrainerCreateCourse />} />
              <Route path="/trainer/course/:courseId/edit" element={<TrainerCourseEditor />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />}>
                <Route index element={<AdminOverview />} />
                <Route path="site" element={<AdminSiteContent />} />
                <Route path="certifications" element={<AdminCertCatalog />} />
                <Route path="community" element={<AdminCommunity />} />
                <Route path="inquiries" element={<AdminInquiries />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="achievements" element={<AdminAchievements />} />
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
                <Route path="razorpay-invoices" element={<AdminRazorpayInvoices />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="exam-dumps" element={<AdminExamDumps />} />
                <Route path="exam-dumps/add" element={<AdminAddExamDump />} />
                <Route path="exam-dumps/edit/:id" element={<AdminEditExamDump />} />
                <Route path="guide" element={<GuideView type="admin" />} />
                <Route path="sitemap" element={<AdminSitemapView />} />
              </Route>

              <Route path="/reset-password" element={<ResetPassword />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            <CalendlyPopup />
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>

  </ThemeProvider >
);

export default App;
