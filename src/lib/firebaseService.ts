import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Turma, Exam, Result } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    userId: auth.currentUser?.uid,
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Turmas
export const createTurma = async (name: string) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  
  const path = 'turmas';
  try {
    const docRef = await addDoc(collection(db, path), {
      name,
      ownerId: userId,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const deleteTurma = async (id: string) => {
  const path = `turmas/${id}`;
  try {
    await deleteDoc(doc(db, 'turmas', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const subscribeToTurmas = (callback: (turmas: Turma[]) => void) => {
  const userId = auth.currentUser?.uid;
  if (!userId) return () => {};
  
  const path = 'turmas';
  const q = query(
    collection(db, path),
    where('ownerId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const turmas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Turma));
    callback(turmas);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

// Exams (Provas)
export const createExam = async (examData: Omit<Exam, 'id' | 'ownerId' | 'createdAt'>) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  
  const path = 'exams';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...examData,
      ownerId: userId,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateExam = async (id: string, examData: Partial<Exam>) => {
  const path = `exams/${id}`;
  try {
    await updateDoc(doc(db, 'exams', id), {
      ...examData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteExam = async (id: string) => {
  const path = `exams/${id}`;
  try {
    await deleteDoc(doc(db, 'exams', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const subscribeToExams = (turmaId: string, callback: (exams: Exam[]) => void) => {
  const userId = auth.currentUser?.uid;
  if (!userId) return () => {};
  
  const path = 'exams';
  const q = query(
    collection(db, path),
    where('turmaId', '==', turmaId),
    where('ownerId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const exams = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Exam));
    callback(exams);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

// Results
export const saveResult = async (resultData: Omit<Result, 'id' | 'scannedAt'>) => {
  const path = 'results';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...resultData,
      scannedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const subscribeToResults = (examId: string, callback: (results: Result[]) => void) => {
  const path = 'results';
  const q = query(
    collection(db, path),
    where('examId', '==', examId),
    orderBy('scannedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Result));
    callback(results);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};
