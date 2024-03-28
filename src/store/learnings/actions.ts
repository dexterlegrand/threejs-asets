import { action } from "typesafe-actions";
import { TCourse, LearningsActionTypes } from "./types";

export const setCoursesAction = (courses: TCourse[]) =>
  action(LearningsActionTypes.SET_COURSES, { courses });

export const addCourseAction = (course: TCourse) =>
  action(LearningsActionTypes.ADD_COURSE, { course });

export const changeCourseAction = (course: TCourse) =>
  action(LearningsActionTypes.CHANGE_COURSE, { course });

export const removeCourseAction = (course: TCourse) =>
  action(LearningsActionTypes.REMOVE_COURSE, { course });
