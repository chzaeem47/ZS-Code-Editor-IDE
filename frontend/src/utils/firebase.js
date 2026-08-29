import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCdRxhlGUbyPyc3tDvkuhYEmCfoAOQkam0",
  authDomain: "zs-code.firebaseapp.com",
  projectId: "zs-code",
  storageBucket: "zs-code.firebasestorage.app",
  messagingSenderId: "611172939380",
  appId: "1:611172939380:web:e51f65eaf22a83b4bd0321"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and the Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();