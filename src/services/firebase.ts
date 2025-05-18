// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// ArulJegan//
const firebaseConfig = {
  apiKey: "AIzaSyBAE0S48DiLzx2ldT0_2LekbICSghiRFwM",
  authDomain: "finflowai-1ec0a.firebaseapp.com",
  projectId: "finflowai-1ec0a",
  storageBucket: "finflowai-1ec0a.firebasestorage.app",
  messagingSenderId: "395105016509",
  appId: "1:395105016509:web:f17dff8ba85b6a408b75d4"
};

//Jeganwin4//
// const firebaseConfig = {
//   apiKey: "AIzaSyCD1pBuM_cSoy1C2zqAvZGP5lii--6JSYA",
//   authDomain: "finflow-b996d.firebaseapp.com",
//   projectId: "finflow-b996d",
//   storageBucket: "finflow-b996d.firebasestorage.app",
//   messagingSenderId: "841650779740",
//   appId: "1:841650779740:web:7b264c1a82380208a59899"
// };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
