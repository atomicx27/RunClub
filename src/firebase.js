import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// We don't need auth SDK yet if we are using "Test Mode" (Open rules), 
// but good to import if we want to use anonymous auth later.

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

// Export Realtime Database reference
export const db = getDatabase(app);
