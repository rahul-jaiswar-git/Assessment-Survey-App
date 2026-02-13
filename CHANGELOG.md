# Assessment Survey App — Update History

## Overview
- Tracks fixes and improvements applied across Admin, Public, and Supabase layers.
- Use this to brief teammates when moving between IDEs/tools.

## Authentication & Admin
- Fixed login redirect loop by verifying admin membership via service role lookup.
- Added protected admin layout with role check and sign-out redirect on failure.
- Reduced admin sidebar width for better content focus.

## Surveys Management
- Implemented dynamic rendering for admin lists and dashboard to avoid stale data.
- Added publish/unpublish toggle with server revalidation of admin routes.
- Replaced 3-dots dropdown with inline action buttons to avoid off-screen/scroll issues.
- Added client-side SurveyActions for responsive feedback (“Updating…”) and UI refresh.
- Always show “Open Link”; no hover required.

## Public Survey Page
- Route: /survey/[id]
- Fetch survey and questions separately to avoid failing joins under RLS.
- Disabled caching (force-dynamic) for fresh content.
- Removed status filter to allow viewing any survey status.
- Added graceful fallback UI instead of framework 404 when survey not found/inaccessible.
- Implemented server-side service role fallback fetch when anon read returns no data.

## Forms & UI Consistency
- Set black text (text-gray-900), readable placeholders, and white backgrounds for:
  - Admin login inputs
  - Request form inputs
  - Public survey inputs/textarea
  - Analytics survey select
  - New survey title/description/category/question text/option inputs
- Improved focus rings and borders for accessibility.

## Analytics
- Built analytics view with charts and CSV export.
- Ensured inputs use consistent black text styling.

## Supabase & RLS
- Base schema includes RLS restricting public reads to published surveys by default.
- Provided SQL options to:
  - Allow public reads to surveys/questions for all statuses, or
  - Allow PUBLISHED + DRAFT only.
- Admin mutations restricted to authenticated users; public can submit responses/answers.

## Known/Observed Issues & Resolutions
- Public link 404:
  - Root causes: status filtering in code, RLS blocking access, or invalid survey ID.
  - Resolutions: removed status filter in page code; provided RLS SQL; added fallback UI; added service role fallback for reliability.
  - Persistent cases found to be environment mismatch on Vercel (URL/key not pointing to the same project). Verification steps:
    - Confirm Vercel envs match local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
    - Test REST: GET /rest/v1/surveys?id=eq.<survey_id> with anon key headers; expect one row
    - If REST returns, app should render; otherwise fix envs and redeploy
- Action menu scrolling:
  - Resolution: inline buttons + client actions component.
- Stale dashboard/surveys after toggles:
  - Resolution: dynamic rendering and path revalidation on toggle route.

## Files Touched (Key)
- src/lib/supabase/server.ts
- src/app/admin/(dashboard)/layout.tsx
- src/app/admin/(dashboard)/dashboard/page.tsx
- src/app/admin/(dashboard)/surveys/page.tsx
- src/app/admin/surveys/toggle/route.ts
- src/app/survey/[id]/page.tsx
- src/components/SurveyActions.tsx
- src/components/SurveyForm.tsx
- src/components/AnalyticsView.tsx
- src/app/admin/login/page.tsx
- src/app/request/page.tsx
- src/app/admin/(dashboard)/surveys/new/page.tsx

## Deployment Notes
- Verify Vercel envs:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY (server-side only)
- After RLS updates, redeploy to ensure policies are applied to new sessions.
