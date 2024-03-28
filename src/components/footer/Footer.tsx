import React, { FunctionComponent, useState, useMemo } from "react";
import { Button, Icon, Popover } from "@blueprintjs/core";
import { useSelector, useDispatch } from "react-redux";
import { ApplicationState } from "../../store";
import { InputDlg } from "../common/InputDlg";
import {
  createProject,
  selectProject,
  removeProject,
} from "../../store/main/actions";
import { RenameDlg } from "./RenameDlg";
import { SimpleToaster } from "../toaster/SimpleToaster";
import { TEvent } from "../../store/ui/types";
import {
  removeEventAction,
  removeUIAction,
  createUIAction,
  selectUIAction,
} from "../../store/ui/actions";
import { CloseDlg } from "./CloseDlg";
import {
  getCurrentUI,
  getCurrentProcess,
  saveGenericProject,
} from "../3d-models/utils";
import { Project } from "../../store/main/types";
import {
  removeProcessAction,
  createProcessAction,
} from "../../store/process/actions";
import { createPSSAction, removePSSAction } from "../../store/pss/actions";
import { secondServerAPI } from "../../pages/utils/agent";

type Props = {};

const alertMes =
  'Do you want to save the project? If you select the "Don\'t save" option, all project data will be lost.';

async function deleteProjectDirectory(projectId:string) {
  try {
    const response = await fetch( `${secondServerAPI}/api/v1/delete/directory/admin${projectId}`,{
     method : 'DELETE'
    });
    if(!response.ok){
      throw new Error('Projectr Id not found');
    }
  } catch (error) {
    console.log(error);
    
  }
}

const Footer: FunctionComponent<Props> = () => {
  const [dialog, setDialog] = useState<JSX.Element>();

  const selected = useSelector(
    (state: ApplicationState) => state.main.currentProject
  );
  const controls = useSelector(
    (state: ApplicationState) => state.scene.controls
  );
  const mode = useSelector((state: ApplicationState) => state.main.workMode);
  const projects = useSelector(
    (state: ApplicationState) => state.main.projects
  );
  const fabricatedSections = useSelector(
    (state: ApplicationState) => state.main.fabricatedSections
  );
  const rolledSections = useSelector(
    (state: ApplicationState) => state.main.rolledSections
  );
  const combinedSections = useSelector(
    (state: ApplicationState) => state.main.combinedSections
  );
  const userDefinedElbows = useSelector(
    (state: ApplicationState) => state.main.userDefinedElbows
  );
  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const process = useSelector((state: ApplicationState) =>
    getCurrentProcess(state)
  );

  const dispatch = useDispatch();

  const events = useMemo(() => ui?.events, [ui]);

  function handleSelect(name: string) {
    if (name !== selected) {
      dispatch(selectProject(name));
      dispatch(selectUIAction(name));
    }
  }

  function handleRemove(project: Project) {
    setDialog(
      <CloseDlg
        project={project.name}
        onSaveAndClose={() => {
          handleSave(project);
          dispatch(removeProject(project.name));
          dispatch(removeUIAction(project.name));
          dispatch(removeProcessAction(project.name));
          dispatch(removePSSAction(project.name));
          setDialog(undefined);
          deleteProjectDirectory(project.name);
        }}
        onClose={() => {
          dispatch(removeProject(project.name));
          dispatch(removeUIAction(project.name));
          dispatch(removeProcessAction(project.name));
          dispatch(removePSSAction(project.name));
          setDialog(undefined);
          deleteProjectDirectory(project.name);
        }}
        onCancel={() => setDialog(undefined)}
      />
    );
  }

  function handleRename(name: string) {
    setDialog(<RenameDlg name={name} onClose={() => setDialog(undefined)} />);
  }

  function handleCreateProject() {
    setDialog(
      <InputDlg
        title={`Create new project`}
        onClose={(name) => {
          if (name) {
            dispatch(createProject(name));
            dispatch(createUIAction(name));
            dispatch(createProcessAction(name));
            dispatch(createPSSAction(name));
          }
          setDialog(undefined);
        }}
      />
    );
  }

  function handleSave(project: Project) {
    saveGenericProject(
      project,
      ui,
      process,
      mode,
      fabricatedSections,
      rolledSections,
      combinedSections,
      userDefinedElbows,
      controls
    );
  }

  return (
    <>
      {dialog}
      <SimpleToaster />
      <div className="footer">
        <Popover
          disabled={!events || !events.length}
          content={
            events && events.length ? (
              <div className="d-flex f-column p-5">
                {events
                  ?.slice(events.length > 10 ? events.length - 10 : 0)
                  .sort((a, b) => b.id - a.id)
                  .map((event) => (
                    <Button
                      large
                      key={event.id}
                      alignText="left"
                      text={event.message}
                      intent={event.type}
                      icon={getIcon(event.type)}
                      rightIcon={
                        <Icon
                          icon="cross"
                          onClick={() => dispatch(removeEventAction(event.id))}
                        />
                      }
                    />
                  ))}
              </div>
            ) : (
              <></>
            )
          }
        >
          <Button
            className={"standart"}
            icon={events && events.length ? "new-layers" : "layers"}
            intent={getIntent(events)}
            minimal
          />
        </Popover>

        <Button icon="caret-left" minimal />
        <div className="projects">
          {projects.map((item) => (
            <Button
              className={`c-light ${item.name === selected ? "active" : ""}`}
              key={item.name}
              text={item.name}
              outlined
              onClick={() => handleSelect(item.name)}
              onDoubleClick={() => handleRename(item.name)}
              rightIcon={
                <Icon icon="cross" onClick={() => handleRemove(item)} />
              }
            />
          ))}
          <Button icon="plus" minimal onClick={handleCreateProject} />
        </div>
        <Button icon="caret-right" minimal />
      </div>
    </>
  );
};

export default Footer;

function getIntent(events?: TEvent[]) {
  if (!events || !events.length) return "none";
  return events[events.length - 1].type;
}

function getIcon(type: "danger" | "none" | "success" | "warning"): any {
  switch (type) {
    case "danger":
      return "error";
    case "success":
      return "tick-circle";
    case "warning":
      return "warning-sign";
    default:
      return "info-sign";
  }
}
