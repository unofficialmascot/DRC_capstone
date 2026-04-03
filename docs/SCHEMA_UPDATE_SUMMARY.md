# Schema Normalization - Complete Update Summary

## Overview
This document summarizes the schema normalization completed on February 6, 2026, which restructures the database to properly handle Users, Scholars, and Employees with consistent ID management.

## Key Changes

### 1. **Users Table** (No Changes)
- **Primary Key**: `id` (serial/integer)
- **Purpose**: Core user authentication and basic identity information
- **Fields**: username, password, role, name, email, phone, avatarUrl, timestamps

### 2. **New Employees Table** ✅
- **Primary Key**: `employee_id` (text)
- **Foreign Key**: `user_id` → users.id (one-to-one)
- **Purpose**: Stores employee-specific data for supervisors, DRC, IRC, DoAA members
- **Fields**: 
  - employeeId (text, PK)
  - userId (integer, unique FK)
  - designation (Professor, Associate Professor, etc.)
  - department
  - created_at, updated_at

### 3. **Scholars Table** (Restructured)
- **Primary Key**: Changed from `id` (serial) → `scholar_id` (text)
- **Foreign Key**: `user_id` → users.id (one-to-one)
- **Supervisor Fields** (NEW):
  - `supervisor_id` → employees.employee_id (optional, can be null)
  - `co_supervisor_id` → employees.employee_id (optional, can be null)
- **Rationale**: Eliminates redundant ID field, uses meaningful identifier as PK
- **Other Fields Unchanged**: batch, status, department, research fields, personal details, education info

### 4. **RAC Members Table** (Restructured)
- **Before**: 
  - scholarId was integer
  - userId was integer (reference to users)
- **After**:
  - scholarId is now text (reference to scholars.scholar_id)
  - userId removed, replaced with employeeId (text reference to employees.employee_id)
  - memberRole: 'drc', 'irc', 'doaa'
- **Unique Constraint**: (scholar_id, employee_id) to prevent duplicate assignments

### 5. **Applications Table** (Type Changes)
- **scholarId**: Changed from integer → text (foreign key to scholars.scholar_id)
- **All other fields unchanged**: type, status, currentStage, submissionDate, details, finalOutcome
- **Cascade Delete**: Added ON DELETE CASCADE for referential integrity

### 6. **Application Reviews Table** (Type Changes)
- **reviewer_id**: Changed from integer → text (foreign key to employees.employee_id)
- **Other fields unchanged**: applicationId, stage, decision, remarks, reviewDate
- **Cascade Delete**: Added ON DELETE CASCADE

### 7. **Research Progress Table** (Type Changes)
- **scholar_id**: Changed from integer → text (foreign key to scholars.scholar_id)
- **Other fields unchanged**: completedReviews, pendingReports, publications, lastReviewDate
- **Unique Constraint**: (scholar_id) to ensure one progress record per scholar
- **Cascade Delete**: Added ON DELETE CASCADE

### 8. **Removed Table**
- **scholar_supervisors**: Removed - supervisor relationships now stored directly in scholars table via supervisor_id and co_supervisor_id fields

## Relationship Diagram

```
users (id: serial)
  ├─→ employees (user_id FK)
  │    └─→ rac_members (employee_id FK)
  │    └─→ application_reviews (reviewer_id FK)
  │    └─→ scholars (supervisor_id FK, co_supervisor_id FK)
  │
  └─→ scholars (user_id FK, scholar_id: text PK)
       ├─→ applications (scholar_id FK)
       │    └─→ application_reviews (application_id FK)
       └─→ research_progress (scholar_id FK)
       └─→ rac_members (scholar_id FK)
```

## Database Constraints

### Primary Keys
- users: id
- employees: employee_id (text)
- scholars: scholar_id (text)
- applications: id
- application_reviews: id
- research_progress: id
- rac_members: id
- notices: id

### Foreign Keys
All foreign keys now use ON DELETE CASCADE for data integrity

