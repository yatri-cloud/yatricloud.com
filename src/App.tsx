import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CalendlyPopup } from "@/components/CalendlyPopup";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ConfirmProvider } from "@/components/providers/ConfirmProvider";
import Index from "./pages/Index";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import { usePageTracker } from "@/hooks/usePageTracker";
import { ProfileCompletionGuard } from "@/components/ProfileCompletionGuard";

// Route-level code splitting: every page below loads on demand, so the
// initial bundle carries only the homepage and the shared shell.
const Review = lazy(() => import("./pages/Review"));
const Reviews = lazy(() => import("./pages/Reviews"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CancellationRefundPolicy = lazy(() => import("./pages/CancellationRefundPolicy"));
const ShippingExchangePolicy = lazy(() => import("./pages/ShippingExchangePolicy"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const CertifiedYatris = lazy(() => import("./pages/CertifiedYatris"));
const Achievements = lazy(() => import("./pages/Achievements"));
const CertificationPaths = lazy(() => import("./pages/CertificationPaths"));
const YatriProfile = lazy(() => import("./pages/YatriProfile"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const Community = lazy(() => import("./pages/Community"));
const Support = lazy(() => import("./pages/Support"));
const SupportTicket = lazy(() => import("./pages/SupportTicket"));
const Partners = lazy(() => import("./pages/Partners"));
const PartnerApply = lazy(() => import("./pages/PartnerApply"));
const Udemy = lazy(() => import("./pages/Udemy"));
const YatriStore = lazy(() => import("./pages/YatriStore"));
const AddProduct = lazy(() => import("./pages/AddProduct"));
const ManageCertifications = lazy(() => import("./pages/ManageCertifications"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Leads = lazy(() => import("./pages/Leads"));
const ResumeMaker = lazy(() => import("./pages/ResumeMaker"));
const JobBoard = lazy(() => import("./pages/JobBoard"));
const JobApplications = lazy(() => import("./pages/JobApplications"));
const JobSeekerProfile = lazy(() => import("./pages/JobSeekerProfile"));
const JobReferrals = lazy(() => import("./pages/JobReferrals"));
const JobWebSearch = lazy(() => import("./pages/JobWebSearch"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const BlogWrite = lazy(() => import("./pages/BlogWrite"));
const BlogAuthor = lazy(() => import("./pages/BlogAuthor"));
const BlogSettings = lazy(() => import("./pages/BlogSettings"));
const BlogDashboard = lazy(() => import("./pages/BlogDashboard"));
const BlogNotifications = lazy(() => import("./pages/BlogNotifications"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const UdemyAdmin = lazy(() => import("./pages/admin/UdemyAdmin"));
const AdminAddProduct = lazy(() => import("./pages/admin/AdminAddProduct"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
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
const AdminTrainingReview = lazy(() => import("@/pages/admin/AdminTrainingReview"));
const AdminTrainingAttendance = lazy(() => import("@/pages/admin/AdminTrainingAttendance"));
const AdminRoleManagement = lazy(() => import("@/pages/admin/AdminRoleManagement"));
const MyTrainings = lazy(() => import("@/pages/MyTrainings"));
const StudentTrainingDashboard = lazy(() => import("@/pages/StudentTrainingDashboard"));
const CertificateView = lazy(() => import("@/pages/CertificateView"));
const BecomeTrainer = lazy(() => import("@/pages/BecomeTrainer"));
const AdminTrainers = lazy(() => import("@/pages/admin/AdminTrainers"));
const TrainerLogin = lazy(() => import("@/pages/trainer/TrainerLogin"));
const TrainerDashboard = lazy(() => import("@/pages/trainer/TrainerDashboard"));
const TrainerEditCourse = lazy(() => import("@/pages/trainer/TrainerEditCourse"));
const Unsubscribe = lazy(() => import("@/pages/Unsubscribe"));
const GuideView = lazy(() => import("@/pages/GuideView"));
const ExamDumps = lazy(() => import("./pages/ExamDumps"));
const AdminExamDumps = lazy(() => import("./pages/admin/AdminExamDumps"));
const AdminAddExamDump = lazy(() => import("./pages/admin/AdminAddExamDump"));
const AdminEditExamDump = lazy(() => import("./pages/admin/AdminEditExamDump"));
const AdminSiteContent = lazy(() => import("./pages/admin/AdminSiteContent"));
const AdminCommunity = lazy(() => import("./pages/admin/AdminCommunity"));
const AdminInquiries = lazy(() => import("./pages/admin/AdminInquiries"));
const AdminResumes = lazy(() => import("./pages/admin/AdminResumes"));
const AdminAISettings = lazy(() => import("./pages/admin/AdminAISettings"));
const AdminJobs = lazy(() => import("./pages/admin/AdminJobs"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));

const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminAchievements = lazy(() => import("./pages/admin/AdminAchievements"));
const AdminCertCatalog = lazy(() => import("./pages/admin/AdminCertCatalog"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminContentReviews = lazy(() => import("./pages/admin/AdminContentReviews"));
const AdminTickets = lazy(() => import("./pages/admin/AdminTickets"));
const AdminNewsletters = lazy(() => import("./pages/admin/AdminNewsletters"));
const AdminNewsletterCompose = lazy(() => import("./pages/admin/AdminNewsletterCompose"));
const AdminSubscribers = lazy(() => import("./pages/admin/AdminSubscribers"));
const AdminYatris = lazy(() => import("./pages/admin/AdminYatris"));
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
const Resources = lazy(() => import("./pages/Resources"));
const MyResources = lazy(() => import("./pages/MyResources"));
const AdminResources = lazy(() => import("./pages/admin/AdminResources"));
const AdminAddResource = lazy(() => import("./pages/admin/AdminAddResource"));
const AdminEditResource = lazy(() => import("./pages/admin/AdminEditResource"));
const AdminEmailTemplates = lazy(() => import("./pages/admin/AdminEmailTemplates"));
const AdminEmailSettings = lazy(() => import("./pages/admin/AdminEmailSettings"));
const AdminEmailLogs = lazy(() => import("./pages/admin/AdminEmailLogs"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
import { FEATURE_FLAGS } from "@/config/features";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Floating checkout pill: mounts only when the cart has items, and stays off
// surfaces that carry their own cart UI (store) or aren't shopping (admin,
// trainer). Lazy so the checkout sheet code never touches the entry bundle.
const FloatingCart = lazy(() => import("@/components/store/FloatingCart"));

const FloatingCartGate = () => {
  const { totalItems } = useCart();
  const { pathname } = useLocation();
  if (
    totalItems === 0 ||
    pathname === "/yatristore" ||
    pathname.startsWith("/examdumps") ||
    pathname.startsWith("/exam-dumps") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/trainer/")
  ) {
    return null;
  }
  return (
    <Suspense fallback={null}>
      <FloatingCart />
    </Suspense>
  );
};

/** Shown for the instant a lazy route chunk is fetched. */
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div aria-label="Loading page" role="status" className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent motion-reduce:animate-none" />
  </div>
);

/** Tracks every page navigation automatically — must be inside BrowserRouter. */
const PageTracker = () => { usePageTracker(); return null; };

const App = () => (
  <ThemeProvider defaultTheme="light">
    <SpeedInsights />
    <Analytics />
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CurrencyProvider>
          <CartProvider>
            <ConfirmProvider>
            <Toaster />
            <Sonner />
          <BrowserRouter>
            <PageTracker />
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ... all routes ... */}
              <Route path="/" element={<Index />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-and-conditions" element={<TermsOfService />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/cancellation-and-refund" element={<CancellationRefundPolicy />} />
              <Route path="/shipping-and-exchange" element={<ShippingExchangePolicy />} />
              <Route path="/contact-us" element={<ContactUs />} />
              <Route path="/certifiedyatris" element={<CertifiedYatris />} />
              <Route path="/login" element={<CertifiedYatris />} />
              <Route path="/signin" element={<CertifiedYatris />} />
              <Route path="/resume-maker" element={<ResumeMaker />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/jobs" element={<JobBoard />} />
              <Route path="/jobs/applications" element={<JobApplications />} />
              <Route path="/jobs/profile" element={<JobSeekerProfile />} />
              <Route path="/jobs/referrals" element={<JobReferrals />} />
              <Route path="/jobs/web" element={<JobWebSearch />} />
              <Route path="/blog" element={FEATURE_FLAGS.myBlogs ? <Blog /> : <ComingSoon title="Blogs" description="Our community blog and cloud learning stories platform is launching soon." />} />
              <Route path="/blog/write" element={FEATURE_FLAGS.myBlogs ? <BlogWrite /> : <ComingSoon title="Write Story" description="Writing and publishing community stories will be available soon." />} />
              <Route path="/blog/edit/:id" element={FEATURE_FLAGS.myBlogs ? <BlogWrite /> : <ComingSoon title="Edit Story" description="Story drafting and editing will be available soon." />} />
              <Route path="/blog/author/:id" element={FEATURE_FLAGS.myBlogs ? <BlogAuthor /> : <ComingSoon title="Author Profile" description="Author profiles and stories will be available soon." />} />
              <Route path="/blog/settings" element={FEATURE_FLAGS.myBlogs ? <BlogSettings /> : <ComingSoon title="Blog Settings" description="Writer profile settings will be available soon." />} />
              <Route path="/blog/dashboard" element={FEATURE_FLAGS.myBlogs ? <BlogDashboard /> : <ComingSoon title="My Blogs" description="Your writer dashboard and story management will be accessible here once the blog platform launches." />} />
              <Route path="/blog/notifications" element={FEATURE_FLAGS.myBlogs ? <BlogNotifications /> : <ComingSoon title="Blog Notifications" description="Blog notifications will be accessible here soon." />} />
              <Route path="/blog/:slug" element={FEATURE_FLAGS.myBlogs ? <BlogPost /> : <ComingSoon title="Blogs" description="Our community blog and cloud learning stories platform is launching soon." />} />
              <Route path="/manage-certifications" element={<ManageCertifications />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/paths" element={<CertificationPaths />} />
              <Route path="/yatri/:slug" element={<YatriProfile />} />
              <Route path="/events" element={FEATURE_FLAGS.events ? <Events /> : <ComingSoon title="Events" description="Our community events and workshop platform is launching soon. Stay tuned for upcoming meetups and certification sessions!" />} />
              <Route path="/events/:slug" element={FEATURE_FLAGS.events ? <EventDetail /> : <ComingSoon title="Events" description="Our community events and workshop platform is launching soon. Stay tuned for upcoming meetups and certification sessions!" />} />
              <Route path="/community" element={<Community />} />
              <Route path="/support" element={<Support />} />
              <Route path="/support/:ticketNumber" element={<SupportTicket />} />
              <Route path="/partners" element={<Partners />} />
              <Route path="/partners/:kind" element={<PartnerApply />} />
              <Route path="/udemy" element={<Udemy />} />
              <Route path="/yatristore" element={<YatriStore />} />
              <Route path="/examdumps" element={<ExamDumps />} />
              <Route path="/examdumps/:provider" element={<ExamDumps />} />
              <Route path="/exam-dumps" element={<Navigate to="/examdumps" replace />} />
              <Route path="/exam-dumps/:provider" element={<ExamDumps />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/training" element={FEATURE_FLAGS.trainings ? <Training /> : <ComingSoon title="Trainings" description="Comprehensive live and hands on cloud training programs are in development and will launch soon." />} />
              <Route path="/training/:slug/dashboard" element={FEATURE_FLAGS.trainings ? <StudentTrainingDashboard /> : <ComingSoon title="Trainings" description="Comprehensive live and hands on cloud training programs are in development and will launch soon." />} />
              {/* Backward-compatible fallback: resolves by slug or id so old bookmarks keep working */}
              <Route path="/training/:id" element={FEATURE_FLAGS.trainings ? <TrainingDetail /> : <ComingSoon title="Trainings" description="Comprehensive live and hands on cloud training programs are in development and will launch soon." />} />
              <Route path="/training/:certification/:courseSlug" element={FEATURE_FLAGS.trainings ? <TrainingDetail /> : <ComingSoon title="Trainings" description="Comprehensive live and hands on cloud training programs are in development and will launch soon." />} />
              <Route path="/certificate/:serial" element={<CertificateView />} />
              <Route path="/addproduct" element={<AddProduct />} />
              <Route path="/feedback" element={<Review />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/trainer" element={<BecomeTrainer />} />
              <Route path="/creator" element={<Navigate to="/trainer" replace />} />
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
              <Route path="/upcoming-event/:slug" element={FEATURE_FLAGS.events ? <UpcomingEventDetail /> : <ComingSoon title="Upcoming Events" description="Our upcoming events platform is launching soon." />} />
              <Route path="/upcoming-event/:slug/venue" element={<VenueSubmissionForm />} />
              <Route path="/upcoming-event/:slug/speakers" element={<SpeakerSubmissionForm />} />
              <Route path="/upcoming-event/:slug/sponsors" element={<SponsorSubmissionForm />} />

              {/* Event Media Upload Route */}
              <Route path="/event/:slug/media" element={<EventMediaUpload />} />

              {/* Profile Routes */}
              <Route path="/dashboard" element={FEATURE_FLAGS.myDashboard ? <YatriDashboard /> : <ComingSoon title="My Dashboard" description="Your personalized learner dashboard is currently under development. You will soon be able to track your courses, certificates, and practice exams here." />} />
              <Route path="/certificates" element={<MyCertificates />} />
              <Route path="/profile/my-events" element={FEATURE_FLAGS.events ? <MyEvents /> : <ComingSoon title="My Events" description="Event registrations and schedules will be accessible here once the events feature launches." />} />
              <Route path="/my-trainings" element={FEATURE_FLAGS.trainings ? <MyTrainings /> : <ComingSoon title="My Trainings" description="Enrolled training modules and course progress will appear here once trainings launch." />} />
              <Route path="/profile/my-resources" element={<MyResources />} />
              <Route path="/profile/purchases" element={<MyPurchases />} />
              <Route path="/receipt/:invoiceNumber" element={<ReceiptView />} />
              <Route path="/profile/guide" element={FEATURE_FLAGS.userGuide ? <GuideView type="user" /> : <ComingSoon title="User Guide" description="The official learner guide and step by step platform walkthroughs are currently being curated." />} />
              <Route path="/profile/sitemap" element={FEATURE_FLAGS.userSitemap ? <UserSitemapView /> : <ComingSoon title="User Sitemap" description="The complete visual directory and sitemap for all learner areas will be available soon." />} />

              {/* Trainer Routes */}
              <Route path="/trainer/login" element={<TrainerLogin />} />
              <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
              <Route path="/trainer/course/create" element={<TrainerCreateCourse />} />
              <Route path="/trainer/course/:courseId/edit" element={<TrainerEditCourse />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />}>
                <Route index element={<AdminOverview />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="yatris" element={<AdminYatris />} />
                <Route path="roles" element={<AdminRoleManagement />} />
                <Route path="site" element={<AdminSiteContent />} />
                <Route path="certifications" element={<AdminCertCatalog />} />
                <Route path="blog" element={<AdminBlog />} />
                <Route path="community" element={<AdminCommunity />} />
                <Route path="inquiries" element={<AdminInquiries />} />
                <Route path="resumes" element={<AdminResumes />} />
                <Route path="jobs" element={<AdminJobs />} />
                <Route path="leads" element={<AdminLeads />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="achievements" element={<AdminAchievements />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="content-reviews" element={<AdminContentReviews />} />
                <Route path="tickets" element={<AdminTickets />} />
                <Route path="newsletters" element={<AdminNewsletters />} />
                <Route path="newsletters/new" element={<AdminNewsletterCompose />} />
                <Route path="newsletters/edit/:id" element={<AdminNewsletterCompose />} />
                <Route path="subscribers" element={<AdminSubscribers />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="events/:eventId/registrations" element={<EventRegistrationsList />} />
                <Route path="attendees" element={<AdminAttendees />} />
                <Route path="udemy" element={<UdemyAdmin />} />
                <Route path="submissions" element={<AdminSubmissions />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/add" element={<AdminAddProduct />} />
                <Route path="training">
                  <Route index element={<AdminTrainingList />} />
                  <Route path="review" element={<AdminTrainingReview />} />
                  <Route path="create" element={<AdminTraining />} />
                  <Route path="edit/:id" element={<AdminEditTraining />} />
                  <Route path="reviews" element={<AdminTrainingReviews />} />
                  <Route path="attendance" element={<AdminTrainingAttendance />} />
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
                <Route path="resources" element={<AdminResources />} />
                <Route path="resources/add" element={<AdminAddResource />} />
                <Route path="resources/edit/:id" element={<AdminEditResource />} />
                <Route path="ai-settings" element={<AdminAISettings />} />
                <Route path="email/templates" element={<AdminEmailTemplates />} />
                <Route path="email/settings" element={<AdminEmailSettings />} />
                <Route path="email/logs" element={<AdminEmailLogs />} />
                <Route path="email" element={<AdminEmailTemplates />} />
                <Route path="guide" element={<GuideView type="admin" />} />
                <Route path="sitemap" element={<AdminSitemapView />} />
              </Route>


              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            <CalendlyPopup />
            <ExitIntentPopup />
            <FloatingCartGate />
            <ProfileCompletionGuard />
          </BrowserRouter>
          </ConfirmProvider>
        </CartProvider>
      </CurrencyProvider>
      </TooltipProvider>
    </QueryClientProvider>

  </ThemeProvider >
);

export default App;
