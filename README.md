# 🚚 CargoMatch — Logistics Booking Platform

CargoMatch is an end-to-end logistics booking platform that connects Importers/Exporters with Logistics Service Providers (LSPs). It enables smooth container booking, shipment management, and payment processing—all with a clean, scalable architecture.

---

## 📦 Key Functionalities

- Role-based platform for Admin, LSPs, and Importers/Exporters
- Container listing and management (Air/Ship)
- Auto-approved bookings using best-fit bin packing logic
- Live container space tracking (volume/weight)
- Real-time shipment status updates
- Booking cancellation policies
- Complaint and notification modules
- Integrated payment gateway using Razorpay

---

## 🧑‍💻 Tech Stack

| Layer         | Technology                    |
|---------------|-------------------------------|
| Backend       | Node.js + Express (Raw SQL)   |
| Database      | PostgreSQL                    |
| Frontend      | React.js                      |
| Mobile App    | Flutter (for Importer/Exporter)|
| Auth          | JWT (JSON Web Tokens)         |
| Payments      | Razorpay                      |
| Realtime Notification | Firebase Cloud Messaging (FCM) |

---

## 👥 User Roles

- 🛡️ Admin: Approves LSPs, handles complaints, views analytics
- 🚛 LSP: Manages containers, bookings, shipment statuses
- 🌐 Importer/Exporter: Books containers, makes payments, tracks shipments

---

## ⚙️ Core Workflows

- LSPs list containers with pricing, capacity, and routes
- Importer/Exporter books a container (auto-approved if available)
- Backend updates live capacity and shipment data
- Admin oversees platform and handles issues
- Notifications sent on key actions (via FCM)
- Payments processed through Razorpay

---

## 📈 Business Model

- Commission on each booking
- Premium listing or subscription plans for LSPs

---

## 🔒 Auth & Security

- JWT-based authentication
- Role-based route access
- Passwords hashed using bcrypt
- CORS and environment-based configuration

---

## 🏁 Project Modules

- Authentication Module
- Container Management (LSP)
- Booking Management (Importer/Exporter)
- Shipment Tracking (LSP)
- Admin Oversight (Approvals, Reports, Complaints)
- Notifications System (via FCM)
- Razorpay Payment Gateway

---

## 📄 License

MIT License © 2025 CargoMatch Team
