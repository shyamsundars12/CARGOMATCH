import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company_name: '',
    pan_number: '',
    gst_number: '',
    gst_certificate_number: '',
    company_registration: '',
    company_registration_number: '',
    phone: '',
    address: '',
    business_license: '',
    business_license_number: '',
    insurance_certificate: '',
    insurance_certificate_number: '',
  });
  const [files, setFiles] = useState({
    gst_certificate: null as File | null,
    company_registration_doc: null as File | null,
    business_license_doc: null as File | null,
    insurance_certificate_doc: null as File | null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFiles({ ...files, [e.target.name]: file });
    } else if (file) {
      setError('Please upload PDF files only');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate files
    if (!files.gst_certificate || !files.company_registration_doc || 
        !files.business_license_doc || !files.insurance_certificate_doc) {
      setError('Please upload all required PDF documents');
      return;
    }

    try {
      const formData = new FormData();
      
      // Add form fields
      Object.keys(form).forEach(key => {
        formData.append(key, form[key as keyof typeof form]);
      });

      // Add files
      formData.append('gst_certificate', files.gst_certificate);
      formData.append('company_registration_doc', files.company_registration_doc);
      formData.append('business_license_doc', files.business_license_doc);
      formData.append('insurance_certificate_doc', files.insurance_certificate_doc);

      const res = await fetch('/api/lsp/register', {
        method: 'POST',
        body: formData, // Don't set Content-Type header for FormData
      });

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Registration failed');
      }
      setSuccess('Registration successful! Please login.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6f8' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 32, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', width: 500, maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>LSP Registration</h2>
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        {success && <div style={{ color: 'green', marginBottom: 16 }}>{success}</div>}
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Personal Information</label>
          <input style={inputStyle} name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
          <input style={inputStyle} name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input style={inputStyle} name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          <input style={inputStyle} name="confirmPassword" type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} required />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Company Information</label>
          <input style={inputStyle} name="company_name" placeholder="Company Name" value={form.company_name} onChange={handleChange} required />
          <input style={inputStyle} name="pan_number" placeholder="PAN Number" value={form.pan_number} onChange={handleChange} required />
          <input style={inputStyle} name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required />
          <input style={inputStyle} name="address" placeholder="Address" value={form.address} onChange={handleChange} required />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>GST Information</label>
          <input style={inputStyle} name="gst_number" placeholder="GST Number" value={form.gst_number} onChange={handleChange} required />
          <input style={inputStyle} name="gst_certificate_number" placeholder="GST Certificate Number" value={form.gst_certificate_number} onChange={handleChange} required />
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>GST Certificate (PDF)</label>
            <input 
              type="file" 
              name="gst_certificate" 
              accept=".pdf"
              onChange={handleFileChange}
              style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
              required 
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Company Registration</label>
          <input style={inputStyle} name="company_registration" placeholder="Company Registration Number" value={form.company_registration} onChange={handleChange} required />
          <input style={inputStyle} name="company_registration_number" placeholder="Registration Certificate Number" value={form.company_registration_number} onChange={handleChange} required />
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Registration Certificate (PDF)</label>
            <input 
              type="file" 
              name="company_registration_doc" 
              accept=".pdf"
              onChange={handleFileChange}
              style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
              required 
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Business License</label>
          <input style={inputStyle} name="business_license" placeholder="Business License Number" value={form.business_license} onChange={handleChange} required />
          <input style={inputStyle} name="business_license_number" placeholder="License Certificate Number" value={form.business_license_number} onChange={handleChange} required />
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Business License (PDF)</label>
            <input 
              type="file" 
              name="business_license_doc" 
              accept=".pdf"
              onChange={handleFileChange}
              style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
              required 
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Insurance Certificate</label>
          <input style={inputStyle} name="insurance_certificate" placeholder="Insurance Certificate Number" value={form.insurance_certificate} onChange={handleChange} required />
          <input style={inputStyle} name="insurance_certificate_number" placeholder="Insurance Policy Number" value={form.insurance_certificate_number} onChange={handleChange} required />
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Insurance Certificate (PDF)</label>
            <input 
              type="file" 
              name="insurance_certificate_doc" 
              accept=".pdf"
              onChange={handleFileChange}
              style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
              required 
            />
          </div>
        </div>

        <button style={{ width: '100%', background: '#2563eb', color: '#fff', padding: 12, borderRadius: 4, fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 12 }} type="submit">
          Register
        </button>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          Already have an account? <span style={{ color: '#2563eb', cursor: 'pointer' }} onClick={() => navigate('/login')}>Login</span>
        </div>
      </form>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  marginBottom: 12,
  padding: 10,
  borderRadius: 4,
  border: '1px solid #ddd',
};
