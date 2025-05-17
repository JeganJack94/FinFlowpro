// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCD1pBuM_cSoy1C2zqAvZGP5lii--6JSYA",
  authDomain: "finflow-b996d.firebaseapp.com",
  projectId: "finflow-b996d",
  storageBucket: "finflow-b996d.firebasestorage.app",
  messagingSenderId: "841650779740",
  appId: "1:841650779740:web:7b264c1a82380208a59899"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
