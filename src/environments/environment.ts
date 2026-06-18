import { FirebaseOptions } from 'firebase/app';

export const environment = {
  production: false,
  firebaseDocumentPath: 'aaPersonal/defaultProfile',
  firebase: {
    apiKey: 'AIzaSyD7pwPs7MnirP_PbENNzoZXm7Eo8FGyKws',
    authDomain: 'aa-pessoal.firebaseapp.com',
    projectId: 'aa-pessoal',
    storageBucket: 'aa-pessoal.firebasestorage.app',
    messagingSenderId: '588173616497',
    appId: '1:588173616497:web:1dea06a50cc90f45eb02d0'
  } satisfies FirebaseOptions
};
