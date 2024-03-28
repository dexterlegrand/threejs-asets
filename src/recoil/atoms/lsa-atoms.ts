import { atom } from "recoil";
import { FreePipe } from "../../store/main/types";

type Props = {
  element?: {
    pipe: FreePipe;
    type: "pipe" | "connector" | "start-flange" | "end-flange";
  };
  result?: any;
};

const lsaAtom = atom<Props>({
  key: "lsa",
  default: {
    element: undefined,
    result: undefined,
  },
});

export { lsaAtom };
