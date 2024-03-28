import React, { useMemo } from "react";
import MenuBar from "../components/menu-bar/MenuBar";
import WorkField from "../components/work-field/WorkField";
import Footer from "../components/footer/Footer";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../store";
import { ConfirmDlg } from "../components/common/ConfirmDlg";
import { confirmAction, secondConfirmAction } from "../store/ui/actions";
import { getCurrentUI, getCurrentProject } from "../components/3d-models/utils";
import { ProcessToolBar } from "../components/process/ProcessToolBar";
import { usePipeRack } from "../components/common/hooks/usePipeRack";
import { useOpenFrame } from "../components/common/hooks/useOpenFrame";
import { usePiping } from "../components/common/hooks/usePiping";
import PipesContainer from "../components/3d-models/pipes/PipesContainer";
/*import CablesContainer from "../components/3d-models/cables/CablesContainer";*/
import Selections from "../components/work-field/selections/Selections";
import OpenFramesContainer from "../components/3d-models/open-frame/OpenFramesContainer";
import PipeRackContainer from "../components/3d-models/pipe-rack/PipeRackContainer";
import { SimplePipeDetails } from "../components/process/SimplePipeDetails";
import { SimpleFlangeDetails } from "../components/process/SimpleFlangeDetails";
import FlareContainer from "../components/3d-models/flare/FlareContainer";
import FactoryShedsContainer from "../components/3d-models/factory-shed/FactoryShedsContainer";
import ODSSContainer from "../components/3d-models/odss/ODSSContainer";
import OFCreationBar from "../components/menu-bar/3d-modeling/open-frame/creation-bar/CreationBar";
import { SimpleConnectionDetails } from "../components/process/SimpleConnectionDetails";

export function Editor() {
  const main = useSelector((state: ApplicationState) => state.main);
  const ui = useSelector((state: ApplicationState) => state.ui);
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );
  const confirm = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.confirm
  );
  const confirm_s = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.confirm_s
  );
  const data = useSelector((state: ApplicationState) => state.data);

  const mode = useSelector((state: ApplicationState) => state.main.workMode);

  const dispatch = useDispatch();

  const statePR = usePipeRack(main, dispatch);
  const stateOF = useOpenFrame(main, ui, dispatch);
  const statePP = usePiping(main, ui, dispatch);

  const neProjects = useMemo(() => {
    return project?.notEditableProjects ?? [];
  }, [project]);

  return (
    <>
      {confirm ? (
        <ConfirmDlg
          message={confirm.message}
          onConfirm={() => {
            confirm.onConfirm();
            dispatch(confirmAction());
          }}
          onCancel={() => {
            confirm.onCancel && confirm.onCancel();
            dispatch(confirmAction());
          }}
        />
      ) : null}
      {confirm_s ? (
        <ConfirmDlg
          message={confirm_s.message}
          onConfirm={() => {
            confirm_s.onConfirm();
            dispatch(secondConfirmAction());
          }}
          onCancel={() => {
            confirm_s.onCancel && confirm_s.onCancel();
            dispatch(secondConfirmAction());
          }}
        />
      ) : null}
      <MenuBar />
      <WorkField workMode={mode} data={data} />
      {mode === "PROCESS" || mode === "DESIGNER" || mode === "PRODESIGNER" || mode === "PIPDESIGNER" ? <ProcessToolBar /> : null}
      {["STRUCTURE", "DESIGNER", "STRDESIGNER"].includes(mode) &&
      project?.models.some((m) =>
        ["Open Frame", "Pipe Rack"].includes(m.type)
      ) ? (
        <OFCreationBar />
      ) : null}
      {mode === "DESIGNER" || mode === "PIPDESIGNER"? ( //Trial Mode
        <>
          <SimplePipeDetails />
          <SimpleFlangeDetails />
          <SimpleConnectionDetails />
        </>
      ) : null}
      {project ? (
        <>
          <PipesContainer project={project} data={data} />
          {/*<CablesContainer project={project} data={data}/>*/}
          <FlareContainer project={project} data={data} />
          <PipeRackContainer project={project} data={data} />
          <OpenFramesContainer project={project} data={data} />
          <FactoryShedsContainer project={project} data={data} />
          <ODSSContainer />
        </>
      ) : null}
      {neProjects.map((nep) => {
        return (
          <>
            <PipesContainer project={nep} data={data} />
            {/*<CablesContainer project={nep} data={data}/>*/}
            <FlareContainer project={nep} data={data} />
            <PipeRackContainer project={nep} data={data} />
            <OpenFramesContainer project={nep} data={data} />
            <FactoryShedsContainer project={nep} data={data} />
          </>
        );
      })}
      <Selections />
      <Footer />
    </>
  );
}
