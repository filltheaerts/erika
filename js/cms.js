/* ============================================================
   ERIKA — CMS Module (Firebase Firestore)
   Admin inline editing for: Projects, Categories, Home content
   ============================================================ */

const settingsRef = db.collection('settings');

// ── Default Content ────────────────────────────────────────
const DEFAULT_CONTENT = {
  categories: ['RH', 'VV', 'commercial', 'user acquisition'],

  hero: {
    title1_en: 'Building Together',   title1_ko: '함께 만들어가는',
    title2_en: 'Better Answers',      title2_ko: '더 나은 답변',
    desc_en: 'A space where customer questions are answered quickly and accurately, with all records transparently shared. Easily search through past Q&A.',
    desc_ko: '고객의 질문에 빠르고 정확하게 답하고, 모든 기록이 투명하게 공유되는 공간입니다. 과거의 질문과 답변을 쉽게 찾아보세요.'
  },

  features: [
    {
      title_en: 'Fast Search',          title_ko: '빠른 검색',
      desc_en: 'Quickly find past questions by category, date, and questioner. No need to ask the same question twice.',
      desc_ko: '카테고리, 날짜, 질문자별로 과거 질문을 빠르게 찾을 수 있습니다. 같은 질문을 반복하지 않아도 됩니다.'
    },
    {
      title_en: 'Transparent Communication', title_ko: '투명한 소통',
      desc_en: 'All questions and answers are viewable, ensuring the entire team shares the same information.',
      desc_ko: '모든 질문과 답변이 열람 가능하여, 팀 전체가 동일한 정보를 공유합니다.'
    },
    {
      title_en: 'Progress Tracking',     title_ko: '진행 추적',
      desc_en: 'Track resolution status and follow-ups at a glance to ensure nothing falls through the cracks.',
      desc_ko: '해결 여부와 후속 조치(F/U)를 한눈에 파악하여 누락 없이 관리합니다.'
    }
  ],

  about: {
    title_en: 'Efficient Communication,\nSystematic Management',
    title_ko: '효율적인 소통,\n체계적인 관리',
    desc1_en: 'No need to rewrite answers to repeated questions. This board is designed to record all Q&A and make it easily searchable.',
    desc1_ko: '반복되는 질문에 대한 답변을 매번 다시 작성할 필요가 없습니다. 이 게시판은 모든 Q&A를 기록하고, 쉽게 검색할 수 있도록 설계되었습니다.',
    desc2_en: 'Categorized by RH, VV, Commercial, User Acquisition and more — find the information you need instantly.',
    desc2_ko: 'RH, VV, Commercial, User Acquisition 등 카테고리별로 분류하여 필요한 정보를 즉시 찾으세요.'
  },

  projects: [
    {
      label: 'RH',
      title_en: 'RH Operations', title_ko: 'RH Operations',
      desc_en: 'Operations and strategy projects related to RH. A core question category with a systematic answer framework.',
      desc_ko: 'RH 관련 운영 및 전략 프로젝트입니다. 고객 문의의 핵심 카테고리로, 체계적인 답변 체계를 구축하고 있습니다.',
      tags: ['Strategy', 'Operations', 'Analysis']
    },
    {
      label: 'VV',
      title_en: 'VV Insights', title_ko: 'VV Insights',
      desc_en: 'Data analysis and insight generation for the VV segment. Creating tangible business value.',
      desc_ko: 'VV 부문의 데이터 분석 및 인사이트 도출 프로젝트입니다. 실질적인 비즈니스 가치를 창출합니다.',
      tags: ['Data', 'Insights', 'Growth']
    },
    {
      label: 'Commercial',
      title_en: 'Commercial Strategy', title_ko: 'Commercial Strategy',
      desc_en: 'Commercial strategy and market analysis. Collaborating with US-commercial team to strengthen market competitiveness.',
      desc_ko: '상업 전략 및 시장 분석 프로젝트입니다. US-commercial 팀과 협업하여 시장 경쟁력을 강화합니다.',
      tags: ['Market', 'Commercial', 'US Team']
    },
    {
      label: 'User Acquisition',
      title_en: 'User Acquisition', title_ko: 'User Acquisition',
      desc_en: 'User acquisition strategy with data-driven approaches for efficient user growth and retention.',
      desc_ko: '사용자 확보 전략 프로젝트입니다. 효율적인 유저 획득과 리텐션을 위한 데이터 기반 접근을 추구합니다.',
      tags: ['Acquisition', 'Retention', 'Analytics']
    }
  ]
};

