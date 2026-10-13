export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname === '/api/acceptance') {
      const row = await env.DB.prepare(
        'SELECT marker FROM acceptance_marker WHERE id = 1'
      ).first();
      const ready = row?.marker === 'workspace-builder-canary-20261010';
      return Response.json({ fixture: 'workspace-builder-canary-20261010', ready },
        { status: ready ? 200 : 503 });
    }
    return env.ASSETS.fetch(request);
  }
};
