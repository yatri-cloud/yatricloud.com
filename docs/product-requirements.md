# Product Requirements — Redesign Scope by Surface

> Functional requirements are **unchanged**. This lists every surface and its *visual* redesign scope. Behavior, routes, and data flow stay exactly as they are.

## Global / shared shell
| Element | Redesign scope |
|---|---|
| `Navbar.tsx` | Glass-on-scroll, active-route indicator, refined auth menu, better mobile sheet, theme toggle polish |
| `Footer.tsx` (sections/) | Expanded brand presence, link columns, social, deep band |
| `ThemeToggle.tsx` | Smooth icon transition, accessible label |
| shadcn `ui/*` (49) | Re-theme globally via tokens — buttons, cards, inputs, dialogs, tables, tabs, toasts, etc. |
| Global states | Consistent empty / loading (skeleton) / error patterns |

## Marketing pages
| Page | Sections / scope |
|---|---|
| `Index.tsx` | Hero, CertificationFlow, VoucherPromo, Curriculum, LatestExamDumps, Trust, HomeReviews, Instructor, FAQ, Community — apply band rhythm (DESIGN §5b) |
| `Events.tsx`, `EventDetail.tsx`, `UpcomingEventDetail.tsx` | Event cards, hero, registration CTA, media |
| `YatriStore.tsx`, `AddProduct.tsx` | Product grid, cart UI, voucher promo, seller form |
| `Udemy.tsx` | Course integration cards |
| `CertifiedYatris.tsx`, `Reviews.tsx`, `Review.tsx` | Showcase grids, testimonial cards, review forms |

## Learning surfaces (base-band, quiet, focused)
| Page | Scope |
|---|---|
| `Training.tsx`, `TrainingDetail.tsx` | Course listing + detail/enroll |
| `StudentTrainingDashboard.tsx`, `MyTrainings.tsx` | Progress dashboards, achievement/motivation cues |
| `ExamDumps.tsx` | Question repository, filters, readable long-form |
| `GuideView.tsx` | Docs reading view (user + admin) |
| `Achievements.tsx`, `ManageCertifications.tsx` | Badges, cert portfolio |

## Account & forms
| Page | Scope |
|---|---|
| `EditProfile.tsx`, `RequestVoucher.tsx` | Form redesign — visible labels, inline validation styling, helper text |
| `LoginModal`, `RegistrationModal`, `EnrollmentModal` | Modal polish, scrim, motion from trigger |
| Event forms: `CreateEvent`, `EventFeedback`, `EventMediaUpload`, `Venue/Speaker/Sponsor Submission` | Multi-step progress, grouped fields, autosave affordance (visual only) |
| Legal: `PrivacyPolicy`, `TermsOfService`, `NotFound` | Typographic reading layout / friendly 404 |

## Trainer portal (base-band, tool-like)
`trainer/TrainerLogin`, `TrainerDashboard`, `TrainerCreateCourse`, `TrainerCourseEditor` — dense, quiet, task-first; editor ergonomics.

## Admin dashboard (base-band, data-dense)
`admin/AdminDashboard` + nested (`AdminEvents`, `AdminTraining`, `AdminTrainers`, `AdminExamDumps`, …), `AdminLayout`, `StatsCard` — sidebar layout, stat cards, tables with sort/pagination styling, charts (accessible colors, legends, tooltips).

## Cross-cutting requirements (from UI/UX Pro Max)
- Accessibility AA in both themes; visible focus; keyboard nav; alt text; aria labels on icon buttons.
- Touch: 44×44px targets, 8px spacing, press feedback ≤150ms.
- Performance: lazy-load below-fold, reserve image dimensions (CLS < 0.1), skeletons > spinners.
- Navigation: active-state highlight, predictable back, ≤5 primary nav items, adaptive sidebar ≥1024px.
