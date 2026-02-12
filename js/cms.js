/* ============================================================
   RH&VV Q&A — CMS Module (Firebase Firestore)
   Admin inline editing for: Categories, Home content
   ============================================================ */

const settingsRef = db.collection('settings');

const DEFAULT_CONTENT = {
  categories: ['RH', 'VV', 'commercial', 'user acquisition'],

  hero: {
    title1_en: 'Building Together',   title1_ko: '함께 만들어가는',
    title2_en: 'Better Answers',      title2_ko: '더 나은 답변',
    desc_en: 'A space where customer questions are answered quickly and accurately, with all records transparently shared.',
    desc_ko: '고객의 질문에 빠르고 정확하게 답하고, 모든 기록이 투명하게 공유되는 공간입니다.'
  },

  features: [
    {
      title_en: 'Fast Search',          title_ko: '빠른 검색',
      desc_en: 'Quickly find past questions by category, date, and questioner.',
      desc_ko: '카테고리, 날짜, 질문자별로 과거 질문을 빠르게 찾을 수 있습니다.'
    },
    {
      title_en: 'Transparent Communication', title_ko: '투명한 소통',
      desc_en: 'All questions and answers are viewable by the entire team.',
      desc_ko: '모든 질문과 답변이 열람 가능하여, 팀 전체가 동일한 정보를 공유합니다.'
    },
    {
      title_en: 'Progress Tracking',     title_ko: '진행 추적',
      desc_en: 'Track resolution status and follow-ups at a glance.',
      desc_ko: '해결 여부와 후속 조치(F/U)를 한눈에 파악합니다.'
    }
  ],

  about: {
    title_en: 'Efficient Communication,\nSystematic Management',
    title_ko: '효율적인 소통,\n체계적인 관리',
    desc1_en: 'No need to rewrite answers to repeated questions. This board records all Q&A and makes it easily searchable.',
    desc1_ko: '반복되는 질문에 대한 답변을 매번 다시 작성할 필요가 없습니다.',
    desc2_en: 'Categorized by RH, VV, Commercial, User Acquisition and more.',
    desc2_ko: 'RH, VV, Commercial, User Acquisition 등 카테고리별로 분류합니다.'
  }
};

