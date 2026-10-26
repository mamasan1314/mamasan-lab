// Outputs only connection metadata. Never print raw API bodies or credentials.
const { randomUUID } = require('node:crypto');
const { connectHopeBoxApi, openHopeBoxApi } = require('../lib/hopebox-api.cjs');

async function main() {
  const action = process.argv[2] || 'status';
  if (action === 'connect') {
    console.log(JSON.stringify({ action, ...await connectHopeBoxApi() }));
    return;
  }
  if (!['status', 'verify-write', 'mcp'].includes(action)) throw new Error('Use connect, status, verify-write, or mcp.');
  const api = openHopeBoxApi();
  if (action === 'status') {
    const { data: me } = await api.request('/wp/v2/users/me?context=edit');
    console.log(JSON.stringify({ ok: true, action, roles: me.roles, editPages: !!me.capabilities?.edit_pages, manageOptions: !!me.capabilities?.manage_options }));
  }
  if (action === 'verify-write') {
    const slug = 'hopebox-api-check-' + randomUUID();
    let draft;
    try {
      ({ data: draft } = await api.request('/wp/v2/pages', { method: 'POST', body: {
        status: 'draft', slug, title: 'HopeBox API connection check', content: 'Temporary connection check.',
      } }));
      const { data: changed } = await api.request('/wp/v2/pages/' + draft.id, { method: 'POST', body: { content: 'API update verified.' } });
      const { data: reread } = await api.request('/wp/v2/pages/' + draft.id + '?context=edit');
      if (changed.status !== 'draft' || reread.content?.raw !== 'API update verified.' || reread.slug !== slug) {
        throw new Error('Draft update could not be verified.');
      }
      console.log(JSON.stringify({ ok: true, action, draftId: draft.id, create: true, update: true, readback: true, published: false }));
    } finally {
      if (draft?.id) {
        const { data: owned } = await api.request('/wp/v2/pages/' + draft.id + '?context=edit');
        if (owned.slug !== slug || owned.status !== 'draft') throw new Error('Temporary draft cleanup requires inspection.');
        const { data: removed } = await api.request('/wp/v2/pages/' + draft.id + '?force=true', { method: 'DELETE' });
        if (!removed.deleted) throw new Error('Temporary draft cleanup could not be verified.');
        console.log(JSON.stringify({ action: 'cleanup', draftId: draft.id, deleted: true }));
      }
    }
  }
  if (action === 'mcp') {
    const route = '/mcp/mcp-adapter-default-server';
    const headers = { Accept: 'application/json, text/event-stream' };
    const initial = await api.request(route, { method: 'POST', headers, body: {
      jsonrpc: '2.0', id: 1, method: 'initialize', params: {
        protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'hopelight-api', version: '1.0.0' },
      },
    } });
    if (initial.data?.error || !initial.data?.result) throw new Error('MCP initialization failed.');
    const sid = initial.headers.get('mcp-session-id');
    if (sid) headers['Mcp-Session-Id'] = sid;
    headers['MCP-Protocol-Version'] = initial.data.result.protocolVersion;
    await api.request(route, { method: 'POST', headers, body: { jsonrpc: '2.0', method: 'notifications/initialized' } });
    const { data: list } = await api.request(route, { method: 'POST', headers, body: { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} } });
    if (list?.error || !Array.isArray(list?.result?.tools)) throw new Error('MCP tool listing failed.');
    const { data: abilities } = await api.request(route, { method: 'POST', headers, body: {
      jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'mcp-adapter-discover-abilities', arguments: {} },
    } });
    const texts = abilities.result?.content?.filter(c => c.type === 'text').map(c => c.text).join('\n') || '';
    let catalog;
    try { catalog = JSON.parse(texts); } catch { catalog = null; }
    const entries = Array.isArray(catalog) ? catalog : catalog?.abilities;
    console.log(JSON.stringify({ ok: !abilities.error && !abilities.result?.isError, action,
      server: initial.data.result.serverInfo, tools: list.result.tools.map(t => t.name),
      discoverySucceeded: !!texts,
      abilities: Array.isArray(entries) ? entries.map(a => a.name || a.ability_name).filter(Boolean) : [],
    }));
  }
}

main().catch(() => {
  console.error('HopeBox API operation failed; no credential or API response was logged.');
  process.exitCode = 1;
});
