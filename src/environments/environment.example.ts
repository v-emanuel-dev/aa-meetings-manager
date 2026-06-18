import { FirebaseOptions } from 'firebase/app';

export const environment = {
  production: false,
  firebaseDocumentPath: 'aaPersonal/defaultProfile',
  firebase: {
    apiKey: 'SUA_API_KEY',
    authDomain: 'seu-projeto.firebaseapp.com',
    projectId: 'seu-projeto',
    storageBucket: 'seu-projeto.firebasestorage.app',
    messagingSenderId: '000000000000',
    appId: '1:000000000000:web:0000000000000000000000'
  } satisfies FirebaseOptions
};
