import React, { FunctionComponent, useState, useMemo } from "react";
import MenuButton from "../MenuButton";
import DeadLoad from "./pipe-rack/dead-load/DeadLoad";
import LiveLoad from "./pipe-rack/live-load/LiveLoad";
import TempLoad from "./pipe-rack/temp-load/TempLoad";
import { Popover } from "@blueprintjs/core";
import PipingLoadSubgroup from "./PipingLoadSubgroup";
import DirectLoads from "./pipe-rack/piping-and-equipment-load/DirectLoads";
import EquipmentLoads from "./pipe-rack/piping-and-equipment-load/EquipmentLoads";
import BlanketLoads from "./pipe-rack/piping-and-equipment-load/BlanketLoad";
import WindLoad from "./pipe-rack/wind-load/WindLoad";
import SeismicLoad from "./pipe-rack/seismic-load/SeismicLoad";
import LoadComb from "./pipe-rack/load-comb/LoadComb";
import { Project } from "../../../store/main/types";
import { DeadLoadsOF } from "./open-frame/dead-load/DeadLoads";
import { LiveLoadsOF } from "./open-frame/live-load/LiveLoads";
import { TempLoadOF } from "./open-frame/temp-load/TempLoad";
import { DirectLoadsOF } from "./open-frame/piping-and-equipment-load/DirectLoads";
import { BlanketLoadsOF } from "./open-frame/piping-and-equipment-load/BlanketLoads";
import { EquipmentLoadsOF } from "./open-frame/piping-and-equipment-load/EquipmentLoads";
import { WindLoadOF } from "./open-frame/wind-load/WindLoads";
import { SeismicLoadOF } from "./open-frame/seismic-load/SeismicLoad";
import { LoadCombOF } from "./open-frame/load-comb/LoadComb";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import { LoadCombPP } from "./pipes/load-comb/LoadComb";
import { DeadLoadPP } from "./pipes/dead-load/DeadLoad";
import { SlugLoadPP } from "./pipes/slug-load/SlugLoad";
import { WindLoadPP } from "./pipes/wind-load/WindLoads";
import { SeismicLoadPP } from "./pipes/seismic-load/SeismicLoad";
import { LoadCombToStructurePP } from "./pipes/load-comb/LoadCombToStructure";
import { DeadLoadsFS } from "./factory-shed/dead-load/DeadLoads";
import { LiveLoadsFS } from "./factory-shed/live-load/LiveLoads";
import { TempLoadFS } from "./factory-shed/temp-load/TempLoad";
import { DirectLoadsFS } from "./factory-shed/piping-and-equipment-load/DirectLoads";
import { BlanketLoadsFS } from "./factory-shed/piping-and-equipment-load/BlanketLoads";
import { EquipmentLoadsFS } from "./factory-shed/piping-and-equipment-load/EquipmentLoads";
import { WindLoadFS } from "./factory-shed/wind-load/WindLoads";
import { SeismicLoadFS } from "./factory-shed/seismic-load/SeismicLoad";
import { LoadCombFS } from "./factory-shed/load-comb/LoadComb";
// import { changeProjectModeAction } from "../../../store/main/actions";

type Props = {
  project: Project | undefined;
};

