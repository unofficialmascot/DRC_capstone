# Database Schema Normalization Guide

## Overview
The database schema has been refactored to follow database normalization principles (3NF) and best practices for secure data storage. Scholar-specific data is now properly separated from user authentication data.

## Key Changes

### 1. **Normalized users Table**
The `users` table now contains **ONLY** essential authentication and identification fields:

```typescript
users {
  id: SERIAL PRIMARY KEY
  username: TEXT UNIQUE
  password: TEXT (HASHED with bcryptjs)
  role: TEXT ('scholar', 'supervisor', 'drc', 'irc', 'doaa', 'admin')
  name: TEXT
  email: TEXT UNIQUE
  phone: TEXT
  avatarUrl: TEXT
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

**What's removed:**
- ❌ scholarId, batch, status, department (moved to `scholars` table)
- ❌ supervisor, coSupervisor (moved to `scholar_supervisors` table)
- ❌ researchArea, researchTitle, joiningDate, phase, programme (moved to `scholars`)
- ❌ fatherName, parentMobile, aadhaar, nationality, address (moved to `scholars`)
- ❌ tenthBoard, tenthPercentage, interBoard, interPercentage (moved to `scholars`)

### 2. **New scholars Table**
Contains all scholar-specific profile and educational data:

```typescript
scholars {
  id: SERIAL PRIMARY KEY
  userId: INTEGER UNIQUE (FK → users.id)
  scholarId: TEXT UNIQUE
  batch: TEXT
  status: TEXT
  department: TEXT
  researchArea: TEXT
  researchTitle: TEXT
  joiningDate: TEXT
  phase: TEXT (Phase-I, Phase-II, Phase-III)
  programme: TEXT (Full Time, Part Time)
  location: TEXT
  
  // Personal Details
  fatherName: TEXT
  parentMobile: TEXT
  aadhaar: TEXT
  nationality: TEXT
  address: TEXT
  
  // Education
  tenthBoard: TEXT
  tenthPercentage: TEXT
  interBoard: TEXT
  interPercentage: TEXT
  
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

### 3. **New scholar_supervisors Table**
Manages supervisor-scholar relationships:

```typescript
scholar_supervisors {
  id: SERIAL PRIMARY KEY
  scholarId: INTEGER (FK → scholars.id)
  supervisorId: INTEGER (FK → users.id)
  isPrimary: BOOLEAN
  assignedOn: TIMESTAMP
}
```

### 4. **New rac_members Table**
Manages DRC, IRC, and DoAA member assignments to scholars:

```typescript
rac_members {
  id: SERIAL PRIMARY KEY
  scholarId: INTEGER (FK → scholars.id)
  userId: INTEGER (FK → users.id)
  memberRole: TEXT ('drc', 'irc', 'doaa')
  assignedOn: TIMESTAMP
}
```

## Password Security

### Before
- Passwords stored in plain text with default value `"password123"`
- **SECURITY RISK:** ⚠️ All passwords visible in database

### After
- Passwords **HASHED** using `bcryptjs` (10-round salt)
- Passwords verified using `bcrypt.compare()` during login
- Plain text passwords never stored
- **SECURE:** ✅ Only hashed passwords in database

### Implementation
```typescript
// Creating user
const hashedPassword = await bcrypt.hash(password, 10);
await db.insert(users).values({ ...userData, password: hashedPassword });

// Verifying login
const passwordValid = await bcrypt.compare(plainPassword, hashedPassword);
```

## Relationship Diagram

```
┌─────────────┐
│    users    │
├─────────────┤
│ id (PK)     │
│ username    │
│ password    │ ← HASHED
│ role        │
│ name        │
│ email       │
│ phone       │
│ avatarUrl   │
└────┬────────┘
     │
     ├── 1:1 ──→ ┌──────────────┐
     │           │  scholars    │
     │           ├──────────────┤
     │           │ id (PK)      │
     │           │ userId (FK)  │─┐
     │           │ scholarId    │ │
     │           │ batch        │ │
     │           │ ... fields   │ │
     │           └──────────────┘ │
     │                            │
     │  ◄──────────────────────────┘
     │
     ├── 1:Many ──→ ┌──────────────────────┐
     │              │ scholar_supervisors  │
     │              ├──────────────────────┤
     │              │ id (PK)              │
     │              │ scholarId (FK)       │
     │              │ supervisorId (FK)──┐ │
     │              │ isPrimary          │ │
     │              └────────────┬────────┘ │
     │                           │          │
     │  ◄────────────────────────┘──────────┘
     │
     └── 1:Many ──→ ┌──────────────────┐
                    │  rac_members     │
                    ├──────────────────┤
                    │ id (PK)          │
                    │ scholarId (FK)───┼→ scholars
                    │ userId (FK)──────┼→ users
                    │ memberRole       │
                    └──────────────────┘
```

## Data Separation by Role

| Role | Users Table | Scholars Table | Notes |
|------|------------|---|---|
| Scholar | ✅ Username, Email, Password | ✅ Full profile | One user → One scholar (1:1) |
| Supervisor | ✅ Name, Email, Phone | ❌ No scholar data | Can supervise multiple scholars via `scholar_supervisors` |
| DRC Member | ✅ Name, Email, Phone | ❌ No scholar data | Assigned via `rac_members` |
| IRC Member | ✅ Name, Email, Phone | ❌ No scholar data | Assigned via `rac_members` |
| DoAA Officer | ✅ Name, Email, Phone | ❌ No scholar data | Assigned via `rac_members` |
| Admin | ✅ Name, Email, Password | ❌ No scholar data | System administrator |

## Database Indexes for Performance

```sql
-- Users indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Scholars indexes
CREATE INDEX idx_scholars_user_id ON scholars(user_id);
CREATE INDEX idx_scholars_scholar_id ON scholars(scholar_id);

-- Supervisor indexes
CREATE INDEX idx_scholar_supervisors_scholar_id ON scholar_supervisors(scholar_id);
CREATE INDEX idx_scholar_supervisors_supervisor_id ON scholar_supervisors(supervisor_id);

-- RAC members indexes
CREATE INDEX idx_rac_members_scholar_id ON rac_members(scholar_id);
CREATE INDEX idx_rac_members_user_id ON rac_members(user_id);
```

## Query Examples

### Get scholar with all details
```sql
SELECT u.*, s.* 
FROM users u
JOIN scholars s ON u.id = s.user_id
WHERE s.scholar_id = 'PHD2020001';
```

### Get scholar's supervisors
```sql
SELECT s.*, u.name, u.email
FROM scholar_supervisors ss
JOIN scholars s ON ss.scholar_id = s.id
JOIN users u ON ss.supervisor_id = u.id
WHERE s.scholar_id = 'PHD2020001'
  AND ss.is_primary = TRUE;
```

### Get DRC members for a scholar
```sql
SELECT u.name, u.email, rm.member_role
FROM rac_members rm
JOIN users u ON rm.user_id = u.id
WHERE rm.scholar_id = ? AND rm.member_role = 'drc';
```

## Migration Steps

1. ✅ Updated `shared/schema.ts` with new table definitions
2. ✅ Created migration file `0002_normalize_users_schema.sql`
3. ✅ Updated `server/storage.ts` with bcrypt password hashing
4. ✅ Updated `server/routes.ts` to verify passwords
5. ✅ Fixed TypeScript types in components
6. ✅ Installed bcryptjs dependency

## Testing Credentials (After Migration)

All passwords are now hashed. Test accounts should be created with:
- Username: `scholar1`
- Password: `password123` (will be hashed to ~60 character bcrypt hash)
- Role: `scholar`

## Security Benefits

1. **Password Security** ✅
   - Passwords hashed with bcryptjs (industry standard)
   - Rainbow table attacks prevented
   - Password verification constant-time

2. **Data Separation** ✅
   - Scholar data isolated from auth concerns
   - Easier to manage role-based access
   - Cleaner database design

3. **Scalability** ✅
   - Easy to add new scholar-related tables
   - Clear relationship structure
   - Better indexing strategy

4. **Compliance** ✅
   - Follows GDPR data minimization principle
   - Secure password storage
   - Role-based access control ready

## Future Enhancements

- [ ] Add password reset functionality
- [ ] Add email verification
- [ ] Add audit logs for data changes
- [ ] Implement row-level security (RLS)
- [ ] Add soft deletes for scholars
- [ ] Add temporal tables for historical data
