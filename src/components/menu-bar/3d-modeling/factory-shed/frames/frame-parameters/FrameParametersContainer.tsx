import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../../store";
import { changeOFUIAction, addEventAction } from "../../../../../../store/ui/actions";
import { getElementByName, getCurrentUI } from "../../../../../3d-models/utils";
import { changeModel } from "../../../../../../store/main/actions";
import { ColumnRelocation } from "./ColumnRelocation";
import { FrameParameters } from "./FramesParameters";
import { OpenFrameUI } from "../../../../../../store/ui/types";
import { TOpenFrame } from "../../../../../../store/main/openFrameTypes";

export function FrameParametersContainer() {
  const [tab, setTab] = useState<"OFP" | "CR">("OFP");

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);
  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const dispatch = useDispatch();

  function handleChangeUI(ui: OpenFrameUI) {
    dispatch(changeOFUIAction(ui));
  }

  function handleChangeModel(model: TOpenFrame) {
    dispatch(changeModel(model));
  }

  function handleErrorEvent(msg: string) {
    dispatch(addEventAction(msg, "danger"));
  }

  function getTab(tab: "OFP" | "CR") {
    if (tab === "CR") {
      return (
        <ColumnRelocation
          project={project}
          openFrameUI={openFrameUI}
          setTab={setTab}
          onChangeUI={handleChangeUI}
          onChagneModel={handleChangeModel}
          onError={handleErrorEvent}
        />
      );
    } else {
      return (
        <FrameParameters
          project={project}
          openFrameUI={openFrameUI}
          setTab={setTab}
          onChangeUI={handleChangeUI}
          onChagneModel={handleChangeModel}
          onError={handleErrorEvent}
        />
      );
    }
  }

  return getTab(tab);
}
