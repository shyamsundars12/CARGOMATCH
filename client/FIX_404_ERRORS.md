# Fix 404 Errors - API URL Configuration

## Problem
In production, relative URLs like `/api/...` try to fetch from the frontend domain (`cargomatch-orcin.vercel.app`) instead of the backend domain (`cargomatch-talv.vercel.app`), causing 404 errors.

## Solution
Replace all relative API URLs with `getApiUrl()` helper function.

## Files Already Fixed ✅
- `src/pages/Login.tsx`
- `src/pages/Register.tsx`
- `src/pages/Profile.tsx`
- `src/pages/Complaints.tsx`
- `src/pages/ComplaintDetail.tsx`
- `src/pages/Dashboard.tsx`

## Files That Need Fixing ⚠️

### LSP Pages:
1. `src/pages/Bookings.tsx` - Multiple fetch calls
2. `src/pages/BookingApproval.tsx` - Multiple fetch calls
3. `src/pages/BookingDetail.tsx` - Multiple fetch calls
4. `src/pages/Containers.tsx` - Multiple fetch calls
5. `src/pages/Shipments.tsx` - Multiple fetch calls
6. `src/pages/ShipmentDetail.tsx` - Multiple fetch calls
7. `src/pages/Analytics.tsx` - Multiple fetch calls

### Admin Pages:
1. `src/pages/admin/Bookings.tsx`
2. `src/pages/admin/BookingDetail.tsx`
3. `src/pages/admin/Containers.tsx`
4. `src/pages/admin/ContainerApproval.tsx`
5. `src/pages/admin/ContainerDetail.tsx`
6. `src/pages/admin/ContainerTypes.tsx`
7. `src/pages/admin/LSPs.tsx`
8. `src/pages/admin/LSPDetail.tsx`
9. `src/pages/admin/Users.tsx`
10. `src/pages/admin/UserDetail.tsx`
11. `src/pages/admin/Shipments.tsx`
12. `src/pages/admin/Complaints.tsx`
13. `src/pages/admin/ComplaintDetail.tsx`
14. `src/pages/admin/Dashboard.tsx`
15. `src/pages/admin/Login.tsx`

## How to Fix

### Step 1: Add Import
At the top of each file, add:
```typescript
import { getApiUrl } from '../config/api';
```
(Use `../../config/api` for files in `admin/` folder)

### Step 2: Replace Fetch Calls
Find all instances of:
```typescript
fetch('/api/...', { ... })
```

Replace with:
```typescript
fetch(getApiUrl('/api/...'), { ... })
```

### Step 3: Template Strings
For dynamic URLs like:
```typescript
fetch(`/api/lsp/bookings/${id}`, { ... })
```

Replace with:
```typescript
fetch(getApiUrl(`/api/lsp/bookings/${id}`), { ... })
```

## Quick Find & Replace Pattern

**Find:**
```
fetch('/api/
```

**Replace:**
```
fetch(getApiUrl('/api/
```

**Find:**
```
fetch(`/api/
```

**Replace:**
```
fetch(getApiUrl(`/api/
```

## Example

**Before:**
```typescript
fetch('/api/lsp/bookings', {
  headers: { Authorization: `Bearer ${token}` },
})
```

**After:**
```typescript
import { getApiUrl } from '../config/api';

fetch(getApiUrl('/api/lsp/bookings'), {
  headers: { Authorization: `Bearer ${token}` },
})
```

## Alternative: Use apiFetch Helper

You can also use the `apiFetch` helper from `config/api.ts`:

```typescript
import { apiFetch } from '../config/api';

const response = await apiFetch('/api/lsp/bookings', {
  headers: { Authorization: `Bearer ${token}` },
});
```

## Verification

After fixing, verify:
1. All fetch calls use `getApiUrl()` or `apiFetch()`
2. Import statement is added at the top
3. No relative URLs like `/api/...` remain
4. Build succeeds without errors
5. Test in production - no more 404 errors!

