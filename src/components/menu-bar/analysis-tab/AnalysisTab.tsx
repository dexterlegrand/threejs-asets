import React, { FunctionComponent, useState, useMemo } from "react";
import MenuButton from "../MenuButton";
import { Menu, MenuItem, Popover } from "@blueprintjs/core";
import { ReportDlg } from "./pipe-rack/reports/ReportsDlg";
import { MaterialTakeOff } from "./pipe-rack/reports/MaterialTakeOffDlg";
import { MaterialTakeOffOF } from "./open-frame/reports/MaterialTakeOffDlg";
import { DesignCodeAndParameters } from "./pipe-rack/design-code-and-parameters/DesignCodeAndParameters";
import { useDispatch, useSelector } from "react-redux";
import {
  getAndMapReports,
  getAndMapReportsOF,
  importOFReports,
} from "../../../store/main/actions";
import { ApplicationState } from "../../../store";
import { Project, PipeRack, ModelType } from "../../../store/main/types";
import { getJSONForDesignCodesAndParameters } from "../../3d-models/designCodeAndParameters";
import axios from "axios";
import { saveAs } from "file-saver";
import { addEventAction } from "../../../store/ui/actions";
import { DesignCodeAndParametersOF } from "./open-frame/design-code-and-parameters/DesignCodeAndParameters";
import { ReportDlgOF } from "./open-frame/reports/ReportsDlg";
import { TOpenFrame } from "../../../store/main/openFrameTypes";
import { getJSONForDesignCodesAndParametersOF } from "../../3d-models/designCodeAndParametersOF";
import { ProjectUI } from "../../../store/ui/types";
import { Optimizer } from "./optimizer/Optimizer";
import {
  getCurrentUI,
  getCurrentProject,
  getUnicuesArray,
} from "../../3d-models/utils";
import { baseUrl } from "../../../store/main/constants";
import { EnergyBalance } from "./process/EnergyBalance";
import { HeatExchanger } from "./process/equipments/HeatExchanger";
import { Hydraulics } from "./process/Hydraulics";
import { PumpSizing } from "./process/equipments/PumpSizing";
import { ControlValves } from "./process/instruments/ControlValves";
import { Controllers } from "./process/instruments/Controllers";
import { ReportDlgFS } from "./factory-shed/reports/ReportsDlg";
import { MaterialTakeOffFS } from "./factory-shed/reports/MaterialTakeOffDlg";
import { DesignCodeAndParametersFS } from "./factory-shed/design-code-and-parameters/DesignCodeAndParameters";
import { EProcessElementType } from "../../../store/process/types";
import { SourceAndSink } from "./process/equipments/SourceAndSink";
import { MixAndSplit } from "./process/equipments/MixAndSplit";
import { HeaderSummary } from "./process/equipments/HeaderSummary";
import { DrumSummary } from "./process/equipments/DrumSummary";
import { SeparatorSummary } from "./process/equipments/SeparatorSummary";
import { CompressorSummary } from "./process/equipments/CompressorSummary";
import { PFRSummary } from "./process/equipments/PFRSummary";
import { RESummary } from "./process/equipments/RESummary";
import { DistillationColumnSummary } from "./process/equipments/DistillationColumnSummary";
import { ExtractorSummary } from "./process/equipments/ExtractorSummary";
import { TankSummary } from "./process/equipments/TankSummary";
import { ExpanderSummary } from "./process/equipments/ExpanderSummary";
import { PSVSummary } from "./process/equipments/PSVSummary";
import { EnlargerSummary } from "./process/equipments/EnlargerSummary";
import { CSTRSummary } from "./process/equipments/CSTRSummary";
import { RCSummary } from "./process/equipments/RCSummary";
import { HeaterAndCooler } from "./process/equipments/HeaterAndCooler";
import { PipingAnalysis } from "./piping/PipingAnalysis";
import { DisplacementComparison } from "./comparisons/DisplacementComparison";
import { ReactionsComparisons } from "./comparisons/ReactionsComparisons";
import { ForcesComparisons } from "./comparisons/ForcesComparisons";
import { DisplacementComparisonStructure } from "./comparisons/DisplacementComparisonStructure";
import { ForcesComparisonStructure } from "./comparisons/ForcesComparisonStructure";
import { ReactionsComparisonStructure } from "./comparisons/ReactionComparisonStructure";
import { PipingOperatingLoadComparisonStructure } from "./comparisons/PipingOperatingLoadComparisonStructure";
import { EquipmentOperatingLoadComparisonStructure } from "./comparisons/EquipmentOperatingLoadComparisonStructure";

