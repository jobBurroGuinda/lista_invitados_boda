/**
 * @fileoverview Inicialización de Firebase para el proyecto lista_invitados_publica.
 * @author Job Adolfo Salinas Hernández
 */
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * Configuración de Firebase leída desde variables de entorno.
 * @type {Object}
 */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
/** Instancia de Firestore para la aplicación. @type {import('firebase/firestore').Firestore} */
export const db = getFirestore(app);
