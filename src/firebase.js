import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAvi-d7XqjlypEcTEXGkqkH8ccOx_6oSiU",
    authDomain: "runclub-27860.firebaseapp.com",
    projectId: "runclub-27860",
    storageBucket: "runclub-27860.firebasestorage.app",
    messagingSenderId: "870268730006",
    appId: "1:870268730006:web:9332988ed8acf1cf97a0b7",
    databaseURL: "https://runclub-27860-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Realtime Database and Auth references
export const db = getDatabase(app);
export const auth = getAuth(app);
