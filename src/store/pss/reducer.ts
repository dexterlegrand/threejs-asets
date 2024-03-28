import * as actions from "./actions";
import { ActionType, createReducer } from "typesafe-actions";
import { initialPSSState, initialPSS } from "./initialState";
import { TPSSState, EPSSActionTypes } from "./types";

export type Actions = ActionType<typeof actions>;

const reducer = createReducer<TPSSState, Actions>({ ...initialPSSState })
  .handleType(EPSSActionTypes.SET_PSS, (state, action) => {
    const { name, pss } = action.payload;
    if (state.simulations.some((s) => s.project === name)) {
      return {
        ...state,
        simulations: state.simulations.map((s) => (s.project === name ? pss : s)),
      };
    } else {
      return { ...state, simulations: [...state.simulations, { ...pss, project: name }] };
    }
  })
  .handleType(EPSSActionTypes.LOAD_PSS, (state, action) => {
    const { name, pss } = action.payload;
    return { ...state, simulations: [...state.simulations, { ...pss, project: name }] };
  })
  .handleType(EPSSActionTypes.CREATE_PSS, (state, action) => {
    const { name } = action.payload;
    return { ...state, simulations: [...state.simulations, { ...initialPSS, project: name }] };
  })
  .handleType(EPSSActionTypes.CHANGE_PSS, (state, action) => {
    const { name, field, value } = action.payload;
    return {
      ...state,
      simulations: state.simulations.map((s) =>
        s.project === name ? { ...s, [field]: value } : s
      ),
    };
  })
  .handleType(EPSSActionTypes.REMOVE_PSS, (state, action) => {
    const { name } = action.payload;
    return {
      ...state,
      simulations: state.simulations.filter((s) => s.project !== name),
    };
  })
  .handleType(EPSSActionTypes.RENAME_PSS, (state, action) => {
    const { oldName, newName } = action.payload;
    return {
      ...state,
      simulations: state.simulations.map((s) =>
        s.project === oldName ? { ...s, name, project: newName } : s
      ),
    };
  })
  .handleType(EPSSActionTypes.CREATE_ELEMENT, (state, action) => {
    const { name, item } = action.payload;
    return {
      ...state,
      simulations: state.simulations.map((s) =>
        s.project === name ? { ...s, conveyors: [...s.conveyors, item] } : s
      ),
    };
  })
  .handleType(EPSSActionTypes.CHANGE_ELEMENT, (state, action) => {
    const { name, item } = action.payload;
    return {
      ...state,
      simulations: state.simulations.map((s) =>
        s.project === name
          ? { ...s, conveyors: s.conveyors.map((c) => (c.id === item.id ? item : c)) }
          : s
      ),
    };
  })
  .handleType(EPSSActionTypes.REMOVE_ELEMENT, (state, action) => {
    const { name, item } = action.payload;
    return {
      ...state,
      simulations: state.simulations.map((s) =>
        s.project === name ? { ...s, conveyors: s.conveyors.filter((c) => c.id !== item.id) } : s
      ),
    };
  })
  .handleType(EPSSActionTypes.SWITCH_ANIMATION, (state, action) => {
    const { animate } = action.payload;
    return { ...state, animate };
  });

export { reducer as PSSReducer };
