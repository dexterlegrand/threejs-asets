import React, { FunctionComponent, useState, useMemo, useEffect } from "react";
import MenuButton from "../MenuButton";
import {
  faCropAlt,
  faCubes,
  faFlask,
  faGopuram,
} from "@fortawesome/free-solid-svg-icons";
import PipeRackDlg from "./pipe-rack/PipeRackDlg";
import OpenFramesDlg from "./open-frame/OpenFramesDlg";
import FactoryShedDlg from "./factory-shed/FactoryShedDlg";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import { confirmAction } from "../../../store/ui/actions";
import { DesignDataModeling } from "../analysis-tab/piping/DesignDataModeling";
/*import { CablesDataModeling } from "../analysis-tab/cables/CablesDataModeling";*/
import { Popover } from "@blueprintjs/core";
import { baseUrl } from "../../../store/main/constants";
import ClashCheck from "./clash-check/ClashCheck";
import ProductSortingSimulationDlg from "./product-sorting-simulation/ProductSortingSimulationDlg";
import { LinesSyncMTO } from "./MTO/pipe/LinesSyncMTO";
import { AccessoriesSyncMTO } from "./MTO/pipe/AccessoriesSyncMTO";
import FlareDlg from "./flare/FlareDlg";
import PRSectionsSyncMTO from "./MTO/pipe-rack/PRSectionsSyncMTO";
import OFSectionsSyncMTO from "./MTO/open-frame/OFSectionsSyncMTO";
import FlareMTO from "./MTO/flare/FlareSyncMTO";
import { useRecoilState } from "recoil";
import { beamConnections } from "../../../recoil/atoms/beam-connections-atom";
import ToolBar from "./beam-connections/ToolBar";
import ODSSDlg from "./odss/ODSSDlg";
import InstrumentandEquipment from "./Instrumentandequipment";
import { EquipmentDatasheetDlg } from "../ga-drawings-tab/equipmentDatasheetDlg";
import RoadDlg from "./road/RoadDlg";

type DIALOG =
  | "FLARE"
  | "PR"
  | "OF"
  | "ODSS"
  | "FS"
  | "PSS"
  | "DDM"
  | "CC"
  | "LSMTO"
  | "ASMTO"
  | "FMTO"
  | "PRSSMTO"
  | "OFSSMTO"
  | "ROAD"
  | "EqpData";
/*"CABLES";*/

