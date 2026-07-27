// TuxeWorld H5 | ui/sheet.js | Bảng nổi giữa màn hình, có thể chia tab
import { esc } from '../util.js';

// tabs = [{ id, name, draw(box, api) }]; api = { close, redraw, go }
export function openSheet({ title, tabs, tab: startTab, onClose } = {}) {
  const list = (tabs || []).filter(Boolean);
  if (!list.length) return null;
  let tab = list.some(t => t.id === startTab) ? startTab : list[0].id;

  const wrap = document.getElementById('modal-wrap');
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="sheet" role="dialog" aria-label="${esc(title || '')}">
      <div class="sheet-head">
        <b>${esc(title || '')}</b>
        <button type="button" class="sheet-x" aria-label="Đóng">×</button>
      </div>
      ${list.length > 1 ? `<div class="tab-row sheet-tabs">
        ${list.map(t => `<button type="button" class="tab-btn" data-tab="${esc(t.id)}">${esc(t.name)}</button>`).join('')}
      </div>` : ''}
      <div class="sheet-body"></div>
    </div>`;

  const box = overlay.querySelector('.sheet-body');
  let closed = false;
  const api = {
    close() {
      if (closed) return;
      closed = true;
      overlay.classList.remove('in');
      setTimeout(() => overlay.remove(), 180);
      onClose?.();
    },
    redraw() { draw(); },
    go(id) { if (list.some(t => t.id === id)) { tab = id; draw(); } },
  };

  function draw() {
    overlay.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    box.innerHTML = '';
    list.find(t => t.id === tab)?.draw(box, api);
  }

  overlay.addEventListener('click', e => {
    const t = e.target.closest('.tab-btn');
    if (t) { tab = t.dataset.tab; draw(); return; }
    if (e.target.closest('.sheet-x') || e.target === overlay) api.close();
  });

  wrap.appendChild(overlay);
  draw();
  requestAnimationFrame(() => overlay.classList.add('in'));
  return api;
}
