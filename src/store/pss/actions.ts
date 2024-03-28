import { action } from "typesafe-actions";
import { EPSSActionTypes, TPSS, TPSSConveyor } from "./types";

function setPSSAction(name: string, pss: TPSS) {
  return action(EPSSActionTypes.SET_PSS, { name, pss });
}

function loadPSSAction(name: string, pss: TPSS) {
  return action(EPSSActionTypes.LOAD_PSS, { name, pss });
}

function createPSSAction(name: string) {
  return action(EPSSActionTypes.CREATE_PSS, { name });
}

function changePSSAction(name: string, field: string, value: any) {
  return action(EPSSActionTypes.CHANGE_PSS, { name, field, value });
}

function removePSSAction(name: string) {
  return action(EPSSActionTypes.REMOVE_PSS, { name });
}

function renamePSSAction(oldName: string, newName: string) {
  return action(EPSSActionTypes.RENAME_PSS, { oldName, newName });
}

function createPSSConveyor(name: string, item: TPSSConveyor) {
  return action(EPSSActionTypes.CREATE_ELEMENT, { name, item });
}

function changePSSConveyor(name: string, item: TPSSConveyor) {
  return action(EPSSActionTypes.CHANGE_ELEMENT, { name, item });
}
function removePSSConveyor(name: string, item: TPSSConveyor) {
  return action(EPSSActionTypes.REMOVE_ELEMENT, { name, item });
}

function switchPSSAnimationAction(animate: boolean) {
  return action(EPSSActionTypes.SWITCH_ANIMATION, { animate });
}

export {
  setPSSAction,
  loadPSSAction,
  createPSSAction,
  changePSSAction,
  removePSSAction,
  renamePSSAction,
  createPSSConveyor,
  changePSSConveyor,
  removePSSConveyor,
  switchPSSAnimationAction,
};
