import React, { useRef, useState, useMemo, useEffect } from "react";
import { Button, H4, EditableText, Checkbox, Tooltip } from "@blueprintjs/core";
import { TCourse, TTopic } from "../../../store/learnings/types";
import GenericTableHeader from "../../../components/common/table/GenericTableHeader";
import GenericTableBody from "../../../components/common/table/GenericTableBody";
import { useDispatch, useSelector } from "react-redux";
import {
  THeader,
  TDataField,
  TField,
} from "../../../components/common/table/GenericTable";
import {
  getNextId,
  importFromCSV,
  exportToCSV,
  openFile,
} from "../../../components/3d-models/utils";
import Axios from "axios";
import LinksModal from "./LinksModal";
import { jsonOptions } from "../../../store/main/actions";
import { secondServerAPILearning } from "../../utils/agent";
import { useRecoilState } from "recoil";
import { learningLoadingsAtom } from "../../../recoil/atoms/learning-loadings-atom";
import { ApplicationState } from "../../../store";
import '../edu_css/Learning.css';

type Props = {
  isView: boolean;
  course: TCourse;
  onChange: (topics: TTopic[]) => any;
  onReload: () => any;
};

type StudentType = {
  userId: number;
  role: string;
  emailId: string;
  userName: string;
};

export function Student({ isView, course, onChange, onReload }: Props) {
  const [isEdit, setEdit] = useState<boolean>(false);
  const [changed, setChanged] = useState<TTopic[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [topic, setTopic] = useState<TTopic>();
  const [files, setFiles] = useState<File[]>([]);
  const [isInstructorView, setIsInstructorView] = useState(false);
  useEffect(() => {
    const style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = `
      .light-table thead {
        background-color: #f2f2f2;
        color: #333;
        border-radius: 12px 12px 0 0;
      }
      
      .light-table thead th {
        font-size: 18px;  /* Make heading text bigger */
      }
      
      .light-table tbody tr:nth-child(even) {
        background-color: #e6f7ff;
      }
      
      .light-table tbody tr:nth-child(odd) {
        background-color: #ffffff;
      }
      
      .light-table tbody td,
      .light-table thead th {
        padding: 16px;
        text-align: left;
      }

      .light-table tbody td button {
        display: block;
        margin: auto;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
    }, []);
  const [modal, setModal] = useState<{
    id: number;
    index: number;
    prevTopic?: TTopic;
    nextTopic?: TTopic;
    field: string;
    ids?: {
      id: string | number;
      file: string;
      link: string;
      courseId: number;
      topicId: number;
      comment: string;
    }[];
    links: { [key: string]: string }[];
    title: string;
    isEdit: boolean;
    isSubmissions?: boolean;
    openFile?: () => any;
    deleteFile?: (fileName: string) => any;
    addComment?: () => any;
    onClose?: () => any;
  }>();
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [isAddedLoading, setIsAddedLoading] = useState(false);

  const [students, setStudents] = useState<StudentType[]>([]);

  const [showStudents, setShowStudents] = useState(false);

  const [isLoading, setIsLoading] = useRecoilState(learningLoadingsAtom);

  const tableRef = useRef<HTMLTableElement>(null);

  const auth = useSelector((state: ApplicationState) => state.auth);


  const header: THeader = useMemo(() => {
    return {
      rows: [{ columns: [{ title: "Topic" }, { colSpan: 5, title: "Link" }] }],
    };
  }, []);

  const handleInstructorViewOpen = () => {
    setIsInstructorView(true);
  }

  const handleInstructorViewClose = () => {
    setIsInstructorView(false);
  }
  

  const dataFields: TDataField[] = useMemo(() => {
    const dataFields: TDataField[] =
      (isEdit ? changed : course.topics)?.map((r, i, arr) => {
        const fields: TField[] = [
          {
            type: "INPUT",
            props: {
              value: r.title,
              disabled: !isEdit,
              targetClassName: "f-jc-start f-weight-b p-20h",
              onChange: (v: any) => handleChange(r, "title", v),
            },
          },
          {
            type: "CUSTOM",
            element: (
              <Tooltip content="This contains information about the lesson">
              <Button
                data-tooltip-id="initial-tooltip"
                data-tooltip-content={`data supported txt,image,pdf`}
                data-tooltip-place="top"
                text={"Info"}
                font-size={"20px"}
                minimal
                intent={"primary"}
                className={"f-weight-b"}
                loading={isLoading[`${r.id}-info`]}
                onClick={() => {
                  setModal({
                    id: r.id,
                    index: i,
                    links: Object.values(r.info),
                    field: "info",
                    title: `${r.title} - Info`,
                    prevTopic: arr[i - 1],
                    nextTopic: arr[i + 1],
                    isEdit,
                    openFile: isEdit ? () => openText(r, "info") : undefined,
                    deleteFile: isEdit
                      ? (fileName) =>
                          deleteFile(r, "info", fileName, deleteText)
                      : undefined,
                  });
                }}
              />
              </Tooltip>
            ),
          },
          {
            type: "CUSTOM",
            element: (
              <Tooltip content="Click Here to watch the video">
              <Button
                text = {"Video"}
                minimal
                intent={"primary"}
                className={"f-weight-b"}
                loading={isLoading[`${r.id}-video`]}
                onClick={() => {
                  setModal({
                    id: r.id,
                    index: i,
                    links: Object.values(r["video"]),
                    field: "video", 
                    title: `${r.title} - video`, 
                    prevTopic: arr[i - 1],
                    nextTopic: arr[i + 1],
                    isEdit,
                    openFile: isEdit
                      ? () => openTextOrVideo(r, "video")
                      : undefined, 
                    deleteFile: isEdit
                      ? (fileName) =>
                          deleteFile(r, "video", fileName, deleteVideo)
                      : undefined,
                  }); 
                }}
              />
              </Tooltip>
            ),
          },
          {
            type: "CUSTOM",
            element: (
              <Tooltip content="Check your assignment here">
              <Button
                text={"Assign."}
                minimal
                intent={"primary"}
                className={"f-weight-b"}
                loading={isLoading[`${r.id}-assign`]}
                onClick={() => {
                  setModal({
                    id: r.id,
                    index: i,
                    links: Object.values(r.assign),
                    field: "assign",
                    title: `${r.title} - Assign.`,
                    prevTopic: arr[i - 1],
                    nextTopic: arr[i + 1],
                    isEdit,
                    openFile: isEdit ? () => openAnyFile(r) : undefined,
                    deleteFile: isEdit
                      ? (fileName) =>
                          deleteFile(r, "assign", fileName, deleteAnyFile)
                      : undefined,
                  });
                }}
              />
              </Tooltip>
            ),
          },
          {
            type: "CUSTOM",
            element:
              r.submission || isEdit ? (
                isEdit ? (
                  <Checkbox
                    checked={r.submission}
                    onChange={(e) =>
                      handleChange(r, "submission", e.currentTarget.checked)
                    }
                  />
                ) : (
                  <Tooltip content="Submit your assignment here">
                  <Button
                    text={"Submission"}
                    minimal
                    intent={"primary"}
                    className={"f-weight-b"}
                    onClick={() => setTopic(r)}
                  />
                  </Tooltip>
                )
              ) : (
                undefined
              ),
          },
        ];
        return { id: r.id, fields };
      }) ?? [];
    return dataFields;
  }, [course.topics, changed, isEdit, isLoading]);

  useEffect(() => {
    if (!topic) return;
    setTopic(course.topics?.find((t) => t.id === topic.id));
  }, [course.topics, topic]);

  async function uploadFile(
    r: TTopic,
    field: string,
    file: File,
    request: (file: File, r: TTopic) => Promise<any>,
    isUpdateModal = true
  ) {
    setIsLoading((prev: any) => ({
      ...prev,
      [`${r.id}-${field}`]: true,
    }));
    try {
      const res = await request(file, r);
      const link = res?.data.link;
      // @ts-ignore
      const obj = r[field] ?? {};
      const maxKey =
        Object.keys(obj).reduce((acc: number, key: string | number) => {
          return Math.max(acc, +key);
        }, 0) + 1;
      const links = {
        ...obj,
        [maxKey]: { [file.name]: link },
      };
      isUpdateModal &&
        // @ts-ignore
        setModal((prev) => ({
          ...prev,
          links: Object.values(links),
        }));
      handleChange(r, `${field}`, links);
    } catch (error) {
      console.error(error);
    }
    setIsLoading((prev: any) => ({
      ...prev,
      [`${r.id}-${field}`]: false,
    }));
  }

  async function deleteFile(
    r: TTopic,
    field: string,
    file: string,
    request: (file: string, r: TTopic) => Promise<any>,
    isUpdateModal = true
  ) {
    setIsLoading((prev: any) => ({
      ...prev,
      [`${r.id}-${field}`]: true,
    }));
    try {
      // @ts-ignore
      const obj = r[field] ?? {};
      // @ts-ignore
      const fileRow = Object.entries(obj).find(([key, value]) =>
        Object.values((value as any) ?? {}).includes(file)
      );
      if (!fileRow) {
        setIsLoading((prev: any) => ({
          ...prev,
          [`${r.id}-${field}`]: false,
        }));
        return;
      }
      await request(fileRow![0], r);
      const links = {
        ...obj,
        [fileRow![0]]: undefined,
      };
      isUpdateModal &&
        // @ts-ignore
        setModal((prev) => ({
          ...prev,
          links: Object.values(links),
        }));
      handleChange(r, `${field}`, links);
    } catch (error) {
      console.error(error);
    }
    setIsLoading((prev: any) => ({
      ...prev,
      [`${r.id}-${field}`]: false,
    }));
  }

  function openText(r: TTopic, field: string) {
    openFile(
      [".txt", ".doc", ".docx", ".pdf", ".png", ".jpg", ".jpeg"],
      (files) => {
        const file = files[0];
        if (!file) return;
        uploadFile(r, field, file, uploadText);
      }
    );
  }

  function openTextOrVideo(r: TTopic, field: string) {
    openFile(
      [".txt", ".doc", ".docx", ".pdf", ".mp4", ".png", ".jpg", ".jpeg"],
      (files) => {
        const file = files[0];
        if (!file) return;
        const acceptedVideoTypes = ["video/mp4", "video/webm","video/mkv", "video/ogg", "video/x-matroska"];
        if (acceptedVideoTypes.includes(file.type)) {
          uploadFile(r, field, file, uploadVideo);
        } else {
          uploadFile(r, field, file, uploadText);
        }
      }
    );
  }

  function openAnyFile(r: TTopic) {
    openFile(
      [
        ".txt",
        ".doc",
        ".docx",
        ".pdf",
        ".pps",
        ".ids",
        ".ppsm",
        ".ddd",
        ".ofs",
        ".odsm",
      ],
      (files) => {
        const file = files[0];
        if (!file) return;
        setIsLoading((prev: any) => ({
          ...prev,
          [`${r.id}-assign`]: true,
        }));
        uploadFileToServer(file, r)
          .then((res) => {
            const link = res?.data.link;
            const obj = r.assign ?? {};
            const maxKey =
              Object.keys(obj).reduce((acc: number, key: string | number) => {
                return Math.max(acc, +key);
              }, 0) + 1;
            const links = {
              ...obj,
              [maxKey]: { [file.name]: link },
            };
            // @ts-ignore
            setModal((prev) => ({
              ...prev,
              links: Object.values(links),
            }));
            handleChange(r, `assign`, links);
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            setIsLoading((prev: any) => ({
              ...prev,
              [`${r.id}-assign`]: false,
            }));
          });
      }
    );
  }

  function handleAdd() {
    setIsAddedLoading(true);
    const newLesson = {
      id: getNextId(changed),
      title: "",
      info: {},
      "video":{},
      assign: {},
    };
    course.isChanged = true,
    console.log("Sending course: ", course);
    Axios.post(
      `${secondServerAPILearning}/api/v1/learning/courses/update`,
      JSON.stringify({ ...course,  topics: [...changed, newLesson] }),
      {
        ...jsonOptions,
        headers:{
          ...jsonOptions.headers,
          'user-id' : auth.User_id
        }
      }
    )
      .then(() => {
        setChanged((prev) => [...prev, newLesson]);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        setIsAddedLoading(false);
      });
  }

  function handleChange(r: TTopic, field: string, value: any) {
    let changedTopic: TTopic;
    setChanged((prev) => {
      const changed = [];
      for (const t of prev) {
        if (t.id === r.id) {
          changed.push({ ...t, [field]: value });
          changedTopic = { ...t, [field]: value };
        } else changed.push(t);
      }
      return changed;
    });
    setModal((prev) => {
      if (!prev) return prev;
      let openFileC, deleteFileC;
      if (isEdit) {
        if (prev.field === "info") {
          openFileC = () => openText(changedTopic, "info");
          deleteFileC = (fileName: string) =>
            deleteFile(changedTopic, "info", fileName, deleteText);
        }
          else if (prev.field === "video") {
          openFileC = () => openTextOrVideo(changedTopic, "video");
          deleteFileC = (fileName: string) =>
            deleteFile(changedTopic, "video", fileName, deleteVideo);
        } else if (prev.field === "assign") {
          openFileC = () => openAnyFile(changedTopic);
          deleteFileC = (fileName: string) =>
            deleteFile(changedTopic, "assign", fileName, deleteAnyFile);
        }
      }
      return {
        ...prev,
        openFile: openFileC,
        deleteFile: deleteFileC,
      };
    });
  }

  function handleDelete() {
    setChanged((prev) => prev.filter((t) => !selected.includes(t.id)));
    setSelected([]);
  }
  
  function handleImport() {
    importFromCSV((arr, isCSV) => {
      if (!isCSV || !Array.isArray(arr)) return;
      const topics: TTopic[] = [];
      for (const item of arr) {
        if (!item.id) continue;
        try {
          topics.push({
            id: item.id,
            title: item.Topic ?? "",
            info: JSON.parse(item.Info) ?? "{}",
            "video": JSON.parse(item["video"] ?? "{}"),
            assign: JSON.parse(item.Assign ?? "{}"),
            submission: item.Submission ?? false,
            submission_files: JSON.parse(item["Submissions files"] ?? "{}"),
            comment: item.Comment,
            score: item.Score ?? "",
          });
        } catch (error) {
          console.error(error);
        }
      }
      setChanged(topics);
    });
  }

  function handleExport() {
    const items = [];
    for (const t of course.topics ?? []) {
      try {
        items.push({
          id: t.id,
          Topic: t.title,
          Info: JSON.stringify(t.info),
          "video": JSON.stringify(t["video"]),
          Assign: JSON.stringify(t.assign),
          Submission: !!t.submission,
          "Submissions files": JSON.stringify(t.submission_files ?? {}),
          Comment: t.comment ?? "",
          Score: t.score ?? "",
        });
      } catch (error) {
        console.error(error);
      }
      if (!items.length) {
        items.push({
          id: " ",
          Topic: " ",
          Info: " ",
          Lect: " ",
          Assign: " ",
          Submission: " ",
          Formats: " ",
          Comment: " ",
          Score: " ",
        });
      }
    }
    exportToCSV(items, `${course.name} - Topics`);
  }

  function addFiles() {
    openFile(
      [],
      (files) => {
        setFiles((prev) => [...prev, ...files]);
      },
      true
    );
  }

  function handleDropFiles(ev: any) {
    ev.preventDefault();
    const files: File[] = [];
    for (let i = 0; i < ev.dataTransfer.files.length; i++) {
      files.push(ev.dataTransfer.files.item(i));
    }
    setFiles((prev) => [...prev, ...files]);
  }

  async function uploadSubmissionFiles() {
    if (!topic) return;
    for (const file of files) {
      try {
        await uploadFile(
          topic,
          "submission_files",
          file,
          (file, topic) => {
            const formData = new FormData();
            formData.append("file", file, file.name);
            return Axios.post(
              `${secondServerAPILearning}/api/v1/learning/upload/submission/${course.id}/${topic.id}`,
              formData,
              {
                ...jsonOptions,
                headers:{
                  ...jsonOptions.headers,
                  'user-id' : auth.User_id
                }
              }
            );
          },
          false
        );
      } catch (error) {
        console.error(error);
      }
    }
  }

  async function uploadVideo(file: File, r: TTopic) {
    const formData = new FormData();
    formData.append("file", file, file.name);
    return Axios.post(
      `${secondServerAPILearning}/api/v1/learning/upload/video/${course.id}/${r.id}`,
      formData,
      {
        ...jsonOptions,
        headers:{
          ...jsonOptions.headers,
          'user-id' : auth.User_id
        }
      }
    );
  }

  function deleteVideo(file: string, r: TTopic) {
    return Axios.delete(
      `${secondServerAPILearning}/api/v1/learning/delete/video/${course.id}/${r.id}/${file}`,
      {
        ...jsonOptions,
        headers:{
          ...jsonOptions.headers,
          'user-id' : auth.User_id
        },

      }
    );
  }

  async function uploadText(file: File, r: TTopic) {
    const formData = new FormData();
    formData.append("file", file, file.name);
    return Axios.post(
      `${secondServerAPILearning}/api/v1/learning/upload/text/${course.id}/${r.id}`,
      formData,
      {
        headers:{
          'user-id' : auth.User_id
        },
      }
    );
  }

  function deleteText(file: string, r: TTopic) {
    console.log("File:", file);
    return Axios.delete(
      `${secondServerAPILearning}/api/v1/learning/delete/text/${course.id}/${r.id}/${file}`,
      {
        ...jsonOptions,
        headers:{
          'user-id' : auth.User_id
        },
      }
    );
  }

  function deleteAnyFile(file: string, r: TTopic) {
    return Axios.delete(
      `${secondServerAPILearning}/api/v1/learning/delete/file/${course.id}/${r.id}/${file}`,
      {
        ...jsonOptions,
        headers:{
          ...jsonOptions.headers,
          'user-id' : auth.User_id
        }
      }
    );
  }

  function uploadFileToServer(file: File, r: TTopic) {
    const formData = new FormData();
    formData.append("file", file, file.name);
    return Axios.post(
      `${secondServerAPILearning}/api/v1/learning/upload/file/${course.id}/${r.id}`,
      formData,
      {
        ...jsonOptions,
        headers:{
          ...jsonOptions.headers,
          'user-id' : auth.User_id
        }
      }
    );
  }

  async function uploadFiles() {
    setUploadingFiles(true);
    setChanged(course.topics ?? []);
    try {
      await uploadSubmissionFiles();
    } catch (error) {
      console.error(error);
    }
    setUploadingFiles(false);
    setChanged([]);
    setFiles([]);
    onReload();
  }

function getStudents(courseId: number, auth: any) {
  const headers = {
    ...jsonOptions.headers,
    'user-id': auth.User_id,
  };
  Axios.get(`${secondServerAPILearning}/api/v1/learning/users/${courseId}`, {
    headers,
  })
  .then(response => {
    setStudents(response.data);
    setShowStudents(true);
  })
  .catch(error => {
    console.error('Error fetching student data: ', error);
  });
}

  return (
    <div className={"d-flex f-column f-grow"}>
      {modal ? (
        <LinksModal
          {...modal}
          onClose={() => {
            setModal((prev) => {
              if (prev?.onClose) prev.onClose();
              return undefined;
            });
          }}
          onToTopic={(topic, field, index) => {
            setModal((prev) => {
              if (!prev) return prev;
              const topics = (prev?.isEdit ? changed : course.topics) ?? [];
              let openFileC, deleteFileC;
              if (isEdit) {
                if (prev.field === "info") {
                  openFileC = () => openText(topic, "info");
                  deleteFileC = (fileName: string) =>
                    deleteFile(topic, "info", fileName, deleteText);
                }
                  else if (prev.field === "Video") {
                  openFileC = () => openTextOrVideo(topic, "Video");
                  deleteFileC = (fileName: string) =>
                    deleteFile(topic, "Video", fileName, deleteVideo)
                } else if (prev.field === "assign") {
                  openFileC = () => openAnyFile(topic);
                  deleteFileC = (fileName: string) =>
                    deleteFile(topic, "assign", fileName, deleteAnyFile);
                }
              }
              return {
                id: topic.id,
                index,
                prevTopic: topics[index - 1],
                nextTopic: topics[index + 1],
                // @ts-ignore
                links: Object.values(topic[field] ?? {}),
                field,
                title: `${topic.title} - ${field}`,
                isEdit: !!prev?.isEdit,
                openFile: openFileC,
                deleteFile: deleteFileC,
              };
            });
          }}
        />
      ) : null}
      <div  
        style={{
        display: 'flex',  
        alignItems: 'flex-start',  
        padding: '20px', 
        gap: '16px', 
        border: '2px solid #e0e0e0',  
        borderRadius: '8px',  
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        backgroundColor: '#fff'  
        }} 
      > 
      {course.img || course.icon ? ( 
        <img 
          style={{
          height: '100px',  
          width: '100px',  
          borderRadius: '50%',  
          objectFit: 'cover',  
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }} 
          src={course.img || course.icon} 
          alt={"Course image"} 
        /> 
      ) : null} 
      <div  
        style={{  
          display: 'flex',  
          flexDirection: 'column',  
          justifyContent: 'center' 
        }} 
      > 
      <h4  
        style={{  
          margin: '0',  
          padding: '0',  
          fontWeight: '700',  
          fontSize: '2rem',
          fontFamily:'Inter',
          fontStyle: 'normal',  
          color: '#333' 
          }} 
        >{course.name}</h4> 
        <p style={{  
          margin: '5px 0 0 0',
          fontWeight: '500',  
          fontSize: '1.5rem',
          fontFamily: 'Inter',
          fontStyle: 'oblique',  
          color: '#666' 
          }} 
          >{course.description}</p> 
          {!topic && !isView ? (
            <div className="d-flex label-light f-ai-center">
              {!isEdit ? (
                <Button
                  text="Edit Topic"
                  intent="primary"
                  className="button-primary-b2l"
                  onClick={() => {
                    setEdit(true);
                    setChanged(course.topics ?? []);
                  }}
                />
              ) : null}
                <Button
                  text="Get Student List"
                  intent="primary"
                  className="button-primary-b2l"
                  onClick={() => getStudents(course.id, auth)}
                />
              {isEdit ? (
                <>
                  <Button 
                    text="Add Topic" 
                    intent="primary" 
                    className="button-primary-b2l"
                    loading={isAddedLoading} 
                    onClick={handleAdd}
                  />
                  <Button 
                    text="Delete Topic" 
                    intent="primary" 
                    className="button-primary-b2l"
                    onClick={handleDelete}
                  />
                  <Button 
                    text="CSV Upload" 
                    intent="success" 
                    className="button-secondary-b1l"
                    onClick={handleImport}
                  />
                  <Button 
                    text="CSV Download" 
                    intent="success" 
                    className="button-secondary-b1l"
                    onClick={handleExport}
                  />
                </>
              ) : null}
              {isEdit ? (
                <>
                  <Button
                    text="Save changes"
                    intent="primary"
                    className="button-primary-b2l"
                    disabled={Object.values(isLoading).includes(true)}
                    onClick={() => {
                      onChange(changed);
                      setEdit(false);
                    }}
                  />
                  <Button
                    text="Cancel"
                    intent="primary"
                    className="button-primary-b2l"
                    disabled={Object.values(isLoading).includes(true)}
                    onClick={() => {
                      setEdit(false);
                      setChanged([]);
                    }}
                  />
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {showStudents ? (
        <>
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px',
            borderBottom: '2px solid #ccc',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            fontStyle: 'normal',
            fontFamily: 'Inter',
          }}>
          <span>Student Name</span>
          <span>Student Email</span>
        </div>
        {students.map((student, index) => (
          <div key={student.userId} style={{ 
            display: 'flex',
            fontSize: '1.3rem',
            fontFamily: 'Inter',
            fontStyle: 'Oblique',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid #ccc',
            padding: '10px', 
            margin: '10px 0', 
            borderRadius: '5px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#fff'
          }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}>
          <span style={{
            fontWeight: 'bold',
            fontSize: '1.2rem',
            fontFamily: 'Inter',
            fontStyle: 'Oblique',
            color: student.userName.length > 10 ? '#f00' : '#333'
          }}>
            {index + 1}. {student.userName}
          </span>
        </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start'
      }}>
        <span style={{
          fontSize: '0.85rem',
          fontFamily: 'Inter',
          fontStyle: 'Oblique',
          color: '#555'
        }}>
          ({student.emailId})
        </span>
      </div>
    </div>
  ))}
</div>
          <Button
            icon={"arrow-left"}
            text={"Back"}
            intent={"primary"}
            className="button-primary-b2l"
            onClick={() => setShowStudents(false)}
          />
        </>
        ) : topic ? (
        <div className={"d-flex f-column f-grow"}>
          <div className={"d-flex f-ai-center m-5"} style={{ gap: 16 }}>
            <Button
              icon={"arrow-left"}
              text={"Back"}
              className={"button-primary-b2l"}
              intent={"primary"}
              onClick={() => setTopic(undefined)}
            />
            <H4 className={"no-m"}>{topic.title}</H4>
            {files.length ? (
              <Button
                text={"Upload files"}
                intent={"success"}
                onClick={uploadFiles}
                loading={uploadingFiles}
              />
            ) : null}
            {Object.keys(topic.submission_files ?? {}).length ? (
              <Button
                text={"Submission files"}
                className={"button-secondary-b1l"}
                intent={"primary"}
                onClick={() => {
                  setModal({
                    id: topic.id,
                    index: 1,
                    ids: fieldToArr(
                      course.id,
                      topic.id,
                      topic.submission_files ?? {}
                    ),
                    links: Object.values(topic.submission_files ?? {}),
                    field: "submission_files",
                    title: "Submission files",
                    isEdit: false,
                    isSubmissions: true,
                    deleteFile: async (link) => {
                      setIsLoading((prev: any) => ({
                        ...prev,
                        [`${topic.id}-submission_files`]: true,
                      }));
                      try {
                        const obj = topic.submission_files ?? {};
                        const fileRow = Object.entries(
                          obj
                        ).find(([key, value]) =>
                          Object.values((value as any) ?? {}).includes(link)
                        );
                        if (!fileRow) {
                          setIsLoading((prev: any) => ({
                            ...prev,
                            [`${topic.id}-submission_files`]: false,
                          }));
                          return;
                        }
                        await Axios.post(
                          `${secondServerAPILearning}/api/v1/learning/upload/submission/${course.id}/${topic.id}`,
                          fileRow![0],
                          {
                            ...jsonOptions,
                            headers:{
                              ...jsonOptions.headers,
                              'user-id' : auth.User_id
                            }
                          }
                        );
                        // @ts-ignore
                        setModal((prev) => {
                          const links = prev!.links.filter((l) => {
                            return Object.values(l).includes(link);
                          });
                          return {
                            ...prev,
                            links,
                            onClose: () => onReload(),
                          };
                        });
                      } catch (error) {
                        console.error(error);
                      }
                      setIsLoading((prev: any) => ({
                        ...prev,
                        [`${topic.id}-submission_files`]: false,
                      }));
                    },
                  });
                }}
              />
            ) : null}
          </div>
          <div
            className={"d-flex f-column dashed-border p-20 m-5"}
            onClick={addFiles}
            onDrop={handleDropFiles}
            onDragOver={(e) => e.preventDefault()}
          >
            <span>{`<Area to drag and drop files>`}</span>
          </div>
          {files.map((file) => (
            <p key={file.name}>{file.name}</p>
          ))}
          <div className={"solid-border p-20 m-5"}>
            <EditableText
              multiline={true}
              value={topic.comment}
              onChange={(value) => handleChange(topic, "comment", value)}
            />
          </div>
          <div className={"d-flex f-ai-center p-20"} style={{ gap: 16 }}>
            <H4 className={"no-m"}>Score: </H4>
            <EditableText
              value={topic.score}
              onChange={(value) => handleChange(topic, "score", value)}
            />
          </div>
        </div>
      ) : (
        <div className={"p-5"}>
        <div className={"p-5"} style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <table ref={tableRef} className="light-table" 
          style={{ 
            width: '100%',
            fontSize: '1.2rem',
            fontFamily: 'Inter',
            fontStyle: 'Oblique', 
            borderCollapse: 'separate', borderSpacing: '0', borderRadius: '12px' }}>
            <GenericTableHeader
              table={tableRef.current}
              selected={selected}
              setSelected={setSelected}
              header={header}
              dataFields={dataFields}
              onDelete={handleDelete}
            />
            <GenericTableBody
              table={tableRef.current}
              header={header}
              dataFields={dataFields}
              selected={selected}
              setSelected={setSelected}
              onDelete={handleDelete}
            />
          </table>
        </div>
      </div>
      )}
    </div>
  );
}

function fieldToArr(
  courseId: number,
  topicId: number,
  field: any
): {
  id: string;
  file: string;
  link: string;
  courseId: number;
  topicId: number;
  comment: string;
}[] {
  // @ts-ignore
  return Object.entries(field ?? {}).reduce((acc, [key, value]) => {
    const val = (value as any) ?? {};
    const entries = Object.entries(val)[0];
    return entries
      ? [
          ...acc,
          {
            id: key,
            file: entries[0],
            link: entries[1],
            courseId,
            topicId,
            comment: val.comment,
          },
        ]
      : acc;
  }, []);
}
