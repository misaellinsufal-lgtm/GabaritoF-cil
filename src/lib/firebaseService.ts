import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  doc,
  getDocFromServer,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Turma, Gabarito } from '../types';

const getLocalUser = () => {
  const saved = localStorage.getItem('omr_user');
  return saved ? JSON.parse(saved) : null;
};

const getOwnerId = () => {
  const user = getLocalUser();
  return user ? `user-${user.username.toLowerCase()}` : 'anonymous';
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: getLocalUser(),
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const testConnection = async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}

export const createTurma = async (name: string) => {
  const ownerId = getOwnerId();
  const path = 'turmas';
  try {
    const docRef = await addDoc(collection(db, path), {
      name,
      ownerId,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export const createGabarito = async (turmaId: string, name: string, answers: string[], choicesCount: number) => {
  const ownerId = getOwnerId();
  const path = 'gabaritos';
  try {
    const docRef = await addDoc(collection(db, path), {
      turmaId,
      name,
      answers,
      choicesCount,
      ownerId,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export const updateGabarito = async (id: string, name: string, answers: string[], choicesCount: number) => {
  const path = `gabaritos/${id}`;
  try {
    const docRef = doc(db, 'gabaritos', id);
    await updateDoc(docRef, {
      name,
      answers,
      choicesCount,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export const deleteGabarito = async (id: string) => {
  const path = `gabaritos/${id}`;
  try {
    const docRef = doc(db, 'gabaritos', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export const subscribeToTurmas = (callback: (turmas: Turma[]) => void) => {
  const ownerId = getOwnerId();
  const path = 'turmas';
  const q = query(
    collection(db, path),
    where('ownerId', '==', ownerId),
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
}

export const subscribeToGabaritos = (turmaId: string, callback: (gabaritos: Gabarito[]) => void) => {
  const ownerId = getOwnerId();
  const path = 'gabaritos';
  const q = query(
    collection(db, path),
    where('turmaId', '==', turmaId),
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const gabaritos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Gabarito));
    callback(gabaritos);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}
