export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const body = await request.json();
    const { name, email, dream, momentum, impact, timeline } = body;

    if (!name || !email || !dream) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers,
      });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Save to D1
    await env.RDAD_DB.prepare(
      `INSERT INTO assessments (id, name, email, dream, momentum, impact, timeline, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
    ).bind(id, name, email, dream, momentum || "", impact || "", timeline || "", now).run();

    // Notify grants@rdad.org
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "RDAD Foundation <grants@rdad.org>",
        to: ["grants@rdad.org"],
        subject: `New Assessment: ${name}`,
        html: `
          <h2 style="color:#1A3A5C;">New RDAD Assessment Submission</h2>
          <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;">
            <tr><td style="padding:8px;font-weight:bold;width:140px;">Name</td><td style="padding:8px;">${name}</td></tr>
            <tr style="background:#f8f7f4;"><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Dream</td><td style="padding:8px;">${dream}</td></tr>
            <tr style="background:#f8f7f4;"><td style="padding:8px;font-weight:bold;">Momentum</td><td style="padding:8px;">${momentum}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">$5K Impact</td><td style="padding:8px;">${impact}</td></tr>
            <tr style="background:#f8f7f4;"><td style="padding:8px;font-weight:bold;">Timeline</td><td style="padding:8px;">${timeline}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Submitted</td><td style="padding:8px;">${now}</td></tr>
          </table>
          <p style="margin-top:20px;"><a href="https://cloud.rdad.org/admin.html" style="background:#E8A020;color:#0A1628;padding:10px 20px;text-decoration:none;border-radius:4px;font-weight:bold;">View in Admin Panel</a></p>
        `,
      }),
    });

    // Confirmation to applicant
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "RDAD Foundation <grants@rdad.org>",
        to: [email],
        subject: "We received your assessment — RDAD Foundation",
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111;">
            <p style="font-size:16px;">Hi ${name},</p>
            <p style="font-size:15px;line-height:1.7;color:#444;">Thank you for submitting your assessment to the Runnin' Down a Dream Foundation.</p>
            <p style="font-size:15px;line-height:1.7;color:#444;">Our team reads every response personally. If your application is a strong fit, you'll receive an email from <strong>grants@rdad.org</strong> with a private link to the full grant application within 2–3 weeks.</p>
            <p style="font-size:15px;line-height:1.7;color:#444;">Keep chasing it.</p>
            <p style="font-size:15px;margin-top:24px;">— The RDAD Team</p>
            <hr style="border:none;border-top:1px solid #e0ded8;margin:32px 0;">
            <p style="font-size:12px;color:#999;">Runnin' Down a Dream Foundation · <a href="https://rdad.org" style="color:#1A3A5C;">rdad.org</a> · grants@rdad.org</p>
          </div>
        `,
      }),
    });

    return new Response(JSON.stringify({ ok: true, id }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
