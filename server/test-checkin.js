require("dotenv").config();

async function testCheckin() {
  console.log("🧪 Testing Gatekeeper Check-In API locally...");
  const res = await fetch("http://localhost:4000/api/gatekeeper/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ticketId: "MM26-79A7F0",
      adminKey: "admin_gatekeeper",
      adminSecret: "MM26_Gatekeeper_Secret_99!",
    }),
  });

  const data = await res.json();
  console.log("HTTP Status:", res.status);
  console.log("Response:", data);
}

testCheckin();
