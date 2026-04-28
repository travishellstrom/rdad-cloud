export async function onRequest(context) {
  const { request, env, params } = context;

  const token = request.headers.get("X-Admin-Token");
  if (!token || token !== env.ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = params;

  if (request.method === "PATCH") {
    const body = await request.json();
    const { status, notes } = body;
    await env.RDAD_DB.prepare(
      "UPDATE assessments SET status = ?, notes = ? WHERE id = ?"
    ).bind(status || "pending", notes || "", id).run();
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (request.method === "DELETE") {
    await env.RDAD_DB.prepare("DELETE FROM assessments WHERE id = ?").bind(id).run();
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405, headers: { "Content-Type": "application/json" },
  });
}
