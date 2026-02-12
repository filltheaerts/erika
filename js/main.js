/* ============================================================
   ERIKA — Main JavaScript
   Navigation, Language Toggle (KR/EN), Scroll Effects, i18n
   ============================================================ */

// ── i18n Translations ──────────────────────────────────────
const i18n = {
  ko: {
    'nav.home': 'Home',
    'nav.project': 'Project',
    'nav.qna': 'Q&A',
    'nav.board': '게시판',

    'hero.label': 'Welcome',
    'hero.title1': '함께 만들어가는',
    'hero.title2': '더 나은 답변',
    'hero.desc': '고객의 질문에 빠르고 정확하게 답하고, 모든 기록이 투명하게 공유되는 공간입니다. 과거의 질문과 답변을 쉽게 찾아보세요.',
    'hero.cta1': '게시판 바로가기',
    'hero.cta2': 'Q&A 보기',

    'features.label': 'Features',
    'features.title': '왜 이 게시판인가요?',
    'features.card1.title': '빠른 검색',
    'features.card1.desc': '카테고리, 날짜, 질문자별로 과거 질문을 빠르게 찾을 수 있습니다. 같은 질문을 반복하지 않아도 됩니다.',
    'features.card2.title': '투명한 소통',
    'features.card2.desc': '모든 질문과 답변이 열람 가능하여, 팀 전체가 동일한 정보를 공유합니다.',
    'features.card3.title': '진행 추적',
    'features.card3.desc': '해결 여부와 후속 조치(F/U)를 한눈에 파악하여 누락 없이 관리합니다.',

    'about.label': 'About',
    'about.title': '효율적인 소통,\n체계적인 관리',
    'about.desc1': '반복되는 질문에 대한 답변을 매번 다시 작성할 필요가 없습니다. 이 게시판은 모든 Q&A를 기록하고, 쉽게 검색할 수 있도록 설계되었습니다.',
    'about.desc2': 'RH, VV, Commercial, User Acquisition 등 카테고리별로 분류하여 필요한 정보를 즉시 찾으세요.',
    'about.stat1': 'Categories',
    'about.stat2': 'Access',
    'about.stat3': 'Transparent',

    'cta.title': '질문이 있으신가요?',
    'cta.desc': '게시판에서 기존 답변을 확인하거나, 새로운 질문을 남겨주세요.',
    'cta.btn': '게시판으로 이동',

    'project.label': 'Project',
    'project.title': 'Our Focus Areas',
    'project.desc': '각 카테고리별 핵심 프로젝트와 진행 현황을 확인하세요.',
    'project.rh.title': 'RH Operations',
    'project.rh.desc': 'RH 관련 운영 및 전략 프로젝트입니다. 고객 문의의 핵심 카테고리로, 체계적인 답변 체계를 구축하고 있습니다.',
    'project.vv.title': 'VV Insights',
    'project.vv.desc': 'VV 부문의 데이터 분석 및 인사이트 도출 프로젝트입니다. 실질적인 비즈니스 가치를 창출합니다.',
    'project.comm.title': 'Commercial Strategy',
    'project.comm.desc': '상업 전략 및 시장 분석 프로젝트입니다. US-commercial 팀과 협업하여 시장 경쟁력을 강화합니다.',
    'project.ua.title': 'User Acquisition',
    'project.ua.desc': '사용자 확보 전략 프로젝트입니다. 효율적인 유저 획득과 리텐션을 위한 데이터 기반 접근을 추구합니다.',
    'project.cta.title': '프로젝트 관련 질문이 있나요?',
    'project.cta.desc': '게시판에서 해당 카테고리를 선택하여 질문을 남겨주세요.',
    'project.cta.btn': '게시판 바로가기',

    'qna.label': 'Q&A',
    'qna.title': '자주 묻는 질문',
    'qna.desc': '가장 많이 묻는 질문들을 모았습니다. 원하는 답변이 없다면 게시판에서 새 질문을 남겨주세요.',
    'qna.search': '질문 검색...',
    'qna.cat.all': '전체',
    'qna.empty': '해당하는 질문이 없습니다.',
    'qna.cta.title': '원하는 답을 못 찾으셨나요?',
    'qna.cta.desc': '게시판에서 직접 질문을 남겨주시면 빠르게 답변 드리겠습니다.',
    'qna.cta.btn': '질문하러 가기',

    'board.label': 'Board',
    'board.title': '게시판',
    'board.desc': '질문을 남기고, 과거 답변을 검색하세요. 해결된 질문은 삭제되지 않고 계속 열람 가능합니다.',
    'board.search': '검색...',
    'board.filter.allCat': '전체 카테고리',
    'board.filter.allStatus': '전체 상태',
    'board.filter.resolved': '해결됨',
    'board.filter.pending': '미해결',
    'board.filter.answerer': '답변자 검색...',
    'board.loginBtn': '관리자 로그인',
    'board.writeBtn': '질문하기',
    'board.th.date': '날짜',
    'board.th.from': '질문자',
    'board.th.category': '카테고리',
    'board.th.question': '질문',
    'board.th.status': '상태',
    'board.th.answeredBy': '답변자',
    'board.empty': '게시물이 없습니다.',
    'board.admin.label': '관리자 모드',
    'board.admin.logout': '로그아웃',
    'board.write.title': '새 질문 작성',
    'board.write.name': '이름 (닉네임)',
    'board.write.category': '카테고리',
    'board.write.question': '질문',
    'board.write.qPlaceholder': '질문 내용을 작성해주세요...',
    'board.write.notice': '* 중복 질문은 기존 답변을 먼저 확인해주세요. 도매 관련 문의는 별도 문의 바랍니다.',
    'board.write.submit': '질문 등록',
    'board.detail.title': '질문 상세',
    'board.login.title': '관리자 로그인',
    'board.login.id': '아이디',
    'board.login.pw': '비밀번호',
    'board.login.error': '아이디 또는 비밀번호가 올바르지 않습니다.',
    'board.login.submit': '로그인',
    'board.answer.title': '답변 작성',
    'board.answer.by': '답변자',
    'board.answer.status': '해결 여부',
    'board.answer.yes': '해결됨',
    'board.answer.no': '미해결',
    'board.answer.text': '답변',
    'board.answer.placeholder': '답변 내용...',
    'board.answer.fuPlaceholder': '후속 조치 사항 (선택)',
    'board.answer.submit': '답변 등록',
  },

  en: {
    'nav.home': 'Home',
    'nav.project': 'Project',
    'nav.qna': 'Q&A',
    'nav.board': 'Board',

    'hero.label': 'Welcome',
    'hero.title1': 'Building Together',
    'hero.title2': 'Better Answers',
    'hero.desc': 'A space where customer questions are answered quickly and accurately, with all records transparently shared. Easily search through past Q&A.',
    'hero.cta1': 'Go to Board',
    'hero.cta2': 'View Q&A',

    'features.label': 'Features',
    'features.title': 'Why This Board?',
    'features.card1.title': 'Fast Search',
    'features.card1.desc': 'Quickly find past questions by category, date, and questioner. No need to ask the same question twice.',
    'features.card2.title': 'Transparent Communication',
    'features.card2.desc': 'All questions and answers are viewable, ensuring the entire team shares the same information.',
    'features.card3.title': 'Progress Tracking',
    'features.card3.desc': 'Track resolution status and follow-ups at a glance to ensure nothing falls through the cracks.',

    'about.label': 'About',
    'about.title': 'Efficient Communication,\nSystematic Management',
    'about.desc1': 'No need to rewrite answers to repeated questions. This board is designed to record all Q&A and make it easily searchable.',
    'about.desc2': 'Categorized by RH, VV, Commercial, User Acquisition and more — find the information you need instantly.',
    'about.stat1': 'Categories',
    'about.stat2': 'Access',
    'about.stat3': 'Transparent',

    'cta.title': 'Have a question?',
    'cta.desc': 'Check existing answers on the board or leave a new question.',
    'cta.btn': 'Go to Board',

    'project.label': 'Project',
    'project.title': 'Our Focus Areas',
    'project.desc': 'Explore core projects and progress by category.',
    'project.rh.title': 'RH Operations',
    'project.rh.desc': 'Operations and strategy projects related to RH. A core question category with a systematic answer framework.',
    'project.vv.title': 'VV Insights',
    'project.vv.desc': 'Data analysis and insight generation for the VV segment. Creating tangible business value.',
    'project.comm.title': 'Commercial Strategy',
    'project.comm.desc': 'Commercial strategy and market analysis. Collaborating with US-commercial team to strengthen market competitiveness.',
    'project.ua.title': 'User Acquisition',
    'project.ua.desc': 'User acquisition strategy with data-driven approaches for efficient user growth and retention.',
    'project.cta.title': 'Questions about projects?',
    'project.cta.desc': 'Select the relevant category on the board and leave your question.',
    'project.cta.btn': 'Go to Board',

    'qna.label': 'Q&A',
    'qna.title': 'Frequently Asked Questions',
    'qna.desc': 'Browse the most commonly asked questions. If you can\'t find your answer, leave a new question on the board.',
    'qna.search': 'Search questions...',
    'qna.cat.all': 'All',
    'qna.empty': 'No matching questions found.',
    'qna.cta.title': 'Can\'t find the answer?',
    'qna.cta.desc': 'Leave your question on the board and we\'ll respond promptly.',
    'qna.cta.btn': 'Ask a Question',

    'board.label': 'Board',
    'board.title': 'Board',
    'board.desc': 'Leave questions and search past answers. Resolved questions remain accessible and are never deleted.',
    'board.search': 'Search...',
    'board.filter.allCat': 'All Categories',
    'board.filter.allStatus': 'All Status',
    'board.filter.resolved': 'Resolved',
    'board.filter.pending': 'Pending',
    'board.filter.answerer': 'Search answerer...',
    'board.loginBtn': 'Admin Login',
    'board.writeBtn': 'Ask Question',
    'board.th.date': 'Date',
    'board.th.from': 'From',
    'board.th.category': 'Category',
    'board.th.question': 'Question',
    'board.th.status': 'Status',
    'board.th.answeredBy': 'Answered by',
    'board.empty': 'No posts found.',
    'board.admin.label': 'Admin Mode',
    'board.admin.logout': 'Logout',
    'board.write.title': 'New Question',
    'board.write.name': 'Name (Nickname)',
    'board.write.category': 'Category',
    'board.write.question': 'Question',
    'board.write.qPlaceholder': 'Write your question here...',
    'board.write.notice': '* Please check existing answers before posting duplicate questions. For wholesale inquiries, please contact us separately.',
    'board.write.submit': 'Submit Question',
    'board.detail.title': 'Question Detail',
    'board.login.title': 'Admin Login',
    'board.login.id': 'Username',
    'board.login.pw': 'Password',
    'board.login.error': 'Invalid username or password.',
    'board.login.submit': 'Login',
    'board.answer.title': 'Write Answer',
    'board.answer.by': 'Answered by',
    'board.answer.status': 'Resolution Status',
    'board.answer.yes': 'Resolved',
    'board.answer.no': 'Pending',
    'board.answer.text': 'Answer',
    'board.answer.placeholder': 'Write your answer...',
    'board.answer.fuPlaceholder': 'Follow-up notes (optional)',
    'board.answer.submit': 'Submit Answer',
  }
};

