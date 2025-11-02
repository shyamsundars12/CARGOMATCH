# 🔧 FRONTEND DEBUGGING GUIDE

## 🎯 **Issue: Users not showing in admin panel**

The backend API is working perfectly and returning 5 users. The issue is likely with the frontend authentication or token storage.

---

## 🛠️ **STEP-BY-STEP SOLUTION:**

### **Step 1: Clear Browser Storage**
1. Open your browser's **Developer Tools** (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Find **Local Storage** → `http://localhost:5173`
4. **Delete** the `adminToken` entry
5. **Refresh** the page

### **Step 2: Login Again**
1. Go to `http://localhost:5173/admin/login`
2. Login with:
   - **Email:** `admin@cargomatch.in`
   - **Password:** `adminCargomatch123`
3. You should be redirected to the dashboard

### **Step 3: Check Users Tab**
1. Navigate to **Users** tab in the admin panel
2. You should now see **5 users**:
   - New Test Trader (pending)
   - Test Trader (pending)
   - Karnan (approved)
   - Jane Exporter (pending)
   - John Importer (pending)

### **Step 4: Test Approval**
1. Click **Approve** on any pending user
2. The status should change to "Approved"
3. The user should disappear from pending list

---

## 🔍 **DEBUGGING STEPS:**

### **Check Browser Console:**
1. Open **Developer Tools** (F12)
2. Go to **Console** tab
3. Look for any **red error messages**
4. Common errors:
   - `Failed to fetch users`
   - `401 Unauthorized`
   - `403 Forbidden`

### **Check Network Tab:**
1. Go to **Network** tab in Developer Tools
2. Navigate to Users page
3. Look for `/api/admin/users` request
4. Check if it returns **200 status** and **5 users**

### **Check Local Storage:**
1. Go to **Application** → **Local Storage**
2. Verify `adminToken` exists
3. Copy the token value
4. Test it with: `http://localhost:5000/api/admin/users` (with Authorization header)

---

## 🚨 **COMMON ISSUES & SOLUTIONS:**

### **Issue 1: "Failed to fetch users"**
- **Cause:** Network error or CORS issue
- **Solution:** Check if backend is running on port 5000

### **Issue 2: "401 Unauthorized"**
- **Cause:** Invalid or expired token
- **Solution:** Clear localStorage and login again

### **Issue 3: "403 Forbidden"**
- **Cause:** Token doesn't have admin privileges
- **Solution:** Check if admin user exists in database

### **Issue 4: Empty users array**
- **Cause:** API returning empty data
- **Solution:** Check backend logs for errors

---

## ✅ **VERIFICATION:**

### **Backend API Test:**
```bash
# Test from terminal (should return 5 users)
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cargomatch.in","password":"adminCargomatch123"}'

# Use the token from response to test users API
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### **Frontend Test:**
1. Open `http://localhost:5173/admin/login`
2. Login successfully
3. Go to Users tab
4. Should see 5 users with approve/reject buttons

---

## 🎉 **EXPECTED RESULT:**

After following these steps, you should see:
- ✅ **5 users** in the Users tab
- ✅ **Approve/Reject buttons** for pending users
- ✅ **Status updates** working correctly
- ✅ **No console errors**

---

## 📞 **IF STILL NOT WORKING:**

1. **Check server logs** for any errors
2. **Restart both frontend and backend**
3. **Clear all browser data** (cookies, localStorage, etc.)
4. **Try in incognito/private mode**

**The backend is working perfectly - the issue is definitely frontend-related!** 🎯
