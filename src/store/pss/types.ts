import { Direction2 } from "../main/types";

export enum EPSSActionTypes {
  SET_PSS = "SET_PSS",
  LOAD_PSS = "LOAD_PSS",

  CREATE_PSS = "CREATE_PSS",
  CHANGE_PSS = "CHANGE_PSS",
  REMOVE_PSS = "REMOVE_PSS",
  RENAME_PSS = "RENAME_PSS",

  CREATE_ELEMENT = "CREATE_ELEMENT",
  CHANGE_ELEMENT = "CHANGE_ELEMENT",
  REMOVE_ELEMENT = "REMOVE_ELEMENT",

  SWITCH_ANIMATION = "SWITCH_ANIMATION",
}

export enum ERackColor {
  RED = "Red",
  YELLOW = "Yellow",
  BLUE = "Blue",
  GREEN = "Green",
}

export type TPSSState = {
  animate?: boolean;
  simulations: TPSS[];
};

export type TPSS = {
  project: string;
  racks: number;
  conveyors: TPSSConveyor[];
};

export type TPSSConveyor = {
  id: number;
  x: number;
  y: number;
  z: number;
  direction: Direction2;
  length: number;
  height: number;
  speed: number;

  EGVPath: TPSSEGVPath[];
  EGVSpeed: number;
  EGVRacksPerTrip: number;

  peopleCountL: number;
  peopleSpacingL: number;
  peopleRackAssignmentL: TPSSRackAssignment[];
  peopleStartPositionL: number;

  peopleCountR: number;
  peopleSpacingR: number;
  peopleRackAssignmentR: TPSSRackAssignment[];
  peopleStartPositionR: number;
};

export type TPSSEGVPath = {
  id: number;
  x: number;
  y: number;
  z: number;
};

export type TPSSRackAssignment = {
  id: number;
  color: ERackColor;
};
