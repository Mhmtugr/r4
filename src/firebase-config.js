import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/analytics";

// MehmetEndustriyelTakip uygulaması için Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyCUjPf-XtmbcmFmy3m-HWjJoilDNQbt3GE",
  authDomain: "mehmetendustriyeltakip-1d917.firebaseapp.com",
  projectId: "mehmetendustriyeltakip-1d917",
  storageBucket: "mehmetendustriyeltakip-1d917.firebasestorage.app",
  messagingSenderId: "278521463542",
  appId: "1:278521463542:web:ee3f34dd1c8830f664e2d7"
};

// Firebase compat başlatma
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
const analytics = firebase.analytics();

// Expose firebase namespace for useAuthService hook
if (typeof window !== 'undefined') {
  window.firebase = firebase;
}

export { app, db, storage, analytics };
export default app;