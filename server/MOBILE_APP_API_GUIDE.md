# CargoMatch Mobile App API Integration Guide

## 🎯 **Overview**

This guide provides complete API integration for the CargoMatch mobile app (Trader/User registration and authentication) with admin approval flow.

---

## 📱 **Mobile App API Endpoints**

### **Base URL**
```
https://your-api-domain.com/api
```

---

## 🔐 **1. TRADER REGISTRATION**

### **Endpoint**
```
POST /api/auth/register
```

### **Request Headers**
```
Content-Type: application/json
```

### **Request Body**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123",
  "phone": "9876543210",
  "address": "123 Business Street, Mumbai",
  "Company_name": "ABC Trading Company",
  "pan": "ABCDE1234F",
  "gst": "22ABCDE1234F1Z5",
  "company_reg": "REG123456789",
  "role": "user"
}
```

### **Response (Success)**
```json
{
  "message": "User registered successfully. Pending admin approval.",
  "user": {
    "id": "uuid-string",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "user"
  }
}
```

### **Response (Error)**
```json
{
  "error": "Email already registered"
}
```

### **Mobile App Implementation**
```javascript
const registerTrader = async (formData) => {
  try {
    const response = await fetch('https://your-api-domain.com/api/auth/register', {
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
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    // Show success message
    showSuccessMessage('Registration successful! Please wait for admin approval.');
    
    return data;
  } catch (error) {
    showErrorMessage(error.message);
    throw error;
  }
};
```

---

## 🔑 **2. TRADER LOGIN**

### **Endpoint**
```
POST /api/auth/login
```

### **Request Headers**
```
Content-Type: application/json
```

### **Request Body**
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

### **Response (Success - Approved User)**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-string",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "user"
  }
}
```

### **Response (Error - Pending Approval)**
```json
{
  "error": "Account pending approval. Please contact admin."
}
```

### **Response (Error - Rejected)**
```json
{
  "error": "Account is inactive. Please contact admin."
}
```

### **Mobile App Implementation**
```javascript
const loginTrader = async (email, password) => {
  try {
    const response = await fetch('https://your-api-domain.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (data.error.includes('pending approval')) {
        showPendingApprovalMessage();
      } else if (data.error.includes('inactive')) {
        showRejectedMessage();
      } else {
        showErrorMessage(data.error);
      }
      throw new Error(data.error);
    }
    
    // Store token and user data
    await AsyncStorage.setItem('authToken', data.token);
    await AsyncStorage.setItem('userData', JSON.stringify(data.user));
    
    // Navigate to dashboard
    navigation.navigate('Dashboard');
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
```

---

## 📊 **3. CHECK APPROVAL STATUS**

### **Endpoint**
```
GET /api/auth/status
```

### **Request Headers**
```
Authorization: Bearer {token}
Content-Type: application/json
```

### **Response**
```json
{
  "approval_status": "pending",
  "is_active": false,
  "message": "Account pending admin approval"
}
```

### **Possible Status Values**
- `pending`: Waiting for admin approval
- `approved`: Approved by admin, can login
- `rejected`: Rejected by admin, cannot login

### **Mobile App Implementation**
```javascript
const checkApprovalStatus = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    const response = await fetch('https://your-api-domain.com/api/auth/status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.approval_status === 'pending') {
      showPendingApprovalScreen();
    } else if (data.approval_status === 'rejected') {
      showRejectedScreen(data.message);
    } else if (data.approval_status === 'approved') {
      // User is approved, proceed to dashboard
      navigation.navigate('Dashboard');
    }
    
    return data;
  } catch (error) {
    console.error('Status check error:', error);
    throw error;
  }
};
```

---

## 🛡️ **4. PROTECTED ROUTES**

### **Using Authentication Token**
For all protected routes, include the JWT token in the Authorization header:

```javascript
const makeAuthenticatedRequest = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem('authToken');
  
  const response = await fetch(`https://your-api-domain.com${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (response.status === 401) {
    // Token expired or invalid
    await AsyncStorage.removeItem('authToken');
    navigation.navigate('Login');
    throw new Error('Session expired. Please login again.');
  }
  
  return response;
};
```

---

## 📱 **5. MOBILE APP UI FLOWS**

### **Registration Flow**
1. **Registration Form** → Collect all required trader information
2. **Submit Registration** → Call `/api/auth/register`
3. **Success Screen** → Show "Registration successful. Pending admin approval."
4. **Login Redirect** → Redirect to login screen

### **Login Flow**
1. **Login Form** → Email and password
2. **Submit Login** → Call `/api/auth/login`
3. **Check Response**:
   - ✅ **Success**: Store token, navigate to dashboard
   - ⏳ **Pending**: Show "Account pending approval" screen
   - ❌ **Rejected**: Show "Account rejected" screen with contact info

### **Approval Status Screen**
```javascript
const PendingApprovalScreen = () => {
  return (
    <View style={styles.container}>
      <Icon name="clock" size={64} color="#f39c12" />
      <Text style={styles.title}>Account Pending Approval</Text>
      <Text style={styles.message}>
        Your account is under review by our admin team.
        You will be notified once approved.
      </Text>
      <Button 
        title="Check Status" 
        onPress={checkApprovalStatus}
      />
      <Button 
        title="Contact Support" 
        onPress={() => Linking.openURL('mailto:support@cargomatch.in')}
      />
    </View>
  );
};
```

---

## 🔧 **6. ERROR HANDLING**

### **Common Error Scenarios**

#### **Network Errors**
```javascript
const handleNetworkError = (error) => {
  if (error.message.includes('Network request failed')) {
    showErrorMessage('No internet connection. Please check your network.');
  } else {
    showErrorMessage('Something went wrong. Please try again.');
  }
};
```

#### **Validation Errors**
```javascript
const handleValidationError = (error) => {
  if (error.message.includes('Email already registered')) {
    showErrorMessage('This email is already registered. Please use a different email.');
  } else if (error.message.includes('Passwords do not match')) {
    showErrorMessage('Passwords do not match. Please try again.');
  } else {
    showErrorMessage(error.message);
  }
};
```

#### **Authentication Errors**
```javascript
const handleAuthError = (error) => {
  if (error.message.includes('pending approval')) {
    showPendingApprovalScreen();
  } else if (error.message.includes('inactive')) {
    showRejectedScreen();
  } else if (error.message.includes('Invalid password')) {
    showErrorMessage('Invalid password. Please try again.');
  } else {
    showErrorMessage('Login failed. Please try again.');
  }
};
```

---

## 📋 **7. REQUIRED FIELDS VALIDATION**

### **Registration Form Validation**
```javascript
const validateRegistrationForm = (formData) => {
  const errors = {};
  
  // Required fields
  if (!formData.name?.trim()) errors.name = 'Name is required';
  if (!formData.email?.trim()) errors.email = 'Email is required';
  if (!formData.password?.trim()) errors.password = 'Password is required';
  if (!formData.confirmPassword?.trim()) errors.confirmPassword = 'Confirm password is required';
  if (!formData.phone?.trim()) errors.phone = 'Phone number is required';
  if (!formData.address?.trim()) errors.address = 'Address is required';
  if (!formData.companyName?.trim()) errors.companyName = 'Company name is required';
  if (!formData.pan?.trim()) errors.pan = 'PAN number is required';
  if (!formData.gst?.trim()) errors.gst = 'GST number is required';
  if (!formData.companyReg?.trim()) errors.companyReg = 'Company registration is required';
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (formData.email && !emailRegex.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Password validation
  if (formData.password && formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  // Password confirmation
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  // Phone validation
  const phoneRegex = /^[6-9]\d{9}$/;
  if (formData.phone && !phoneRegex.test(formData.phone)) {
    errors.phone = 'Please enter a valid 10-digit phone number';
  }
  
  // PAN validation
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (formData.pan && !panRegex.test(formData.pan)) {
    errors.pan = 'Please enter a valid PAN number';
  }
  
  // GST validation
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (formData.gst && !gstRegex.test(formData.gst)) {
    errors.gst = 'Please enter a valid GST number';
  }
  
  return errors;
};
```

---

## 🚀 **8. IMPLEMENTATION CHECKLIST**

### **Backend Setup**
- [ ] Server running on Neon database
- [ ] API endpoints accessible
- [ ] CORS configured for mobile app
- [ ] SSL certificate installed (HTTPS)

### **Mobile App Setup**
- [ ] API base URL configured
- [ ] Network security config updated
- [ ] AsyncStorage for token management
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Form validation implemented

### **Testing**
- [ ] Registration flow tested
- [ ] Login flow tested
- [ ] Approval status checking tested
- [ ] Error scenarios tested
- [ ] Network error handling tested

---

## 📞 **9. SUPPORT & CONTACT**

### **Admin Contact**
- **Email**: admin@cargomatch.in
- **Phone**: +91-XXXXXXXXXX

### **Technical Support**
- **Email**: support@cargomatch.in
- **Documentation**: [API Documentation Link]

---

## 🔄 **10. COMPLETE FLOW SUMMARY**

### **Trader Journey**
1. **Download App** → Install CargoMatch mobile app
2. **Register** → Fill registration form with company details
3. **Submit** → Account created with `pending` status
4. **Wait** → Admin reviews application
5. **Approval** → Admin approves/rejects account
6. **Login** → Approved traders can login and access dashboard
7. **Use App** → Book containers, track shipments, etc.

### **Admin Journey**
1. **Login** → Admin logs into web panel
2. **Review** → Check pending traders in Users tab
3. **Verify** → Review company documents and details
4. **Decide** → Approve or reject with reason
5. **Notify** → Trader receives status update

This complete flow ensures that only verified traders can access the mobile app, maintaining security and quality control in the CargoMatch platform.
