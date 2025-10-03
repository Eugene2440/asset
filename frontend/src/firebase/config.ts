// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAr-34SBYmFXCXYEwHzkpp_UhqaaD2f0o4",
  authDomain: "assets-11ffc.firebaseapp.com",
  projectId: "assets-11ffc",
  storageBucket: "assets-11ffc.firebasestorage.app",
  messagingSenderId: "463508766906",
  appId: "1:463508766906:web:a2d85453e6a6481ae44283"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;