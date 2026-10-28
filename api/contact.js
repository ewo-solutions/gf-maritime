// Vercel serverless function: emails a website enquiry to GF Maritime through Resend (https://resend.com).
//
// Environment variables (Vercel → Project Settings → Environment Variables):
//   RESEND_API_KEY  required – Resend API key (without it the endpoint answers 503 and the site
//                   falls back to the visitor's email app, so no enquiry is ever lost)
//   CONTACT_TO      optional – recipient, default operations@gf-maritime.com
//   CONTACT_FROM    optional – sender, default "GF Maritime Website <website@gf-maritime.com>"
//                   (the domain must be verified in Resend)

const TO = process.env.CONTACT_TO || "operations@gf-maritime.com";
const FROM = process.env.CONTACT_FROM || "GF Maritime Website <website@gf-maritime.com>";

const ALLOWED_ORIGIN = /^(https:\/\/(www\.)?gf-maritime\.com|https:\/\/gf-maritime[a-z0-9-]*\.vercel\.app|http:\/\/localhost(:\d+)?)$/;
const MIN_FILL_MS = 2500; // humans take longer than this to fill the form

const LIMITS = { company: 120, firstName: 80, lastName: 80, email: 254, phone: 40, vessel: 80, imo: 7, requirement: 200, message: 4000 };

const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
const oneLine = (v) => String(v).replace(/[\r\n\t]+/g, " ").trim();
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function send(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "method_not_allowed" });
  }

  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGIN.test(origin)) return send(res, 403, { error: "forbidden" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || typeof body !== "object") return send(res, 400, { error: "invalid_body" });

  // Spam traps: a filled honeypot or an instant submission gets a fake "success" so bots learn nothing.
  const tooFast = !(Number(body.ts) > 0) || Date.now() - Number(body.ts) < MIN_FILL_MS;
  if (clean(body.website, 200) || tooFast) return send(res, 200, { ok: true });

  const f = {};
  for (const key of Object.keys(LIMITS)) f[key] = clean(body[key], LIMITS[key]);

  const errors = {};
  if (!f.firstName) errors.firstName = true;
  if (!f.lastName) errors.lastName = true;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errors.email = true;
  if (f.imo && !/^\d{7}$/.test(f.imo)) errors.imo = true;
  if (!f.message) errors.message = true;
  if (!body.consent) errors.consent = true;
  if (Object.keys(errors).length) return send(res, 400, { error: "validation", fields: Object.keys(errors) });

  if (!process.env.RESEND_API_KEY) return send(res, 503, { error: "not_configured" });

  const rows = [
    ["Company", f.company], ["Name", `${f.firstName} ${f.lastName}`], ["Email", f.email], ["Contact number", f.phone],
    ["Vessel name", f.vessel], ["IMO number", f.imo], ["Port/Canal requirement", f.requirement],
  ];
  const text = rows.map(([k, v]) => `${k}: ${v || "-"}`).join("\n") + `\n\nMessage:\n${f.message}\n\n--\nSent from the gf-maritime.com contact form. The sender consented to GF Maritime retaining their details and sending relevant updates.`;
  const html =
    `<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px">` +
    rows.map(([k, v]) => `<tr><td style="color:#555"><b>${esc(k)}</b></td><td>${esc(v || "-")}</td></tr>`).join("") +
    `</table><p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap"><b>Message</b><br>${esc(f.message)}</p>` +
    `<p style="font-family:Arial,sans-serif;font-size:12px;color:#777">Sent from the gf-maritime.com contact form. The sender consented to GF Maritime retaining their details and sending relevant updates.</p>`;

  const subject = oneLine(`Website enquiry – ${f.vessel || f.company || `${f.firstName} ${f.lastName}`}`).slice(0, 120);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [TO], reply_to: f.email, subject, text, html }),
      signal: ctrl.signal,
    });
    if (!r.ok) {
      console.error("Resend error", r.status, (await r.text()).slice(0, 500));
      return send(res, 502, { error: "send_failed" });
    }
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error("Resend request failed", e && e.name);
    return send(res, 502, { error: "send_failed" });
  } finally {
    clearTimeout(timer);
  }
};