type Props = {};

const AnalysisTab: FunctionComponent<Props> = () => {
  const [dlg, setDlg] = useState<JSX.Element>();

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const mode = useSelector((state: ApplicationState) => state.main.workMode);
  const scene = useSelector((state: ApplicationState) => state.main.scene);
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );
  const process = useSelector((state: ApplicationState) => state.process);

  const dispatch = useDispatch();

  const reportsProgress = useMemo(() => ui?.requests?.reports, [ui]);

  function downloadPDF(json: any, type: ModelType) {
    const isPR = type === "Pipe Rack";
    const name = isPR ? json.piperackName : json.openFrameName;
    let url = "";
    if (isPR) {
      switch (project?.loadings.windLoadingAsPerCode) {
        case "IS Code":
          url = `${baseUrl}api/v2/piperack/IS875/report`;
          break;
        case "US Code":
          url = `${baseUrl}api/v2/piperack/asce710/report`;
          break;
        case "Manual":
          url = `${baseUrl}api/v2/piperack/manual/report`;
      }
    } else {
      switch (ui?.openFrameUI.loadingsUI.windLoadUI.windLoadingAsPerCode) {
        case "IS Code":
          url = `${baseUrl}api/v2/openFrame/IS875/report`;
          break;
        case "US Code":
          url = `${baseUrl}api/v2/openFrame/asce710/report`;
          break;
        case "Manual":
          url = `${baseUrl}api/v2/openFrame/manual/report`;
      }
    }
    if (!url) return;
    axios({
      url,
      method: "POST",
      data: json,
      responseType: "blob",
    })
      .then((response) => {
        saveAs(response.data, `${name} report.pdf`);
      })
      .catch((err) => {
        console.error(err);
        dispatch(addEventAction(`${name} report: ${err.message}`, "danger"));
      });
  }

  /*function getDesignAnalysisList(project?: Project) {
    if (!project) return null;
    if (project.modelType === "Pipe Rack") {
      const models = project.models as PipeRack[];
      return models.map((model) => (
        <MenuItem
          key={model.name}
          text={`Get Analysis for ${model.name}`}
          onClick={() =>
            handleGettingReports(project, ui)
          }
        />
      ));
    } else if (
      (project.modelType === "Open Frame" ||
        project.modelType === "Factory Shed") &&
      ui
    ) {
      const models = project.models as TOpenFrame[];
      return models.map((model) => (
        <MenuItem
          key={model.name}
          text={`Get Analysis for Open Frame`}
          onClick={() =>
              handleGettingReports(project, ui)
          }
        />
      ));
    }
  }
*/
  function getDesignReportsList(project?: Project) {
    if (!project) return null;
    if (project.modelType === "Pipe Rack") {
      const models = project.models as PipeRack[];
      return models.map((model) => (
        <MenuItem
          key={model.name}
          text={`Get report for ${model.name}`}
          onClick={() =>
            downloadPDF(
              {
                ...getJSONForDesignCodesAndParameters(
                  scene,
                  project,
                  model,
                  models
                ),
                structuralNaturalFrequency:
                  model.structuralNaturalFrequency ?? 0,
              },
              project.modelType!
            )
          }
        />
      ));
    } else if (
      (project.modelType === "Open Frame" ||
        project.modelType === "Factory Shed") &&
      ui
    ) {
      const models = project.models as TOpenFrame[];
      return models.map((model) => (
        <MenuItem
          key={model.name}
          text={`Get report for ${model.name}`}
          onClick={() =>
            downloadPDF(
              getJSONForDesignCodesAndParametersOF(
                ui.openFrameUI,
                ui.designCodeAndParametersUI,
                scene,
                project,
                model,
                models
              ),
              project.modelType!
            )
          }
        />
      ));
    }
  }

  function getReportListContent() {
    return (
      <Menu>
        <MenuItem key={0} text={"Analysis"}
          onClick={()=>{
            {handleGettingReports(project,ui)}
          }}
        />
        <MenuItem key={1} text={"Design Report"}>
          <Menu style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {getDesignReportsList(project)}
          </Menu>
        </MenuItem>
        <MenuItem
          key={2}
          text={"Reaction Summary"}
          onClick={() => {
            if (!project) return;
            if (project.modelType === "Pipe Rack") {
              setDlg(<ReportDlg table={1} onClose={handleClose} />);
            } else if (project.modelType === "Open Frame") {
              setDlg(<ReportDlgOF table={1} onClose={handleClose} />);
            } else if (project.modelType === "Factory Shed") {
              setDlg(<ReportDlgFS table={1} onClose={handleClose} />);
            }
          }}
        />
        <MenuItem
          key={3}
          text={"Member End Forces"}
          onClick={() => {
            if (!project) return;
            if (project.modelType === "Pipe Rack") {
              setDlg(<ReportDlg table={2} onClose={handleClose} />);
            } else if (project.modelType === "Open Frame") {
              setDlg(<ReportDlgOF table={2} onClose={handleClose} />);
            } else if (project.modelType === "Factory Shed") {
              setDlg(<ReportDlgFS table={2} onClose={handleClose} />);
            }
          }}
        />
        <MenuItem
          key={4}
          text={"Member Stress Check"}
          onClick={() => {
            if (!project) return;
            if (project.modelType === "Pipe Rack") {
              setDlg(<ReportDlg table={3} onClose={handleClose} />);
            } else if (project.modelType === "Open Frame") {
              setDlg(<ReportDlgOF table={3} onClose={handleClose} />);
            } else if (project.modelType === "Factory Shed") {
              setDlg(<ReportDlgFS table={3} onClose={handleClose} />);
            }
          }}
        />
        <MenuItem
          key={5}
          text={"Node Displacement"}
          onClick={() => {
            if (!project) return;
            if (project.modelType === "Pipe Rack") {
              setDlg(<ReportDlg table={4} onClose={handleClose} />);
            } else if (project.modelType === "Open Frame") {
              setDlg(<ReportDlgOF table={4} onClose={handleClose} />);
            } else if (project.modelType === "Factory Shed") {
              setDlg(<ReportDlgFS table={4} onClose={handleClose} />);
            }
          }}
        />
        <MenuItem
          key={6}
          text={"Deflection Check"}
          onClick={() => {
            if (!project) return;
            if (project.modelType === "Pipe Rack") {
              setDlg(<ReportDlg table={5} onClose={handleClose} />);
            } else if (project.modelType === "Open Frame") {
              setDlg(<ReportDlgOF table={5} onClose={handleClose} />);
            } else if (project.modelType === "Factory Shed") {
              setDlg(<ReportDlgFS table={5} onClose={handleClose} />);
            }
          }}
        />
        <MenuItem
          key={7}
          text={"Base Plate Check"}
          onClick={() => {}}
          disabled={true}
        />
        <MenuItem
          key={8}
          text={"Splice Plate Check"}
          onClick={() => {}}
          disabled={true}
        />
        <MenuItem key={9} text={"Various Material Take of"}>
          <MenuItem
            key={10}
            text={"Material Take Off"}
            onClick={() => {
              if (!project) return;
              if (project.modelType === "Pipe Rack") {
                setDlg(<MaterialTakeOff onClose={handleClose} />);
              } else if (project.modelType === "Open Frame") {
                setDlg(<MaterialTakeOffOF onClose={handleClose} />);
              } else if (project.modelType === "Factory Shed") {
                setDlg(<MaterialTakeOffFS onClose={handleClose} />);
              }
            }}
          />
          <MenuItem
            key={11}
            text={"Platform Area"}
            onClick={() => {}}
            disabled={true}
          />
          <MenuItem
            key={12}
            text={"Paint Area"}
            onClick={() => {}}
            disabled={true}
          />
          <MenuItem
            key={13}
            text={"Handrail Length"}
            onClick={() => {}}
            disabled={true}
          />
          <MenuItem
            key={14}
            text={"Ladder length"}
            onClick={() => {}}
            disabled={true}
          />
          <MenuItem
            key={15}
            text={"Base plate MTO"}
            onClick={() => {}}
            disabled={true}
          />
          <MenuItem
            key={16}
            text={"Splice MTO"}
            onClick={() => {}}
            disabled={true}
          />
          <MenuItem
            key={17}
            text={"Anchor Bolt MTO"}
            onClick={() => {}}
            disabled={true}
          />
          <MenuItem
            key={18}
            text={"Splice Bolt MTO"}
            onClick={() => {}}
            disabled={true}
          />
        </MenuItem>
        { mode === "PIPING" ? (
        <MenuItem key={19} text={"Comparisons"}>
          
          <MenuItem
            key={20}
            text={"Displacement"}
            onClick={() =>
              setDlg(<DisplacementComparison onClose={handleClose} />)
            }
          />
          <MenuItem
            key={21}
            text={"Reactions"}
            onClick={() =>
              setDlg(<ReactionsComparisons onClose={handleClose} />)
            }
          />
          <MenuItem
            key={22}
            text={"Forces"}
            onClick={() => setDlg(<ForcesComparisons onClose={handleClose} />)}
          />
          
        </MenuItem>
        ): null}
         { mode === "STRUCTURE" ? (
        <MenuItem key={19} text={"Comparisons"}>
          
          <MenuItem
            key={20}
            text={"Displacement"}
            onClick={() =>
              setDlg(<DisplacementComparisonStructure onClose={handleClose} />)
            }
          />
          <MenuItem
            key={21}
            text={"Reactions"}
            onClick={() =>
              setDlg(<ReactionsComparisonStructure onClose={handleClose} />)
            }
          />
          <MenuItem
            key={22}
            text={"Forces"}
            onClick={() => setDlg(<ForcesComparisonStructure onClose={handleClose} />)}
          />
          <MenuItem
            key={23}
            text={"Piping Operating Load"}
            onClick={() => setDlg(<PipingOperatingLoadComparisonStructure onClose={handleClose} />)}
          />
          <MenuItem
            key={24}
            text={"Equipment Operating Load"}
            onClick={() => setDlg(<EquipmentOperatingLoadComparisonStructure onClose={handleClose} />)}
          />
          
        </MenuItem>
        ): null}
      </Menu>
    );
  }

  function handleClose() {
    setDlg(undefined);
  }

  function handleGettingReports(project?: Project, ui?: ProjectUI) {
    if (!ui || !project) return;
    if (project.modelType === "Pipe Rack") {
      getAndMapReports(dispatch, project.models as PipeRack[], scene, project);
    } else if (
      (project.modelType === "Open Frame" ||
        project.modelType === "Factory Shed") &&
      ui
    ) {
      getAndMapReportsOF(
        dispatch,
        project.models as TOpenFrame[],
        scene,
        project,
        ui
      );
    }
  }

  function drawBtn(
    key: string | number,
    txt: string,
    disabled?: boolean,
    loading?: boolean,
    onClick?: () => any
  ) {
    return (
      <MenuButton
        id={key+'-'+txt}
        key={key}
        text={txt}
        disabled={disabled}
        loading={loading}
        onClick={onClick}
      />
    );
  }

  function drawMenuItem(
    key: string | number,
    txt: string,
    disabled?: boolean,
    onClick?: () => any,
    content?: JSX.Element | JSX.Element[]
  ) {
    return (
      <MenuItem key={key} text={txt} disabled={disabled} onClick={onClick}>
        {content}
      </MenuItem>
    );
  }

  function drawPopower(
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

  function getProcessEquipments() {
    const equipments = [
      <MenuButton
        key={"p-sizing"}
        text={"Pump Sizing"}
        onClick={() => setDlg(<PumpSizing onClose={handleClose} />)}
      />,
      <MenuButton
        key={"h-exch"}
        text={"Heat Exchangers"}
        onClick={() => setDlg(<HeatExchanger onClose={handleClose} />)}
      />,
      <MenuButton
        key={"f-separator"}
        text={"Flash Separator"}
        onClick={() => {}}
        disabled={true}
      />,
    ];
    if (!project) return equipments;
    const p = process.processes.get(project.name);
    if (!p) return equipments;
    const types = getUnicuesArray(
      Array.from(p.elements.values()).map((e) => e.type)
    );
    let isSourceSink = false;
    let isMixSplit = false;
    let isHeaterCooler = false;
    for (const type of types) {
      switch (type) {
        case EProcessElementType.SOURCE:
        case EProcessElementType.SINK:
          {
            if (isSourceSink) continue;
            equipments.push(
              <MenuButton
                key={"s-s"}
                text={"Source & Sink"}
                onClick={() => setDlg(<SourceAndSink onClose={handleClose} />)}
              />
            );
            isSourceSink = true;
          }
          break;
        case EProcessElementType.MIX:
        case EProcessElementType.SPLIT:
          {
            if (isMixSplit) continue;
            equipments.push(
              <MenuButton
                key={"m-s"}
                text={"Mix & Split"}
                onClick={() => setDlg(<MixAndSplit onClose={handleClose} />)}
              />
            );
            isMixSplit = true;
          }
          break;
        case EProcessElementType.HEATER:
        case EProcessElementType.COOLER:
          {
            if (isHeaterCooler) continue;
            equipments.push(
              <MenuButton
                key={"h-c"}
                text={"Heater & Cooler"}
                onClick={() =>
                  setDlg(<HeaterAndCooler onClose={handleClose} />)
                }
              />
            );
            isHeaterCooler = true;
          }
          break;
        case EProcessElementType.RE:
          {
            equipments.push(
              <MenuButton
                key={"re"}
                text={"RE"}
                onClick={() => setDlg(<RESummary onClose={handleClose} />)}
              />
            );
          }
          break;
        case EProcessElementType.RC:
          {
            equipments.push(
              <MenuButton
                key={"rc"}
                text={"RC"}
                onClick={() => setDlg(<RCSummary onClose={handleClose} />)}
              />
            );
          }
          break;
        case EProcessElementType.CSTR:
          {
            equipments.push(
              <MenuButton
                key={"cstr"}
                text={"CSTR"}
                onClick={() => setDlg(<CSTRSummary onClose={handleClose} />)}
              />
            );
          }
          break;
        case EProcessElementType.ENLARGER:
          {
            equipments.push(
              <MenuButton
                key={"enlarger"}
                text={"Enlarger"}
                onClick={() =>
                  setDlg(<EnlargerSummary onClose={handleClose} />)
                }
              />
            );
          }
          break;
        case EProcessElementType.PSV:
          {
            equipments.push(
              <MenuButton
                key={"psv"}
                text={"PSV"}
                onClick={() => setDlg(<PSVSummary onClose={handleClose} />)}
              />
            );
          }
          break;
        case EProcessElementType.EXPANDER:
          {
            equipments.push(
              <MenuButton
                key={"expander"}
                text={"Expander"}
                onClick={() =>
                  setDlg(<ExpanderSummary onClose={handleClose} />)
                }
              />
            );
          }
          break;
        case EProcessElementType.TANK:
          {
            equipments.push(
              <MenuButton
                key={"tank"}
                text={"Tank"}
                onClick={() => setDlg(<TankSummary onClose={handleClose} />)}
              />
            );
          }
          break;
        case EProcessElementType.EXTRACTOR:
          {
            equipments.push(
              <MenuButton
                key={"extractor"}
                text={"Extractor"}
                onClick={() =>
                  setDlg(<ExtractorSummary onClose={handleClose} />)
                }
              />
            );
          }
          break;
        case EProcessElementType.PFR:
          {
            equipments.push(
              <MenuButton
                key={"pfr"}
                text={"PFR"}
                onClick={() => setDlg(<PFRSummary onClose={handleClose} />)}
              />
            );
          }
          break;
        case EProcessElementType.COMPRESSOR:
          {
            equipments.push(
              <MenuButton
                key={"compressor"}
                text={"Compressor"}
                onClick={() =>
                  setDlg(<CompressorSummary onClose={handleClose} />)
                }
              />
            );
          }
          break;
        case EProcessElementType.SEPARATOR:
          {
            equipments.push(
              <MenuButton
                key={"separator"}
                text={"Separator"}
                onClick={() =>
                  setDlg(<SeparatorSummary onClose={handleClose} />)
                }
              />
            );
          }
          break;
        case EProcessElementType.DRUM:
          {
            equipments.push(
              <MenuButton
                key={"drum"}
                text={"Drum"}
                onClick={() => setDlg(<DrumSummary onClose={handleClose} />)}
              />
            );
          }
          break;
        case EProcessElementType.HEADER:
          {
            equipments.push(
              <MenuButton
                key={"header"}
                text={"Header"}
                onClick={() => setDlg(<HeaderSummary onClose={handleClose} />)}
              />
            );
          }
          break;
        case EProcessElementType.DISTILLATION_COLUMN:
          {
            equipments.push(
              <MenuButton
                key={"d-column"}
                text={"Distillation Column"}
                onClick={() =>
                  setDlg(<DistillationColumnSummary onClose={handleClose} />)
                }
              />
            );
          }
          break;
      }
    }
    return equipments;
  }

  return (
    <>
      {dlg}
      <div className={"d-flex"}>
        { mode === "PROCESS" ? (
        <div>
        {drawPopower(
          [
            <MenuButton
              key={"ebm"}
              text={"Energy Balance Manual"}
              onClick={() => setDlg(<EnergyBalance onClose={handleClose} />)}
            />,
            <MenuButton
              key={"hydr"}
              text={"Hydraulics"}
              onClick={() => setDlg(<Hydraulics onClose={handleClose} />)}
            />,
            drawPopower(
              getProcessEquipments(),
              <MenuButton key={"equip"} text={"Equipment"} />
            ),
            drawPopower(
              [
                <MenuButton
                  key={"c-valves"}
                  text={"Control Valves"}
                  onClick={() =>
                    setDlg(<ControlValves onClose={handleClose} />)
                  }
                />,
                <MenuButton
                  key={"controllers"}
                  text={"Controllers"}
                  onClick={() => setDlg(<Controllers onClose={handleClose} />)}
                />,
                /*<MenuButton
                  key={"psv"}
                  text={"PSV"}
                  onClick={() => {}}
                  disabled={true}
                />,*/
              ],
              <MenuButton key={"instr"} text={"Instruments"} />
            ),
          ],
          <MenuButton
          id="analysis-process-button-1"
            text="Process"
            disabled={mode !== "PROCESS" && mode !== "DESIGNER"}
          />,
          mode !== "PROCESS" && mode !== "DESIGNER"
        )}
        </div>
        ): null}
        { mode === "PIPING" ? (
        <PipingAnalysis
          key={"pa"}
          scene={scene}
          project={project}
          drawBtn={drawBtn}
          drawMenuItem={drawMenuItem}
          drawPopower={drawPopower}
          setDlg={setDlg}
          onClose={handleClose}
          dispatch={dispatch}
          reportsProgress={reportsProgress}
          /*disabled={mode !== "PIPING"}*/
        />
        ):null}
        { mode === "STRUCTURE" ? (
        <div>
        {drawPopower(
          [
            <MenuButton
              key={"dcp"}
              text={"Design Codes & Parameters"}
              onClick={() => {
                if (!project) return;
                if (project.modelType === "Pipe Rack") {
                  setDlg(<DesignCodeAndParameters onClose={handleClose} />);
                } else if (project.modelType === "Open Frame") {
                  setDlg(<DesignCodeAndParametersOF onClose={handleClose} />);
                } else if (project.modelType === "Factory Shed") {
                  setDlg(<DesignCodeAndParametersFS onClose={handleClose} />);
                }
              }}
            />,
            drawPopower(
              getReportListContent(),
              <MenuButton
                text="Reports"
                /*onClick={() => handleGettingReports(project, ui)}*/
                loading={reportsProgress}
              />
            ),
            // <MenuButton
            //   key={"iofa"}
            //   text="Import Analysis"
            //   onClick={() =>
            //     ui &&
            //     project &&
            //     importOFReports(
            //       dispatch,
            //       project.models as TOpenFrame[],
            //       scene,
            //       project,
            //       ui
            //     )
            //   }
            // />,
            <MenuButton
              key={"opt"}
              text={"Optimizer"}
              onClick={() => {
                setDlg(<Optimizer onClose={handleClose} />);
              }}
            />,
          ],
          <MenuButton id="structure-analysis-button" text="Structure" disabled={mode !== "STRUCTURE"} />,
          mode !== "STRUCTURE"
        )}
        </div>
        ): null}
      </div>
    </>
  );
};

export default AnalysisTab;