const ModelingTab: FunctionComponent = () => {
  const [dlg, setDlg] = useState<DIALOG>();

  const products = useSelector(
    (state: ApplicationState) => state.main.products ?? []
  );

  const mode = useSelector((state: ApplicationState) => state.main.workMode);

  const modelType = useSelector(
    (state: ApplicationState) =>
      state.main.projects.find(
        (project) => project.name === state.main.currentProject
      )?.modelType
  );

  const dispatch = useDispatch();

  const [BCS, setBCS] = useRecoilState(beamConnections);


  function handleEquipmentDatasheetClick() {
      setDlg("EqpData");
  }

  useEffect(() => {
    if (BCS.type === "ODSM" && BCS.item) handleOpenFrameClick();
  }, [BCS.type, BCS.item]);

  const isProduction = useMemo(() => {
    return process.env.NODE_ENV === "production";
  }, []);

  function handleFlareClick() {
    if (mode === "DESIGNER" || !modelType || modelType === "Flare") {
      setDlg("FLARE");
    }
  }

  function handlePipeRackClick() {
    if (mode === "DESIGNER" || !modelType || modelType === "Pipe Rack") {
      setDlg("PR");
    }
  }

  function handleOpenFrameClick() {
    if (mode === "DESIGNER" || !modelType || modelType === "Open Frame") {
      setDlg("OF");
    }
  }

  function handleOpenBeamConnections(
    type: "ODSM" | "ODSS",
    subtype: "Bolted" | "Welded"
  ) {
    setBCS({ type, subtype });
  }

  function handleFactoryShedClick() {
    if (mode === "DESIGNER" || !modelType || modelType === "Factory Shed") {
      setDlg("FS");
    }
  }

  function handlePSSClick() {
    setDlg("PSS");
  }

  function handleCloseDlg() {
    setDlg(undefined);
  }

  function invokeSimCentral() {
    window.open("https://remotedesktop.google.com/access/", "_blank");
  }

  function drawPopower( //Trial Mode
    content: JSX.Element | JSX.Element[],
    target: JSX.Element,
    isDisabled?: boolean
  ) {
    return (
      <Popover
        key={`popover-${target.props.text}`}
        position={"bottom"}
        interactionKind={"click"}
        disabled={isDisabled}
        content={<div className="menu-bar-subgroup">{content}</div>}
        target={target}
      />
    );
  }

  

  function handleRedirect(url: string, message: string, ifCorrect?: () => any) {
    if (isProduction && baseUrl !== url) {
      dispatch(
        confirmAction({
          message,
          onConfirm: () => (window.location.href = url),
        })
      );
    } else ifCorrect && ifCorrect();
  }

  return (
    <div className="d-flex">
      {dlg === "FLARE" ? <FlareDlg onClose={handleCloseDlg} /> : null}
      {dlg === "PR" ? <PipeRackDlg onClose={handleCloseDlg} /> : null}
      {dlg === "OF" ? <OpenFramesDlg onClose={handleCloseDlg} /> : null}
      {dlg === "ODSS" ? <ODSSDlg onClose={handleCloseDlg} /> : null}
      {dlg === "FS" ? <FactoryShedDlg onClose={handleCloseDlg} /> : null}
      {dlg === "PSS" ? (
        <ProductSortingSimulationDlg onClose={handleCloseDlg} />
      ) : null}
      {dlg === "ROAD" ? <RoadDlg onClose={handleCloseDlg} /> : null}
      {dlg === "DDM" ? <DesignDataModeling onClose={handleCloseDlg} /> : null}
      {/*{dlg === "CABLES" ? <CablesDataModeling onClose={handleCloseDlg} /> : null}*/}
      {dlg === "CC" ? <ClashCheck onClose={handleCloseDlg} /> : null}
      {dlg === "LSMTO" ? <LinesSyncMTO onClose={handleCloseDlg} /> : null}
      {dlg === "ASMTO" ? <AccessoriesSyncMTO onClose={handleCloseDlg} /> : null}
      {dlg === "FMTO" ? <FlareMTO onClose={handleCloseDlg} /> : null}
      {dlg === "PRSSMTO" ? (
        <PRSectionsSyncMTO onClose={handleCloseDlg} />
      ) : null}
      {dlg === "OFSSMTO" ? (
        <OFSectionsSyncMTO onClose={handleCloseDlg} />
      ) : null}
      {BCS.type ? <ToolBar /> : null}
      {/*{["PROCESS"].includes(mode) ? (
        <MenuButton text="SimCentral" onClick={invokeSimCentral} />
      ) : null}*/}

    {dlg === "EqpData" ? <EquipmentDatasheetDlg isVisible={dlg === "EqpData"} onClose={handleCloseDlg} /> : null}

     {["DESIGNER"].includes(mode) ? (
      <MenuButton
        text="Equipment Data Sheet"
        onClick={() => setDlg("EqpData")}
      />
     ): null}

      {["PRODESIGNER","PIPDESIGNER"].includes(mode) ? ( //Trial Mode
        <MenuButton
          id="piping-modeling-button"
          text="Piping"
          onClick={() => setDlg("DDM")}
        />

      ) : null}

      {["PIPDESIGNER"].includes(mode) ? (
        <Popover
        interactionKind={"click"}
        position={"bottom"}
        content={
          <div className="menu-bar-subgroup">
            <Popover
              interactionKind={"click"}
              position={"bottom"}
              content={
                <div className="menu-bar-subgroup">
                  <MenuButton
                    text="Lines"
                    onClick={() => setDlg("LSMTO")}
                  />
                  <MenuButton
                    text="Accessories"
                    onClick={() => setDlg("ASMTO")}
                  />
                </div>
              }
              target={<MenuButton text="Pipe" />}
            />
        </div>
        }
        target={<MenuButton text="MTO" />}
        />
      ) : null}


      {["PIPING", "DESIGNER"].includes(mode) ? (
        <MenuButton
          id="piping-modeling-button"
          text="Piping"
          //disabled={isProduction && !products.includes("Pipe")}
          onClick={() => setDlg("DDM")}
        />
      ) : null}

      {["STRUCTURE", "DESIGNER", "STRDESIGNER"].includes(mode) ? (
        <>
          {/*<MenuButton
            text="Flare"
            id="flare-modeling-button"
            icon={faFlask}
            // disabled={isProduction && !products.includes("flare")}
            onClick={() => {
              // handleRedirect(
              //   // `${flareAPI}/`,
              //   `${piperackAPI}/`,
              //   `Are you sure you want to go to the "Flare" project?`,
              handleFlareClick();
              // );
            }}
          />
          <MenuButton
          id="derrick-modeling-button"
            text="Derrick Tower"
            icon={faGopuram}
            disabled={true}
            onClick={() => {
              // handleRedirect(
              //   `${towerAPI}/`,
              //   `Are you sure you want to go to the "Derrick Tower" project?`
              // );
            }}
          />*/}
          <MenuButton
            id="pipe-rack-modeling-button"
            text="Pipe Rack"
            icon={faCropAlt}
            // disabled={
            //   isProduction &&
            //   (!products.includes("PR") ||
            //     !["Pipe Rack", "Multi"].includes(modelType || ""))
            // }
            onClick={() => {
              // handleRedirect(
              //   `${piperackAPI}/`,
              //   `Are you sure you want to go to the "Pipe Rack" project?`,
              handlePipeRackClick();
              // );
            }}
          />
          <MenuButton
            id="open-frame-modeling-button"         
            text="Open Frame"
            icon={faCubes}
            // disabled={
            //   isProduction &&
            //   (!products.includes("OF") ||
            //     !["Open Frame", "Multi"].includes(modelType || ""))
            // }
            onClick={() => {
              // handleRedirect(
              //   `${openframeAPI}/`,
              //   `Are you sure you want to go to the "Open Frame" project?`,
              handleOpenFrameClick();
              // );
            }}
          />
          <MenuButton
            text="Factory Shed"
            id="factory-shed-modeling-button"
            icon={faCubes}
            // disabled={
            //   !products.includes("OF") ||
            //   !["Factory Shed", "Multi"].includes(modelType || "") ||
            //   isProd
            // }
            onClick={() => {
              // handleRedirect(
              // "http://openframe.asetslux.com/",
              // `Are you sure you want to go to the "Open Frame" project?`,
              handleFactoryShedClick();
              // );
            }}
          />
          <MenuButton
            text={"Product sorting simulation"}
            onClick={() => handlePSSClick()}
          />
          <Popover
            interactionKind={"click"}
            position={"bottom"}
            content={
              <div className="menu-bar-subgroup">
                <MenuButton text="Shape" disabled={true} />
                <MenuButton text="Member" disabled={true} />
              </div>
            }
            target={<MenuButton text="Optimizer" />}
          />
        </>
      ) : null}

      {(mode === "PROCESS")? (
        <InstrumentandEquipment/>
      ): null}

      {(mode !== "PROCESS" && mode !== "PRODESIGNER" && mode !=="PIPDESIGNER" && mode !== "STRDESIGNER") ? (
        <>
          <MenuButton id="clash-check-modeling-button" text="Clash Check" onClick={() => setDlg("CC")} />
          <Popover
            interactionKind={"click"}
            position={"bottom"}
            content={
              <div className="menu-bar-subgroup">
                <Popover
                  interactionKind={"click"}
                  position={"bottom"}
                  content={
                    <div className="menu-bar-subgroup">
                      <MenuButton
                        text="Lines"
                        onClick={() => setDlg("LSMTO")}
                      />
                      <MenuButton
                        text="Accessories"
                        onClick={() => setDlg("ASMTO")}
                      />
                    </div>
                  }
                  target={<MenuButton id="mto-modeling-pipe-button" text="Pipe" />}
                />
                {/*<MenuButton id="mto-modeling-flare-button" text="Flare" onClick={() => setDlg("FMTO")} />
                <MenuButton id="mto-modeling-derrick-button" text="Derrick Tower" disabled={true} />*/}
                <MenuButton
                id="mto-modeling-pipe-rack-button"
                  text="Pipe Rack"
                  onClick={() => setDlg("PRSSMTO")}
                />
                <MenuButton
                id="mto-modeling-open-frame-button"
                  text="Open Frame"
                  onClick={() => setDlg("OFSSMTO")}
                />
              </div>
            }
            target={<MenuButton id="mto-modeling-main-button" text="MTO" />}
          />
          <Popover
            interactionKind={"click"}
            position={"bottom"}
            content={
              <div className="menu-bar-subgroup">
                <Popover
                  interactionKind={"click"}
                  position={"bottom"}
                  content={
                    <div className="menu-bar-subgroup">
                      <MenuButton
                        text="ODSM"
                        onClick={() => {
                          handleOpenBeamConnections("ODSM", "Bolted");
                        }}
                      />
                      <MenuButton
                        text="ODSS"
                        onClick={() => {
                          handleOpenBeamConnections("ODSS", "Bolted");
                        }}
                      />
                    </div>
                  }
                  target={<MenuButton text="Bolted" />}
                />
                <Popover
                  interactionKind={"click"}
                  position={"bottom"}
                  content={
                    <div className="menu-bar-subgroup">
                      <MenuButton
                        text="ODSM"
                        onClick={() => {
                          handleOpenBeamConnections("ODSM", "Welded");
                        }}
                      />
                      <MenuButton
                        text="ODSS"
                        onClick={() => {
                          handleOpenBeamConnections("ODSS", "Welded");
                        }}
                      />
                    </div>
                  }
                  target={<MenuButton text="Welded" />}
                />
              </div>
            }
            target={<MenuButton text="Connections" />}
          />
          <MenuButton text="ODSS" onClick={() => setDlg("ODSS")} />
          {/*<MenuButton text="Cables" onClick={() => setDlg("CABLES")} />*/}
          <MenuButton text="Road" onClick={() => setDlg("ROAD")} />
        </>
      ) : null}
    </div>
  );
};

export default ModelingTab;
