import { initializeApp } from '@react-native-firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8bVnq1QZ4X6X8X6X8X6X8X6X8X6X8X6X8",
  authDomain: "grocerease-12345.firebaseapp.com",
  databaseURL: "https://grocerease-12345-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "grocerease-12345",
  storageBucket: "grocerease-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcd1234efgh5678",
  measurementId: "G-RD0W5092JN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;
