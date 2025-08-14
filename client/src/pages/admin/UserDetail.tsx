import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Helper to convert Windows file path to URL
  const getPdfUrl = (filePath: string) => {
    if (!filePath) return null;
    const cleanPath = filePath.replace(/\\\\/g, '/').replace(/\\/g, '/');
    return `http://localhost:5000/${cleanPath}`;
  };

  const renderPdfViewer = (title: string, filePath: string) => {
    const pdfUrl = getPdfUrl(filePath);
    if (!pdfUrl) return null;

    return (
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{title}</h3>
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <iframe
            src={pdfUrl}
            width="100%"
            height="400px"
            title={title}
            style={{ border: "none" }}
          />
        </div>
      </div>
    );
  };

  useEffect(() => {
    setError("");
    setLoading(true);
    fetch(`/api/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user details");
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => setError("Failed to load user details"))
      .finally(() => setLoading(false));
  }, [id]);

  // Update approval status API call
  const updateApprovalStatus = async (approved: boolean) => {
    if (!user) return;

    setUpdating(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ is_approved: approved }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update approval status");
      }
      // The backend returns the full updated user object including updated profile info
      const updatedUser = await res.json();
      setUser(updatedUser);
    } catch (err: any) {
      setError(err.message || "Failed to update approval status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div style={{ padding: 32 }}>Loading...</div>;
  if (error) return <div style={{ padding: 32, color: "red" }}>{error}</div>;
  if (!user) return <div style={{ padding: 32 }}>User not found</div>;

  const isLSP = user.role === "lsp";
  const isTrader = user.role === "trader";

  // Show buttons only if not approved
  const showApproveRejectButtons = !user.is_approved;

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: 20,
          cursor: "pointer",
          background: "#ddd",
          padding: "6px 12px",
          borderRadius: 4,
          border: "none",
        }}
      >
        ← Back to Users
      </button>

      <h1>User Detail (ID: {user.id})</h1>
      <p>
        <strong>Name:</strong> {user.name}
      </p>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Role:</strong> {user.role}
      </p>
      <p>
        <strong>Approved:</strong> {user.is_approved ? "Yes" : "No"}
      </p>
      <p>
        <strong>Created At:</strong> {new Date(user.created_at).toLocaleString()}
      </p>

      {showApproveRejectButtons && (
        <div style={{ marginTop: 24 }}>
          <button
            disabled={updating}
            onClick={() => updateApprovalStatus(true)}
            style={{
              backgroundColor: "#16a34a",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: 4,
              border: "none",
              marginRight: 12,
              cursor: "pointer",
              opacity: updating ? 0.6 : 1,
            }}
          >
            Approve
          </button>
          <button
            disabled={updating}
            onClick={() => updateApprovalStatus(false)}
            style={{
              backgroundColor: "#dc2626",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: 4,
              border: "none",
              cursor: "pointer",
              opacity: updating ? 0.6 : 1,
            }}
          >
            Reject
          </button>
        </div>
      )}

      {isLSP && user.profile && (
        <>
          <h2 style={{ marginTop: 32 }}>LSP Profile</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div>
              <strong>Company Name:</strong> {user.profile.company_name}
            </div>
            <div>
              <strong>Phone:</strong> {user.profile.phone}
            </div>
            <div>
              <strong>Address:</strong> {user.profile.address}
            </div>
            <div>
              <strong>PAN Number:</strong> {user.profile.pan_number}
            </div>
            <div>
              <strong>GST Number:</strong> {user.profile.gst_number}
            </div>
            <div>
              <strong>Business License:</strong> {user.profile.business_license}
            </div>
            <div>
              <strong>Insurance Certificate:</strong> {user.profile.insurance_certificate}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <h2 style={{ marginBottom: 16 }}>Uploaded Documents</h2>
            {renderPdfViewer("GST Certificate", user.profile.gst_certificate_path)}
            {renderPdfViewer(
              "Company Registration Certificate",
              user.profile.company_registration_doc_path
            )}
            {renderPdfViewer("Business License", user.profile.business_license_doc_path)}
            {renderPdfViewer("Insurance Certificate", user.profile.insurance_certificate_doc_path)}

            {!user.profile.gst_certificate_path &&
              !user.profile.company_registration_doc_path &&
              !user.profile.business_license_doc_path &&
              !user.profile.insurance_certificate_doc_path && (
                <div style={{ textAlign: "center", color: "#666", padding: 32 }}>
                  No documents uploaded yet.
                </div>
              )}
          </div>
        </>
      )}

      {isTrader && user.profile && (
        <>
          <h2 style={{ marginTop: 32 }}>Trader Profile</h2>
          <p>
            <strong>Company Name:</strong> {user.profile.company_name}
          </p>
          <p>
            <strong>Phone:</strong> {user.profile.phone}
          </p>
          <p>
            <strong>Address:</strong> {user.profile.address}
          </p>
        </>
      )}
    </div>
  );
}