// ── CMS Data Layer ─────────────────────────────────────────
window.CMS = {
  _content: null,
  _ready: false,

  // Load from Firestore (or use defaults)
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
      console.warn('CMS load fallback to defaults:', e);
      this._content = { ...DEFAULT_CONTENT };
    }
    this._ready = true;
    return this._content;
  },

  get(key) {
    if (!this._content) return DEFAULT_CONTENT[key];
    return this._content[key] || DEFAULT_CONTENT[key];
  },

  // Localized getter
  t(obj, field) {
    const lang = window._lang || 'en';
    return obj[field + '_' + lang] || obj[field + '_en'] || '';
  },

  async save(key, value) {
    try {
      this._content[key] = value;
      await settingsRef.doc('content').update({ [key]: value });
      return true;
    } catch (e) {
      console.error('CMS save error:', e);
      return false;
    }
  },

  // ── Categories ───────────────────────────────────────
  getCategories() {
    return this.get('categories') || DEFAULT_CONTENT.categories;
  },

  async saveCategories(cats) {
    return this.save('categories', cats);
  },

  // ── Render dynamic categories in all select/filter elements ──
  renderCategoryOptions() {
    const cats = this.getCategories();

    // Board filter
    const filterCat = document.getElementById('filterCategory');
    if (filterCat) {
      const val = filterCat.value;
      const lang = window._lang || 'en';
      filterCat.innerHTML = `<option value="all">${lang === 'ko' ? '전체 카테고리' : 'All Categories'}</option>` +
        cats.map(c => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join('');
      filterCat.value = val;
    }

    // Write form category
    const writeCat = document.getElementById('writeCategory');
    if (writeCat) {
      const val = writeCat.value;
      writeCat.innerHTML = cats.map(c => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join('');
      if (val) writeCat.value = val;
    }

    // Q&A category buttons
    const qnaCats = document.querySelector('.qna-categories');
    if (qnaCats) {
      const lang = window._lang || 'en';
      qnaCats.innerHTML = `<button class="qna-cat-btn active" data-cat="all">${lang === 'ko' ? '전체' : 'All'}</button>` +
        cats.map(c => `<button class="qna-cat-btn" data-cat="${escHtml(c)}">${escHtml(c)}</button>`).join('');
      // Re-bind click events
      qnaCats.querySelectorAll('.qna-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          qnaCats.querySelectorAll('.qna-cat-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          // Trigger Q&A re-render if available
          if (window._qnaRender) window._qnaRender(btn.dataset.cat);
        });
      });
    }
  },

  // ── Admin Edit Mode ──────────────────────────────────
  enableEditMode() {
    document.body.classList.add('admin-mode');
  },

  disableEditMode() {
    document.body.classList.remove('admin-mode');
  },

  // ── Show Edit Modal ──────────────────────────────────
  showEditModal(section) {
    const overlay = document.getElementById('cmsEditModal');
    const title = document.getElementById('cmsEditTitle');
    const body = document.getElementById('cmsEditBody');
    if (!overlay) return;

    const lang = window._lang || 'en';
    const isKo = lang === 'ko';

    switch (section) {
      case 'categories':
        title.textContent = isKo ? '카테고리 관리' : 'Manage Categories';
        this._renderCategoryEditor(body);
        break;
      case 'hero':
        title.textContent = isKo ? '히어로 섹션 수정' : 'Edit Hero Section';
        this._renderHeroEditor(body);
        break;
      case 'features':
        title.textContent = isKo ? '기능 섹션 수정' : 'Edit Features';
        this._renderFeaturesEditor(body);
        break;
      case 'about':
        title.textContent = isKo ? '소개 섹션 수정' : 'Edit About Section';
        this._renderAboutEditor(body);
        break;
      default:
        if (section.startsWith('project-')) {
          const idx = parseInt(section.split('-')[1]);
          title.textContent = isKo ? '프로젝트 수정' : 'Edit Project';
          this._renderProjectEditor(body, idx);
        }
        break;
    }

    overlay.classList.add('show');
  },

  closeCmsModal() {
    const overlay = document.getElementById('cmsEditModal');
    if (overlay) overlay.classList.remove('show');
  },

  // ── Category Editor ──────────────────────────────────
  _renderCategoryEditor(body) {
    const cats = [...this.getCategories()];
    const isKo = (window._lang || 'en') === 'ko';

    body.innerHTML = `
      <div class="cms-cat-list" id="cmsCatList">
        ${cats.map((c, i) => `
          <div class="cms-cat-item">
            <input type="text" value="${escHtml(c)}" data-idx="${i}">
            <button class="cms-cat-del" onclick="CMS._removeCat(${i})">✕</button>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-sm btn-outline" onclick="CMS._addCat()" style="margin-bottom:20px;">
        + ${isKo ? '카테고리 추가' : 'Add Category'}
      </button>
      <button class="btn btn-primary" style="width:100%;" onclick="CMS._saveCats()">
        ${isKo ? '저장' : 'Save'}
      </button>
    `;
  },

  _addCat() {
    const list = document.getElementById('cmsCatList');
    const idx = list.children.length;
    const div = document.createElement('div');
    div.className = 'cms-cat-item';
    div.innerHTML = `
      <input type="text" value="" data-idx="${idx}" placeholder="New category">
      <button class="cms-cat-del" onclick="this.parentElement.remove()">✕</button>
    `;
    list.appendChild(div);
    div.querySelector('input').focus();
  },

  _removeCat(idx) {
    const list = document.getElementById('cmsCatList');
    if (list.children[idx]) list.children[idx].remove();
  },

  async _saveCats() {
    const inputs = document.querySelectorAll('#cmsCatList input');
    const cats = Array.from(inputs).map(i => i.value.trim()).filter(v => v);
    if (cats.length === 0) return alert('At least one category is required.');
    const ok = await this.saveCategories(cats);
    if (ok) {
      this.renderCategoryOptions();
      this.closeCmsModal();
      if (typeof BoardApp !== 'undefined' && BoardApp.render) BoardApp.render();
    }
  },

  // ── Hero Editor ──────────────────────────────────────
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
      title1_en: document.getElementById('cms_h_t1en').value,
      title1_ko: document.getElementById('cms_h_t1ko').value,
      title2_en: document.getElementById('cms_h_t2en').value,
      title2_ko: document.getElementById('cms_h_t2ko').value,
      desc_en: document.getElementById('cms_h_den').value,
      desc_ko: document.getElementById('cms_h_dko').value
    };
    if (await this.save('hero', hero)) {
      this._applyHero();
      this.closeCmsModal();
    }
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

  // ── Features Editor ──────────────────────────────────
  _renderFeaturesEditor(body) {
    const feats = this.get('features');
    body.innerHTML = feats.map((f, i) => `
      <div style="border:1px solid var(--border); border-radius:var(--radius-sm); padding:16px; margin-bottom:12px;">
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
      title_en: document.getElementById(`cms_f${i}_ten`).value,
      title_ko: document.getElementById(`cms_f${i}_tko`).value,
      desc_en: document.getElementById(`cms_f${i}_den`).value,
      desc_ko: document.getElementById(`cms_f${i}_dko`).value
    }));
    if (await this.save('features', feats)) {
      this._applyFeatures();
      this.closeCmsModal();
    }
  },

  _applyFeatures() {
    const feats = this.get('features');
    feats.forEach((f, i) => {
      const t = document.querySelector(`[data-cms="feat-${i}-title"]`);
      const d = document.querySelector(`[data-cms="feat-${i}-desc"]`);
      if (t) t.textContent = this.t(f, 'title');
      if (d) d.textContent = this.t(f, 'desc');
    });
  },

  // ── About Editor ─────────────────────────────────────
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
      title_en: document.getElementById('cms_a_ten').value,
      title_ko: document.getElementById('cms_a_tko').value,
      desc1_en: document.getElementById('cms_a_d1en').value,
      desc1_ko: document.getElementById('cms_a_d1ko').value,
      desc2_en: document.getElementById('cms_a_d2en').value,
      desc2_ko: document.getElementById('cms_a_d2ko').value
    };
    if (await this.save('about', about)) {
      this._applyAbout();
      this.closeCmsModal();
    }
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

  // ── Project Editor ───────────────────────────────────
  _renderProjectEditor(body, idx) {
    const projects = this.get('projects');
    const p = projects[idx];
    if (!p) return;

    body.innerHTML = `
      <input type="hidden" id="cms_p_idx" value="${idx}">
      <div class="form-group"><label>Label</label><input id="cms_p_label" value="${escHtml(p.label)}"></div>
      <div class="form-row">
        <div class="form-group"><label>Title (EN)</label><input id="cms_p_ten" value="${escHtml(p.title_en)}"></div>
        <div class="form-group"><label>Title (KO)</label><input id="cms_p_tko" value="${escHtml(p.title_ko)}"></div>
      </div>
      <div class="form-group"><label>Description (EN)</label><textarea id="cms_p_den">${escHtml(p.desc_en)}</textarea></div>
      <div class="form-group"><label>Description (KO)</label><textarea id="cms_p_dko">${escHtml(p.desc_ko)}</textarea></div>
      <div class="form-group"><label>Tags (comma separated)</label><input id="cms_p_tags" value="${escHtml((p.tags || []).join(', '))}"></div>
      <button class="btn btn-primary" style="width:100%;" onclick="CMS._saveProject()">Save</button>
    `;
  },

  async _saveProject() {
    const idx = parseInt(document.getElementById('cms_p_idx').value);
    const projects = [...this.get('projects')];
    projects[idx] = {
      ...projects[idx],
      label: document.getElementById('cms_p_label').value,
      title_en: document.getElementById('cms_p_ten').value,
      title_ko: document.getElementById('cms_p_tko').value,
      desc_en: document.getElementById('cms_p_den').value,
      desc_ko: document.getElementById('cms_p_dko').value,
      tags: document.getElementById('cms_p_tags').value.split(',').map(t => t.trim()).filter(Boolean)
    };
    if (await this.save('projects', projects)) {
      this._applyProjects();
      this.closeCmsModal();
    }
  },

  _applyProjects() {
    const projects = this.get('projects');
    projects.forEach((p, i) => {
      const label = document.querySelector(`[data-cms="proj-${i}-label"]`);
      const title = document.querySelector(`[data-cms="proj-${i}-title"]`);
      const desc = document.querySelector(`[data-cms="proj-${i}-desc"]`);
      const tags = document.querySelector(`[data-cms="proj-${i}-tags"]`);
      if (label) label.textContent = p.label;
      if (title) title.textContent = this.t(p, 'title');
      if (desc) desc.textContent = this.t(p, 'desc');
      if (tags) tags.innerHTML = (p.tags || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('');
    });
  },

  // ── Apply All Content ────────────────────────────────
  applyAll() {
    this._applyHero();
    this._applyFeatures();
    this._applyAbout();
    this._applyProjects();
    this.renderCategoryOptions();
  },

  // ── Init ─────────────────────────────────────────────
  async init() {
    await this.load();
    this.applyAll();

    // Check admin state
    const isAdmin = sessionStorage.getItem('erika_admin') === 'true';
    if (isAdmin) this.enableEditMode();
  }
};
