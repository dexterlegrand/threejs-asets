export enum LearningsActionTypes {
  SET_COURSES = "SET_COURSES",
  ADD_COURSE = "ADD_COURSE",
  CHANGE_COURSE = "CHANGE_COURSE",
  REMOVE_COURSE = "REMOVE_COURSE",
}

export type TLearningsState = {
  courses: TCourse[];
};

export type TCourse = {
  id: number;
  img?: string;
  icon?: string;
  imgFile?: File;
  name: string;
  description: string;
  toolType?: string[]; // which tool is associated
  isStudent?: boolean;
  isValidation?: boolean;
  topics?: TTopic[];
  validations?: TValidation[];
  isNew?: boolean;
  isChanged?: boolean;
  isDeleted?: boolean;
};

export type TTopic = {
  id: number;
  title: string;
  info: { [key: number]: { [key: string]: string } };
  "video": { [key: number]: { [key: string]: string } };   
  assign: { [key: number]: { [key: string]: string } };
  submission_files?: { [key: number]: { [key: string]: string } };
  submission?: boolean;
  formats?: string[];
  comment?: string;
  score?: string;
};

export type TValidation = {
  id: number;
  title: string;
  document?: string;
  video?: string;
  files?: string;
};
