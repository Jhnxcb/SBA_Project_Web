const { createHmac } = require("node:crypto");

const topics = ["Admissions", "Academic Programs", "News & Events", "Other"];
const fields = { name: 120, email: 254, phone: 40, topic: 40, message: 3000 };

module.exports = async function inquiry(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false });
  }

  const { SBA_INQUIRY_SCRIPT_URL: url, SBA_INQUIRY_SECRET: secret } = process.env;
  if (!secret || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url ?? "")) {
    return res.status(503).json({ ok: false, code: "unavailable" });
  }

  const body = req.body;
  if (!body || typeof body !== "object" || !/^[a-f0-9-]{36}$/i.test(body.requestId ?? "")) {
    return res.status(400).json({ ok: false, code: "invalid" });
  }

  const submission = {};
  for (const [name, maxLength] of Object.entries(fields)) {
    const value = body[name];
    if (typeof value !== "string" || value.length > maxLength || (name !== "phone" && !value.trim())) {
      return res.status(400).json({ ok: false, code: "invalid" });
    }
    submission[name] = value.trim();
  }
  if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(submission.email) || !topics.includes(submission.topic)) {
    return res.status(400).json({ ok: false, code: "invalid" });
  }

  const client = req.headers["x-vercel-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  const clientKey = createHmac("sha256", secret).update(String(client)).digest("hex");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...submission, requestId: body.requestId, clientKey, secret }),
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return res.status(502).json({ ok: false });
    const result = await response.json();
    if (result.ok === true) return res.status(200).json({ ok: true, confirmationSent: result.confirmationSent === true });
    if (result.code === "rate_limit") return res.status(429).json({ ok: false, code: "rate_limit" });
    return res.status(503).json({ ok: false, code: "unavailable" });
  } catch {
    return res.status(502).json({ ok: false });
  }
};
