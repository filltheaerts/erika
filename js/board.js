/* ============================================================
   RH&VV Q&A — Board Logic (Firebase Firestore)
   CRUD, Filtering, Pagination, Excel Export, Real-time Sync
   ============================================================ */

// ── Board Data Layer (Firestore) ──────────────────────────
window.BoardData = {
  _posts: [],
  _listeners: [],

  subscribe(callback) {
    const unsubscribe = postsRef
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        this._posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        if (callback) callback(this._posts);
      }, err => {
        console.error('Firestore listen error:', err);
      });
    this._listeners.push(unsubscribe);
    return unsubscribe;
  },

  getPosts() { return this._posts; },

  async fetchPosts() {
    const snapshot = await postsRef.orderBy('createdAt', 'desc').get();
    this._posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return this._posts;
  },

  async addPost(post) {
    post.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    const docRef = await postsRef.add(post);
    return { id: docRef.id, ...post };
  },

  async updatePost(id, updates) {
    await postsRef.doc(id).update(updates);
  },

  async deletePost(id) {
    await postsRef.doc(id).delete();
  },
};

// ── Board App ──────────────────────────────────────────────
const POSTS_PER_PAGE = 10;

window.BoardApp = {
  currentPage: 1,
  isAdmin: false,

  async init() {
    this.isAdmin = isAdmin();
    this.updateAdminUI();
    this.bindFilters();
    BoardData.subscribe(() => this.render());
  },

  updateAdminUI() {
    const adminBar = document.getElementById('adminBar');
    const catBtn = document.getElementById('cmsManageCatBtn');
    if (adminBar) adminBar.classList.toggle('show', this.isAdmin);
    if (catBtn) catBtn.style.display = this.isAdmin ? '' : 'none';
    if (this.isAdmin && typeof CMS !== 'undefined') CMS.enableEditMode();
    if (!this.isAdmin && typeof CMS !== 'undefined') CMS.disableEditMode();
  },

  // ── Modals ─────────────────────────────────────────────
  closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('show'));
  },

  showWriteModal() {
    document.getElementById('writeForm').reset();
    document.getElementById('writeModal').classList.add('show');
    document.getElementById('writeFrom').focus();
  },

  showDetail(postId) {
    const post = BoardData.getPosts().find(p => p.id === postId);
    if (!post) return;

    const lang = window._lang || 'en';
    const isKo = lang === 'ko';
    const content = document.getElementById('detailContent');

    content.innerHTML = `
      <div class="post-detail">
        <div class="post-meta">
          <span><strong>${isKo ? '날짜' : 'Date'}:</strong> ${escHtml(post.date)}</span>
          <span><strong>${isKo ? '질문자' : 'From'}:</strong> ${escHtml(post.from)}</span>
          <span class="badge badge-accent">${escHtml(post.category)}</span>
          <span class="badge ${post.resolved === 'Yes' ? 'badge-green' : 'badge-orange'}">
            ${post.resolved === 'Yes' ? (isKo ? '해결됨' : 'Resolved') : (isKo ? '미해결' : 'Pending')}
          </span>
        </div>
        <div class="post-question">
          <h4 style="margin-bottom:8px; color:var(--text-secondary);">Q.</h4>
          ${escHtml(post.question)}
        </div>
        ${post.answer ? `
        <div class="post-answer">
          <h4>A. (${escHtml(post.answeredBy || '-')})</h4>
          <p>${escHtml(post.answer)}</p>
        </div>` : `
        <p style="color:var(--text-muted); font-style:italic;">
          ${isKo ? '아직 답변이 없습니다.' : 'No answer yet.'}
        </p>`}
        ${post.followUp ? `
        <div class="post-followup">
          <strong>F/U:</strong> ${escHtml(post.followUp)}
        </div>` : ''}
        <div style="margin-top:24px; display:flex; gap:10px;">
          <button class="btn btn-sm btn-primary" onclick="BoardApp.showAnswerModal('${post.id}')">
            ${isKo ? '답변하기' : 'Answer'}
          </button>
          ${this.isAdmin ? `
          <button class="btn btn-sm btn-outline" style="color:#E53935; border-color:#E53935;" onclick="if(confirm('${isKo ? '삭제하시겠습니까?' : 'Delete this post?'}')) { BoardApp.deletePost('${post.id}'); }">
            ${isKo ? '삭제' : 'Delete'}
          </button>` : ''}
        </div>
      </div>
    `;

    document.getElementById('detailModal').classList.add('show');
  },

  showAnswerModal(postId) {
    const post = BoardData.getPosts().find(p => p.id === postId);
    if (!post) return;

    document.getElementById('answerPostId').value = postId;
    document.getElementById('answerBy').value = post.answeredBy || '';
    document.getElementById('answerText').value = post.answer || '';
    document.getElementById('answerResolved').value = post.resolved || 'No';
    document.getElementById('answerFollowUp').value = post.followUp || '';

    const lang = window._lang || 'en';
    const isKo = lang === 'ko';
    document.getElementById('answerQuestionPreview').innerHTML = `
      <p style="font-size:.85rem; color:var(--text-muted); margin-bottom:4px;">${isKo ? '질문' : 'Question'}:</p>
      <p style="font-weight:600;">${escHtml(post.question)}</p>
      <p style="font-size:.8rem; color:var(--text-muted); margin-top:6px;">${escHtml(post.from)} · ${post.category} · ${post.date}</p>
    `;

    this.closeModals();
    document.getElementById('answerModal').classList.add('show');
  },

  // ── CRUD ───────────────────────────────────────────────
  async submitQuestion(e) {
    e.preventDefault();
    const from = document.getElementById('writeFrom').value.trim();
    const category = document.getElementById('writeCategory').value;
    const question = document.getElementById('writeQuestion').value.trim();
    if (!from || !question) return;

    const lang = window._lang || 'ko';
    const posts = BoardData.getPosts();
    if (posts.some(p => p.question.toLowerCase().trim() === question.toLowerCase().trim())) {
      alert(lang === 'ko' ? '비슷한 질문이 이미 등록되어 있습니다.' : 'A similar question already exists.');
      return;
    }

    const wholesaleKeywords = ['도매', '대량', 'wholesale', 'bulk order', 'bulk purchase'];
    if (wholesaleKeywords.some(kw => question.toLowerCase().includes(kw.toLowerCase()))) {
      alert(lang === 'ko' ? '도매 관련 문의는 별도로 연락 부탁드립니다.' : 'For wholesale inquiries, please contact us separately.');
      return;
    }

    const today = new Date();
    const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    try {
      await BoardData.addPost({ date: dateStr, from, category, question, answer: '', answeredBy: '', resolved: 'No', followUp: '' });
      this.closeModals();
      alert(lang === 'ko' ? '질문이 등록되었습니다.' : 'Question submitted successfully.');
    } catch (err) {
      console.error('Add post error:', err);
      alert(lang === 'ko' ? '오류가 발생했습니다.' : 'An error occurred.');
    }
  },

  async submitAnswer(e) {
    e.preventDefault();
    const postId = document.getElementById('answerPostId').value;
    const answeredBy = document.getElementById('answerBy').value.trim();
    const answer = document.getElementById('answerText').value.trim();
    const resolved = document.getElementById('answerResolved').value;
    const followUp = document.getElementById('answerFollowUp').value.trim();
    if (!answer || !answeredBy) return;

    const lang = window._lang || 'ko';
    try {
      await BoardData.updatePost(postId, { answer, answeredBy, resolved, followUp });
      this.closeModals();
      alert(lang === 'ko' ? '답변이 등록되었습니다.' : 'Answer submitted successfully.');
    } catch (err) {
      console.error('Update post error:', err);
      alert(lang === 'ko' ? '오류가 발생했습니다.' : 'An error occurred.');
    }
  },

  async deletePost(id) {
    try { await BoardData.deletePost(id); this.closeModals(); }
    catch (err) { console.error('Delete post error:', err); }
  },

  // ── Excel Download ────────────────────────────────────
  downloadExcel() {
    const posts = this.getFilteredPosts();
    const lang = window._lang || 'en';
    const isKo = lang === 'ko';

    const headers = [
      '#',
      isKo ? '날짜' : 'Date',
      isKo ? '질문자' : 'From',
      isKo ? '카테고리' : 'Category',
      isKo ? '질문' : 'Question',
      isKo ? '답변' : 'Answer',
      isKo ? '답변자' : 'Answered by',
      isKo ? '상태' : 'Status',
      'F/U'
    ];

    const rows = posts.map((p, i) => [
      i + 1,
      p.date || '',
      p.from || '',
      p.category || '',
      p.question || '',
      p.answer || '',
      p.answeredBy || '',
      p.resolved === 'Yes' ? (isKo ? '해결' : 'Resolved') : (isKo ? '대기' : 'Pending'),
      p.followUp || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(','))
      .join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'RH_VV_QA_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  },

  // ── Filtering ──────────────────────────────────────────
  getFilteredPosts() {
    let posts = BoardData.getPosts();
    const search = (document.getElementById('boardSearch')?.value || '').toLowerCase().trim();
    const catFilter = document.getElementById('filterCategory')?.value || 'all';
    const statusFilter = document.getElementById('filterStatus')?.value || 'all';
    const answererFilter = (document.getElementById('filterAnswerer')?.value || '').toLowerCase().trim();

    if (search) posts = posts.filter(p =>
      (p.question || '').toLowerCase().includes(search) ||
      (p.answer || '').toLowerCase().includes(search) ||
      (p.from || '').toLowerCase().includes(search) ||
      (p.category || '').toLowerCase().includes(search)
    );
    if (catFilter !== 'all') posts = posts.filter(p => (p.category || '').toLowerCase() === catFilter.toLowerCase());
    if (statusFilter !== 'all') posts = posts.filter(p => p.resolved === statusFilter);
    if (answererFilter) posts = posts.filter(p => (p.answeredBy || '').toLowerCase().includes(answererFilter));
    return posts;
  },

  bindFilters() {
    ['boardSearch', 'filterCategory', 'filterStatus', 'filterAnswerer'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => { this.currentPage = 1; this.render(); });
        el.addEventListener('change', () => { this.currentPage = 1; this.render(); });
      }
    });
  },

  // ── Render ─────────────────────────────────────────────
  render() {
    const tbody = document.getElementById('boardTableBody');
    const emptyEl = document.getElementById('boardEmpty');
    const paginationEl = document.getElementById('boardPagination');
    if (!tbody) return;

    const filtered = this.getFilteredPosts();
    const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const start = (this.currentPage - 1) * POSTS_PER_PAGE;
    const pageItems = filtered.slice(start, start + POSTS_PER_PAGE);

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyEl.classList.remove('hidden');
      paginationEl.innerHTML = '';
      return;
    }
    emptyEl.classList.add('hidden');

    const lang = window._lang || 'ko';
    const isKo = lang === 'ko';

    tbody.innerHTML = pageItems.map((p, idx) => `
      <tr onclick="BoardApp.showDetail('${p.id}')">
        <td>${start + idx + 1}</td>
        <td>${escHtml(p.date)}</td>
        <td style="font-weight:600;">${escHtml(p.from)}</td>
        <td><span class="badge badge-accent">${escHtml(p.category)}</span></td>
        <td class="td-question">${escHtml(p.question)}</td>
        <td>
          <span class="badge ${p.resolved === 'Yes' ? 'badge-green' : 'badge-orange'}">
            ${p.resolved === 'Yes' ? (isKo ? '해결' : 'Resolved') : (isKo ? '대기' : 'Pending')}
          </span>
        </td>
        <td>${escHtml(p.answeredBy || '-')}</td>
      </tr>
    `).join('');

    if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }
    let phtml = '';
    if (this.currentPage > 1) phtml += `<button onclick="BoardApp.goPage(${this.currentPage - 1})">&laquo;</button>`;
    for (let i = 1; i <= totalPages; i++) phtml += `<button class="${i === this.currentPage ? 'active' : ''}" onclick="BoardApp.goPage(${i})">${i}</button>`;
    if (this.currentPage < totalPages) phtml += `<button onclick="BoardApp.goPage(${this.currentPage + 1})">&raquo;</button>`;
    paginationEl.innerHTML = phtml;
  },

  goPage(n) {
    this.currentPage = n;
    this.render();
    window.scrollTo({ top: 200, behavior: 'smooth' });
  }
};

// ── Utility ────────────────────────────────────────────────
function escHtml(text) {
  if (!text) return '';
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('show');
});
