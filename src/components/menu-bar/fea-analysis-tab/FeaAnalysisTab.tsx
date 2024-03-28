import React, { FunctionComponent, useState } from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import { getCurrentProject } from "../../3d-models/utils";
import MenuButton from "../MenuButton";
import { LSAGeometryDlg } from "./modals/LSAGeometryDlg";
import { LSAViewer } from "./modals/LSAViewer";

type OwnProps = {};

type Props = OwnProps;

const MODALS = {
  LSAGeometry: "LSAGeometry",
  LSAViewer: "LSAViewer",
};

const FeaAnalysisTab: FunctionComponent<Props> = () => {
  const [modals, setModals] = useState<{ [key: string]: boolean }>({});

  const mode = useSelector((state: ApplicationState) => state.main.workMode);
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  function handleOpenLSAGeometry() {
    if (!project) return;
    setModals((prev) => ({ ...prev, [MODALS.LSAGeometry]: true }));
  }

  function handleOpenLSAViewer() {
    setModals((prev) => ({ ...prev, [MODALS.LSAViewer]: true }));
  }

  function handleCloseModal(key: string) {
    setModals((prev) => ({ ...prev, [key]: false }));
  }

  return (
    <div className="d-flex">
      {mode === "PIPING" || mode === "DESIGNER" ? (
        <>
          <MenuButton text="LSA Geometry" onClick={handleOpenLSAGeometry} />
          <MenuButton text="LSA Viewer" onClick={handleOpenLSAViewer} />
          {project && modals[MODALS.LSAGeometry] ? (
            <LSAGeometryDlg
              project={project}
              LCs={project.pipeLoadings.loadCombinations.loads ?? []}
              onClose={() => handleCloseModal(MODALS.LSAGeometry)}
            />
          ) : null}
          {project && modals[MODALS.LSAViewer] ? (
            <LSAViewer onClose={() => handleCloseModal(MODALS.LSAViewer)} />
          ) : null}
        </>
      ) : null}
      {mode !== "PIPING" ? (
        <>
          <MenuButton text="FEA Inlet Nozzle" disabled={true} />
          <MenuButton text="FEA Stiffeners" disabled={true} />
          <MenuButton text="FEA KMI Flare Tip" disabled={true} />
          <MenuButton text="FEA Guy wire Lug" disabled={true} />
          <MenuButton text="Lifting Lug" disabled={true} />
          <MenuButton text="FEA Trunnions" disabled={true} />
        </>
      ) : null}
    </div>
  );
};

export default FeaAnalysisTab;
