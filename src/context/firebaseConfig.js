import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCctIitTMSq_Ku7RyMsem4x1Kzl_usg8W4",
    authDomain: "prueba-crud-25ed8.firebaseapp.com",
    projectId: "prueba-crud-25ed8",
    storageBucket: "prueba-crud-25ed8.firebasestorage.app",
    messagingSenderId: "682332718383",
    appId: "1:682332718383:web:7546aab7fdadf40d4a8dda"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { db, auth, provider };