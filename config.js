import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBECXYTGQykyurvFdRRSZPtN69vVmbvlAU",
    authDomain: "interlinked-5b77a.firebaseapp.com",
    projectId: "interlinked-5b77a",
    storageBucket: "interlinked-5b77a.appspot.com",
    messagingSenderId: "926924551340",
    appId: "1:926924551340:web:d34613daef774b8a0b1b09",
    measurementId: "G-GC00B6XQSD"
  }

  if (!firebase.apps.length){
    firebase.initializeApp(firebaseConfig);
  }

  const playersCollection = firebase.firestore().collection('players');

  export { firebase };
  export { playersCollection };
  