import {
    Award, Calendar, BookOpen, Plus, GraduationCap, ClipboardList, Users,
    Server, Info, LayoutDashboard, List, ExternalLink, Globe, Handshake,
    CalendarClock, Star, Inbox, Receipt, CreditCard, ShoppingBag, type LucideIcon,
} from "lucide-react";

/**
 * The admin navigation, in one place. Both the sidebar (AdminLayout) and the
 * auto generated Admin Sitemap read from this, so adding a page here shows it in
 * both without touching anything else. Descriptions are used by the sitemap.
 */

export interface AdminNavItem {
    name: string;
    path: string;
    icon: LucideIcon;
    description?: string;
}

export interface AdminNavGroup {
    id: string;
    label: string;
    icon: LucideIcon;
    items: AdminNavItem[];
}

// Note: the Dashboard / Overview landing (/admin) is rendered as a standalone
// link at the top of the sidebar, so it is intentionally NOT a group here.
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
    {
        id: "site-content",
        label: "Site Content",
        icon: Globe,
        items: [
            { name: "Site & Homepage", path: "/admin/site", icon: Globe, description: "Edit homepage sections, stats and site wide copy." },
            { name: "Certifications", path: "/admin/certifications", icon: Award, description: "Manage the certification catalog and exam details." },
        ],
    },
    {
        id: "events",
        label: "Events",
        icon: Calendar,
        items: [
            { name: "All Events", path: "/admin/events", icon: Calendar, description: "Create and manage community events." },
            { name: "Attendees", path: "/admin/attendees", icon: Users, description: "See who registered and mark attendance." },
            { name: "Submissions", path: "/admin/submissions", icon: ClipboardList, description: "Review event related submissions." },
        ],
    },
    {
        id: "training",
        label: "Training",
        icon: GraduationCap,
        items: [
            { name: "Course list", path: "/admin/training", icon: ClipboardList, description: "All training courses at a glance." },
            { name: "Create Course", path: "/admin/training/create", icon: BookOpen, description: "Add a new training course." },
            { name: "Enrollments", path: "/admin/enrollments", icon: Users, description: "See who enrolled and their payment status." },
            { name: "Reviews", path: "/admin/training/reviews", icon: Star, description: "Moderate learner reviews for trainings." },
            { name: "Providers", path: "/admin/providers", icon: Server, description: "Manage training providers." },
            { name: "Trainers Hub", path: "/admin/trainers", icon: Users, description: "Manage trainers and their access." },
        ],
    },
    {
        id: "mentorship",
        label: "Mentorship",
        icon: Handshake,
        items: [
            { name: "Overview", path: "/admin/mentorship/overview", icon: LayoutDashboard, description: "Mentorship activity at a glance." },
            { name: "Applications", path: "/admin/mentorship/applications", icon: Inbox, description: "Review people applying to mentor." },
            { name: "Mentors", path: "/admin/mentorship/mentors", icon: Users, description: "Manage active mentors." },
            { name: "Services", path: "/admin/mentorship/services", icon: ClipboardList, description: "Manage mentorship services and pricing." },
            { name: "Bookings", path: "/admin/mentorship/bookings", icon: CalendarClock, description: "See and manage mentorship bookings." },
            { name: "Reviews", path: "/admin/mentorship/reviews", icon: Star, description: "Moderate mentor reviews." },
        ],
    },
    {
        id: "payments",
        label: "Payments",
        icon: CreditCard,
        items: [
            { name: "Revenue", path: "/admin/payments", icon: Receipt, description: "Every receipt and revenue in one place." },
            { name: "Invoices", path: "/admin/razorpay-invoices", icon: ExternalLink, description: "Raise Razorpay invoices and view dashboard ones." },
            { name: "Transactions", path: "/admin/transactions", icon: CreditCard, description: "All payments, with refunds." },
        ],
    },
    {
        id: "catalog",
        label: "Store & Catalog",
        icon: ShoppingBag,
        items: [
            { name: "Store products", path: "/admin/products/add", icon: Plus, description: "Add a product to the store." },
            { name: "Exam dumps", path: "/admin/exam-dumps", icon: List, description: "Manage exam dump listings." },
            { name: "Udemy courses", path: "/admin/udemy", icon: GraduationCap, description: "Manage Udemy course listings." },
        ],
    },
    {
        id: "help",
        label: "Help",
        icon: Info,
        items: [
            { name: "Admin guide", path: "/admin/guide", icon: Info, description: "How to run the platform, step by step." },
            { name: "Sitemap", path: "/admin/sitemap", icon: List, description: "A map of every admin area." },
        ],
    },
];
