/* ============================================================
   ERIKA — Board Logic (Firebase Firestore)
   CRUD, Admin Auth, Filtering, Pagination, Real-time Sync
   ============================================================ */

const ADMIN_SESSION_KEY = 'erika_admin';

// Admin credentials
const ADMIN_ID = 'erika';
const ADMIN_PW = 'erieri23!';

// ── Board Data Layer (Firestore) ──────────────────────────
window.BoardData = {
  // 로컬 캐시 — 실시간 리스너가 자동 갱신
  _posts: [],
  _listeners: [],

  // 실시간 구독 시작
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

  // 캐시에서 동기적으로 가져오기
  getPosts() {
    return this._posts;
  },

  // 한 번만 읽기 (Q&A 페이지용)
  async fetchPosts() {
    const snapshot = await postsRef.orderBy('createdAt', 'desc').get();
    this._posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return this._posts;
  },

  // 새 질문 등록
  async addPost(post) {
    post.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    const docRef = await postsRef.add(post);
    return { id: docRef.id, ...post };
  },

  // 답변/수정
  async updatePost(id, updates) {
    await postsRef.doc(id).update(updates);
  },

  // 삭제
  async deletePost(id) {
    await postsRef.doc(id).delete();
  },

  // 초기 샘플 데이터 시드 (컬렉션이 비어있을 때)
  async seedIfEmpty() {
    const snapshot = await postsRef.limit(1).get();
    if (!snapshot.empty) return;

    const samples = [
      {
        date: '2026-03-06', from: 'Laura', category: 'RH',
        question: '어쩌고?', answer: '이래라',
        answeredBy: 'Zach', resolved: 'Yes', followUp: '그럼이거는?',
        createdAt: firebase.firestore.Timestamp.fromDate(new Date('2026-03-06T10:00:00'))
      },
      {
        date: '2026-03-06', from: 'Laura', category: 'VV',
        question: '저쩌고?', answer: '저래라',
        answeredBy: 'Ed', resolved: 'Yes', followUp: '',
        createdAt: firebase.firestore.Timestamp.fromDate(new Date('2026-03-06T10:01:00'))
      },
      {
        date: '2026-03-06', from: 'Laura', category: 'commercial',
        question: '어쩌고?', answer: '',
        answeredBy: 'US-commercial', resolved: 'No', followUp: '',
        createdAt: firebase.firestore.Timestamp.fromDate(new Date('2026-03-06T10:02:00'))
      },
      {
        date: '2026-03-06', from: 'Laura', category: 'user acquisition',
        question: '저쩌고?', answer: '',
        answeredBy: 'Erika', resolved: 'No', followUp: '',
        createdAt: firebase.firestore.Timestamp.fromDate(new Date('2026-03-06T10:03:00'))
      }
    ];

    const batch = db.batch();
    samples.forEach(s => batch.set(postsRef.doc(), s));
    await batch.commit();
  }
};

// ── Board App ──────────────────────────────────────────────
const POSTS_PER_PAGE = 10;