### Unique Constraints
- employees.user_id (one employee per user)
- scholars.user_id (one scholar per user)
- research_progress.scholar_id (one progress record per scholar)
- rac_members(scholar_id, employee_id) (no duplicate RAC assignments)

## Code Updates

### Backend Changes

#### `server/storage.ts`
- ✅ Updated IStorage interface to accept string scholarId and employeeId
- ✅ Added new methods: `getEmployee()`, `createEmployee()`
- ✅ Removed: `createScholarSupervisor()` (now handled via scholars table directly)
- ✅ Updated method signatures:
  - `getApplications(scholarId?: string)` 
  - `getApplicationsForSupervisor(employeeId: string)`
  - `isSupervisorForScholar(employeeId: string, scholarId: string)`
  - `getResearchProgress(scholarId: string)`

#### `server/routes.ts`
- ✅ Updated seed data to create Employee records alongside User records
- ✅ Updated application query to use string scholarId
- ✅ Updated reviewer schema to accept string reviewerId
- ✅ Updated applyApprovedChanges() function signature

#### `shared/routes.ts`
- ✅ Updated applications.list.input to expect string scholarId
- ✅ Updated applications.review.input to expect string reviewerId

### Frontend Changes

#### `client/src/pages/Home.tsx`
- ✅ Updated Application interface: `scholarId: string` (was number)
- ✅ Updated ApplicationReview interface: `reviewerId: string` (was number)
- ✅ Updated ScholarApplications() to use `user.scholarId` instead of `user.id`

#### `client/src/hooks/use-applications.ts`
- ✅ Updated useApplications() to accept `scholarId?: string` (was number)

#### `shared/schema.ts`
- ✅ Added employees table export
- ✅ Restructured scholars table with text primary key
- ✅ Updated all dependent tables to use string foreign keys

## Migration File

**File**: `migrations/0003_normalize_ids.sql`

The migration:
1. Creates employees table
2. Backs up existing scholars data
3. Drops dependent tables to avoid FK constraint issues
4. Recreates scholars table with scholar_id as primary key
5. Recreates all dependent tables with new foreign key relationships
6. Adds CASCADE DELETE constraints

**Important**: This migration is destructive and requires careful planning for production deployment.

## Testing Considerations

### Seed Data
The application now seeds with:
- Scholar records using scholar_id: "GITAM-SCH-2020-118", "GITAM-SCH-2021-204"
- Employee records using employee_id: "EMP-SUPERVISOR-001", "EMP-DRC-001", etc.

### API Endpoints
When testing:
- Use `scholar_id` values when querying applications
- Use `employee_id` values when submitting reviews
- Ensure supervisors are created as employees before assigning to scholars

## Backward Compatibility

⚠️ **BREAKING CHANGES**
- Any code expecting numeric scholarId now needs to handle strings
- Any code checking supervisor relationships must access scholars.supervisor_id directly
- The old scholar_supervisors table no longer exists

## Benefits of This Schema

✅ **Cleaner IDs**: Uses domain-specific identifiers (GITAM-SCH-*, EMP-*)
✅ **Better Semantics**: scholar_id in applications directly references the scholar
✅ **Improved Relationships**: Supervisor relationships are first-class in scholars table
✅ **Data Integrity**: CASCADE deletes prevent orphaned records
✅ **Single Responsibility**: Each entity table has clear purpose

## Migration Steps for Production

1. Backup production database
2. Set maintenance mode (if applicable)
3. Run migration 0003_normalize_ids.sql
4. Verify data integrity (check row counts, sample records)
5. Deploy updated code
6. Test all application workflows
7. Resume normal operations

## Status

✅ Schema updated (shared/schema.ts)
✅ Migration created (migrations/0003_normalize_ids.sql)
✅ Backend storage layer updated (server/storage.ts)
✅ Backend routes updated (server/routes.ts)
✅ Frontend types updated (client/src/pages/Home.tsx)
✅ Frontend hooks updated (client/src/hooks/use-applications.ts)
✅ Build: PASSING (no errors)
✅ TypeScript: NO ERRORS
