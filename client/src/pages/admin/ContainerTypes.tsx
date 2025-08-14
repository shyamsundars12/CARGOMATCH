import { useEffect, useState } from "react";

export default function ContainerTypes() {
  const [types, setTypes] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [selectedType, setSelectedType] = useState<any | null>(null);
  const [form, setForm] = useState({
    type_name: "",
    size: "",
    capacity: "",
    description: "",
  });
  const [message, setMessage] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Fetch container types
  const fetchTypes = () => {
    setError("");
    fetch("/api/admin/container-types", {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(setTypes)
      .catch(() => setError("Failed to fetch container types"));
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  // When a row is clicked, select that type and fill form
  const handleRowClick = (type: any) => {
    setSelectedType(type);
    setForm({
      type_name: type.type_name || "",
      size: type.size || "",
      capacity: type.capacity || "",
      description: type.description || "",
    });
    setMessage("");
    setIsAddingNew(false);
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add new container type button handler
  const handleAddNew = () => {
    setSelectedType(null);
    setForm({
      type_name: "",
      size: "",
      capacity: "",
      description: "",
    });
    setMessage("");
    setIsAddingNew(true);
  };

  // Save (Add or Update) container type
  const handleSave = async () => {
    setMessage("");
    try {
      const url = isAddingNew
        ? "/api/admin/container-types"
        : `/api/admin/container-types/${selectedType.id}`;
      const method = isAddingNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }
      await res.json();
      setMessage(isAddingNew ? "Container type added successfully" : "Container type updated successfully");
      setSelectedType(null);
      setIsAddingNew(false);
      fetchTypes();
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  // Delete container type
  const handleDelete = async () => {
    if (!selectedType) return;
    if (!window.confirm("Are you sure you want to delete this container type?")) return;

    setMessage("");
    try {
      const res = await fetch(`/api/admin/container-types/${selectedType.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Delete failed");
      }
      setMessage("Container type deleted successfully");
      setSelectedType(null);
      fetchTypes();
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  // Cancel button handler: reset form and hide form area
  const handleCancel = () => {
    setSelectedType(null);
    setForm({
      type_name: "",
      size: "",
      capacity: "",
      description: "",
    });
    setMessage("");
    setIsAddingNew(false);
  };

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Container Types</h1>
      {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}

      <button
        onClick={handleAddNew}
        style={{
          marginBottom: 16,
          padding: "10px 16px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        + Add New Container Type
      </button>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Size</th>
          </tr>
        </thead>
        <tbody>
          {types.map((t) => (
            <tr
              key={t.id}
              onClick={() => handleRowClick(t)}
              style={{ cursor: "pointer", backgroundColor: selectedType?.id === t.id ? "#f0f4ff" : "transparent" }}
            >
              <td style={tdStyle}>{t.id}</td>
              <td style={tdStyle}>{t.type_name}</td>
              <td style={tdStyle}>{t.size}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {(selectedType !== null || isAddingNew) && (
        <div
          style={{
            marginTop: 32,
            background: "#fff",
            padding: 24,
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ marginBottom: 16 }}>
            {isAddingNew ? "Add New Container Type" : `Edit Container Type (ID: ${selectedType?.id})`}
          </h2>

          <label style={labelStyle}>Name</label>
          <input
            type="text"
            name="type_name"
            value={form.type_name}
            onChange={handleChange}
            style={inputStyle}
          />

          <label style={labelStyle}>Size</label>
          <input type="text" name="size" value={form.size} onChange={handleChange} style={inputStyle} />

          <label style={labelStyle}>Capacity</label>
          <input
            type="text"
            name="capacity"
            value={form.capacity}
            onChange={handleChange}
            style={inputStyle}
          />

          <label style={labelStyle}>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            style={{ ...inputStyle, height: 80 }}
          />

          {message && (
            <div style={{ marginTop: 16, color: message.toLowerCase().includes("failed") ? "red" : "green" }}>
              {message}
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <button
              onClick={handleSave}
              style={{
                marginRight: 12,
                background: "#2563eb",
                color: "#fff",
                padding: "10px 16px",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Save
            </button>

            {!isAddingNew && (
              <button
                onClick={handleDelete}
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            )}

            <button
              onClick={handleCancel}
              style={{
                marginLeft: 12,
                background: "#ddd",
                padding: "10px 16px",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const tableStyle: React.CSSProperties = {
  width: "100%",
  background: "#fff",
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  cursor: "default",
};
const thStyle: React.CSSProperties = { padding: 10, background: "#f4f6f8", textAlign: "left", fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: 10, borderTop: "1px solid #eee" };

const labelStyle: React.CSSProperties = { display: "block", marginTop: 12, marginBottom: 6, fontWeight: 600 };
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 4,
  border: "1px solid #ddd",
  fontSize: 14,
  boxSizing: "border-box",
};
