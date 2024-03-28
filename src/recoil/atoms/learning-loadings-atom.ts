import { atom } from "recoil";
type Props = {
  [key: string]: boolean;
};

const learningLoadingsAtom = atom<Props>({
  key: "lsa-loadings",
  default: {},
});

export { learningLoadingsAtom };