window.BoardApp = {
  currentPage: 1,
  isAdmin: false,

  async init() {
    this.isAdmin = sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    this.updateAdminUI();
    this.bindFilters();

    // 샘플 데이터 시드
    try { await BoardData.seedIfEmpty(); } catch (e) { console.warn('Seed skipped:', e); }

    // 실시간 구독 → 자동 렌더
    BoardData.subscribe(() => this.render());
  },

  // ── Admin Auth ─────────────────────────────────────────
  handleLogin(e) {
    try {
      e.preventDefault();
      const id = document.getElementById('loginId').value.trim();
      const pw = document.getElementById('loginPw').value;
      const errorEl = document.getElementById('loginError');

      if (id === ADMIN_ID && pw === ADMIN_PW) {
        this.isAdmin = true;
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        this.updateAdminUI();
        this.closeModals();
        this.render();
      } else {
        errorEl.style.display = 'block';
        setTimeout(() => errorEl.style.display = 'none', 3000);
      }
    } catch (err) {
      alert('Login error: ' + err.message);
    }
  },

  logout() {
    this.isAdmin = false;
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    this.updateAdminUI();
    this.render();
  },

  updateAdminUI() {
    const adminBar = document.getElementById('adminBar');
    const loginBtn = document.getElementById('adminLoginBtn');
    if (adminBar) adminBar.classList.toggle('show', this.isAdmin);
    if (loginBtn) loginBtn.style.display = this.isAdmin ? 'none' : '';
  },

  showLogin() {
    document.getElementById('loginModal').classList.add('show');
    document.getElementById('loginId').focus();
  },

  // ── Modals ─────────────────────────────────────────────
  closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('show'));
    const le = document.getElementById('loginError');
    if (le) le.style.display = 'none';
  },

  showWriteModal() {
    document.getElementById('writeForm').reset();
    document.getElementById('writeModal').classList.add('show');
    document.getElementById('writeFrom').focus();
  },

  showDetail(postId) {
    const post = BoardData.getPosts().find(p => p.id === postId);
    if (!post) return;

    const lang = window._lang || 'ko';
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
        ${this.isAdmin ? `
        <div style="margin-top:24px; display:flex; gap:10px;">
          <button class="btn btn-sm btn-primary" onclick="BoardApp.showAnswerModal('${post.id}')">
            ${isKo ? '답변하기' : 'Answer'}
          </button>
          <button class="btn btn-sm btn-outline" style="color:#E53935; border-color:#E53935;" onclick="if(confirm('${isKo ? '삭제하시겠습니까?' : 'Delete this post?'}')) { BoardApp.deletePost('${post.id}'); }">
            ${isKo ? '삭제' : 'Delete'}
          </button>
        </div>` : ''}
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

    const lang = window._lang || 'ko';
    const isKo = lang === 'ko';
    document.getElementById('answerQuestionPreview').innerHTML = `
      <p style="font-size:.85rem; color:var(--text-muted); margin-bottom:4px;">${isKo ? '질문' : 'Question'}:</p>
      <p style="font-weight:600;">${escHtml(post.question)}</p>
      <p style="font-size:.8rem; color:var(--text-muted); margin-top:6px;">${escHtml(post.from)} · ${post.category} · ${post.date}</p>
    `;

    this.closeModals();
    document.getElementById('answerModal').classList.add('show');
  },

  // ── CRUD (async Firestore) ─────────────────────────────
  async submitQuestion(e) {
    e.preventDefault();
    const from = document.getElementById('writeFrom').value.trim();
    const category = document.getElementById('writeCategory').value;
    const question = document.getElementById('writeQuestion').value.trim();

    if (!from || !question) return;

    const lang = window._lang || 'ko';

    // 중복 체크
    const posts = BoardData.getPosts();
    const isDuplicate = posts.some(p =>
      p.question.toLowerCase().trim() === question.toLowerCase().trim()
    );
    if (isDuplicate) {
      alert(lang === 'ko'
        ? '비슷한 질문이 이미 등록되어 있습니다. 기존 질문을 확인해주세요.'
        : 'A similar question already exists. Please check existing questions.');
      return;
    }

    // 도매 키워드 차단
    const wholesaleKeywords = ['도매', '대량', 'wholesale', 'bulk order', 'bulk purchase'];
    const hasWholesale = wholesaleKeywords.some(kw =>
      question.toLowerCase().includes(kw.toLowerCase())
    );
    if (hasWholesale) {
      alert(lang === 'ko'
        ? '도매 관련 문의는 별도로 연락 부탁드립니다.'
        : 'For wholesale inquiries, please contact us separately.');
      return;
    }

    const today = new Date();
    const dateStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    try {
      await BoardData.addPost({
        date: dateStr,
        from,
        category,
        question,
        answer: '',
        answeredBy: '',
        resolved: 'No',
        followUp: ''
      });
      this.closeModals();
      alert(lang === 'ko' ? '질문이 등록되었습니다.' : 'Question submitted successfully.');
    } catch (err) {
      console.error('Add post error:', err);
      alert(lang === 'ko' ? '등록 중 오류가 발생했습니다.' : 'An error occurred. Please try again.');
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
      alert(lang === 'ko' ? '등록 중 오류가 발생했습니다.' : 'An error occurred. Please try again.');
    }
  },

  async deletePost(id) {
    try {
      await BoardData.deletePost(id);
      this.closeModals();
    } catch (err) {
      console.error('Delete post error:', err);
    }
  },

  // ── Filtering ──────────────────────────────────────────
  getFilteredPosts() {
    let posts = BoardData.getPosts();
    const search = (document.getElementById('boardSearch')?.value || '').toLowerCase().trim();
    const catFilter = document.getElementById('filterCategory')?.value || 'all';
    const statusFilter = document.getElementById('filterStatus')?.value || 'all';
    const answererFilter = (document.getElementById('filterAnswerer')?.value || '').toLowerCase().trim();

    if (search) {
      posts = posts.filter(p =>
        (p.question || '').toLowerCase().includes(search) ||
        (p.answer || '').toLowerCase().includes(search) ||
        (p.from || '').toLowerCase().includes(search) ||
        (p.category || '').toLowerCase().includes(search)
      );
    }
    if (catFilter !== 'all') {
      posts = posts.filter(p => (p.category || '').toLowerCase() === catFilter.toLowerCase());
    }
    if (statusFilter !== 'all') {
      posts = posts.filter(p => p.resolved === statusFilter);
    }
    if (answererFilter) {
      posts = posts.filter(p => (p.answeredBy || '').toLowerCase().includes(answererFilter));
    }
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
        <td style="color:var(--text-muted); font-size:.85rem;">${start + idx + 1}</td>
        <td style="white-space:nowrap; font-size:.85rem;">${escHtml(p.date)}</td>
        <td style="font-weight:600;">${escHtml(p.from)}</td>
        <td><span class="badge badge-accent">${escHtml(p.category)}</span></td>
        <td style="max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escHtml(p.question)}</td>
        <td>
          <span class="badge ${p.resolved === 'Yes' ? 'badge-green' : 'badge-orange'}">
            ${p.resolved === 'Yes' ? (isKo ? '해결' : 'Resolved') : (isKo ? '대기' : 'Pending')}
          </span>
        </td>
        <td style="font-size:.85rem; color:var(--text-secondary);">${escHtml(p.answeredBy || '-')}</td>
      </tr>
    `).join('');

    // Pagination
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }
    let phtml = '';
    if (this.currentPage > 1) {
      phtml += `<button onclick="BoardApp.goPage(${this.currentPage - 1})">&laquo;</button>`;
    }
    for (let i = 1; i <= totalPages; i++) {
      phtml += `<button class="${i === this.currentPage ? 'active' : ''}" onclick="BoardApp.goPage(${i})">${i}</button>`;
    }
    if (this.currentPage < totalPages) {
      phtml += `<button onclick="BoardApp.goPage(${this.currentPage + 1})">&raquo;</button>`;
    }
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

// Close modals on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
  }
});

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('show');
  }
});
