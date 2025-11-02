# CargoMatch Registration & Approval Flow - Complete Guide

## 🎯 **Project Overview**

CargoMatch is a logistics platform with two distinct user types:
- **Traders (Users)**: Mobile app users who book containers for shipping
- **LSPs (Logistics Service Providers)**: Web app users who provide containers and logistics services

Both user types require **admin approval** before they can access their respective dashboards.

---

## 📱 **1. TRADER REGISTRATION FLOW (Mobile App)**

### **Registration Process:**
```
POST /api/auth/register
```

**Required Fields:**
- `name` (string): Full name
- `email` (string): Email address
- `password` (string): Password
- `confirmPassword` (string): Password confirmation
- `phone` (string): Phone number
- `address` (string): Address
- `Company_name` (string): Company name
- `pan` (string): PAN number
- `gst` (string): GST number
- `company_reg` (string): Company registration number
- `role` (string): Default 'user' (trader)

**Database Changes:**
```sql
INSERT INTO users (
  first_name, last_name, email, password_hash, 
  phone_number, company_name, gst_number, pan_number, 
  company_registration, address, role, 
  approval_status, is_active, created_at
) VALUES (
  'John', 'Doe', 'trader@example.com', 'hashed_password',
  '9876543210', 'ABC Trading Co', '22ABCDE1234F1Z5', 'ABCDE1234F',
  'REG123456789', '123 Business St', 'user',
  'pending', false, NOW()
);
```

**Response:**
```json
{
  "message": "User registered successfully. Pending admin approval.",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "trader@example.com",
    "role": "user"
  }
}
```

### **Trader Login Process:**
```
POST /api/auth/login
```

**Login Validation:**
1. ✅ Check email/password
2. ✅ Check `approval_status = 'approved'`
3. ✅ Check `is_active = true`
4. ✅ Generate JWT token

**If Not Approved:**
```json
{
  "error": "Account pending approval. Please contact admin."
}
```

**If Approved:**
```json
{
  "message": "Login successful",
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "trader@example.com",
    "role": "user"
  }
}
```

---

## 🌐 **2. LSP REGISTRATION FLOW (Web App)**

### **Registration Process:**
```
POST /api/lsp/register
```

**Required Fields:**
- `name` (string): Full name
- `email` (string): Email address
- `password` (string): Password
- `confirmPassword` (string): Password confirmation
- `company_name` (string): Company name
- `pan_number` (string): PAN number
- `gst_number` (string): GST number
- `phone` (string): Phone number
- `address` (string): Address
- `business_license` (string): Business license number
- `insurance_certificate` (string): Insurance certificate number

**File Uploads Required:**
- `gst_certificate` (PDF): GST certificate
- `company_registration_doc` (PDF): Company registration document
- `business_license_doc` (PDF): Business license document
- `insurance_certificate_doc` (PDF): Insurance certificate document

**Database Changes:**
```sql
-- Create user
INSERT INTO users (
  first_name, last_name, email, password_hash, role, 
  is_active, created_at
) VALUES (
  'Jane', 'Smith', 'lsp@example.com', 'hashed_password', 'lsp',
  false, NOW()
);

-- Create LSP profile
INSERT INTO lsp_profiles (
  user_id, company_name, pan_number, gst_number, phone, address,
  business_license, insurance_certificate,
  gst_certificate_path, company_registration_doc_path,
  business_license_doc_path, insurance_certificate_doc_path,
  is_verified, verification_status, created_at
) VALUES (
  'user_uuid', 'XYZ Logistics', 'ABCDE1234F', '22ABCDE1234F1Z5',
  '9876543210', '456 Logistics Park', 'LIC123456789', 'INS123456789',
  '/uploads/lsp_docs/gst_cert.pdf', '/uploads/lsp_docs/company_reg.pdf',
  '/uploads/lsp_docs/business_license.pdf', '/uploads/lsp_docs/insurance.pdf',
  false, 'pending', NOW()
);
```

**Response:**
```json
{
  "message": "LSP registered successfully. Pending admin approval.",
  "user": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "lsp@example.com",
    "role": "lsp"
  },
  "profile": {
    "id": "profile_uuid",
    "company_name": "XYZ Logistics",
    "verification_status": "pending"
  }
}
```

### **LSP Login Process:**
```
POST /api/lsp/login
```

**Login Validation:**
1. ✅ Check email/password
2. ✅ Check LSP profile exists
3. ✅ Check `is_verified = true` in lsp_profiles
4. ✅ Check `is_active = true` in users
5. ✅ Generate JWT token

**If Not Verified:**
```json
{
  "error": "Account pending verification. Please contact admin."
}
```

**If Verified:**
```json
{
  "message": "Login successful",
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "lsp@example.com",
    "role": "lsp"
  },
  "profile": {
    "company_name": "XYZ Logistics",
    "is_verified": true
  }
}
```

---

## 👑 **3. ADMIN APPROVAL FLOW**

### **Admin Login:**
```
POST /api/admin/login
```

**Credentials:**
- Email: `admin@cargomatch.in`
- Password: `adminCargomatch123`

### **Trader Approval (Users Tab):**
```
GET /api/admin/users
```

