import { getFirestore } from 'firebase-admin/firestore';

const FIRESTORE_DB = process.env.FIRESTORE_DB || '(default)';
export const db = () => getFirestore(FIRESTORE_DB);
