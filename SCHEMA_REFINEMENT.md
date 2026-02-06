# Refined Database Schema Design

## Current Issues & Solutions

### 1. TABLE REDUNDANCY
**Problem:** `rac_members` and `scholar_rac_members` serve the same purpose
**Solution:** Keep only `scholar_rac_members` as primary RAC tracking table
- Drop obsolete `rac_members` table
- All RAC member assignments go through `scholar_rac_members`

### 2. DENORMALIZATION IN SCHOLARS TABLE
**Problem:** `scholars` table mixes core profile with detail fields that belong elsewhere
**Current Fields to Move:**
- Personal info (father_name, parent_mobile, aadhaar, nationality, address) → `scholar_personal_details`
- Education history (tenth_board, tenth_percentage, inter_board, inter_percentage) → `academic_background` (new table)
- Supervisor references (supervisor_id, co_supervisor_id) → Already in `scholar_supervisors`, should remove from scholars

**Refined Scholars Table:**
```sql
scholars:
  - id (PK)
  - user_id (FK → users) - UNIQUE
  - scholar_id (VARCHAR, UNIQUE)
  - batch
  - status
  - department
  - research_area
  - research_title
  - joining_date
  - phase
  - programme
  - location
  - timestamps
```

### 3. MISSING TABLE: ACADEMIC BACKGROUND
**New Table:** `scholar_education_background`
```sql
scholar_education_background:
  - id (PK)
  - scholar_id (FK)
  - education_level (10th/12th/UG/PG)
  - board_or_university
  - percentage_or_cgpa
  - year_of_completion
  - created_at
```

### 4. FRAGMENTED REVIEW TABLES
**Problem:** `review_cycles`, `review_status`, `review_outcome` are split unnaturally
**Solution:** Consolidate into single `scholar_reviews` table with all review state
```sql
scholar_reviews:
  - review_id (PK)
  - scholar_id (FK)
  - review_month
  - review_year
  - review_type (PERIODIC, SPECIAL, etc)
  - current_stage
  - current_status (IN_PROGRESS, COMPLETED, REJECTED)
  - final_result
  - submitted_date
  - completed_date
  - created_at
```

### 5. APPLICATIONS NEED CLEARER RELATIONSHIPS
**Add Missing Relationship:**
```sql
applications:
  - [existing fields]
  - scholar_id needs to be NOT NULL (currently stores as text)
  - Add CONSTRAINT FK to scholars(id)
```

### 6. FEE MANAGEMENT ORGANIZATION
**Link fee_demand to fee_structure:**
- `scholar_fee_demand.fee_id` → FK to `fee_structure(fee_id)`
- Makes it clear what fee structure applies to each demand

## APPROVED SCHEMA REFINEMENT PROPOSAL

### Tables to CREATE:
- `scholar_education_background` - Education history (10th-12th)

### Tables to MODIFY:
1. **scholars** - Remove denormalized fields
2. **scholar_rac_members** - Rename to `researcher_advisory_committee` (clearer)
3. **scholar_reviews** - Replace fragmented review tables
4. **applications** - Make scholar_id NOT NULL with proper FK
5. **scholar_fee_demand** - Add fee_id FK reference

### Tables to DROP:
- `rac_members` (redundant with scholar_rac_members)
- `review_status` (merge into scholar_reviews)
- `review_outcome` (merge into scholar_reviews)
- `review_cycles` (merge into scholar_reviews)

## RECOMMENDATION
Apply in phases:
1. **Phase 1:** Drop redundant tables, normalize scholars table
2. **Phase 2:** Create academic_background table, combine review tables
3. **Phase 3:** Add/fix foreign key constraints

Would you like me to:
A) Generate migration SQL scripts for these changes?
B) Update the Drizzle schema definitions (shared/schema.ts)?
C) Both?
