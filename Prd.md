
# 📘 FINAL PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Project: Admin-Controlled Survey Management Platform

***

## 1. PRODUCT SUMMARY

### What we are building

A **private, admin-only survey management platform** where:

-   External users **request surveys** via a contact form
    
-   Admins **design surveys internally**
    
-   Surveys are shared via **public links**
    
-   Responses are collected **without user login**
    
-   Admins analyze data and **download reports**
    
-   System supports **multiple survey categories** using the **same core engine**
    

This is a **single-client system**, not a public SaaS like SurveyMonkey.

***

## 2. PLATFORM & TECH STACK (LOCKED)

### Frontend

-   **Framework:** Next.js (React)
    
-   **Hosting:** Vercel
    
-   **Routing:** App Router or Pages Router (either is acceptable)
    
-   **Charts:** Recharts / Chart.js
    
-   **Forms (contact only):** Web3Forms
    

### Backend

-   **Platform:** Supabase
    
-   **Database:** PostgreSQL
    
-   **Auth:** Supabase Auth (Admins only)
    
-   **API:** Supabase client + optional server actions
    

### Database

-   **PostgreSQL (via Supabase)**
    
-   Row-level security (RLS)
    
-   Category-based segregation (not tenant-based)
    

***

## 3. USER ROLES

### 3.1 Super Admin

-   Can:
    
    -   Log in
        
    -   Create **Main Admins**
        
    -   Access all surveys and analytics
        
-   Only **Super Admin** can manage admin accounts
    

### 3.2 Main Admin

-   Can:
    
    -   Create surveys
        
    -   Publish surveys
        
    -   View responses
        
    -   Download reports
        
-   Cannot create or delete other admins
    

⚠️ There are **only 2 admin roles total**  
⚠️ Respondents never authenticate

***

## 4. HOMEPAGE (PUBLIC LANDING PAGE)

### UI Requirement

The **first page** must display **three primary buttons/cards**:

1.  **Industrial Survey**
    
2.  **Professional Survey**
    
3.  **Skill Assessment**
    

Each button represents a **survey request entry point**, not survey creation.

***

## 5. CONTACT / REQUEST FLOW (WEB3FORMS)

### Trigger

User clicks any of the 3 options.

### Contact Form Fields

-   Full Name
    
-   Organization Name
    
-   Contact Email
    
-   Contact Phone Number
    
-   Survey Category (auto-filled based on clicked option)
    

### Submission Behavior

-   Handled via **Web3Forms**
    
-   Email sent directly to **Admin inbox**
    
-   No data stored in PostgreSQL
    
-   Purpose: **Requirement intake only**
    

📌 This form does **NOT** create a survey automatically.

***

## 6. ADMIN AUTHENTICATION FLOW

### Login

-   URL: `/admin/login`
    
-   Supabase Auth (email + password)
    
-   No public sign-up
    
-   Admin accounts are pre-created by Super Admin
    

### Access Control

-   All `/admin/*` routes protected
    
-   Public users cannot access admin dashboard
    
-   RLS enforced on database tables
    

***

## 7. SURVEY SYSTEM (CORE ENGINE)

### Survey Categories

All surveys use the **same schema**, differentiated by:

`survey_category ENUM: - INDUSTRIAL - PROFESSIONAL - SKILL_ASSESSMENT`

No separate systems. Only category tags.

***

## 8. SURVEY CREATION (ADMIN)

### Admin Can:

-   Create new survey
    
-   Select survey category
    
-   Add questions dynamically
    
-   Choose question types:
    
    -   Short text
        
    -   Long text
        
    -   Single choice (radio)
        
    -   Multiple choice (checkbox)
        
    -   Rating / scale (1–5, 1–10)
        
-   Save as:
    
    -   Draft
        
    -   Published
        

### Editing Rules

-   Draft surveys → editable
    
-   Published surveys → editing allowed **only if no responses**
    
-   Once responses exist → read-only structure
    

***

## 9. PUBLIC SURVEY FLOW

### Access

-   Public URL: `/survey/{survey_id}`
    
-   No login
    
-   No authentication
    
-   No user accounts
    

### Submission Rules

-   One submission per session (basic control)
    
-   Timestamp stored
    
-   Linked to survey ID & category
    

***

## 10. RESPONSE STORAGE (POSTGRESQL)

### Tables (Logical Model)

#### `admins`

-   id
    
-   email
    
-   role (SUPER_ADMIN | ADMIN)
    
-   created_at
    

#### `surveys`

-   id
    
-   title
    
-   description
    
-   category
    
-   status (draft / published)
    
-   created_by
    
-   created_at
    

#### `questions`

-   id
    
-   survey_id
    
-   question_text
    
-   question_type
    
-   options (JSONB)
    
-   order_index
    

#### `responses`

-   id
    
-   survey_id
    
-   submitted_at
    

#### `answers`

-   id
    
-   response_id
    
-   question_id
    
-   answer_value (JSONB)
    

***

## 11. ANALYTICS & DASHBOARD

### Admin Dashboard Shows

-   Total surveys
    
-   Surveys by category
    
-   Total responses per survey
    
-   Question-wise breakdown
    
-   Charts:
    
    -   Bar
        
    -   Pie
        
    -   Rating distribution
        

### Filters

-   Survey
    
-   Category
    
-   Date range (optional future)
    

***

## 12. REPORT EXPORTING

### Formats

-   PDF
    
-   CSV / Excel
    

### Behavior

-   Generated on demand
    
-   Downloaded by admin
    
-   Admin manually sends reports to stakeholders
    

❌ No auto-emailing  
❌ No respondent access

***

## 13. SECURITY & NON-FUNCTIONAL REQUIREMENTS

### Security

-   Supabase Row Level Security
    
-   Admin-only mutations
    
-   Public read/write limited to survey submission only
    

### Performance

-   Optimized for read-heavy analytics
    
-   Medium traffic tolerance
    

### Scalability

-   Single-client architecture
    
-   Category-based scaling
    
-   Easy future SaaS conversion (not now)
    

***

## 14. DEPLOYMENT & INFRA

### Hosting

-   Frontend + backend on **Vercel**
    
-   Supabase handles DB, Auth, APIs
    

### Environment Variables

-   Supabase URL
    
-   Supabase Anon Key
    
-   Supabase Service Role Key (server only)
    
-   Web3Forms Access Key
    

***

## 15. REQUIRED THIRD-PARTY SERVICES

| Service | Purpose |
| --- | --- |
| Supabase | Auth + PostgreSQL |
| Vercel | Hosting |
| Web3Forms | Contact form handling |
| Chart Library | Analytics UI |

***

## 16. OUT OF SCOPE (CONFIRMED)

❌ Multi-tenant SaaS  
❌ Public survey creation  
❌ Respondent accounts  
❌ Payments  
❌ Auto emailing reports

***

## 17. SUCCESS CRITERIA

-   Admin can manage surveys without Excel hacks
    
-   Respondents fill surveys friction-free
    
-   Clean analytics & exportable reports
    
-   Zero ambiguity between survey types
