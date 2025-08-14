import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/bookings/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    })
      .then((res) => res.json())
      .then(setBooking)
      .catch(() => setError("Failed to fetch booking details"));
  }, [id]);

  if (error) return <div style={{ padding: 32, color: "red" }}>{error}</div>;
  if (!booking) return <div style={{ padding: 32 }}>Loading...</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        Booking #{booking.id}
      </h1>
      <div style={boxStyle}>
        <p><b>Status:</b> {booking.status}</p>
        <p><b>Container:</b> {booking.container_number}</p>
        <p><b>Exporter:</b> {booking.exporter_name} ({booking.exporter_email})</p>
        <p><b>Importer:</b> {booking.importer_name} ({booking.importer_email})</p>
      </div>
    </div>
  );
}

const boxStyle: React.CSSProperties = {
  background: "#fff",
  padding: 16,
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};
