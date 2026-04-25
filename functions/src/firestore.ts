import { getFirestore } from 'firebase-admin/firestore';

export const db = () => getFirestore('db-checksure');
