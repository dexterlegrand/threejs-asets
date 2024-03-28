import React from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import { getElementByName } from "../../../3d-models/utils";
import { ModelsSettings } from "./models-settings/ModelsSettings";
import { CameraSettings } from "./camera-settings/CameraSettings";
import { GridSettings } from "./grid-settings/GridSettings";
import { AnalysisSettings } from "./analysis-settings/AnalysisSettings";
import { DisplaySettings } from "./display-settings/DisplaySettings";

type Props = {
  selected: number;
  openCustomGrids: () => any;
};

export function SettingsContent(props: Props) {
  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  function getComponent() {
    switch (props.selected) {
      case 0:
        return <ModelsSettings project={project} />;
      case 1:
        return <CameraSettings project={project} />;
      case 2:
        return <GridSettings project={project} openCustomGrids={props.openCustomGrids} />;
      case 3:
        return <AnalysisSettings project={project} />;
      case 4:
        return <DisplaySettings project={project} />;
      default:
        return null;
    }
  }

  return getComponent();
}
