import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
        // API Firebase Information 
  }

  if (!firebase.apps.length){
    firebase.initializeApp(firebaseConfig);
  }

  const playersCollection = firebase.firestore().collection('players');

  export { firebase };
  export { playersCollection };
  
