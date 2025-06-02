import {atom, createStore } from 'jotai';

export interface User {
  userId: string;
  email: string;
  username: string;
  pfp: string;
}

export const accessTokenAtom = atom<string | null>(null);
export const userLoadingAtom = atom<boolean>(true);
export const userPanicAtom = atom<boolean>(false);
export const userAtom = atom<User | null>(null);

export const store = createStore();
