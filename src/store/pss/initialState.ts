import { TPSS, TPSSConveyor, ERackColor, TPSSState } from "./types";

const rackColors: ERackColor[] = [
  ERackColor.RED,
  ERackColor.GREEN,
  ERackColor.BLUE,
  ERackColor.YELLOW,
];

const initialPSSState: TPSSState = {
  simulations: [],
};

const initialPSS: TPSS = {
  project: "",
  racks: 4,
  conveyors: [],
};

const initialConveyor: TPSSConveyor = {
  id: 0,
  x: 0,
  y: 0,
  z: 0,
  direction: "+X",
  length: 0,
  height: 0,
  speed: 0,
  EGVPath: [{ id: 0, x: -5, y: 0, z: 0 }],
  EGVRacksPerTrip: 4,
  EGVSpeed: 0,
  peopleCountL: 0,
  peopleCountR: 0,
  peopleRackAssignmentL: [],
  peopleRackAssignmentR: [],
  peopleSpacingL: 0,
  peopleSpacingR: 0,
  peopleStartPositionL: 0,
  peopleStartPositionR: 0,
};

export { rackColors, initialPSSState, initialPSS, initialConveyor };
