/* Plain-text editorial overrides. Authorization is enforced by the database. */
(() => {
  'use strict';
  const records = new Map(), defaults = new Map();
  let allowed = false, editing = false, busy = false, active = null;
  const toolbar = document.getElementById('text-editor-toolbar');
  const toggle = document.getElementById('toggle-text-editor');
  const status = document.getElementById('text-editor-status');
  const dialog = document.createElement('dialog');
  dialog.className = 'text-edit-dialog';
  dialog.innerHTML = '<form><h2>Text bearbeiten</h2><label for="trip-edit-text">Text</label><textarea id="trip-edit-text" maxlength="12000" rows="9"></textarea><p class="muted">**Fett** · Links: [Bezeichnung](https://…) · Leer lassen blendet den Text aus.</p><p id="trip-edit-error" role="alert"></p><div class="edit-actions"><button type="submit">Speichern</button><button type="button" data-cancel class="secondary">Abbrechen</button><button type="button" data-reset class="secondary">Original wiederherstellen</button></div></form>';
  document.body.append(dialog);
  const input = dialog.querySelector('textarea'), error = dialog.querySelector('[role=alert]');
  function markdown(node) {
    if (node.nodeType === 3) return node.textContent;
    const text = [...node.childNodes].map(markdown).join('');
    if (node.tagName === 'BR') return '\n';
    if (node.tagName === 'A') return '[' + text + '](' + node.getAttribute('href') + ')';
    if (['B', 'STRONG'].includes(node.tagName)) return '**' + text + '**';
    return text;
  }
  function safeHref(href) {
    if (/^#[a-zA-Z0-9_-]+$/.test(href)) return href;
    try { const u = new URL(href); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; } catch { return null; }
  }
  function renderText(node, text) {
    node.replaceChildren();
    const tokens = /(\*\*([^*]+)\*\*|\[([^\]\n]+)\]\(([^\s)]+)\)|\n)/g;
    let cursor = 0;
    for (const match of text.matchAll(tokens)) {
      node.append(document.createTextNode(text.slice(cursor, match.index)));
      let child;
      if (match[0] === '\n') child = document.createElement('br');
      else if (match[2]) { child = document.createElement('strong'); child.textContent = match[2]; }
      else if (safeHref(match[4])) {
        child = document.createElement('a'); child.textContent = match[3]; child.href = safeHref(match[4]);
        if (!match[4].startsWith('#')) { child.target = '_blank'; child.rel = 'noopener noreferrer'; }
      } else child = document.createTextNode(match[0]);
      node.append(child); cursor = match.index + match[0].length;
    }
    node.append(document.createTextNode(text.slice(cursor)));
  }
  function refresh() {
    document.querySelectorAll('[data-edit-key]').forEach(node => {
      const key = node.dataset.editKey;
      if (!defaults.has(key)) defaults.set(key, {html: node.innerHTML, text: markdown(node)});
      const record = records.get(key);
      if (record?.content != null) renderText(node, record.content);
      else if (record) node.innerHTML = defaults.get(key).html;
      node.classList.toggle('editable-text', editing);
      let button = node.nextElementSibling;
      if (!button?.classList.contains('edit-text-button')) {
        button = document.createElement('button'); button.type = 'button'; button.className = 'edit-text-button secondary';
        button.textContent = '✎ Bearbeiten'; button.setAttribute('aria-label', 'Text bearbeiten: ' + defaults.get(key).text.slice(0, 65));
        button.addEventListener('click', () => open(key)); node.after(button);
      }
      button.hidden = !editing || !record;
    });
  }
  async function load() {
    const result = await sb.from('trip_text_content').select('content_key,content,revision').eq('site_id', 'kufstein-2026');
    if (result.error) throw result.error;
    records.clear(); for (const row of result.data) records.set(row.content_key, row);
    refresh();
  }
  async function authorize() {
    try {
      const result = await sb.rpc('get_group_member_directory');
      allowed = !result.error && result.data?.can_manage === true;
    } catch { allowed = false; }
    toolbar.hidden = !allowed;
    if (!allowed) { editing = false; refresh(); }
  }
  function open(key) {
    if (!allowed || busy || !records.has(key)) return;
    active = {key, revision: records.get(key).revision};
    input.value = records.get(key).content ?? defaults.get(key).text;
    error.textContent = ''; dialog.showModal(); input.focus();
  }
  async function save(reset = false) {
    if (busy || !active || !allowed) return;
    busy = true; error.textContent = '';
    dialog.querySelectorAll('button').forEach(b => b.disabled = true); input.disabled = true;
    try {
      const result = await sb.rpc('save_trip_text', {p_site_id: 'kufstein-2026', p_content_key: active.key, p_content: reset ? null : input.value, p_revision: active.revision});
      if (result.error) throw result.error;
      records.set(active.key, result.data); refresh(); dialog.close(); status.textContent = 'Gespeichert – für alle sichtbar.';
    } catch (e) { error.textContent = e.message || 'Speichern fehlgeschlagen. Dein Text bleibt erhalten.'; }
    finally { busy = false; input.disabled = false; dialog.querySelectorAll('button').forEach(b => b.disabled = false); }
  }
  toggle.addEventListener('click', async () => {
    try { await load(); editing = !editing; toggle.setAttribute('aria-pressed', String(editing)); toggle.textContent = editing ? '✓ Bearbeitung beenden' : '✎ Texte bearbeiten'; status.textContent = editing ? 'Beim gewünschten Text auf Bearbeiten tippen.' : ''; refresh(); }
    catch { status.textContent = 'Texte konnten nicht geladen werden. Bitte erneut versuchen.'; }
  });
  dialog.querySelector('form').addEventListener('submit', e => { e.preventDefault(); save(); });
  dialog.querySelector('[data-cancel]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-reset]').addEventListener('click', () => { if (confirm('Diesen Text auf das Original zurücksetzen?')) save(true); });
  dialog.addEventListener('cancel', e => { if (busy) e.preventDefault(); });
  window.tripTextEditor = {refresh, authorize};
  if (typeof sb !== 'undefined' && sb) {
    load().catch(() => { status.textContent = 'Gespeicherte Texte konnten nicht geladen werden. Bitte neu laden.'; });
    authorize();
    sb.auth.onAuthStateChange(() => { setTimeout(authorize, 0); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !dialog.open) load().catch(() => {}); });
  }
})();
