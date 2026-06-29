import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  getDocFromServer, 
  onSnapshot,
  writeBatch,
  query,
  limit
} from "firebase/firestore";
import { db, auth } from "./auth";
import { Participant, AppSettings } from "../types";

// Operation Type Enum as mandated by SKILL.md
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// 3. Create error handlers
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection to Firestore on start (MANDATORY)
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test completed.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Participants CRUD
export async function getParticipants(): Promise<Participant[]> {
  const path = 'participants';
  try {
    const q = query(collection(db, path));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Participant);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveParticipant(participant: Participant): Promise<void> {
  const path = `participants/${participant.id}`;
  try {
    await setDoc(doc(db, 'participants', participant.id), participant);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteParticipant(id: string): Promise<void> {
  const path = `participants/${id}`;
  try {
    await deleteDoc(doc(db, 'participants', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Real-time synchronization helper
export function subscribeToParticipants(
  onUpdate: (participants: Participant[]) => void,
  onError: (err: any) => void
) {
  const path = 'participants';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as Participant);
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err) {
        onError(err);
      }
    }
  );
}

// Master Training Types CRUD
export function subscribeToTrainingTypes(
  onUpdate: (types: any[]) => void,
  onError: (err: any) => void
) {
  const path = 'trainingTypes';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data());
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err) {
        onError(err);
      }
    }
  );
}

export async function saveTrainingType(data: any): Promise<void> {
  const path = `trainingTypes/${data.id}`;
  try {
    await setDoc(doc(db, 'trainingTypes', data.id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTrainingType(id: string): Promise<void> {
  const path = `trainingTypes/${id}`;
  try {
    await deleteDoc(doc(db, 'trainingTypes', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Master Kejuruan CRUD
export function subscribeToKejuruan(
  onUpdate: (list: any[]) => void,
  onError: (err: any) => void
) {
  const path = 'kejuruan';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data());
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err) {
        onError(err);
      }
    }
  );
}

export async function saveKejuruan(data: any): Promise<void> {
  const path = `kejuruan/${data.id}`;
  try {
    await setDoc(doc(db, 'kejuruan', data.id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteKejuruan(id: string): Promise<void> {
  const path = `kejuruan/${id}`;
  try {
    await deleteDoc(doc(db, 'kejuruan', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Master Programs CRUD
export function subscribeToPrograms(
  onUpdate: (list: any[]) => void,
  onError: (err: any) => void
) {
  const path = 'programs';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data());
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err) {
        onError(err);
      }
    }
  );
}

export async function saveProgram(data: any): Promise<void> {
  const path = `programs/${data.id}`;
  try {
    await setDoc(doc(db, 'programs', data.id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProgram(id: string): Promise<void> {
  const path = `programs/${id}`;
  try {
    await deleteDoc(doc(db, 'programs', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Seed the database with default master lists if empty
export async function seedMasterDataIfEmpty(defaults: {
  trainingTypes: any[];
  kejuruanList: any[];
  programs: any[];
}): Promise<void> {
  try {
    const typeSnap = await getDocs(query(collection(db, 'trainingTypes'), limit(1)));
    if (typeSnap.empty) {
      const batch = writeBatch(db);
      defaults.trainingTypes.forEach(t => {
        batch.set(doc(db, 'trainingTypes', t.id), t);
      });
      await batch.commit();
      console.log("Seeded training types to Firestore.");
    }

    const kejSnap = await getDocs(query(collection(db, 'kejuruan'), limit(1)));
    if (kejSnap.empty) {
      const batch = writeBatch(db);
      defaults.kejuruanList.forEach(k => {
        batch.set(doc(db, 'kejuruan', k.id), k);
      });
      await batch.commit();
      console.log("Seeded kejuruan to Firestore.");
    }

    const progSnap = await getDocs(query(collection(db, 'programs'), limit(1)));
    if (progSnap.empty) {
      const batch = writeBatch(db);
      defaults.programs.forEach(p => {
        batch.set(doc(db, 'programs', p.id), p);
      });
      await batch.commit();
      console.log("Seeded programs to Firestore.");
    }
  } catch (error) {
    console.error("Error seeding master data:", error);
  }
}

// Seed the database with default participants if empty
export async function seedParticipantsIfEmpty(defaultList: Participant[]): Promise<void> {
  const path = 'participants';
  try {
    const q = query(collection(db, path), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      console.log("Firestore collection is empty. Seeding defaults...");
      const batch = writeBatch(db);
      defaultList.forEach(p => {
        const docRef = doc(db, 'participants', p.id);
        batch.set(docRef, p);
      });
      await batch.commit();
      console.log("Firestore seeded successfully.");
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Reset participants collection to default list
export async function resetParticipantsToDefault(defaultList: Participant[]): Promise<void> {
  const path = 'participants';
  try {
    const q = query(collection(db, path));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    // Delete existing
    snap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    // Add defaults
    defaultList.forEach(p => {
      const docRef = doc(db, 'participants', p.id);
      batch.set(docRef, p);
    });
    await batch.commit();
    console.log("Firestore reset to defaults successfully.");
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Reset entire database to defaults
export async function resetDatabaseToDefault(defaults: {
  participants: Participant[];
  trainingTypes: any[];
  kejuruanList: any[];
  programs: any[];
}): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Delete existing participants
    const partSnap = await getDocs(collection(db, 'participants'));
    partSnap.docs.forEach(d => batch.delete(d.ref));
    defaults.participants.forEach(p => {
      batch.set(doc(db, 'participants', p.id), p);
    });

    // Delete existing trainingTypes
    const typeSnap = await getDocs(collection(db, 'trainingTypes'));
    typeSnap.docs.forEach(d => batch.delete(d.ref));
    defaults.trainingTypes.forEach(t => {
      batch.set(doc(db, 'trainingTypes', t.id), t);
    });

    // Delete existing kejuruan
    const kejSnap = await getDocs(collection(db, 'kejuruan'));
    kejSnap.docs.forEach(d => batch.delete(d.ref));
    defaults.kejuruanList.forEach(k => {
      batch.set(doc(db, 'kejuruan', k.id), k);
    });

    // Delete existing programs
    const progSnap = await getDocs(collection(db, 'programs'));
    progSnap.docs.forEach(d => batch.delete(d.ref));
    defaults.programs.forEach(p => {
      batch.set(doc(db, 'programs', p.id), p);
    });

    await batch.commit();
    console.log("Entire database reset successfully.");
  } catch (error) {
    console.error("Error resetting database:", error);
  }
}

// App Settings CRUD (e.g. participant targets)
export function subscribeToSettings(
  onUpdate: (settings: AppSettings) => void,
  onError: (err: any) => void
) {
  const path = 'settings/general';
  return onSnapshot(
    doc(db, 'settings', 'general'),
    (snapshot) => {
      const data = snapshot.data() as AppSettings | undefined;
      // Provide default settings if not exists
      onUpdate(data || { target2025: 5000, target2026: 6000, target2027: 7000 });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (err) {
        onError(err);
      }
    }
  );
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const path = 'settings/general';
  try {
    await setDoc(doc(db, 'settings', 'general'), settings);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

