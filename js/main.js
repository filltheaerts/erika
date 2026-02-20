/* ============================================================
   RH&VV Q&A — Main JavaScript
   Auth Guard, Navigation, Language Toggle (KR/EN), i18n
   ============================================================ */

// ── Auth Guard ────────────────────────────────────────────
function checkAuth() {
  if (!sessionStorage.getItem('rh_auth')) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function doLogout() {
  sessionStorage.removeItem('rh_auth');
  window.location.href = 'index.html';
}

function isAdmin() {
  return sessionStorage.getItem('rh_auth') === 'admin';
}

// ── i18n Translations ──────────────────────────────────────
const i18n = {
  ko: {
    'nav.home': 'Home',
    'nav.qna': 'Q&A',
    'nav.logout': '로그아웃',

    'hero.cta1': 'Q&A 바로가기',

    'features.label': 'Features',
    'features.title': '왜 이 게시판인가요?',

    'cta.title': '질문이 있으신가요?',
    'cta.desc': '게시판에서 기존 답변을 확인하거나, 새로운 질문을 남겨주세요.',
    'cta.btn': 'Q&A로 이동',

    'board.label': 'Q&A',
    'board.title': 'Q&A',
    'board.desc': '질문을 남기고 과거 답변을 검색하세요. 해결된 질문은 계속 열람 가능합니다. 관리자(Erika)가 매일 게시판을 확인하고 답변합니다.',
    'board.notice': '민감한 정보(고객 계약 규모, 패널 개인정보 등)는 포함하지 않도록 주의해 주세요.',
    'board.search': '검색...',
    'board.filter.allCat': '전체 카테고리',
    'board.filter.allStatus': '전체 상태',
    'board.filter.resolved': '해결됨',
    'board.filter.pending': '미해결',
    'board.filter.answerer': '댓글 작성자 검색...',
    'board.manageCat': '카테고리 관리',
    'board.writeBtn': '질문하기',
    'board.downloadBtn': '엑셀 다운로드',
    'board.th.date': '날짜',
    'board.th.from': '질문자',
    'board.th.category': '카테고리',
    'board.th.question': '질문',
    'board.th.status': '상태',
    'board.th.answeredBy': '댓글 작성자',
    'board.empty': '게시물이 없습니다.',
    'board.admin.label': '관리자 모드',
    'board.write.title': '새 질문 작성',
    'board.write.name': '이름 (닉네임)',
    'board.write.category': '카테고리',
    'board.write.question': '질문',
    'board.write.qPlaceholder': '질문 내용을 작성해주세요...',
    'board.write.notice': '* 중복 질문은 기존 답변을 먼저 확인해주세요.',
    'board.write.submit': '질문 등록',
    'board.detail.title': '질문 상세',
    'board.edit.title': '질문 수정',
    'board.edit.category': '카테고리',
    'board.edit.question': '질문',
    'board.edit.qPlaceholder': '질문 내용을 수정하세요...',
    'board.edit.submit': '수정 저장',
  },

  en: {
    'nav.home': 'Home',
    'nav.qna': 'Q&A',
    'nav.logout': 'Logout',

    'hero.cta1': 'Go to Q&A',

    'features.label': 'Features',
    'features.title': 'Why This Board?',

    'cta.title': 'Have a question?',
    'cta.desc': 'Check existing answers or leave a new question.',
    'cta.btn': 'Go to Q&A',

    'board.label': 'Q&A',
    'board.title': 'Q&A',
    'board.desc': 'Leave the questions and search past answers. Resolved questions remain accessible. Admin(Erika) will check the board and answer on daily basis',
    'board.notice': 'Please avoid including sensitive information (client contract size, panelist personal information, etc.)',
    'board.search': 'Search...',
    'board.filter.allCat': 'All Categories',
    'board.filter.allStatus': 'All Status',
    'board.filter.resolved': 'Resolved',
    'board.filter.pending': 'Pending',
    'board.filter.answerer': 'Search commenter...',
    'board.manageCat': 'Manage Categories',
    'board.writeBtn': 'Ask Question',
    'board.downloadBtn': 'Download Excel',
    'board.th.date': 'Date',
    'board.th.from': 'From',
    'board.th.category': 'Category',
    'board.th.question': 'Question',
    'board.th.status': 'Status',
    'board.th.answeredBy': 'Commented by',
    'board.empty': 'No posts found.',
    'board.admin.label': 'Admin Mode',
    'board.write.title': 'New Question',
    'board.write.name': 'Name (Nickname)',
    'board.write.category': 'Category',
    'board.write.question': 'Question',
    'board.write.qPlaceholder': 'Write your question here...',
    'board.write.notice': '* Please check existing answers before posting duplicate questions.',
    'board.write.submit': 'Submit Question',
    'board.detail.title': 'Question Detail',
    'board.edit.title': 'Edit Question',
    'board.edit.category': 'Category',
    'board.edit.question': 'Question',
    'board.edit.qPlaceholder': 'Edit your question...',
    'board.edit.submit': 'Save Changes',
  }
};

// ── Global State ───────────────────────────────────────────
window._lang = localStorage.getItem('erika_lang') || 'en';

// ── Language System ────────────────────────────────────────
function setLanguage(lang) {
  window._lang = lang;
  localStorage.setItem('erika_lang', lang);

  document.querySelectorAll('.lang-toggle button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  document.documentElement.lang = lang === 'ko' ? 'ko' : 'en';

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang] && i18n[lang][key]) {
      el.textContent = i18n[lang][key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (i18n[lang] && i18n[lang][key]) {
      el.placeholder = i18n[lang][key];
    }
  });

  document.querySelectorAll('option[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang] && i18n[lang][key]) {
      el.textContent = i18n[lang][key];
    }
  });

  if (typeof CMS !== 'undefined' && CMS._ready) CMS.applyAll();
  if (typeof BoardApp !== 'undefined' && BoardApp.render) BoardApp.render();
}

// ── Navigation ─────────────────────────────────────────────
function initNav() {
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 10);
    });
  }

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('active');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
      });
    });
  }

  document.querySelectorAll('.lang-toggle button').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });
}

// ── Scroll Animations ──────────────────────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initNav();
  initScrollAnimations();
  setLanguage(window._lang);
});