window.CMS = {
  _content: null,
  _ready: false,

  async load() {
    try {
      const doc = await settingsRef.doc('content').get();
      if (doc.exists) {
        this._content = { ...DEFAULT_CONTENT, ...doc.data() };
      } else {
        this._content = { ...DEFAULT_CONTENT };
        await settingsRef.doc('content').set(DEFAULT_CONTENT);
      }
    } catch (e) {
      console.warn('CMS load fallback:', e);
      this._content = { ...DEFAULT_CONTENT };
    }
    this._ready = true;
    return this._content;
  },

  get(key) {
    if (!this._content) return DEFAULT_CONTENT[key];
    return this._content[key] || DEFAULT_CONTENT[key];
  },

  t(obj, field) {
    const lang = window._lang || 'en';
    return obj[field + '_' + lang] || obj[field + '_en'] || '';
  },

  async save(key, value) {
    try {
      this._content[key] = value;
      await settingsRef.doc('content').update({ [key]: value });
      return true;
    } catch (e) { console.error('CMS save error:', e); return false; }
  },

  getCategories() { return this.get('categories') || DEFAULT_CONTENT.categories; },
  async saveCategories(cats) { return this.save('categories', cats); },

  renderCategoryOptions() {
    const cats = this.getCategories();
    const lang = window._lang || 'en';

    const filterCat = document.getElementById('filterCategory');
    if (filterCat) {
      const val = filterCat.value;
      filterCat.innerHTML = `<option value="all">${lang === 'ko' ? '전체 카테고리' : 'All Categories'}</option>` +
        cats.map(c => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join('');
      filterCat.value = val;
    }

    const writeCat = document.getElementById('writeCategory');
    if (writeCat) {
      const val = writeCat.value;
      writeCat.innerHTML = cats.map(c => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join('');
      if (val) writeCat.value = val;
    }

    const qnaCats = document.querySelector('.qna-categories');
    if (qnaCats) {
      qnaCats.innerHTML = `<button class="qna-cat-btn active" data-cat="all">${lang === 'ko' ? '전체' : 'All'}</button>` +
        cats.map(c => `<button class="qna-cat-btn" data-cat="${escHtml(c)}">${escHtml(c)}</button>`).join('');
      qnaCats.querySelectorAll('.qna-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          qnaCats.querySelectorAll('.qna-cat-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (window._qnaRender) window._qnaRender(btn.dataset.cat);
        });
      });
    }
  },

  enableEditMode() { document.body.classList.add('admin-mode'); },
  disableEditMode() { document.body.classList.remove('admin-mode'); },

  showEditModal(section) {
    const overlay = document.getElementById('cmsEditModal');
    const title = document.getElementById('cmsEditTitle');
    const body = document.getElementById('cmsEditBody');
    if (!overlay) return;
    const isKo = (window._lang || 'en') === 'ko';

    switch (section) {
      case 'categories': title.textContent = isKo ? '카테고리 관리' : 'Manage Categories'; this._renderCategoryEditor(body); break;
      case 'hero': title.textContent = isKo ? '히어로 수정' : 'Edit Hero'; this._renderHeroEditor(body); break;
      case 'features': title.textContent = isKo ? '기능 수정' : 'Edit Features'; this._renderFeaturesEditor(body); break;
      case 'about': title.textContent = isKo ? '소개 수정' : 'Edit About'; this._renderAboutEditor(body); break;
    }
    overlay.classList.add('show');
  },

  closeCmsModal() {
    const o = document.getElementById('cmsEditModal');
    if (o) o.classList.remove('show');
  },

  _renderCategoryEditor(body) {
    const cats = [...this.getCategories()];
    const isKo = (window._lang || 'en') === 'ko';
    body.innerHTML = `
      <div class="cms-cat-list" id="cmsCatList">
        ${cats.map((c, i) => `<div class="cms-cat-item"><input type="text" value="${escHtml(c)}" data-idx="${i}"><button class="cms-cat-del" onclick="CMS._removeCat(${i})">✕</button></div>`).join('')}
      </div>
      <button class="btn btn-sm btn-outline" onclick="CMS._addCat()" style="margin-bottom:20px;">+ ${isKo ? '추가' : 'Add'}</button>
      <button class="btn btn-primary" style="width:100%;" onclick="CMS._saveCats()">${isKo ? '저장' : 'Save'}</button>
    `;
  },

  _addCat() {
    const list = document.getElementById('cmsCatList');
    const div = document.createElement('div');
    div.className = 'cms-cat-item';
    div.innerHTML = `<input type="text" value="" placeholder="New category"><button class="cms-cat-del" onclick="this.parentElement.remove()">✕</button>`;
    list.appendChild(div);
    div.querySelector('input').focus();
  },

  _removeCat(idx) {
    const list = document.getElementById('cmsCatList');
    if (list.children[idx]) list.children[idx].remove();
  },

  async _saveCats() {
    const inputs = document.querySelectorAll('#cmsCatList input');
    const cats = Array.from(inputs).map(i => i.value.trim()).filter(Boolean);
    if (!cats.length) return alert('At least one category required.');
    if (await this.saveCategories(cats)) {
      this.renderCategoryOptions();
      this.closeCmsModal();
      if (typeof BoardApp !== 'undefined' && BoardApp.render) BoardApp.render();
    }
  },

  _renderHeroEditor(body) {
    const h = this.get('hero');
    body.innerHTML = `
      <div class="form-group"><label>Title Line 1 (EN)</label><input id="cms_h_t1en" value="${escHtml(h.title1_en)}"></div>
      <div class="form-group"><label>Title Line 1 (KO)</label><input id="cms_h_t1ko" value="${escHtml(h.title1_ko)}"></div>
      <div class="form-group"><label>Title Line 2 (EN)</label><input id="cms_h_t2en" value="${escHtml(h.title2_en)}"></div>
      <div class="form-group"><label>Title Line 2 (KO)</label><input id="cms_h_t2ko" value="${escHtml(h.title2_ko)}"></div>
      <div class="form-group"><label>Description (EN)</label><textarea id="cms_h_den">${escHtml(h.desc_en)}</textarea></div>
      <div class="form-group"><label>Description (KO)</label><textarea id="cms_h_dko">${escHtml(h.desc_ko)}</textarea></div>
      <button class="btn btn-primary" style="width:100%;" onclick="CMS._saveHero()">Save</button>
    `;
  },

  async _saveHero() {
    const hero = {
      title1_en: document.getElementById('cms_h_t1en').value, title1_ko: document.getElementById('cms_h_t1ko').value,
      title2_en: document.getElementById('cms_h_t2en').value, title2_ko: document.getElementById('cms_h_t2ko').value,
      desc_en: document.getElementById('cms_h_den').value, desc_ko: document.getElementById('cms_h_dko').value
    };
    if (await this.save('hero', hero)) { this._applyHero(); this.closeCmsModal(); }
  },

  _applyHero() {
    const h = this.get('hero');
    const t1 = document.querySelector('[data-cms="hero-title1"]');
    const t2 = document.querySelector('[data-cms="hero-title2"]');
    const d = document.querySelector('[data-cms="hero-desc"]');
    if (t1) t1.textContent = this.t(h, 'title1');
    if (t2) t2.textContent = this.t(h, 'title2');
    if (d) d.textContent = this.t(h, 'desc');
  },

  _renderFeaturesEditor(body) {
    const feats = this.get('features');
    body.innerHTML = feats.map((f, i) => `
      <div style="border:1px solid var(--border); border-radius:8px; padding:16px; margin-bottom:12px;">
        <p style="font-weight:700; margin-bottom:8px;">Feature ${i + 1}</p>
        <div class="form-row">
          <div class="form-group"><label>Title (EN)</label><input id="cms_f${i}_ten" value="${escHtml(f.title_en)}"></div>
          <div class="form-group"><label>Title (KO)</label><input id="cms_f${i}_tko" value="${escHtml(f.title_ko)}"></div>
        </div>
        <div class="form-group"><label>Desc (EN)</label><textarea id="cms_f${i}_den" style="min-height:60px;">${escHtml(f.desc_en)}</textarea></div>
        <div class="form-group"><label>Desc (KO)</label><textarea id="cms_f${i}_dko" style="min-height:60px;">${escHtml(f.desc_ko)}</textarea></div>
      </div>
    `).join('') + `<button class="btn btn-primary" style="width:100%;" onclick="CMS._saveFeatures()">Save</button>`;
  },

  async _saveFeatures() {
    const feats = this.get('features').map((f, i) => ({
      ...f,
      title_en: document.getElementById(`cms_f${i}_ten`).value, title_ko: document.getElementById(`cms_f${i}_tko`).value,
      desc_en: document.getElementById(`cms_f${i}_den`).value, desc_ko: document.getElementById(`cms_f${i}_dko`).value
    }));
    if (await this.save('features', feats)) { this._applyFeatures(); this.closeCmsModal(); }
  },

  _applyFeatures() {
    this.get('features').forEach((f, i) => {
      const t = document.querySelector(`[data-cms="feat-${i}-title"]`);
      const d = document.querySelector(`[data-cms="feat-${i}-desc"]`);
      if (t) t.textContent = this.t(f, 'title');
      if (d) d.textContent = this.t(f, 'desc');
    });
  },

  _renderAboutEditor(body) {
    const a = this.get('about');
    body.innerHTML = `
      <div class="form-group"><label>Title (EN)</label><textarea id="cms_a_ten" style="min-height:60px;">${escHtml(a.title_en)}</textarea></div>
      <div class="form-group"><label>Title (KO)</label><textarea id="cms_a_tko" style="min-height:60px;">${escHtml(a.title_ko)}</textarea></div>
      <div class="form-group"><label>Paragraph 1 (EN)</label><textarea id="cms_a_d1en">${escHtml(a.desc1_en)}</textarea></div>
      <div class="form-group"><label>Paragraph 1 (KO)</label><textarea id="cms_a_d1ko">${escHtml(a.desc1_ko)}</textarea></div>
      <div class="form-group"><label>Paragraph 2 (EN)</label><textarea id="cms_a_d2en">${escHtml(a.desc2_en)}</textarea></div>
      <div class="form-group"><label>Paragraph 2 (KO)</label><textarea id="cms_a_d2ko">${escHtml(a.desc2_ko)}</textarea></div>
      <button class="btn btn-primary" style="width:100%;" onclick="CMS._saveAbout()">Save</button>
    `;
  },

  async _saveAbout() {
    const about = {
      title_en: document.getElementById('cms_a_ten').value, title_ko: document.getElementById('cms_a_tko').value,
      desc1_en: document.getElementById('cms_a_d1en').value, desc1_ko: document.getElementById('cms_a_d1ko').value,
      desc2_en: document.getElementById('cms_a_d2en').value, desc2_ko: document.getElementById('cms_a_d2ko').value
    };
    if (await this.save('about', about)) { this._applyAbout(); this.closeCmsModal(); }
  },

  _applyAbout() {
    const a = this.get('about');
    const t = document.querySelector('[data-cms="about-title"]');
    const d1 = document.querySelector('[data-cms="about-desc1"]');
    const d2 = document.querySelector('[data-cms="about-desc2"]');
    if (t) t.textContent = this.t(a, 'title');
    if (d1) d1.textContent = this.t(a, 'desc1');
    if (d2) d2.textContent = this.t(a, 'desc2');
  },

  applyAll() {
    this._applyHero();
    this._applyFeatures();
    this._applyAbout();
    this.renderCategoryOptions();
  },

  async init() {
    await this.load();
    this.applyAll();
    if (isAdmin()) this.enableEditMode();
  }
};
