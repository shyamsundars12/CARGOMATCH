import { useEffect, useState } from "react";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ company_name: "", phone: "", address: "" });
  const [message, setMessage] = useState("");
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lsp/profile", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setForm({
          company_name: data.company_name || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/lsp/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(form),
    });
    if (res.ok) setMessage("Profile updated!");
    else setMessage("Update failed.");
  };

  const getPdfUrl = (filePath: string) => {
    if (!filePath) return null;
    // Convert Windows path to URL format
    const cleanPath = filePath.replace(/\\\\/g, '/').replace(/\\/g, '/');
    return `http://localhost:5000/${cleanPath}`;
  };

  const renderPdfViewer = (title: string, filePath: string) => {
    const pdfUrl = getPdfUrl(filePath);
    if (!pdfUrl) return null;

    return (
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{title}</h3>
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: 8, 
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <iframe
            src={pdfUrl}
            width="100%"
            height="400px"
            title={title}
            style={{ border: 'none' }}
          />
        </div>
      </div>
    );
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>LSP Profile</h1>
      
      {/* Basic Profile Form */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Company Information</h2>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Company Name</label>
          <input
            style={{ width: '100%', marginBottom: 16, padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
            name="company_name"
            value={form.company_name}
            onChange={handleChange}
          />
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Contact Number</label>
          <input
            style={{ width: '100%', marginBottom: 16, padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Address</label>
          <input
            style={{ width: '100%', marginBottom: 16, padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
            name="address"
            value={form.address}
            onChange={handleChange}
          />
          <button style={{ background: '#2563eb', color: '#fff', padding: 10, borderRadius: 4, fontWeight: 600, border: 'none', cursor: 'pointer' }} type="submit">
            Save Changes
          </button>
          {message && <div style={{ marginTop: 16, color: message.includes('failed') ? 'red' : 'green' }}>{message}</div>}
        </form>
      </div>

      {/* Company Details */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Company Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <strong>PAN Number:</strong> {profile.pan_number}
          </div>
          <div>
            <strong>GST Number:</strong> {profile.gst_number}
          </div>
          <div>
            <strong>Company Registration:</strong> {profile.company_registration}
          </div>
          <div>
            <strong>Business License:</strong> {profile.business_license}
          </div>
          <div>
            <strong>Insurance Certificate:</strong> {profile.insurance_certificate}
          </div>
          <div>
            <strong>Verification Status:</strong> 
            <span style={{ 
              color: profile.is_verified ? 'green' : 'orange',
              marginLeft: 8,
              fontWeight: 600
            }}>
              {profile.is_verified ? 'Verified' : 'Pending Verification'}
            </span>
          </div>
        </div>
      </div>

      {/* PDF Documents */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Uploaded Documents</h2>
        <p style={{ color: '#666', marginBottom: 24 }}>
          Review your uploaded documents below. These are used for verification by our admin team.
        </p>
        
        {renderPdfViewer("GST Certificate", profile.gst_certificate_path)}
        {renderPdfViewer("Company Registration Certificate", profile.company_registration_doc_path)}
        {renderPdfViewer("Business License", profile.business_license_doc_path)}
        {renderPdfViewer("Insurance Certificate", profile.insurance_certificate_doc_path)}
        
        {!profile.gst_certificate_path && !profile.company_registration_doc_path && 
         !profile.business_license_doc_path && !profile.insurance_certificate_doc_path && (
          <div style={{ textAlign: 'center', color: '#666', padding: 32 }}>
            No documents uploaded yet. Documents will appear here after registration.
          </div>
        )}
      </div>
    </div>
  );
}
