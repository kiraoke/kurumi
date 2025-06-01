import {atom, createStore } from 'jotai';

export const accessTokenAtom = atom<string | null>(null);
export const userLoadingAtom = atom<boolean>(true);
export const userPanicAtom = atom<boolean>(false);

export const store = createStore();
