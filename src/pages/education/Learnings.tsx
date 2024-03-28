import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Spinner } from "@blueprintjs/core";
import { ApplicationState } from "../../store";
import { setCoursesAction } from "../../store/learnings/actions";
import { TCourse } from "../../store/learnings/types";
import { LearningCard } from "./LearningCard";
import { NewLearningCard } from "./NewLearningCard";

import {
  getNextId,
  exportToCSV,
  importFromCSV,
  openFile,
} from "../../components/3d-models/utils";
import { Student } from "./student/Student";
import Axios from "axios";
import { jsonOptions } from "../../store/main/actions";
import { secondServerAPILearning } from "../utils/agent";

import { useMemo } from "react";
import { search } from "superagent";
import { TWorkMode } from "../../store/main/types";
import { Link, useHistory } from "react-router-dom";
import { changeWorkModeAction } from "../../store/main/actions";
import { createProcessAction } from "../../store/process/actions";
import { createPSSAction } from "../../store/pss/actions";
import logo from "../../assets/Logo.jpg";
import './edu_css/Learning.css';


export function Learnings() {
  const [isLoadings, setLoadings] = useState<boolean>(false);
  const [isEditing, setEditing] = useState<boolean>(false);
  const [course, setCourse] = useState<TCourse>();
  const [changed, setChanged] = useState<TCourse[]>([]);
  const [isStudent, setStudent] = useState<boolean>(false);
  const [isView, setView] = useState<boolean>(false);
  const [isValidation, setValidation] = useState<boolean>(false);
  const [files, setFiles] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [subscribedCourses, setSubscribedCourses] = useState<string[]>([]);
  const [username, setUsername] = useState<string[]>([]);
  const [trial, settrial] = useState(true);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  

  const auth = useSelector((state: ApplicationState) => state.auth);
  const learnings = useSelector((state: ApplicationState) => state.learnings);

  const dispatch = useDispatch();

  const products = useSelector((state: ApplicationState) => state.main.products ?? []);

  const history = useHistory();

  const currentProject = useSelector(
    (state: ApplicationState) => state.main.currentProject
  );

  const isProduction = useMemo(() => {
    return process.env.NODE_ENV === "production";
  }, []);

  useEffect(() => {
    handleGetCourses();
  }, []);

  useEffect(() => {
    handleGetUsername();
  })

  useEffect(() => {
    if (!course) return;
    setCourse(learnings.courses.find((c) => c.id === course.id));
  }, [learnings.courses]);

  /*useEffect(() => {
    handleProds();
  }, []);*/

  const toggleDropdown = () => {
    setDropdownVisible(!isDropdownVisible);
  };

  const logout = () => {
    alert('Logging out...');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = 'http://testing.asets.io';
    setDropdownVisible(false);
  };

  function handleCancel() {
    setCourse(undefined);
    setEditing(false);
    setStudent(false);
    setView(false);
    setValidation(false);
    settrial(true);
  }

  function  handleGetUsername(){ //Get the username of the person logging in
    Axios.get(`${secondServerAPILearning}/api/v1/learning/userInformation`,{
      headers: {
        'user-id' : auth.User_id
      }
    })
    .then(res => {
      setUsername(res.data.userName);
    })
    .catch(error => {
      console.error("There was an error fetching username: ",error);
    });
  }

  function handleProds() { //check who has access to the designer, piping and the structural course
    setLoadings(true);
    Axios.get(`${secondServerAPILearning}/api/v1/learning/get/userProducts`,{
      headers: {
        'user-id' : auth.User_id
      }
    }) 
    .then(res => {
      setSubscribedCourses(res.data); 
    })
      .catch(error => {
        console.error("There was an error fetching the courses:", error);
      });
  }

  /*function handleGetCourses() { //Function to get the courses based on the courses the person has created or has subscribed to 
    setLoadings(true);
    
    Axios.get(`${secondServerAPILearning}/api/v1/learning/courses`, {
      headers: {
        'user-id' : auth.User_id
      }
    })
    .then((res: {data: TCourse[]}) => {
      const courses: TCourse[] = res.data;
      dispatch(setCoursesAction(courses));
      const toolTypes = courses.map(course => course.toolType).filter((toolType): toolType is string => toolType !== undefined);
      setSubscribedCourses(toolTypes);
      setEditing(false);
      console.log(setSubscribedCourses);
    })
    .catch((e) => {
      console.error("Error fetching courses:", e);
    })
    .finally(() => setLoadings(false));
  }*/

  function handleGetCourses() {
    setLoadings(true);
    
    Axios.get(`${secondServerAPILearning}/api/v1/learning/courses`, {
      headers: {
        'user-id' : auth.User_id
      }
    })
    .then((res: {data: TCourse[]}) => {
      const courses: TCourse[] = res.data;
      dispatch(setCoursesAction(courses));

      // Extract and flatten all toolTypes from the courses
      const toolTypes = courses.flatMap(course => course.toolType || []);

      // Filter unique toolTypes
      const uniqueToolTypes = [...new Set(toolTypes)];
      setSubscribedCourses(uniqueToolTypes);

      setEditing(false);
      console.log(setSubscribedCourses);  // log the result to check
    })
    .catch((e) => {
      console.error("Error fetching courses:", e);
    })
    .finally(() => setLoadings(false));
}

  

  async function handleSave() { //function to save the new learning card that has been created or append any changes thet has been made to already present cards.


    function handleChange(
      course: TCourse,
      field: string,
      value: any,
      isTopics = false
    ) {
      if (isTopics) {
        setLoadings(true);
        Axios.post(
          `${secondServerAPILearning}/courses/update`,
          JSON.stringify({ ...course, [field]: value }),
          jsonOptions
        ).then(() => handleGetCourses());
      } else
        setChanged((prev) =>
          prev.map((item) =>
            item.id === course.id
              ? { ...item, [field]: value, isChanged: true }
              : item
          )
        );
    }


    setEditing(false);
    setLoadings(true);
    for (const cc of changed) {
      const { isNew, isDeleted, isChanged, imgFile, ...c } = cc;
      

      //common headers
      const commonHeaders ={
        ...jsonOptions.headers,
        'user-id': auth.User_id,
        'isNew': isNew ? 'true': 'false',
        'isChanged': isChanged ? 'true' : 'false'
      };


      if (isDeleted) {
        if (isNew) continue;
        try {
          await Axios.delete(
            `${secondServerAPILearning}/api/v1/learning/courses/delete/${c.id}`,
            {
              ...jsonOptions,
              headers: commonHeaders
            }
          );
        } catch (error) {
          console.error(error);
        }
      } else if (isNew) {
        try {
          await Axios.post(
            `${secondServerAPILearning}/api/v1/learning/courses/add`,
            JSON.stringify({...c,isNew}),
            {
              ...jsonOptions,
              headers: commonHeaders
            }
          );
        } catch (error) {
          console.error(error);
        }
        let img: any;
        try {
          if (imgFile) img = await uploadImage(imgFile, c);
          await updateCourseWithImage(c, img?.data?.link, commonHeaders);
        } catch (error) {
          console.error(error);
        }
      } else if (isChanged) {
        let img: any;
        if (imgFile) {
          try {
            img = await uploadImage(imgFile, c);
          } catch (error) {
            console.error(error);
          }
        }
        try {
          await Axios.post(
            `${secondServerAPILearning}/api/v1/learning/courses/update`,
            JSON.stringify({ ...c, img: img?.data?.link, isChanged }),
            {
              ...jsonOptions,
              headers: commonHeaders
            }
          );
        } catch (error) {
          console.error(error);
        }
      }
    }
    handleGetCourses();
  }

  async function updateCourseWithImage(course: TCourse, imgUrl: string | undefined, headers: any) {
    const commonHeaders ={
      ...jsonOptions.headers,
      'user-id': auth.User_id,
    };
    try {
        await Axios.post(
            `${secondServerAPILearning}/api/v1/learning/courses/update`,
            JSON.stringify({ ...course, img: imgUrl, }),
            {
                ...jsonOptions,
                headers: commonHeaders
            }
        );
    } catch (error) {
        console.error(error);
    }
}

  async function uploadImage(
    img: File,
    c: TCourse
  ): Promise<{ link: string } | undefined> {
    try {
      const formData = new FormData();
      formData.append("icon", img, img.name);
      return Axios.post(
        `${secondServerAPILearning}/api/v1/learning/upload/course/${c.id}/icon`,
        formData
      );
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  async function deleteImage(img: string, c: TCourse) {
    try {
      await Axios.post(
        `${secondServerAPILearning}/delete/image/course/icon/${c.id}`,
        c.id
      );
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
  
  function handleAdd() { // function to add the new learning card in the menu
    let nextIndex = 1;
  
    // Generate a unique name for the course
    let uniqueName = "New Course " + nextIndex;
    while (changed.some(course => course.name === uniqueName)) {
      nextIndex++;
      uniqueName = "New Course " + nextIndex;
    }
  
    const newCourse: TCourse = {
      id: getNextId(changed),
      name: uniqueName,
      description: "",
      toolType:[],
      topics: [],
      isNew: true,
    };
    
    setChanged((prev) => [newCourse, ...prev]);
  }
  

  function handleChange(
    course: TCourse,
    field: string,
    value: any,
    isTopics = false
  ) {
    if (field === "name") {
      const duplicate = changed.some(
        existingCourse => existingCourse.id !== course.id && existingCourse.name === value
      );
      if (duplicate) {
        alert('A course with this name already exists. Please choose a different name.');
        return;
      }
    }
    if (isTopics) {
      setLoadings(true);
      Axios.post(
        `${secondServerAPILearning}/api/v1/learning/courses/update`,
        JSON.stringify({ ...course, [field]: value }),
        {
          ...jsonOptions,
          headers:{
            ...jsonOptions.headers,
            'user-id' : auth.User_id
          }
        }
      ).then(() => handleGetCourses());
    } else
      setChanged((prev) =>
        prev.map((item) =>
          item.id === course.id
            ? { ...item, [field]: value, isChanged: true }
            : item
        )
      );
  }

  function handleDelete(course: TCourse) { //function to handle the delete functionality of removing course cards.
    const isConfirmed = window.confirm(`Are you sure you want to delete ${course.name}?`);
    if (!isConfirmed) {
      return;
    }
    Axios.delete(`${secondServerAPILearning}/api/v1/learning/delete/course/${course.id}`, {
      headers: {
        'user-id': auth.User_id,  
      },
    })
    .then((response) => {
      setChanged((prev) =>
        prev.filter((item) => item.id !== course.id)
      );
      handleGetCourses();
    })
    .catch((error) => {
      console.error('There was an error deleting the course:', error);
    });
  }
  

  function handleImport() {
    setEditing(true);
    importFromCSV((arr, isCSV) => {
      if (!isCSV || !Array.isArray(arr)) return;
      const courses: TCourse[] = [];
      for (const item of arr) {
        if (!item.id) continue;
        courses.push({
          id: item.id,
          img: item.img,
          name: item.Title ?? "",
          description: item.Description ?? "",
          isStudent: !!item.Student,
          isValidation: !!item.Validation,
          topics: [],
          validations: [],
          isNew: true,
        });
      }
      setChanged((prev) => [...courses, ...prev]);
    });
  }

  function handleExport() {
    exportToCSV(
      learnings.courses.map((c) => {
        return {
          id: c.id,
          img: c.img ?? "",
          Title: c.name,
          Description: c.description,
          Student: !!c.isStudent,
          Validation: !!c.isValidation,
        };
      }),
      `Learning courses`
    );
  }

  function handleViewer(){
    window.open("http://idsviewer.asetslux.com/", "_blank");
  }

  function handleSelectMode(event: React.MouseEvent<HTMLElement, MouseEvent>) {
    const mode = event.currentTarget.id as TWorkMode;
    dispatch(changeWorkModeAction(mode));
    
    let targetUrl = "";
    if (mode === "LEARNINGS") {
      targetUrl = "/learnings";
    } else {
      switch (mode) {
        case "STRUCTURE":
          dispatch(createPSSAction(currentProject));
          break;
        case "PROCESS":
        case "DESIGNER":
          dispatch(createProcessAction(currentProject));
          break;
        case "PIPING":
          break;
      }
      targetUrl = "/editor";
    }
  
    history.push(targetUrl);
  }

  return (
    <div
      className={"sl d-flex f-column f-grow h-100vh"}
    >
      {/* Header */}
      <div className={"headerl"}>
      <div className={"header-logol"}>
      <Link to="/modes">
      <div className={"header-lg"}>
      <img src={logo} alt="Company Logo"/>
      </div>
      </Link>
      <h1>IDS<span>™</span> Training </h1>
    </div>
      <div>
      <div className="dropdown-button" onClick={toggleDropdown}>
        Welcome {username ? username : 'User'}
        {isDropdownVisible && (
          <div className="dropdown">
            <div 
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#0056b3'} 
              onMouseOut={e => e.currentTarget.style.backgroundColor = ''} 
              onClick={logout}
            >
          Logout
        </div>
      </div>
    )}
  </div>
      </div>
    </div>
  
      {/* Conditional Display for Search Bar and Buttons */}
      <div className={"d-flex f-wrap p-20"} style={{ gap: 8 }}>
        {!(isEditing || isStudent || isView || isValidation) ? (
          <Button
            className={"button-primaryl"}
            text={"EDIT Courses"}
            intent={"primary"}
            onClick={() => {
              setEditing(true);
              setChanged(learnings.courses);
            }}
            disabled={isProduction && !(products.includes("Instructor"))}
          />
        ) : null}
        {isEditing && !isStudent ? (
          <>
            <Button className={"button-primary-b1l"} icon={"arrow-left"} text={"Back"} intent={"primary"} onClick={handleCancel}
            />
            <Button className={"button-secondaryl"} text={"Save & Close"} intent={"success"} onClick={handleSave}
            />
            <Button className={"button-secondaryl"} text="CSV Upload" intent="success" onClick={handleImport}
            />
            <Button className={"button-secondaryl"} text="CSV Download" intent="success" onClick={handleExport}
            />
          </>
        ) : null}
        {isStudent || isView ? (
          <Button className={"button-primaryl"} icon={"arrow-left"} text={"Back"} intent={"primary"} onClick={handleCancel}
          />
        ) : null}
        {isValidation ? (
          <Button className={"button-primaryl"} icon={"arrow-left"} text={"Back"} intent={"primary"} onClick={handleCancel}
          />
        ) : null}
  
        {/* Search Bar */}
        {!(isStudent || isValidation || isView) && (
        <input 
          type="text"
          className="inp"
          placeholder="Search for Course ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={(e) => {
            e.target.style.border = '2px solid #007bff';
          }}
          onBlur={(e) => {
            e.target.style.border = '2px solid #ccc';
          }}
        />
      )}

      </div>

      <div
        className="scrollable-containerl"
      >
      {/* Course Cards and Loadings */}
      <div
        className={`d-flex f-grow f-wrap ${
          isLoadings ? "" : "f-ai-start"
        } f-jc-around over-y p-20h`}
      >
        {isEditing && trial ? <NewLearningCard onAdd={handleAdd} /> : null}
  
        {isLoadings ? (
          <Spinner size={200} intent={"primary"} />
        ) : !(isStudent || isValidation || isView) ? (
          (isEditing ? changed : learnings.courses)
            .filter(course => course.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((course) => (

            <LearningCard
              key={course.id}
              course={course}
              isEditing={isEditing}
              onChange={handleChange}
              onDelete={handleDelete}
              onStudent={() => {
                setCourse(course);
                setStudent(true);
                settrial(false);
              }}
              onView={() => {
                setCourse(course);
                setView(true);
              }}
              onValidation={() => {
                openFile(
                  [".pps", ".ppsm", ".ddd", ".std", ".CII", ".ofs"],
                  (files) => {
                    const file = files[0];
                    if (!file) return;
                    setFiles((prev: any) => {
                      return {
                        ...prev,
                        [course.id]: [...(prev[course.id] ?? []), file],
                      };
                    });
                  }
                );
              }}
            />
          ))
        ) : (isStudent || isView) && course ? (
          <Student
            isView={isView}
            course={course}
            onChange={(topics) => handleChange(course, "topics", topics, true)}
            onReload={handleGetCourses}
          />
        ) : null}
      </div>
      <div className={"d-flex f-wrap p-20"}>
      {subscribedCourses.includes("Designer") && (
      <Button
        id={"DESIGNER"}
        large
        intent={"primary"}
        className={"button-tertiaryl"}
        text={"DESIGNER"}
        onClick={handleSelectMode}
        disabled={isProduction && !products.includes("Designer")}
      />)}
      {subscribedCourses.includes("Pipe") && (
      <Button
        id={"PIPING"}
        large
        intent={"primary"}
        className={"button-tertiaryl"}
        text={"PIPING"}
        onClick={handleSelectMode}
        disabled={isProduction && !products.includes("Pipe")}
      />)}
      {subscribedCourses.includes("OF") && (
      <Button
        id={"STRUCTURE"}
        large
        intent={"primary"}
        className={"button-tertiaryl"}
        text={"STRUCTURE"}
        onClick={handleSelectMode}
        disabled={
          isProduction &&
          !(
            products.includes("PR") ||
            products.includes("OF") ||
            products.includes("flare") ||
            products.includes("tower")
          )
        }
      />)}
      {subscribedCourses.includes("process") && (
        <Button
          id={"PROCESS"}
          large
          intent={"primary"}
          className={"button-tertiaryl"}
          text={"PROCESS"}
          onClick={handleSelectMode}
        />
      )}
      {subscribedCourses.includes("viewer") && (
        <Button
          id={"Viewer"}
          large
          intent={"primary"}
          className={"button-tertiaryl"}
          text={"VIEWER"}
          onClick={handleViewer}
        />
      )}
      </div>
    </div>
    </div>
  );
  
}
