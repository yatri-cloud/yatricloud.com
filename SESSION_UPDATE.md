# SESSION UPDATES & CODEBASE STATE

**Last Updated**: 2026-08-20 (Current Release)  
**Primary Focus**: Auth, Login/Signup Modal, Step-by-step Onboarding, Profile Completion Guard, and Navbar UX.

---

## 1. Important Rules & Guidelines for Next Session
1. **Repository Scope**: Only modify `yatri-practice-hub`. **NEVER** modify `gift.yatricloud.com`.
2. **Button & Input UI Rules**:
   - **Solid Vibrant Blue Theme**: Selected states on buttons, badges, tags, and active triggers must be **solid brand blue** (`bg-primary text-primary-foreground`), **NOT** pale/light washed-out blue (`bg-primary/10`).
   - **Checkbox Icons**: Use square checkboxes with clean white checkmark icons (`<Check className="w-3 h-3 stroke-[3]" />`), NOT circular/radio-style icons.
   - **Minimal Question Form**: Keep only the main question in onboarding steps; do NOT add redundant descriptive subtitles under the inputs.
   - **LinkedIn URL**: Strictly **Optional** in `isProfileComplete(user)` and onboarding questions so missing LinkedIn does not block platform access.
   - **Interested Certifications**: **Mandatory** field (must select or enter at least one certification provider or exam).
   - **Certifications Grid**: Directly show all 15 popular providers in `POPULAR_PROVIDERS` without any expand/collapse button.
3. **Modal Dimensions & Viewport Constraints**:
   - Modal width: `max-w-[390px] sm:max-w-[420px]` (standard desktop width).
   - Total modal height must stay compact (~240px) so that **Email, Password, Forgot Password, Login Button, Google Sign-in, Footer Note, and Sign Up toggle** are 100% visible on 100% browser desktop zoom without being cut off by the browser window.

---

## 2. Components & Architecture Implemented
1. **`src/components/ProfileCompletionGuard.tsx`**:
   - Global auth guard mounted inside `BrowserRouter` in `App.tsx`.
   - Listens to Supabase live session state on page load and auth changes.
   - If an account (from existing 200+ users or new signups) is missing **Country, State, City, or Phone Number**, the onboarding popup opens immediately and blocks access until completed.
   - Non-dismissible (prevent outside click & escape key). Allows logging out cleanly.

2. **`src/lib/yatris-api.ts`**:
   - `isProfileComplete(user)`: Validates required fields (`country`, `stateProvince`, `city`, `phoneNumber`). `linkedinUrl` is optional.
   - `loginUser`: Synchronously awaits and returns the full profile from Supabase so `isProfileComplete` has accurate data.

3. **`src/pages/EditProfile.tsx`**:
   - **Google Sign-In Detection**: If the user signed in with Google, the "Change Password" and "Change Email" sections are completely hidden and replaced with a "Signed in via Google" indicator.
   - **Email Login Users**: "Change Password" is functional with current password verification.
   - **Field Validation**: LinkedIn Profile URL is strictly **Optional**; Full Name, Country, State/Province, City, Phone Number, and Interested Certifications are **Mandatory**.
   - **Danger Zone / Delete Account**: Includes a double-confirmation modal with full impact instructions, `DELETE` text typing verification, and an acknowledgment checkbox before permanently deleting user records and logging out. Kept clean and text-focused without icons.
   - **UI Rule**: No decorative icons next to text in cards, buttons, or headers.

4. **`src/components/certified-yatris/LoginSignup.tsx` & `src/components/LoginModal.tsx`**:
   - **Top-Right Close Cross (`✕`) Button**: Added close button to dismiss the modal cleanly when onboarding is not forced.
   - **Tab-Switch Auto-Refresh Fix**:
     - Disabled `auto_select: false` and removed Google One Tap `prompt()` which previously auto-triggered authentication callbacks when switching browser tabs.
     - Preserved user input (`prev => ({ ...prev, ... })`) and used `initializedUserRef` to prevent overwriting entered data when background auth events fire.
     - Configured `QueryClient` with `refetchOnWindowFocus: false` to avoid unexpected background refreshes on tab focus.
   - **Modal Proportions**: Tuned vertical padding (`px-5 py-4 sm:px-7 sm:py-5`) and input sizing so that 100% desktop zoom displays the full modal without any bottom clipping.
   - Step 2: Step-by-step onboarding survey questions.
   - Supports `initialUser` and `forceOnboarding` props.

5. **`src/components/certified-yatris/InterestedCertificationsPicker.tsx`**:
   - All 15 providers rendered directly in a responsive grid.
   - Solid blue selection with square checkbox + checkmark icon.

6. **`src/pages/admin/AdminYatris.tsx`**:
   - **Full Profile Data Fetching**: Fetches all profile fields (`id, full_name, email, role, photo_url, country, state_province, city, country_code, phone_number, linkedin_url, interested_certifications, created_at`).
   - **Clickable LinkedIn Profile**: Direct clickable LinkedIn icon (`<Linkedin />`) with target `_blank` for users with a profile link.
   - **Configurable Rows Per Page**: Added dropdown selector (`10`, `15`, `25`, `50`, `100`, `250`, `All / 1000`) so admins can view all users on one page without navigating pages.
   - **Extended Timeline Filters**: Lifetime, Today (24h), Last 7 Days, Last 30 Days, Last 90 Days (Quarter), Past Year (12 Months), and This Year.
   - **Separate User Moderation Tab**: Dedicated "User Moderation & Access Control" section on the left to search, view details, toggle Enable/Disable, or permanently delete users with double confirmation (preventing accidental deletions from the main directory table).

---

## 3. Next Tasks (Incoming)
- **Button UI and Form UI Redesign / Enhancements** (Ready for next prompt instructions).
