// TuxeWorld H5 | ui/kit.js | Bộ helper UI dùng chung: toast, modal chọn, thanh HP, badge hệ
import { esc } from '../util.js';
import { ITEMS, itemIconPath } from '../data/items.js';
import { TYPE_VI, TYPE_COLORS } from '../data/types.js';
import { statusIcon } from './icons.js';

export function toast(msg, ms = 2200) {
  const wrap = document.getElementById('toast-wrap');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, ms);
}

// Modal chọn 1 trong nhiều lựa chọn.
// options = [{label, sub?, disabled?}] -> Promise<index | null (đóng)>
export function choose(title, options, { cancelable = true } = {}) {
  return new Promise(resolve => {
    const wrap = document.getElementById('modal-wrap');
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-title">${esc(title)}</div>
        <div class="modal-opts">
          ${options.map((o, i) => `
            <button class="modal-opt" data-i="${i}" ${o.disabled ? 'disabled' : ''}>
              <span>${o.html || esc(o.label)}</span>
              ${o.sub ? `<small>${esc(o.sub)}</small>` : ''}
            </button>`).join('')}
        </div>
        ${cancelable ? '<button class="modal-cancel">Đóng</button>' : ''}
      </div>`;
    const close = (val) => { overlay.remove(); resolve(val); };
    overlay.addEventListener('click', e => {
      const btn = e.target.closest('.modal-opt');
      if (btn) return close(Number(btn.dataset.i));
      if (e.target.closest('.modal-cancel')) return close(null);
      if (cancelable && e.target === overlay) return close(null);
    });
    wrap.appendChild(overlay);
  });
}

// Hộp xác nhận. Trả Promise<boolean>
export async function confirmDlg(msg, okLabel = 'Đồng ý') {
  const r = await choose(msg, [{ label: okLabel }, { label: 'Hủy' }], { cancelable: true });
  return r === 0;
}

// Thanh HP: trả HTML. Màu đổi theo % (xanh > vàng > đỏ)
export function hpBar(cur, max) {
  const pct = Math.max(0, Math.min(100, Math.round(cur / Math.max(1, max) * 100)));
  const cls = pct > 50 ? 'hp-hi' : pct > 20 ? 'hp-mid' : 'hp-lo';
  return `<div class="hpbar"><div class="hpbar-fill ${cls}" style="width:${pct}%"></div></div>`;
}

// Icon vật phẩm: ảnh nằm ngay trong dự án nên không cần mạng. Không có ảnh thì bỏ trống.
// Tham số 2 giữ lại cho tương thích chữ ký cũ (trước đây là emoji) — nay ảnh lỗi thì ẩn hẳn.
export function itemIcon(itemId, _legacy = '', size = 26) {
  if (!ITEMS[itemId]) return '';
  const local = itemIconPath(itemId);
  return `<span class="item-ico"><img class="px-icon" src="${local}" width="${size}" height="${size}" alt=""
    onerror="this.style.visibility='hidden'"></span>`;
}

// Chèn ảnh asset local, tự ẩn khi lỗi (không bao giờ rơi về emoji)
export function assetIcon(path, size = 22, alt = '') {
  return `<span class="asset-ico"><img src="${path}" width="${size}" height="${size}" alt="${esc(alt)}"
    onerror="this.style.visibility='hidden'"></span>`;
}

// Inline CSS vars cho card holo: gradient theo hệ của Tuxemon (pha tím galaxy trong CSS)
export function holoStyle(types = []) {
  const c1 = TYPE_COLORS[types[0]] || '#7048e8';
  const c2 = TYPE_COLORS[types[1] || types[0]] || c1;
  return `--t1:${c1};--t2:${c2}`;
}

// Badge hệ: icon 13 hệ của Tuxemon + tên tiếng Việt, nền màu hệ
export function typeBadge(t) {
  const c = TYPE_COLORS[t] || '#888';
  return `<span class="type-badge type-${esc(t)}" style="--tc:${c};background:${c}"
    ><img class="type-ico" src="assets/types/${esc(t)}.png" width="22" height="22" alt=""
      onerror="this.style.display='none'"><span class="type-name">${TYPE_VI[t] || t}</span></span>`;
}

// Header màn hình có nút back tùy chọn (onBack = hàm hoặc null)
export function header(title, backTo = null) {
  return `<div class="scr-head">
    ${backTo ? `<button class="btn-back" data-goto="${backTo}">‹</button>` : ''}
    <h1>${esc(title)}</h1>
  </div>`;
}

// Thẻ trạng thái (brn/psn/slp/par/frz) — icon lấy thẳng từ bộ ảnh của Tuxemon
export function statusTag(st) {
  if (!st) return '';
  const map = { brn: ['BỎNG', '#e8590c'], psn: ['ĐỘC', '#9c36b5'], slp: ['NGỦ', '#868e96'], par: ['TÊ', '#f0b429'], frz: ['BĂNG', '#3bc9db'] };
  const [label, color] = map[st] || [st, '#888'];
  return `<span class="status-tag" style="background:${color}">${statusIcon(st)}${label}</span>`;
}
