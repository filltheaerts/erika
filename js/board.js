/* ============================================================
   RH&VV Q&A — Board Logic (Firebase Firestore)
   CRUD, Comments/Replies, Edit, Filtering, Pagination, Excel
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
    // Delete all comments in subcollection first
    const comments = await postsRef.doc(id).collection('comments').get();
    if (!comments.empty) {
      const batch = db.batch();
      comments.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
    await postsRef.doc(id).delete();
  },

  // ── Comments Subcollection ──
  subscribeComments(postId, callback) {
    return postsRef.doc(postId).collection('comments')
      .orderBy('createdAt', 'asc')
      .onSnapshot(snapshot => {
        const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(comments);
      });
  },

  async addComment(postId, comment) {
    comment.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    return await postsRef.doc(postId).collection('comments').add(comment);
  },

  async deleteComment(postId, commentId) {
    // Delete replies to this comment first
    const replies = await postsRef.doc(postId).collection('comments')
      .where('parentId', '==', commentId).get();
    if (!replies.empty) {
      const batch = db.batch();
      replies.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
    await postsRef.doc(postId).collection('comments').doc(commentId).delete();
  },
};

// ── Board App ──────────────────────────────────────────────
const POSTS_PER_PAGE = 10;

window.BoardApp = {
  currentPage: 1,
  isAdmin: false,
  _commentUnsub: null,
  _currentPostId: null,

  async init() {
    this.isAdmin = isAdmin();
    this.updateAdminUI();
    this.bindFilters();
    BoardData.subscribe((posts) => {
      this.render();
      if (!this._activityChecked) {
        this._activityChecked = true;
        this.checkNewActivity(posts);
        this.migrateResolvedPosts();
      }
    });
  },

  updateAdminUI() {
    const adminBar = document.getElementById('adminBar');
    const catBtn = document.getElementById('cmsManageCatBtn');
    if (adminBar) adminBar.classList.toggle('show', this.isAdmin);
    if (catBtn) catBtn.style.display = this.isAdmin ? '' : 'none';
    if (this.isAdmin && typeof CMS !== 'undefined') CMS.enableEditMode();
    if (!this.isAdmin && typeof CMS !== 'undefined') CMS.disableEditMode();
  },

  // ── Author Identity ─────────────────────────────────────
  getAuthor() {
    return sessionStorage.getItem('rh_author') || '';
  },

  setAuthor(name) {
    if (name) sessionStorage.setItem('rh_author', name);
  },

  canEditPost(post) {
    const author = this.getAuthor();
    return this.isAdmin || (author && post.from === author);
  },

  canDeleteComment(comment) {
    const author = this.getAuthor();
    return this.isAdmin || (author && comment.author === author);
  },

  // ── Modals ─────────────────────────────────────────────
  closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('show'));
    if (this._commentUnsub) {
      this._commentUnsub();
      this._commentUnsub = null;
    }
    this._currentPostId = null;
  },

  showWriteModal() {
    document.getElementById('writeForm').reset();
    const author = this.getAuthor();
    if (author) document.getElementById('writeFrom').value = author;
    document.getElementById('writeModal').classList.add('show');
    document.getElementById('writeFrom').focus();
  },

  // ── Detail View with Comments ────────────────────────────
  showDetail(postId) {
    const post = BoardData.getPosts().find(p => p.id === postId);
    if (!post) return;

    this._currentPostId = postId;
    const lang = window._lang || 'en';
    const isKo = lang === 'ko';
    const content = document.getElementById('detailContent');
    const canEdit = this.canEditPost(post);

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
        </div>` : ''}
        ${post.followUp ? `
        <div class="post-followup">
          <strong>F/U:</strong> ${escHtml(post.followUp)}
        </div>` : ''}
        <div class="post-action-bar">
          ${canEdit ? `
          <button class="btn btn-sm btn-outline" onclick="BoardApp.showEditModal('${post.id}')">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:2px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" transform="scale(.58)"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" transform="scale(.58)"/></svg>
            ${isKo ? '수정' : 'Edit'}
          </button>` : ''}
          ${this.isAdmin ? `
          <button class="btn btn-sm btn-outline" onclick="BoardApp.toggleResolved('${post.id}')" style="color:${post.resolved === 'Yes' ? '#E65100' : '#2E7D32'}; border-color:${post.resolved === 'Yes' ? '#E65100' : '#2E7D32'};">
            ${post.resolved === 'Yes' ? (isKo ? '미해결로 변경' : 'Mark Pending') : (isKo ? '해결로 변경' : 'Mark Resolved')}
          </button>` : ''}
          ${this.isAdmin ? `
          <button class="btn btn-sm btn-outline" style="color:#E53935; border-color:#E53935;" onclick="if(confirm('${isKo ? '삭제하시겠습니까?' : 'Delete this post?'}')) { BoardApp.deletePost('${post.id}'); }">
            ${isKo ? '삭제' : 'Delete'}
          </button>` : ''}
        </div>

        <!-- Comments Section -->
        <div class="comments-section">
          <h4 class="comments-title">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" transform="scale(.67)"/></svg>
            ${isKo ? '댓글' : 'Comments'} <span id="commentCount"></span>
          </h4>
          <div id="commentsList" class="comments-list">
            <p style="color:var(--text-muted); font-size:.85rem;">${isKo ? '로딩 중...' : 'Loading...'}</p>
          </div>
          <!-- New Comment Form -->
          <div class="comment-form-wrap">
            <div class="comment-form-row">
              <input type="text" id="commentAuthor" class="comment-input" placeholder="${isKo ? '이름' : 'Name'}" maxlength="50" value="${escHtml(this.getAuthor())}">
              <button class="btn btn-sm btn-primary" onclick="BoardApp.submitComment('${post.id}')">
                ${isKo ? '댓글 등록' : 'Post Comment'}
              </button>
            </div>
            <textarea id="commentText" class="comment-textarea" placeholder="${isKo ? '댓글을 작성하세요...' : 'Write a comment...'}" maxlength="2000" rows="3"></textarea>
          </div>
        </div>
      </div>
    `;

    // Subscribe to comments real-time
    if (this._commentUnsub) this._commentUnsub();
    this._commentUnsub = BoardData.subscribeComments(postId, (comments) => {
      this.renderComments(comments, postId);
    });

    document.getElementById('detailModal').classList.add('show');
  },

  renderComments(comments, postId) {
    const listEl = document.getElementById('commentsList');
    const countEl = document.getElementById('commentCount');
    if (!listEl) return;

    const lang = window._lang || 'en';
    const isKo = lang === 'ko';

    const topLevel = comments.filter(c => !c.parentId);
    const replies = comments.filter(c => c.parentId);

    if (countEl) countEl.textContent = `(${comments.length})`;

    if (comments.length === 0) {
      listEl.innerHTML = `<p class="comments-empty">${isKo ? '아직 댓글이 없습니다.' : 'No comments yet.'}</p>`;
      return;
    }

    let html = '';
    topLevel.forEach(comment => {
      const commentReplies = replies.filter(r => r.parentId === comment.id);
      const canDel = this.canDeleteComment(comment);
      const timeStr = formatTime(comment.createdAt);

      html += `
        <div class="comment-item">
          <div class="comment-header">
            <strong class="comment-author">${escHtml(comment.author)}</strong>
            <span class="comment-time">${timeStr}</span>
            <div class="comment-actions">
              <button class="comment-action-btn" onclick="BoardApp.showReplyForm('${comment.id}')">
                ${isKo ? '답글' : 'Reply'}
              </button>
              ${canDel ? `<button class="comment-action-btn comment-del-btn" onclick="if(confirm('${isKo ? '삭제하시겠습니까?' : 'Delete?'}')) BoardApp.deleteComment('${postId}', '${comment.id}')">
                ${isKo ? '삭제' : 'Delete'}
              </button>` : ''}
            </div>
          </div>
          <div class="comment-body">${escHtml(comment.text)}</div>
      `;

      // Render replies (대댓글)
      commentReplies.forEach(reply => {
        const canDelReply = this.canDeleteComment(reply);
        const replyTime = formatTime(reply.createdAt);

        html += `
          <div class="comment-reply-item">
            <div class="comment-header">
              <span class="reply-arrow">&#8627;</span>
              <strong class="comment-author">${escHtml(reply.author)}</strong>
              <span class="comment-time">${replyTime}</span>
              ${canDelReply ? `<div class="comment-actions"><button class="comment-action-btn comment-del-btn" onclick="if(confirm('${isKo ? '삭제하시겠습니까?' : 'Delete?'}')) BoardApp.deleteComment('${postId}', '${reply.id}')">
                ${isKo ? '삭제' : 'Delete'}
              </button></div>` : ''}
            </div>
            <div class="comment-body">${escHtml(reply.text)}</div>
          </div>
        `;
      });

      // Reply form (hidden by default)
      html += `
          <div class="reply-form-wrap" id="replyForm_${comment.id}" style="display:none;">
            <div class="comment-form-row">
              <input type="text" class="reply-author-input comment-input" placeholder="${isKo ? '이름' : 'Name'}" maxlength="50" value="${escHtml(this.getAuthor())}">
              <button class="btn btn-sm btn-primary" onclick="BoardApp.submitComment('${postId}', '${comment.id}')">
                ${isKo ? '답글 등록' : 'Reply'}
              </button>
              <button class="btn btn-sm btn-outline" onclick="document.getElementById('replyForm_${comment.id}').style.display='none'">
                ${isKo ? '취소' : 'Cancel'}
              </button>
            </div>
            <textarea class="reply-text-input comment-textarea" placeholder="${isKo ? '답글을 작성하세요...' : 'Write a reply...'}" maxlength="2000" rows="2"></textarea>
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;
  },

  showReplyForm(commentId) {
    // Hide all other reply forms first
    document.querySelectorAll('.reply-form-wrap').forEach(f => f.style.display = 'none');
    const form = document.getElementById('replyForm_' + commentId);
    if (form) {
      form.style.display = 'block';
      form.querySelector('.reply-text-input').focus();
    }
  },

  // ── Edit Post ───────────────────────────────────────────
  showEditModal(postId) {
    const post = BoardData.getPosts().find(p => p.id === postId);
    if (!post || !this.canEditPost(post)) return;

    document.getElementById('editPostId').value = postId;
    document.getElementById('editQuestion').value = post.question;

    // Populate edit category select from write category
    const writeCat = document.getElementById('writeCategory');
    const editCat = document.getElementById('editCategory');
    if (writeCat && editCat) {
      editCat.innerHTML = writeCat.innerHTML;
      editCat.value = post.category;
    }

    this.closeModals();
    document.getElementById('editModal').classList.add('show');
    document.getElementById('editQuestion').focus();
  },

  async submitEdit(e) {
    e.preventDefault();
    const postId = document.getElementById('editPostId').value;
    const category = document.getElementById('editCategory').value;
    const question = document.getElementById('editQuestion').value.trim();
    if (!question) return;

    const lang = window._lang || 'ko';
    try {
      await BoardData.updatePost(postId, { category, question });
      this.closeModals();
      alert(lang === 'ko' ? '수정되었습니다.' : 'Updated successfully.');
      this.showDetail(postId);
    } catch (err) {
      console.error('Edit post error:', err);
      alert(lang === 'ko' ? '오류가 발생했습니다.' : 'An error occurred.');
    }
  },

  // ── Toggle Resolved (Admin) ─────────────────────────────
  async toggleResolved(postId) {
    const post = BoardData.getPosts().find(p => p.id === postId);
    if (!post || !this.isAdmin) return;

    const newStatus = post.resolved === 'Yes' ? 'No' : 'Yes';
    try {
      await BoardData.updatePost(postId, { resolved: newStatus });
      // Detail will auto-refresh via snapshot listener, reopen
      setTimeout(() => this.showDetail(postId), 300);
    } catch (err) {
      console.error('Toggle resolved error:', err);
    }
  },

  // ── Comment CRUD ────────────────────────────────────────
  async submitComment(postId, parentId) {
    let authorEl, textEl;

    if (parentId) {
      const formWrap = document.getElementById('replyForm_' + parentId);
      if (!formWrap) return;
      authorEl = formWrap.querySelector('.reply-author-input');
      textEl = formWrap.querySelector('.reply-text-input');
    } else {
      authorEl = document.getElementById('commentAuthor');
      textEl = document.getElementById('commentText');
    }

    const author = authorEl.value.trim();
    const text = textEl.value.trim();
    if (!author || !text) {
      const lang = window._lang || 'en';
      alert(lang === 'ko' ? '이름과 내용을 입력해주세요.' : 'Please enter name and content.');
      return;
    }

    this.setAuthor(author);

    try {
      await BoardData.addComment(postId, {
        author,
        text,
        parentId: parentId || null,
      });

      // Update post with last comment info
      const postUpdates = {
        lastCommentAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastCommentBy: author
      };

      // Pending: always show last commenter / Resolved: keep first commenter
      if (!parentId) {
        const post = BoardData.getPosts().find(p => p.id === postId);
        if (post && post.resolved === 'Yes') {
          if (!post.answeredBy) postUpdates.answeredBy = author;
        } else {
          postUpdates.answeredBy = author;
        }
      }

      await BoardData.updatePost(postId, postUpdates);

      textEl.value = '';
      if (parentId) {
        document.getElementById('replyForm_' + parentId).style.display = 'none';
      }
    } catch (err) {
      console.error('Add comment error:', err);
      const lang = window._lang || 'en';
      alert(lang === 'ko' ? '오류가 발생했습니다.' : 'An error occurred.');
    }
  },

  async deleteComment(postId, commentId) {
    try {
      await BoardData.deleteComment(postId, commentId);
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  },

  // ── CRUD ───────────────────────────────────────────────
  async submitQuestion(e) {
    e.preventDefault();
    const from = document.getElementById('writeFrom').value.trim();
    const category = document.getElementById('writeCategory').value;
    const question = document.getElementById('writeQuestion').value.trim();
    if (!from || !question) return;

    // Store author identity
    this.setAuthor(from);

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
      isKo ? '댓글 작성자' : 'Commented by',
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
  },

  // ── Migration: fill empty answeredBy on all posts ───────
  async migrateResolvedPosts() {
    if (localStorage.getItem('erika_migration_v3')) return;
    if (!this.isAdmin) return;

    const posts = BoardData.getPosts().filter(p => !p.answeredBy);
    let allOk = true;
    for (const post of posts) {
      try {
        // Fetch all comments, filter top-level client-side (avoids composite index)
        const snap = await postsRef.doc(post.id).collection('comments')
          .orderBy('createdAt', 'asc')
          .get();
        const topLevel = snap.docs
          .map(d => d.data())
          .filter(c => !c.parentId);
        if (topLevel.length > 0) {
          // Resolved → first commenter, Pending → last commenter
          const author = post.resolved === 'Yes'
            ? topLevel[0].author
            : topLevel[topLevel.length - 1].author;
          await BoardData.updatePost(post.id, { answeredBy: author });
        }
      } catch (err) {
        console.error('Migration error for post', post.id, err);
        allOk = false;
      }
    }
    if (allOk) localStorage.setItem('erika_migration_v3', 'done');
  },

  // ── New Activity Banner ────────────────────────────────
  checkNewActivity(posts) {
    const banner = document.getElementById('newActivityBanner');
    if (!banner || !posts || posts.length === 0) return;

    const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const lang = window._lang || 'en';
    const isKo = lang === 'ko';

    const newQuestions = posts.filter(p => {
      if (!p.createdAt) return false;
      const d = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
      return d > cutoff;
    });

    const newComments = posts.filter(p => {
      if (!p.lastCommentAt) return false;
      const d = p.lastCommentAt.toDate ? p.lastCommentAt.toDate() : new Date(p.lastCommentAt);
      return d > cutoff;
    });

    if (newQuestions.length === 0 && newComments.length === 0) {
      banner.classList.add('hidden');
      return;
    }

    let html = '';

    if (newQuestions.length > 0) {
      html += `<div class="activity-section">
        <strong>${isKo ? '📋 새 질문' : '📋 New Questions'} (${newQuestions.length}):</strong>
        <ul>`;
      newQuestions.forEach(p => {
        const title = (p.question || '').substring(0, 50) + ((p.question || '').length > 50 ? '...' : '');
        html += `<li><a href="javascript:void(0)" onclick="BoardApp.showDetail('${p.id}')">${escHtml(title)}</a> <span class="activity-author">— by ${escHtml(p.from)}</span></li>`;
      });
      html += `</ul></div>`;
    }

    if (newComments.length > 0) {
      html += `<div class="activity-section">
        <strong>${isKo ? '💬 새 댓글' : '💬 New Comments'} (${newComments.length}):</strong>
        <ul>`;
      newComments.forEach(p => {
        const title = (p.question || '').substring(0, 50) + ((p.question || '').length > 50 ? '...' : '');
        html += `<li><a href="javascript:void(0)" onclick="BoardApp.showDetail('${p.id}')">${escHtml(title)}</a> <span class="activity-author">— comment by ${escHtml(p.lastCommentBy || '')}</span></li>`;
      });
      html += `</ul></div>`;
    }

    html += `<button class="dismiss-btn" onclick="document.getElementById('newActivityBanner').classList.add('hidden')" title="${isKo ? '닫기' : 'Dismiss'}">&times;</button>`;

    banner.innerHTML = html;
    banner.classList.remove('hidden');
  }
};

// ── Utility ────────────────────────────────────────────────
function escHtml(text) {
  if (!text) return '';
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  try {
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0') + ' ' +
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0');
  } catch (e) { return ''; }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('show');
});
