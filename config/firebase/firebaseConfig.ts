// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCucJAqFe4hvRbZd2aLf54uWn0vudlk7N8",
  authDomain: "mess-website-b53e9.firebaseapp.com",
  projectId: "mess-website-b53e9",
  storageBucket: "mess-website-b53e9.firebasestorage.app",
  messagingSenderId: "472794543297",
  appId: "1:472794543297:web:49a92f04052df5722ed040"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

