import { Button, FormGroup, ProgressBar, TextArea } from "@blueprintjs/core";
import Axios from "axios";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRecoilValue } from "recoil";
import { Player } from "video-react";
import { CustomDlg } from "../../../components/common/CustomDlg";
import { learningLoadingsAtom } from "../../../recoil/atoms/learning-loadings-atom";
import { ApplicationState } from "../../../store";
import { setCoursesAction } from "../../../store/learnings/actions";
import { TTopic } from "../../../store/learnings/types";
import { jsonOptions } from "../../../store/main/actions";
import { secondServerAPILearning } from "../../utils/agent";
import { LearnDlg } from "../LearnDlg";
import '../edu_css/Learning.css';
import '../edu_css/LinksModal.css';



type Props = {
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
  onClose: () => any;
  onToTopic: (topic: TTopic, field: string, index: number) => any;
  openFile?: () => any;
  deleteFile?: (fileName: string) => any;
};

export default function LinksModal({
  id,
  index,
  prevTopic,
  nextTopic,
  field,
  ids,
  links,
  title,
  isEdit,
  isSubmissions,
  onClose,
  onToTopic,
  openFile,
  deleteFile,
}: Props) {
  const learnings = useSelector((state: ApplicationState) => state.learnings);

  const dispatch = useDispatch();

  const isLoading = useRecoilValue(learningLoadingsAtom);

  const [state, setState] = useState<any>();
  const [commentState, setCommentState] = useState<any>();
  const [isExpanded, setIsExpanded] = useState(false);

  const auth = useSelector((state: ApplicationState) => state.auth);

  function handleClick(
    link: string,
    file: string,
    index: number,
    arr: { [name: string]: string }[]
  ) {
    const prev = arr[index - 1];
    const prevLink = prev ? Object.entries(prev)[0] : undefined;
    const next = arr[index + 1];
    const nextLink = next ? Object.entries(next)[0] : undefined;
    const toPrev = prevLink
      ? () => {
          const file = prevLink[0];
          const link = prevLink[1];
          handleClick(link, file, index - 1, arr);
        }
      : undefined;
    const toNext = nextLink
      ? () => {
          const file = nextLink[0];
          const link = nextLink[1];
          handleClick(link, file, index + 1, arr);
        }
      : undefined;
    if (
      file.toLowerCase().includes(".mp4") ||
      link.toLowerCase().includes(".mp4")
    ) {
      setState({ link, file, type: "video", index, arr, toPrev, toNext });
    } else if (
      file.toLowerCase().includes(".png") ||
      file.toLowerCase().includes(".jpg") ||
      file.toLowerCase().includes(".jpeg") ||
      link.toLowerCase().includes(".png") ||
      link.toLowerCase().includes(".jpg") ||
      link.toLowerCase().includes(".jpeg") 
    ) {
      setState({ link, file, type: "img", index, arr, toPrev, toNext });
    } else if (file.toLowerCase().includes(".txt")) {
      Axios.post(
        `${secondServerAPILearning}/api/v1/learning/get/fileS3`,
        { link, responceType: "text" },
        {
          ...jsonOptions,
          headers: {
            'user-id' : auth.User_id
          }
        }
      ).then((res) => {
        let content;
        if (typeof res.data !== "string") {
          content = JSON.stringify(res.data);
        } else content = res.data;
        setState({
          link,
          file,
          type: "txt",
          content,
          index,
          arr,
          toPrev,
          toNext,
        });
        return Axios.delete(`${secondServerAPILearning}/clean/learning/temp`);
      });
    } else if (
      file.toLowerCase().includes(".doc") ||
      link.toLowerCase().includes(".doc") ||
      file.toLowerCase().includes(".docx") ||
      link.toLowerCase().includes(".docx")
    ) {
      setState({ link, file, type: "doc", index, arr, toPrev, toNext });
    } else if (
      file.toLowerCase().includes(".pdf") ||
      link.toLowerCase().includes(".pdf")
    ) {
      Axios.post(
        `${secondServerAPILearning}/api/v1/learning/get/fileS3`,
        { link, responceType: "file" },
        {
          ...jsonOptions,
          headers: {
            'user-id' : auth.User_id
          }
        }
      ).then((res) => {
        const reader = new FileReader();
        reader.readAsDataURL(res.data);
        reader.onload = () => {
          setState({
            link,
            file,
            type: "pdf",
            content: reader.result,
            index,
            arr,
            toPrev,
            toNext,
          });
        };
        reader.onerror = (error) => {
          console.error(error);
        };
        return Axios.delete(`${secondServerAPILearning}/clean/learning/temp`);
      });
    } else {
      const a = document.createElement("a");
      a.href = link;
      a.download = file;
      a.click();
      a.remove();
    }
  }

  function handleOpenComment(file: string) {
    const comment = ids?.find((el) => el.file === file);
    comment && setCommentState({ ...comment, changedComment: comment.comment });
  }

  return (
    <>
      {state ? (
        <LearnDlg
        title={state.file}
        zIndex={4}
        onClose={() => setState(undefined)}
        body={
            <div className="d-flex f-column" style={{ color : "black" }}>
                <div className="hr" />
                <div className="d-flex f-grow f-jc-between p-3">
                    {state.toPrev ? (
                        <Button
                            icon={"arrow-left"}
                            text={"Back"}
                            intent={"primary"}
                            className={"button-secondary-b1l"}
                            onClick={state.toPrev}
                            style={{ marginRight: 10 }}
                        />
                    ) : (
                        <div></div>
                    )}
                    {state.toNext ? (
                        <Button
                            icon={"arrow-right"}
                            text={"Forward"}
                            intent={"primary"}
                            className={"button-secondary-b1l"}
                            onClick={state.toNext}
                            style={{ flexDirection: "row-reverse", gap: 5 }}
                        />
                    ) : (
                        <div></div>
                    )}
                </div>
                <div className="hr" />
                <div className="p-5" style={{ minWidth: "70vw", backgroundColor: "#f5f5f5" }}>
                    {state.type === "video" ? (
                        <Player playsInline preload="auto" src={state.link} />
                    ) : null}
                    {state.type === "img" ? <img src={state.link} style={{ maxWidth: "100%", height: "auto" }} /> : null}
                    {state.type === "txt" ? <p>{state.content}</p> : null}
                    {state.type === "pdf" ? (
                        <iframe
                            src={`https://docs.google.com/viewer?url=${state.link}&embedded=true`}
                            style={{
                                position: "relative",
                                overflow: "auto",
                                height: "60vh",
                                width: "100%",
                                border: "none"
                            }}
                        ></iframe>
                    ) : null}
                </div>
            </div>
        }
    />
      ) : null}
      {commentState ? (
        <LearnDlg
          title={`Comment of ${commentState.file}`}
          zIndex={4}
          body={
            <div className="d-flex f-column">
              <FormGroup>
                <TextArea
                  fill
                  value={commentState.changedComment}
                  disabled={commentState.isLoading}
                  onChange={(e) => {
                    e.persist();
                    setCommentState((prev: any) => {
                      return {
                        ...prev,
                        changedComment: e.target.value,
                      };
                    });
                  }}
                />
              </FormGroup>
            </div>
          }
          actions={
            <>
              <Button
                intent="success"
                text={"Save"}
                loading={commentState.isLoading}
                onClick={() => {
                  setCommentState((prev: any) => ({
                    ...(prev ?? {}),
                    isLoading: true,
                  }));
                  Axios.post(
                    `${secondServerAPILearning}/upload/comment/submission/${commentState.courseId}/${commentState.topicId}`,
                    {
                      id: +commentState.id,
                      comment: commentState.changedComment ?? "",
                    },
                    jsonOptions
                  )
                    .then(() => {
                      setCommentState((prev: any) => ({
                        ...(prev ?? {}),
                        comment: prev.changedComment,
                      }));
                      dispatch(
                        setCoursesAction(
                          learnings.courses.map((c) => {
                            if (c.id === commentState.courseId) {
                              return {
                                ...c,
                                topics: c.topics?.map((t) => {
                                  if (t.id === commentState.topicId) {
                                    return {
                                      ...t,
                                      submission_files: {
                                        ...(t.submission_files ?? {}),
                                        [commentState.id]: {
                                          ...((t.submission_files ?? {})[
                                            commentState.id
                                          ] ?? {}),
                                          comment:
                                            commentState.changedComment ?? "",
                                        },
                                      },
                                    };
                                  }
                                  return t;
                                }),
                              };
                            }
                            return c;
                          })
                        )
                      );
                    })
                    .catch((e) => console.error(e))
                    .finally(() => {
                      setCommentState((prev: any) => ({
                        ...(prev ?? {}),
                        isLoading: false,
                      }));
                    });
                }}
              />
              {commentState.comment ? (
                <Button
                  intent="primary"
                  text={"Delete"}
                  loading={commentState.isLoading}
                  onClick={() => {
                    setCommentState((prev: any) => ({
                      ...(prev ?? {}),
                      isLoading: true,
                    }));
                    Axios.post(
                      `${secondServerAPILearning}/delete/comment/submission/${commentState.courseId}/${commentState.topicId}`,
                      { id: +commentState.id },
                      jsonOptions
                    )
                      .then(() => {
                        setCommentState((prev: any) => ({
                          ...(prev ?? {}),
                          comment: undefined,
                          changedComment: "",
                        }));
                        dispatch(
                          setCoursesAction(
                            learnings.courses.map((c) => {
                              if (c.id === commentState.courseId) {
                                return {
                                  ...c,
                                  topics: c.topics?.map((t) => {
                                    if (t.id === commentState.topicId) {
                                      return {
                                        ...t,
                                        submission_files: {
                                          ...(t.submission_files ?? {}),
                                          [commentState.id]: {
                                            ...((t.submission_files ?? {})[
                                              commentState.id
                                            ] ?? {}),
                                            comment: "",
                                          },
                                        },
                                      };
                                    }
                                    return t;
                                  }),
                                };
                              }
                              return c;
                            })
                          )
                        );
                      })
                      .catch((e) => console.error(e))
                      .finally(() => {
                        setCommentState((prev: any) => ({
                          ...(prev ?? {}),
                          isLoading: false,
                        }));
                      });
                  }}
                />
              ) : null}
            </>
          }
          onClose={() => setCommentState(undefined)}
        />
      ) : null}
      <LearnDlg
        title={title}
        zIndex={3}
        onClose={onClose}
        body={
          <div className="d-flex f-column"  style={{ color: "black" }}>
            {isLoading[`${id}-${field}`] ? (
              <>
                <div className={"hr"} />
                <ProgressBar />
              </>
            ) : null}
            <div className="hr" />
            <div className="p-5 bg-dark">
              {links
                .filter((el) => {
                  const link = Object.entries(el ?? {})[0];
                  return link && link[1];
                })
                .map((el, i, arr) => {
                  const link = Object.entries(el)[0];
                  if (
                    !link ||
                    !link[0] ||
                    !link[1] ||
                    typeof link[1] !== "string"
                  )
                    return null;
                  return (
                    <p key={i} style={{ padding: 5 }}>
                      {(isEdit || isSubmissions) && deleteFile ? (
                        <Button
                          small
                          minimal
                          icon={"cross"}
                          intent={"danger"}
                          onClick={() => {
                            deleteFile(link[1]);
                          }}
                        />
                      ) : null}
                      {ids ? (
                        <Button
                          small
                          minimal
                          icon={"comment"}
                          onClick={() => handleOpenComment(link[0])}
                        />
                      ) : null}
                      {`${i + 1}: `}
                      <a
                        style={{ color: "white" }}
                        onClick={() => handleClick(link[1], link[0], i, arr)}
                      >
                        {link[0]}
                      </a>
                    </p>
                  );
                })}
            </div>
            {isEdit && openFile ? (
              <>
                <div className="hr" />
                <Button
                  fill
                  intent={"success"}
                  text={"Upload File"}
                  className={"button-secondary-b1l"}
                  onClick={() => {
                    openFile();
                  }}
                />
              </>
            ) : null}
            <div className="hr" />
            <div className="d-flex f-grow f-jc-between">
              {prevTopic ? (
                <Button
                  icon={"arrow-left"}
                  text={"Back"}
                  className={"button-secondary-b1l"}
                  intent={"primary"}
                  onClick={() => onToTopic(prevTopic, field, index - 1)}
                />
              ) : (
                <div></div>
              )}
              {nextTopic ? (
                <Button
                  icon={"arrow-right"}
                  text={"Forward"}
                  intent={"primary"}
                  className={"button-secondary-b1l"}
                  onClick={() => onToTopic(nextTopic, field, index + 1)}
                  style={{ flexDirection: "row-reverse", gap: 5 }}
                />
              ) : (
                <div></div>
              )}
            </div>
          </div>
        }
      />
    </>
  );
}
