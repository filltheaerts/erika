/* ============================================================
   ERIKA — Firebase Configuration
   ============================================================ */

const firebaseConfig = {
  apiKey:            "AIzaSyB7DLIK9Ua-Is0iXDSY949T6YOE4bGkVO8",
  authDomain:        "erika-board.firebaseapp.com",
  projectId:         "erika-board",
  storageBucket:     "erika-board.firebasestorage.app",
  messagingSenderId: "225354181598",
  appId:             "1:225354181598:web:91629b227a9bcca27f0b4f"
};

// ── Initialize Firebase ────────────────────────────────────
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Firestore 컬렉션 참조
const postsRef = db.collection('posts');
