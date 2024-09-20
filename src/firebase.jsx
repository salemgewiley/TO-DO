// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzeXmAGYX4UlAc9YR1cHq2sUr23968kbw",
  authDomain: "to-do-firebase-ea3a0.firebaseapp.com",
  databaseURL: "https://to-do-firebase-ea3a0-default-rtdb.firebaseio.com",
  projectId: "to-do-firebase-ea3a0",
  storageBucket: "to-do-firebase-ea3a0.appspot.com",
  messagingSenderId: "638515987949",
  appId: "1:638515987949:web:41544829bb60175b6dd3e4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const database = getDatabase(app);

export { auth, provider, database };
