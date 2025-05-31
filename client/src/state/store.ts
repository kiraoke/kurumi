import {atom } from 'jotai';

export const accessTokenAtom = atom<string | null>(null);
export const userLoadingAtom = atom<boolean>(true);
