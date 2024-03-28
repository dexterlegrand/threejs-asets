import { atom } from "recoil";
import { Vector2, Vector3 } from "three";

export type TSnapPostion = {
  from: Vector3;
  current: Vector3;
  position: Vector2;
  isString?: boolean;
  callback: (val: number, valY?: number, valZ?: number) => any;
};

const snapPosition = atom<TSnapPostion | undefined>({
  key: "snapPosition",
  default: undefined,
});

export { snapPosition };
