import { atom } from "recoil";

const viewerComments = atom<any | undefined>({
  key: "viewer-comments",
  default: undefined,
});

export { viewerComments };