// ── Global State ───────────────────────────────────────────
window._lang = localStorage.getItem('erika_lang') || 'ko';

// ── Language System ────────────────────────────────────────
function setLanguage(lang) {
  window._lang = lang;
  localStorage.setItem('erika_lang', lang);

  // Update toggle buttons
  document.querySelectorAll('.lang-toggle button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Update html lang
  document.documentElement.lang = lang === 'ko' ? 'ko' : 'en';

  // Translate elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang] && i18n[lang][key]) {
      el.textContent = i18n[lang][key];
    }
  });

  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (i18n[lang] && i18n[lang][key]) {
      el.placeholder = i18n[lang][key];
    }
  });

  // Translate option elements
  document.querySelectorAll('option[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang] && i18n[lang][key]) {
      el.textContent = i18n[lang][key];
    }
  });

  // Re-render board if on board page
  if (typeof BoardApp !== 'undefined' && BoardApp.render) {
    BoardApp.render();
  }
}

// ── Navigation ─────────────────────────────────────────────
function initNav() {
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  // Scroll effect
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  });

  // Hamburger toggle
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('active');
    });
  }

  // Close mobile menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      if (hamburger) hamburger.classList.remove('active');
    });
  });

  // Language toggle
  document.querySelectorAll('.lang-toggle button').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });
}

// ── Scroll Animations ──────────────────────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initScrollAnimations();
  setLanguage(window._lang);
});
