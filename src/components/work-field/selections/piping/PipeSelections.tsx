import React from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import { getCurrentProject } from "../../../3d-models/utils";
import { SelectedPipe } from "./SelectedPipe";
import { SelectedPipeSupport } from "./SelectedPipeSupport";
import { SelectedConnector } from "./SelectedConnector";
import { HoveredPipe } from "./HoveredPipe";
import { HoveredPipeConnector } from "./HoveredPipeConnector";
import { HoveredPipeSupport } from "./HoveredPipeSupport";

export default function PipeSelections() {
  const project = useSelector((state: ApplicationState) => getCurrentProject(state));

  return (
    <>
      <SelectedPipe project={project} />
      <SelectedPipeSupport project={project} />
      <SelectedConnector project={project} />

      <HoveredPipe />
      <HoveredPipeConnector project={project} />
      <HoveredPipeSupport />
    </>
  );
}
