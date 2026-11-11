/* The Colorify colour picker, as handed over (colorify-picker.zip): vanilla
   JS, no dependencies. Unchanged except the export at the end, so React
   code can import it. PaletteTool.tsx creates one shared instance. */
/* ═══════════════════════════════════════════════════════════════
   ColorPicker — drop-in, zero-dependency
   const cp = new ColorPicker({ onChange: c => ..., onClose: c => ... });
   cp.open(anchorEl, '#F9F2F1');
   c = { hex:'#F9F2F1', rgb:[r,g,b], hsl:[h,s,l], cmyk:[c,m,y,k], hsv:[h,s,v] }
   ═══════════════════════════════════════════════════════════════ */
class ColorPicker {
  constructor({ onChange = () => {}, onClose = () => {} } = {}) {
    this.onChange = onChange; this.onClose = onClose;
    this.h = 0; this.s = 0; this.v = 1; this.initial = '#FFFFFF';
    this._build(); this._bind();
  }

  /* ── colour math ── */
  static hsvToRgb(h, s, v) {
    const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
    return [f(5), f(3), f(1)].map(x => Math.round(x * 255));
  }
  static rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), d = mx - Math.min(r, g, b);
    let h = 0;
    if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx];
  }
  static rgbToHsl(r, g, b) {
    const [h] = ColorPicker.rgbToHsv(r, g, b);
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
    return [h, s * 100, l * 100];
  }
  static rgbToCmyk(r, g, b) {
    const k = 1 - Math.max(r, g, b) / 255;
    if (k >= 1) return [0, 0, 0, 100];
    return [r, g, b].map(x => ((1 - x / 255 - k) / (1 - k)) * 100).concat(k * 100);
  }
  static cmykToRgb(c, m, y, k) {
    return [c, m, y].map(x => Math.round(255 * (1 - x / 100) * (1 - k / 100)));
  }
  static hex(rgb) { return '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase(); }

  /* Parses hex, rgb(), hsl(), cmyk(), or bare "r g b" — returns [h,s,v] or null */
  static parse(str) {
    str = String(str).trim().toLowerCase();
    let m = str.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (m) {
      let x = m[1]; if (x.length === 3) x = [...x].map(c => c + c).join('');
      return ColorPicker.rgbToHsv(...[0, 2, 4].map(i => parseInt(x.substr(i, 2), 16)));
    }
    const nums = (str.match(/-?\d*\.?\d+/g) || []).map(Number);
    if (str.startsWith('hsl') && nums.length >= 3) return ColorPicker.hslToHsv(...nums);
    if (str.startsWith('cmyk') && nums.length >= 4) return ColorPicker.rgbToHsv(...ColorPicker.cmykToRgb(...nums));
    if ((str.startsWith('rgb') || /^[\d.\s,]+$/.test(str)) && nums.length >= 3)
      return ColorPicker.rgbToHsv(...nums.slice(0, 3).map(n => Math.max(0, Math.min(255, n))));
    return null;
  }
  static hslToHsv(h, s, l) {
    s /= 100; l /= 100;
    const v = l + s * Math.min(l, 1 - l);
    return [((h % 360) + 360) % 360, v ? 2 * (1 - l / v) : 0, v];
  }

  get color() {
    const rgb = ColorPicker.hsvToRgb(this.h, this.s, this.v);
    return {
      hex: ColorPicker.hex(rgb), rgb,
      hsl: ColorPicker.rgbToHsl(...rgb).map(Math.round),
      cmyk: ColorPicker.rgbToCmyk(...rgb).map(Math.round),
      hsv: [Math.round(this.h), Math.round(this.s * 100), Math.round(this.v * 100)]
    };
  }

  /* ── DOM ── */
  _build() {
    const ico = {
      drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/></svg>',
      x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
      copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
      check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
    };
    this.icons = ico;
    this.groups = {
      hex:  { label: 'HEX',  subs: [''], max: [] },
      rgb:  { label: 'RGB',  subs: ['R', 'G', 'B'], max: [255, 255, 255] },
      hsl:  { label: 'HSL',  subs: ['H', 'S', 'L'], max: [360, 100, 100] },
      cmyk: { label: 'CMYK', subs: ['C', 'M', 'Y', 'K'], max: [100, 100, 100, 100] }
    };
    const rows = Object.entries(this.groups).map(([key, g]) => `
      <div class="cp-row" data-g="${key}">
        <div class="cp-label">${g.label}</div>
        <div class="cp-fields n${g.subs.length}">
          ${g.subs.map((s, i) => `
            <label class="cp-field ${key === 'hex' ? 'hex' : ''}">
              <input data-g="${key}" data-i="${i}" spellcheck="false" autocomplete="off"
                ${key === 'hex' ? 'maxlength="32"' : 'inputmode="numeric"'} aria-label="${g.label} ${s}">
              ${s ? `<span class="cp-sub" data-g="${key}" data-i="${i}" title="Drag to scrub">${s}</span>` : ''}
            </label>`).join('')}
        </div>
        <button class="cp-copy" data-copy="${key}" title="Copy ${g.label}">${ico.copy}</button>
      </div>`).join('');

    const el = document.createElement('div');
    el.className = 'cp'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Color picker');
    el.innerHTML = `
      <div class="cp-head">
        <div class="cp-compare">
          <button class="cp-prev" title="Revert to original"></button>
          <button class="cp-next" tabindex="-1"></button>
        </div>
        <button class="cp-icon cp-eye" title="Pick from screen">${ico.drop}</button>
        <button class="cp-icon cp-close" title="Close (Esc)">${ico.x}</button>
      </div>
      <div class="cp-wheel-wrap">
        <div class="cp-wheel" tabindex="0" role="slider" aria-label="Hue and saturation">
          <div class="cp-shade"></div><div class="cp-handle"></div>
        </div>
      </div>
      <div class="cp-slider" tabindex="0" role="slider" aria-label="Brightness" aria-valuemin="0" aria-valuemax="100"><div class="cp-thumb"></div></div>
      <div class="cp-rows">${rows}</div>
      <div class="cp-hint">Paste any HEX · RGB · HSL · CMYK into HEX</div>`;
    document.body.appendChild(el);

    const q = s => el.querySelector(s);
    this.el = el;
    this.$ = { wheel: q('.cp-wheel'), shade: q('.cp-shade'), handle: q('.cp-handle'), slider: q('.cp-slider'),
      thumb: q('.cp-thumb'), prev: q('.cp-prev'), next: q('.cp-next'), eye: q('.cp-eye'), close: q('.cp-close'),
      inputs: [...el.querySelectorAll('input')] };
    if (!('EyeDropper' in window)) this.$.eye.style.display = 'none';
  }

  _bind() {
    const { wheel, slider, prev, eye, close, inputs } = this.$;

    // Drag helper with pointer capture
    const drag = (node, fn) => {
      node.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        node.setPointerCapture(e.pointerId); node.classList.add('dragging'); fn(e); e.preventDefault(); node.focus();
        const move = ev => fn(ev);
        const up = () => { node.classList.remove('dragging'); node.removeEventListener('pointermove', move); node.removeEventListener('pointerup', up); node.removeEventListener('pointercancel', up); };
        node.addEventListener('pointermove', move); node.addEventListener('pointerup', up); node.addEventListener('pointercancel', up);
      });
    };

    drag(wheel, e => {
      const r = wheel.getBoundingClientRect(), R = r.width / 2;
      const dx = e.clientX - r.left - R, dy = e.clientY - r.top - R;
      this.h = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
      this.s = Math.min(1, Math.hypot(dx, dy) / R);
      this._update();
    });
    drag(slider, e => {
      const r = slider.getBoundingClientRect();
      this.v = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      this._update();
    });

    // Keyboard for wheel + slider
    wheel.addEventListener('keydown', e => {
      const st = e.shiftKey ? 10 : 1, map = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, st / 100], ArrowDown: [0, -st / 100] };
      if (!map[e.key]) return; e.preventDefault();
      this.h = (this.h + map[e.key][0] + 360) % 360; this.s = Math.max(0, Math.min(1, this.s + map[e.key][1])); this._update();
    });
    slider.addEventListener('keydown', e => {
      const st = (e.shiftKey ? 10 : 1) / 100, d = { ArrowLeft: -st, ArrowDown: -st, ArrowRight: st, ArrowUp: st }[e.key];
      if (d === undefined) return; e.preventDefault();
      this.v = Math.max(0, Math.min(1, this.v + d)); this._update();
    });

    // Text inputs
    inputs.forEach(inp => {
      inp.addEventListener('input', () => this._fromGroup(inp.dataset.g, inp));
      inp.addEventListener('blur', () => { inp.classList.remove('bad'); this._render(); });
      inp.addEventListener('focus', () => inp.select());
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') { inp.blur(); return; }
        if (inp.dataset.g === 'hex' || !['ArrowUp', 'ArrowDown'].includes(e.key)) return;
        e.preventDefault();
        this._nudge(inp, (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1));
      });
      inp.addEventListener('paste', e => {
        const txt = (e.clipboardData || window.clipboardData).getData('text');
        const hsv = ColorPicker.parse(txt);
        if (hsv && (inp.dataset.g === 'hex' || /[#(a-z]/i.test(txt))) { e.preventDefault(); this._setHsv(hsv); inp.blur(); }
      });
    });

    // Scrub labels (Figma-style drag to change value)
    this.el.querySelectorAll('.cp-sub').forEach(sub => {
      sub.addEventListener('pointerdown', e => {
        e.preventDefault(); sub.setPointerCapture(e.pointerId);
        const inp = this.el.querySelector(`input[data-g="${sub.dataset.g}"][data-i="${sub.dataset.i}"]`);
        let last = e.clientX, acc = 0;
        const move = ev => { acc += (ev.clientX - last) / (ev.shiftKey ? 0.25 : 2); last = ev.clientX; const step = Math.trunc(acc); if (step) { acc -= step; this._nudge(inp, step); } };
        const up = () => { sub.removeEventListener('pointermove', move); sub.removeEventListener('pointerup', up); };
        sub.addEventListener('pointermove', move); sub.addEventListener('pointerup', up);
      });
    });

    // Copy buttons
    this.el.querySelectorAll('.cp-copy').forEach(btn => btn.addEventListener('click', () => {
      const c = this.color, k = btn.dataset.copy;
      const str = { hex: c.hex, rgb: `rgb(${c.rgb.join(', ')})`, hsl: `hsl(${c.hsl[0]}, ${c.hsl[1]}%, ${c.hsl[2]}%)`, cmyk: `cmyk(${c.cmyk.map(x => x + '%').join(', ')})` }[k];
      navigator.clipboard?.writeText(str);
      btn.innerHTML = this.icons.check; btn.classList.add('done');
      clearTimeout(btn._t); btn._t = setTimeout(() => { btn.innerHTML = this.icons.copy; btn.classList.remove('done'); }, 1100);
    }));

    prev.addEventListener('click', () => this._setHsv(ColorPicker.parse(this.initial)));
    close.addEventListener('click', () => this.close());
    eye.addEventListener('click', async () => {
      try { const { sRGBHex } = await new EyeDropper().open(); this._setHsv(ColorPicker.parse(sRGBHex)); } catch {}
    });

    // Dismiss
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && this.isOpen) this.close(); });
    document.addEventListener('pointerdown', e => {
      if (this.isOpen && !this.el.contains(e.target) && !this.anchor?.contains(e.target)) this.close();
    }, true);
    window.addEventListener('resize', () => this.isOpen && this._position());
  }

  /* ── state updates ── */
  _nudge(inp, delta) {
    const g = this.groups[inp.dataset.g], i = +inp.dataset.i, max = g.max[i];
    let n = (parseFloat(inp.value) || 0) + delta;
    n = inp.dataset.g === 'hsl' && i === 0 ? (n + 360) % 360 : Math.max(0, Math.min(max, n));
    inp.value = Math.round(n);
    this._fromGroup(inp.dataset.g, inp);
  }

  _fromGroup(key, src) {
    const ins = this.$.inputs.filter(i => i.dataset.g === key);
    if (key === 'hex') {
      const hsv = ColorPicker.parse(src.value);
      src.classList.toggle('bad', !hsv && src.value.replace('#', '').length > 0);
      if (hsv) this._setHsv(hsv, src);
      return;
    }
    const vals = ins.map(i => i.value.trim() === '' ? NaN : Number(i.value));
    const ok = vals.every((v, i) => Number.isFinite(v) && v >= 0 && v <= this.groups[key].max[i]);
    src.classList.toggle('bad', !ok);
    if (!ok) return;
    const hsv = key === 'rgb' ? ColorPicker.rgbToHsv(...vals)
              : key === 'hsl' ? ColorPicker.hslToHsv(...vals)
              : ColorPicker.rgbToHsv(...ColorPicker.cmykToRgb(...vals));
    this._setHsv(hsv, src, key === 'hsl');
  }

  _setHsv([h, s, v], skip = null, forceHue = false) {
    // Preserve hue/sat when the colour is grey/black so the wheel doesn't jump
    if (s > 0 && v > 0 || forceHue) this.h = h;
    if (v > 0) this.s = s;
    this.v = v;
    this._update(skip);
  }

  _update(skip) { this._render(skip); this.onChange(this.color); }

  _render(skip = document.activeElement) {
    const c = this.color, { wheel, shade, handle, slider, thumb, prev, next } = this.$;
    const R = wheel.clientWidth / 2, a = this.h * Math.PI / 180;
    handle.style.left = R + Math.sin(a) * this.s * R + 'px';
    handle.style.top = R - Math.cos(a) * this.s * R + 'px';
    handle.style.background = c.hex;
    shade.style.opacity = 1 - this.v;

    const full = ColorPicker.hex(ColorPicker.hsvToRgb(this.h, this.s, 1));
    slider.style.background = `linear-gradient(90deg,#000,${full})`;
    thumb.style.left = this.v * 100 + '%'; thumb.style.background = c.hex;
    slider.setAttribute('aria-valuenow', Math.round(this.v * 100));
    wheel.setAttribute('aria-valuetext', `Hue ${Math.round(this.h)}°, saturation ${Math.round(this.s * 100)}%`);

    next.style.background = c.hex; prev.style.background = this.initial;
    const L = ColorPicker.rgbToHsl(...ColorPicker.parse(this.initial) ? ColorPicker.hsvToRgb(...ColorPicker.parse(this.initial)) : [255,255,255])[2];
    prev.style.setProperty('--cp-prev-ink', L > 55 ? '#000' : '#fff');

    const vals = { hex: [c.hex], rgb: c.rgb, hsl: c.hsl, cmyk: c.cmyk };
    this.$.inputs.forEach(inp => {
      if (inp === skip) return;
      inp.value = vals[inp.dataset.g][+inp.dataset.i];
    });
  }

  /* ── public API ── */
  setColor(str) { const hsv = ColorPicker.parse(str); if (hsv) this._setHsv(hsv); }

  open(anchor, color = '#FFFFFF') {
    this.anchor = anchor; this.initial = ColorPicker.parse(color) ? ColorPicker.hex(ColorPicker.hsvToRgb(...ColorPicker.parse(color))) : '#FFFFFF';
    const hsv = ColorPicker.parse(this.initial); this.h = hsv[0]; this.s = hsv[1]; this.v = hsv[2];
    this._render(null); this._position();
    this.el.classList.add('open'); this.isOpen = true;
  }

  close() {
    if (!this.isOpen) return;
    this.el.classList.remove('open'); this.isOpen = false;
    this.onClose(this.color);
  }

  _position() {
    if (!this.anchor) return;
    const a = this.anchor.getBoundingClientRect(), w = this.el.offsetWidth, h = this.el.offsetHeight, m = 8;
    const vw = innerWidth, vh = innerHeight;
    let top = a.bottom + m, left = a.left, origin = 'top left';
    if (top + h > vh - m) {                       // not enough room below
      if (a.right + m + w < vw - m) { left = a.right + m; top = a.top; }        // try right side
      else if (a.left - m - w > m) { left = a.left - m - w; top = a.top; }      // try left side
      else { top = a.top - h - m; origin = 'bottom left'; }                    // above
    }
    this.el.style.left = Math.max(m, Math.min(left, vw - w - m)) + 'px';
    this.el.style.top = Math.max(m, Math.min(top, vh - h - m)) + 'px';
    this.el.style.transformOrigin = origin;
  }
}

if (typeof window !== 'undefined') window.ColorPicker = ColorPicker;

export default ColorPicker