**Shows only traders with:**
- Name, Email, Company, Phone
- Approval Status (Pending/Approved/Rejected)
- Approve/Reject buttons for pending users

**Approve Trader:**
```
PUT /api/admin/users/{id}/approve
```

**Database Changes:**
```sql
UPDATE users 
SET approval_status = 'approved', 
    approved_at = NOW(),
    approved_by = 'admin_id',
    is_active = true
WHERE id = 'user_id';
```

**Reject Trader:**
```
PUT /api/admin/users/{id}/reject
Body: { "rejectionReason": "Incomplete documentation" }
```

**Database Changes:**
```sql
UPDATE users 
SET approval_status = 'rejected', 
    approved_at = NOW(),
    approved_by = 'admin_id',
    rejection_reason = 'Incomplete documentation',
    is_active = false
WHERE id = 'user_id';
```

### **LSP Approval (LSPs Tab):**
```
GET /api/admin/lsps
```

**Shows only LSPs with:**
- Name, Email, Company
- Verification Status (Pending/Verified/Rejected)
- Verify/Reject buttons for pending LSPs

**Approve LSP:**
```
PUT /api/admin/lsps/{id}/approve
```

**Database Changes:**
```sql
-- Update user
UPDATE users SET is_active = true WHERE id = 'lsp_id';

-- Update LSP profile
UPDATE lsp_profiles 
SET is_verified = true, 
    verification_status = 'approved',
    updated_at = NOW()
WHERE user_id = 'lsp_id';
```

**Reject LSP:**
```
PUT /api/admin/lsps/{id}/reject
Body: { "reason": "Invalid documents" }
```

**Database Changes:**
```sql
-- Update user
UPDATE users SET is_active = false WHERE id = 'lsp_id';

-- Update LSP profile
UPDATE lsp_profiles 
SET is_verified = false, 
    verification_status = 'rejected',
    updated_at = NOW()
WHERE user_id = 'lsp_id';
```

---

## 🔐 **4. AUTHENTICATION MIDDLEWARE**

### **Trader Middleware:**
```javascript
exports.verifyTrader = async (req, res, next) => {
  // Check JWT token
  // Check user role = 'user'
  // Check approval_status = 'approved'
  // Check is_active = true
  next();
};
```

### **LSP Middleware:**
```javascript
exports.verifyLSP = async (req, res, next) => {
  // Check JWT token
  // Check user role = 'lsp'
  // Check LSP profile exists
  // Check is_verified = true
  // Check is_active = true
  next();
};
```

---

## 📊 **5. DATABASE SCHEMA**

### **Users Table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  company_name VARCHAR(255),
  gst_number VARCHAR(20),
  pan_number VARCHAR(20),
  company_registration VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  country VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user',
  approval_status VARCHAR(20) DEFAULT 'pending',
  approved_at TIMESTAMP,
  approved_by UUID,
  rejection_reason TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **LSP Profiles Table:**
```sql
CREATE TABLE lsp_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  pan_number VARCHAR(20),
  gst_number VARCHAR(20),
  phone VARCHAR(20),
  address TEXT,
  business_license VARCHAR(50),
  insurance_certificate VARCHAR(50),
  gst_certificate_path TEXT,
  company_registration_doc_path TEXT,
  business_license_doc_path TEXT,
  insurance_certificate_doc_path TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 **6. IMPLEMENTATION STATUS**

### ✅ **Completed:**
- [x] Database schema with approval_status
- [x] LSP registration with file uploads
- [x] LSP approval/rejection flow
- [x] Admin panel for LSP management
- [x] LSP authentication middleware
- [x] Trader registration endpoint
- [x] Trader approval/rejection flow
- [x] Admin panel for trader management

### 🔧 **Needs Fixing:**
- [ ] Trader login authentication (add approval status check)
- [ ] Trader authentication middleware
- [ ] Mobile app integration testing
- [ ] Email notifications for approval/rejection

---

## 📱 **7. MOBILE APP INTEGRATION**

### **Registration API Call:**
```javascript
const registerTrader = async (formData) => {
  const response = await fetch('https://your-api.com/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      phone: formData.phone,
      address: formData.address,
      Company_name: formData.companyName,
      pan: formData.pan,
      gst: formData.gst,
      company_reg: formData.companyReg,
      role: 'user'
    })
  });
  
  return await response.json();
};
```

### **Login API Call:**
```javascript
const loginTrader = async (email, password) => {
  const response = await fetch('https://your-api.com/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.error && data.error.includes('pending approval')) {
    // Show pending approval message
    showPendingApprovalMessage();
  } else if (data.token) {
    // Store token and navigate to dashboard
    localStorage.setItem('token', data.token);
    navigateToDashboard();
  }
  
  return data;
};
```

---

## 🎯 **8. NEXT STEPS**

1. **Fix Trader Authentication**: Update login service to check approval_status
2. **Add Trader Middleware**: Create verifyTrader middleware
3. **Test Mobile Integration**: Test registration and login from mobile app
4. **Add Email Notifications**: Send emails on approval/rejection
5. **Add Status Checking**: Add endpoint to check approval status
6. **Error Handling**: Improve error messages for better UX

This flow ensures that both traders and LSPs must be approved by admin before they can access their respective dashboards, maintaining security and quality control.
