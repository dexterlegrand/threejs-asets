import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../../store";
import {
  changeOFUIAction,
  addEventAction,
} from "../../../../../../store/ui/actions";
import { getElementByName, getCurrentUI } from "../../../../../3d-models/utils";
import { changeModel } from "../../../../../../store/main/actions";
import { ColumnRelocation } from "./ColumnRelocation";
import FrameParameters from "./FramesParameters";
import { OpenFrameUI } from "../../../../../../store/ui/types";
import { TOpenFrame } from "../../../../../../store/main/openFrameTypes";

export function FrameParametersContainer() {
  const [tab, setTab] = useState<"OFP" | "CR">("OFP");

  const openFrameUI = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.openFrameUI
  );
  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const dispatch = useDispatch();

  const handleChangeUI = useCallback((ui: OpenFrameUI) => {
    dispatch(changeOFUIAction(ui));
  }, []);

  const handleChangeModel = useCallback((model: TOpenFrame) => {
    dispatch(changeModel(model));
  }, []);

  const handleErrorEvent = useCallback((msg: string) => {
    dispatch(addEventAction(msg, "danger"));
  }, []);

  return tab === "CR" ? (
    <ColumnRelocation
      project={project}
      openFrameUI={openFrameUI}
      setTab={setTab}
      onChangeUI={handleChangeUI}
      onChagneModel={handleChangeModel}
      onError={handleErrorEvent}
    />
  ) : (
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
