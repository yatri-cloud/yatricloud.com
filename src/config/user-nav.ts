import {
    Home, BookOpen, Calendar, FileText, GraduationCap, ShoppingBag, Handshake,
    Users, Award, Building2, Star, UserCog, CalendarCheck, Receipt, BadgeCheck,
    Info, Map, Shield, ScrollText, Mail, Truck, BookMarked, type LucideIcon,
} from "lucide-react";

/**
 * The learner-facing site map, in one place. The User Sitemap page is generated
 * from this, so it always reflects the same set of pages. Every path here is a
 * real route in App.tsx. Grouped for scanning, not for navigation chrome.
 */

export interface UserNavItem {
    name: string;
    path: string;
    icon: LucideIcon;
    description?: string;
}

export interface UserNavGroup {
    id: string;
    label: string;
    icon: LucideIcon;
    items: UserNavItem[];
}

export const USER_NAV_GROUPS: UserNavGroup[] = [
    {
        id: "explore",
        label: "Explore",
        icon: Home,
        items: [
            { name: "Home", path: "/", icon: Home, description: "The Yatri Cloud homepage." },
            { name: "Training", path: "/training", icon: BookOpen, description: "Live and self paced training programs." },
            { name: "Events", path: "/events", icon: Calendar, description: "Community events and workshops." },
            { name: "Resources", path: "/resources", icon: BookMarked, description: "Free and premium study materials, practice tests, and guides." },
            { name: "Exam Dumps", path: "/examdumps", icon: FileText, description: "Practice questions to prepare for exams." },
            { name: "Udemy Courses", path: "/udemy", icon: GraduationCap, description: "Curated Udemy courses for cloud skills." },
            { name: "Store", path: "/yatristore", icon: ShoppingBag, description: "Vouchers, guides and more." },
        ],
    },
    {
        id: "mentorship",
        label: "Mentorship",
        icon: Handshake,
        items: [
            { name: "Find a mentor", path: "/mentorship", icon: Handshake, description: "Book a session with a mentor." },
        ],
    },
    {
        id: "community",
        label: "Community",
        icon: Users,
        items: [
            { name: "Community", path: "/community", icon: Users, description: "Join the Yatri Cloud community." },
            { name: "Certified Yatris", path: "/certifiedyatris", icon: BadgeCheck, description: "Meet learners who earned their certifications." },
            { name: "Achievements", path: "/achievements", icon: Award, description: "Milestones and wins across the community." },
            { name: "Partners", path: "/partners", icon: Building2, description: "Our partners and collaborators." },
            { name: "Reviews", path: "/reviews", icon: Star, description: "What learners say about Yatri Cloud." },
        ],
    },
    {
        id: "account",
        label: "Your account",
        icon: UserCog,
        items: [
            { name: "Edit Profile", path: "/edit-profile", icon: UserCog, description: "Update your details and preferences." },
            { name: "My Events", path: "/profile/my-events", icon: CalendarCheck, description: "Events you registered for." },
            { name: "My Trainings", path: "/my-trainings", icon: BookOpen, description: "Courses you are enrolled in." },
            { name: "My Resources", path: "/profile/my-resources", icon: BookMarked, description: "Study materials and resources you have unlocked." },
            { name: "My Receipts", path: "/profile/purchases", icon: Receipt, description: "View and download your receipts." },
            { name: "Manage Certifications", path: "/manage-certifications", icon: Award, description: "Add and manage your certifications." },
            { name: "User Guide", path: "/profile/guide", icon: Info, description: "How to get the most from Yatri Cloud." },
            { name: "User Sitemap", path: "/profile/sitemap", icon: Map, description: "This page: a map of every learner area." },
        ],
    },
    {
        id: "legal",
        label: "Legal",
        icon: ScrollText,
        items: [
            { name: "Privacy Policy", path: "/privacy-policy", icon: Shield, description: "How we handle your data." },
            { name: "Terms and Conditions", path: "/terms-and-conditions", icon: ScrollText, description: "The terms of using Yatri Cloud." },
            { name: "Cancellation and Refund", path: "/cancellation-and-refund", icon: Receipt, description: "Refunds, cancellations, and support terms." },
            { name: "Shipping and Exchange", path: "/shipping-and-exchange", icon: Truck, description: "Delivery, shipping, and exchange details." },
            { name: "Contact Us", path: "/contact-us", icon: Mail, description: "Reach us for support or partnership questions." },
        ],
    },
];
