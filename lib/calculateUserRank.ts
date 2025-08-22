
'use client';

import { collection, query, where, getCountFromServer, Firestore } from "firebase/firestore";

interface RankOptions {
  db: Firestore;
  collectionName?: string;
  field: string;
  value: number;
  nameKey: string;
}

/**
 * Calculates a user's rank for a given field, handling tie-breakers.
 * @param {RankOptions} options - The options for calculating the rank.
 * @returns {Promise<number>} The user's calculated rank.
 */
export async function calculateUserRank({ db, collectionName = 'users', field, value, nameKey }: RankOptions): Promise<number> {
  const usersCollection = collection(db, collectionName);

  // 1. Count all users with a strictly higher value in the given field.
  const higherQuery = query(usersCollection, where(field, '>', value));
  const higherSnapshot = await getCountFromServer(higherQuery);

  // 2. Count users with the same value but an alphabetically earlier name/uid for tie-breaking.
  const tieBreakerQuery = query(
    usersCollection,
    where(field, '==', value),
    where('name', '<', nameKey)
  );
  const tieSnapshot = await getCountFromServer(tieBreakerQuery);

  // The final rank is 1 + (count of users with higher scores) + (count of users with same score but better tie-breaker).
  return higherSnapshot.data().count + tieSnapshot.data().count + 1;
}
