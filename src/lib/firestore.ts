/**
 * Firestore typed references and platform-aware CRUD helpers.
 *
 * Web  → firebase/firestore modular API
 * Native → @react-native-firebase/firestore instance API
 */

import { Platform } from 'react-native';
import { getFirebaseFirestore } from './firebase';

// ---------------------------------------------------------------------------
// Typed reference getters (async, platform-aware)
// ---------------------------------------------------------------------------

export async function getCharacterRef(userId: string) {
  const db = await getFirebaseFirestore();
  if (Platform.OS === 'web') {
    const { doc } = await import('firebase/firestore');
    return doc(db as any, 'users', userId, 'character', 'data');
  }
  return (db as any).collection('users').doc(userId).collection('character').doc('data');
}

export async function getQuestsCollectionRef(userId: string) {
  const db = await getFirebaseFirestore();
  if (Platform.OS === 'web') {
    const { collection } = await import('firebase/firestore');
    return collection(db as any, 'users', userId, 'quests');
  }
  return (db as any).collection('users').doc(userId).collection('quests');
}

export async function getQuestRef(userId: string, questId: string) {
  const db = await getFirebaseFirestore();
  if (Platform.OS === 'web') {
    const { doc } = await import('firebase/firestore');
    return doc(db as any, 'users', userId, 'quests', questId);
  }
  return (db as any).collection('users').doc(userId).collection('quests').doc(questId);
}

export async function getLogCollectionRef(userId: string) {
  const db = await getFirebaseFirestore();
  if (Platform.OS === 'web') {
    const { collection } = await import('firebase/firestore');
    return collection(db as any, 'users', userId, 'log');
  }
  return (db as any).collection('users').doc(userId).collection('log');
}

export async function getLogEntryRef(userId: string, logId: string) {
  const db = await getFirebaseFirestore();
  if (Platform.OS === 'web') {
    const { doc } = await import('firebase/firestore');
    return doc(db as any, 'users', userId, 'log', logId);
  }
  return (db as any).collection('users').doc(userId).collection('log').doc(logId);
}

export async function getSkillsRef(userId: string) {
  const db = await getFirebaseFirestore();
  if (Platform.OS === 'web') {
    const { doc } = await import('firebase/firestore');
    return doc(db as any, 'users', userId, 'skills', 'data');
  }
  return (db as any).collection('users').doc(userId).collection('skills').doc('data');
}

export async function getShopItemsCollectionRef(userId: string) {
  const db = await getFirebaseFirestore();
  if (Platform.OS === 'web') {
    const { collection } = await import('firebase/firestore');
    return collection(db as any, 'users', userId, 'shopItems');
  }
  return (db as any).collection('users').doc(userId).collection('shopItems');
}

export async function getShopItemRef(userId: string, itemId: string) {
  const db = await getFirebaseFirestore();
  if (Platform.OS === 'web') {
    const { doc } = await import('firebase/firestore');
    return doc(db as any, 'users', userId, 'shopItems', itemId);
  }
  return (db as any).collection('users').doc(userId).collection('shopItems').doc(itemId);
}

export async function getInventoryCollectionRef(userId: string) {
  const db = await getFirebaseFirestore();
  if (Platform.OS === 'web') {
    const { collection } = await import('firebase/firestore');
    return collection(db as any, 'users', userId, 'inventory');
  }
  return (db as any).collection('users').doc(userId).collection('inventory');
}

export async function getInventoryItemRef(userId: string, itemId: string) {
  const db = await getFirebaseFirestore();
  if (Platform.OS === 'web') {
    const { doc } = await import('firebase/firestore');
    return doc(db as any, 'users', userId, 'inventory', itemId);
  }
  return (db as any).collection('users').doc(userId).collection('inventory').doc(itemId);
}

export async function getFcmTokensCollectionRef(userId: string) {
  const db = await getFirebaseFirestore();
  if (Platform.OS === 'web') {
    const { collection } = await import('firebase/firestore');
    return collection(db as any, 'users', userId, 'fcmTokens');
  }
  return (db as any).collection('users').doc(userId).collection('fcmTokens');
}

export async function getFcmTokenRef(userId: string, tokenHash: string) {
  const db = await getFirebaseFirestore();
  if (Platform.OS === 'web') {
    const { doc } = await import('firebase/firestore');
    return doc(db as any, 'users', userId, 'fcmTokens', tokenHash);
  }
  return (db as any).collection('users').doc(userId).collection('fcmTokens').doc(tokenHash);
}

// ---------------------------------------------------------------------------
// Platform-aware CRUD helpers
// ---------------------------------------------------------------------------

/** Write (or merge) a document. */
export async function firestoreSetDoc(
  ref: any,
  data: object,
  options?: { merge?: boolean }
): Promise<void> {
  if (Platform.OS === 'web') {
    const { setDoc } = await import('firebase/firestore');
    if (options?.merge) {
      await setDoc(ref, data, { merge: true });
    } else {
      await setDoc(ref, data);
    }
  } else {
    if (options?.merge) {
      await ref.set(data, { merge: true });
    } else {
      await ref.set(data);
    }
  }
}

/** Read a single document. Returns { exists, data }. */
export async function firestoreGetDoc(ref: any): Promise<{ exists: boolean; data: any }> {
  if (Platform.OS === 'web') {
    const { getDoc } = await import('firebase/firestore');
    const snap = await getDoc(ref);
    return { exists: snap.exists(), data: snap.exists() ? snap.data() : undefined };
  } else {
    const snap = await ref.get();
    return { exists: snap.exists, data: snap.exists ? snap.data() : undefined };
  }
}

/** Read all documents in a collection. Returns array of { id, data }. */
export async function firestoreGetDocs(ref: any): Promise<Array<{ id: string; data: any }>> {
  if (Platform.OS === 'web') {
    const { getDocs } = await import('firebase/firestore');
    const snap = await getDocs(ref);
    return snap.docs.map((d: any) => ({ id: d.id, data: d.data() }));
  } else {
    const snap = await ref.get();
    return snap.docs.map((d: any) => ({ id: d.id, data: d.data() }));
  }
}

/** Delete a document. */
export async function firestoreDeleteDoc(ref: any): Promise<void> {
  if (Platform.OS === 'web') {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(ref);
  } else {
    await ref.delete();
  }
}

/** Create a write batch. Returns { set, delete, commit } wrapper. */
export async function firestoreBatch() {
  const db = await getFirebaseFirestore();
  if (Platform.OS === 'web') {
    const { writeBatch } = await import('firebase/firestore');
    const batch = writeBatch(db as any);
    return {
      set: (ref: any, data: object, options?: { merge?: boolean }) => {
        if (options?.merge) {
          batch.set(ref, data, { merge: true });
        } else {
          batch.set(ref, data);
        }
      },
      delete: (ref: any) => batch.delete(ref),
      commit: () => batch.commit(),
    };
  } else {
    const batch = (db as any).batch();
    return {
      set: (ref: any, data: object, options?: { merge?: boolean }) => {
        if (options?.merge) {
          batch.set(ref, data, { merge: true });
        } else {
          batch.set(ref, data);
        }
      },
      delete: (ref: any) => batch.delete(ref),
      commit: () => batch.commit(),
    };
  }
}
