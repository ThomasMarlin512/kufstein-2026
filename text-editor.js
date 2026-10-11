/* Plain-text editorial overrides. Authorization is enforced by the database. */
(() => {
  'use strict';
  const records = new Map(), defaults = new Map();
  let allowed = false, busy = false, active = null, editing = false;
  const toggle = document.getElementById('edit-mode-toggle'), bar = document.getElementById('edit-mode-bar');
  function syncMode() {
    if (!allowed) editing = false;
    if (bar) bar.hidden = !allowed;
    if (toggle) {
      toggle.hidden = !allowed;
      toggle.setAttribute('aria-pressed', String(editing));
      toggle.innerHTML=editing?'<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" focusable="false"><path d="m5 12 4 4L19 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Fertig</span>':'<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" focusable="false"><path d="m15 5 4 4M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15l-1 6Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Bearbeiten</span>';toggle.setAttribute('aria-label',editing?'Bearbeitung beenden':'Bearbeitungsmodus einschalten');toggle.title=toggle.getAttribute('aria-label');
    }
    document.body.classList.toggle('is-editing', editing);
  }
  toggle?.addEventListener('click', () => {
    if (busy || dialog.open || window.tripActivityEditor?.isOpen()) return;
    editing = allowed && !editing;
    refresh();
  });
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
    syncMode();
    document.querySelectorAll('[data-edit-key]').forEach(node => {
      const key = node.dataset.editKey;
      if(window.tripActivityEditor?.ownsField(key)){
        node.querySelectorAll('.edit-text-button').forEach(button=>button.remove());node.classList.remove('editable-text');return;
      }
      if (!defaults.has(key)) defaults.set(key, {html: node.innerHTML, text: markdown(node)});
      const record = records.get(key);
      if (record?.content != null) renderText(node, record.content);
      else if (record) node.innerHTML = defaults.get(key).html;
      node.querySelectorAll('.edit-text-button').forEach(button => button.remove());
      node.classList.toggle('editable-text', allowed && editing && !!record);
      if (allowed && editing && record) {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'edit-text-button';
        button.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="m15 5 4 4M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15l-1 6Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        button.title = 'Text bearbeiten';
        button.setAttribute('aria-label', 'Text bearbeiten: ' + defaults.get(key).text.slice(0, 65));
        button.addEventListener('click', () => open(key)); node.append(button);
      }
    });
    window.tripActivityEditor?.refresh();
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
    refresh();
    if (!allowed && dialog.open) dialog.close();
  }
  function open(key) {
    if (!allowed || !editing || busy || !records.has(key)) return;
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
      setTimeout(() => { status.textContent = ''; }, 4000);
    } catch (e) { error.textContent = e.message || 'Speichern fehlgeschlagen. Dein Text bleibt erhalten.'; }
    finally { busy = false; input.disabled = false; dialog.querySelectorAll('button').forEach(b => b.disabled = false); }
  }
  dialog.querySelector('form').addEventListener('submit', e => { e.preventDefault(); save(); });
  dialog.querySelector('[data-cancel]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-reset]').addEventListener('click', () => { if (confirm('Diesen Text auf das Original zurücksetzen?')) save(true); });
  dialog.addEventListener('close', () => {
    if (active) [...document.querySelectorAll('[data-edit-key]')].find(node => node.dataset.editKey === active.key)?.querySelector('.edit-text-button')?.focus();
  });
  dialog.addEventListener('cancel', e => { if (busy) e.preventDefault(); });
  window.tripTextEditor = {refresh, authorize, canEdit:()=>allowed};
  if (typeof sb !== 'undefined' && sb) {
    load().catch(() => { status.textContent = 'Gespeicherte Texte konnten nicht geladen werden. Bitte neu laden.'; });
    authorize();
    sb.auth.onAuthStateChange(() => { setTimeout(authorize, 0); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !dialog.open) load().catch(() => {}); });
  }
})();
