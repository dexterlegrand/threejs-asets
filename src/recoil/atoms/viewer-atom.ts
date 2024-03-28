import { atom } from "recoil";

const viewerSelectedElement = atom<any | undefined>({
  key: "viewer-selected-element",
  default: undefined,
});

export { viewerSelectedElement };