const LoadingTab: FunctionComponent<Props> = ({ project }) => {
  const [dialog, setDialog] = useState<JSX.Element>();

  const mode = useSelector((state: ApplicationState) => state.main.workMode);

  // const dispatch = useDispatch();

  const isPR = useMemo(() => {
    if (!project || mode !== "STRUCTURE") return false;
    return project.modelType === "Pipe Rack";
  }, [project]);

  const isOF = useMemo(() => {
    if (!project || mode !== "STRUCTURE") return false;
    return project.modelType === "Open Frame";
  }, [project]);

  const isFS = useMemo(() => {
    if (!project || mode !== "STRUCTURE") return false;
    return project.modelType === "Factory Shed";
  }, [project]);

  // useEffect(() => {
  //   if (project && project.mode !== "standard") {
  //     dispatch(changeProjectModeAction(project.name, "standard"));
  //     return;
  //   }
  // }, []);

  return (
    <>
      {dialog}
      <div className="d-flex">
        {mode === "STRUCTURE" ? (
          <>
            <Popover
              interactionKind={"click"}
              disabled={!isPR}
              content={
                <div className="d-flex p-5">
                  <MenuButton
                    text="Dead Load"
                    onClick={() => setDialog(<DeadLoad onClose={() => setDialog(undefined)} />)}
                  />
                  <MenuButton
                    text="Live Load"
                    onClick={() => setDialog(<LiveLoad onClose={() => setDialog(undefined)} />)}
                  />
                  <MenuButton
                    text="Temp. Load"
                    onClick={() => setDialog(<TempLoad onClose={() => setDialog(undefined)} />)}
                  />
                  <Popover
                    interactionKind={"click"}
                    content={
                      <PipingLoadSubgroup
                        onSelect={(value) => {
                          value === "Direct Load" &&
                            setDialog(<DirectLoads onClose={() => setDialog(undefined)} />);
                          value === "Blanket Load" &&
                            setDialog(<BlanketLoads onClose={() => setDialog(undefined)} />);
                        }}
                      />
                    }
                    position="bottom-right"
                  >
                    <MenuButton text="Piping Load" />
                  </Popover>
                  <MenuButton
                    text="Equipment Load"
                    onClick={() =>
                      setDialog(<EquipmentLoads onClose={() => setDialog(undefined)} />)
                    }
                  />
                  <MenuButton
                    text="Wind Load"
                    onClick={() =>
                      setDialog(<WindLoad project={project} onClose={() => setDialog(undefined)} />)
                    }
                  />
                  <MenuButton
                    text="Seismic Load"
                    onClick={() => setDialog(<SeismicLoad onClose={() => setDialog(undefined)} />)}
                  />
                  <MenuButton
                    text="Load Comb"
                    onClick={() => setDialog(<LoadComb onClose={() => setDialog(undefined)} />)}
                  />
                </div>
              }
              position="bottom-right"
            >
              <MenuButton id="pipe-rack-load" text="Pipe Rack" disabled={!isPR} />
            </Popover>
            <Popover
              interactionKind={"click"}
              disabled={!isOF}
              content={
                <div className={"d-flex p-5"}>
                  <MenuButton
                    text="Dead Load"
                    onClick={() => {
                      setDialog(<DeadLoadsOF onClose={() => setDialog(undefined)} />);
                    }}
                  />
                  <MenuButton
                    text="Live Load"
                    onClick={() => {
                      setDialog(<LiveLoadsOF onClose={() => setDialog(undefined)} />);
                    }}
                  />
                  <MenuButton
                    text="Temp. Load"
                    onClick={() => {
                      setDialog(<TempLoadOF onClose={() => setDialog(undefined)} />);
                    }}
                  />
                  <Popover
                    interactionKind={"click"}
                    content={
                      <PipingLoadSubgroup
                        onSelect={(value) => {
                          value === "Direct Load" &&
                            setDialog(<DirectLoadsOF onClose={() => setDialog(undefined)} />);
                          value === "Blanket Load" &&
                            setDialog(<BlanketLoadsOF onClose={() => setDialog(undefined)} />);
                        }}
                      />
                    }
                    position="bottom-right"
                  >
                    <MenuButton text="Piping Load" />
                  </Popover>
                  <MenuButton
                    text="Equipment Load"
                    onClick={() => {
                      setDialog(<EquipmentLoadsOF onClose={() => setDialog(undefined)} />);
                    }}
                  />
                  <MenuButton
                    text="Wind Load"
                    onClick={() => {
                      setDialog(<WindLoadOF onClose={() => setDialog(undefined)} />);
                    }}
                  />
                  <MenuButton
                    text="Seismic Load"
                    onClick={() => {
                      setDialog(<SeismicLoadOF onClose={() => setDialog(undefined)} />);
                    }}
                  />
                  <MenuButton
                    text="Load Comb"
                    onClick={() => {
                      setDialog(<LoadCombOF onClose={() => setDialog(undefined)} />);
                    }}
                  />
                </div>
              }
              position="bottom-right"
            >
              <MenuButton id="open-frame-load" text="Open Frame" disabled={!isOF} />
            </Popover>
            <Popover
              interactionKind={"click"}
              disabled={!isFS}
              content={
                <div className={"d-flex p-5"}>
                  <MenuButton
                    text="Dead Load"
                    onClick={() => {
                      setDialog(<DeadLoadsFS onClose={() => setDialog(undefined)} />);
                    }}
                  />
                  <MenuButton
                    text="Live Load"
                    onClick={() => {
                      setDialog(<LiveLoadsFS onClose={() => setDialog(undefined)} />);
                    }}
                  />
                  <MenuButton
                    text="Temp. Load"
                    onClick={() => {
                      setDialog(<TempLoadFS onClose={() => setDialog(undefined)} />);
                    }}
                  />
                  <Popover
                    interactionKind={"click"}
                    content={
                      <PipingLoadSubgroup
                        onSelect={(value) => {
                          value === "Direct Load" &&
                            setDialog(<DirectLoadsFS onClose={() => setDialog(undefined)} />);
                          value === "Blanket Load" &&
                            setDialog(<BlanketLoadsFS onClose={() => setDialog(undefined)} />);
                        }}
                      />
                    }
                    position="bottom-right"
                  >
                    <MenuButton text="Piping Load" />
                  </Popover>
                  <MenuButton
                    text="Equipment Load"
                    onClick={() => {
                      setDialog(<EquipmentLoadsFS onClose={() => setDialog(undefined)} />);
                    }}
                  />
                  <MenuButton
                    text="Wind Load"
                    onClick={() => {
                      setDialog(<WindLoadFS onClose={() => setDialog(undefined)} />);
                    }}
                  />
                  <MenuButton
                    text="Seismic Load"
                    onClick={() => {
                      setDialog(<SeismicLoadFS onClose={() => setDialog(undefined)} />);
                    }}
                  />
                  <MenuButton
                    text="Load Comb"
                    onClick={() => {
                      setDialog(<LoadCombFS onClose={() => setDialog(undefined)} />);
                    }}
                  />
                </div>
              }
              position="bottom-right"
            >
              <MenuButton id="factory-shed-load" text="Factory Shed" disabled={!isFS} />
            </Popover>
          </>
        ) : null}

        {mode === "PIPING" ? (
          <Popover
            interactionKind={"click"}
            content={
              <div className={"d-flex p-5"}>
                <MenuButton
                  text="Dead Load"
                  onClick={() => {
                    setDialog(<DeadLoadPP onClose={() => setDialog(undefined)} />);
                  }}
                />
                <MenuButton
                  text="Slug Load"
                  onClick={() => {
                    setDialog(<SlugLoadPP onClose={() => setDialog(undefined)} />);
                  }}
                />
                <MenuButton
                  text="Wind Load"
                  onClick={() => {
                    setDialog(<WindLoadPP onClose={() => setDialog(undefined)} />);
                  }}
                />
                <MenuButton
                  text="Seismic Load"
                  onClick={() => {
                    setDialog(<SeismicLoadPP onClose={() => setDialog(undefined)} />);
                  }}
                />
                <MenuButton
                  text="Load Comb"
                  onClick={() => {
                    setDialog(<LoadCombPP onClose={() => setDialog(undefined)} />);
                  }}
                />
                <MenuButton
                  text="Load Transfer To Structure"
                  onClick={() =>
                    setDialog(<LoadCombToStructurePP onClose={() => setDialog(undefined)} />)
                  }
                />
              </div>
            }
            position="bottom-right"
          >
            <MenuButton id="load-pipes-button" text="Pipes" />
          </Popover>
        ) : null}
      </div>
    </>
  );
};

export default LoadingTab;
