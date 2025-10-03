import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  Query,
  DocumentData,
  CollectionReference
} from 'firebase/firestore';
import { db } from './config';

export interface FirestoreService {
  // Generic CRUD operations
  create: (collectionName: string, data: any) => Promise<string>;
  read: (collectionName: string, docId: string) => Promise<any>;
  update: (collectionName: string, docId: string, data: any) => Promise<void>;
  delete: (collectionName: string, docId: string) => Promise<void>;
  list: (collectionName: string, conditions?: any[]) => Promise<any[]>;
}

class FirebaseFirestoreService implements FirestoreService {
  async create(collectionName: string, data: any): Promise<string> {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  async read(collectionName: string, docId: string): Promise<any> {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error(`Document not found in ${collectionName} with id: ${docId}`);
    }
  }

  async update(collectionName: string, docId: string, data: any): Promise<void> {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  }

  async delete(collectionName: string, docId: string): Promise<void> {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  }

  async list(collectionName: string, conditions: any[] = []): Promise<any[]> {
    const collectionRef = collection(db, collectionName);
    
    let queryRef: Query<DocumentData> | CollectionReference<DocumentData> = collectionRef;
    if (conditions.length > 0) {
      queryRef = query(collectionRef, ...conditions);
    }
    
    const querySnapshot = await getDocs(queryRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  // Utility methods for common query conditions
  createWhereCondition(field: string, operator: any, value: any) {
    return where(field, operator, value);
  }

  createOrderByCondition(field: string, direction: 'asc' | 'desc' = 'asc') {
    return orderBy(field, direction);
  }

  createLimitCondition(limitCount: number) {
    return limit(limitCount);
  }
}

export const firestoreService = new FirebaseFirestoreService();