import { createReducer, ActionType } from "typesafe-actions";
import { TLearningsState, LearningsActionTypes } from "./types";
import * as actions from "./actions";

export type TLearningsActions = ActionType<typeof actions>;

const reducer = createReducer<TLearningsState, TLearningsActions>({ courses: [] })
  .handleType(LearningsActionTypes.SET_COURSES, (state, action) => {
    const changed: TLearningsState = { ...state, courses: action.payload.courses };
    return changed;
  })
  .handleType(LearningsActionTypes.ADD_COURSE, (state, action) => {
    const changed: TLearningsState = {
      ...state,
      courses: [...state.courses, action.payload.course],
    };
    return changed;
  })
  .handleType(LearningsActionTypes.CHANGE_COURSE, (state, action) => {
    const { course } = action.payload;
    const changed: TLearningsState = {
      ...state,
      courses: state.courses.map((el) => (el.id === course.id ? course : el)),
    };
    return changed;
  })
  .handleType(LearningsActionTypes.REMOVE_COURSE, (state, action) => {
    const { course } = action.payload;
    const changed: TLearningsState = {
      ...state,
      courses: state.courses.filter((el) => el.id !== course.id),
    };
    return changed;
  });

export { reducer as LearningsReducer };
