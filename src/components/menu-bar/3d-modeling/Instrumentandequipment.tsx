import React from "react";
import {FunctionComponent, useState, useMemo } from "react";
import MenuButton from "../MenuButton";
import { MenuItem,Menu } from "@blueprintjs/core";
import { ReportDlg } from "../analysis-tab/pipe-rack/reports/ReportsDlg";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import { getCurrentProject, getCurrentUI } from "../../3d-models/utils";
import { Popover } from "@blueprintjs/core";
import { PumpSizing } from "../analysis-tab/process/equipments/PumpSizing";
import { HeatExchanger } from "../analysis-tab/process/equipments/HeatExchanger";
import { EProcessElementType } from "../../../store/process/types";
import { SourceAndSink } from "../analysis-tab/process/equipments/SourceAndSink";
import { MixAndSplit } from "../analysis-tab/process/equipments/MixAndSplit";
import { HeaterAndCooler } from "../analysis-tab/process/equipments/HeaterAndCooler";
import { RESummary } from "../analysis-tab/process/equipments/RESummary";
import { RCSummary } from "../analysis-tab/process/equipments/RCSummary";
import { CSTRSummary } from "../analysis-tab/process/equipments/CSTRSummary";
import { EnlargerSummary } from "../analysis-tab/process/equipments/EnlargerSummary";
import { PSVSummary } from "../analysis-tab/process/equipments/PSVSummary";
import { ExpanderSummary } from "../analysis-tab/process/equipments/ExpanderSummary";
import { TankSummary } from "../analysis-tab/process/equipments/TankSummary";
import { ExtractorSummary } from "../analysis-tab/process/equipments/ExtractorSummary";
import { PFRSummary } from "../analysis-tab/process/equipments/PFRSummary";
import { CompressorSummary } from "../analysis-tab/process/equipments/CompressorSummary";
import { SeparatorSummary } from "../analysis-tab/process/equipments/SeparatorSummary";
import { HeaderSummary } from "../analysis-tab/process/equipments/HeaderSummary";
import { DrumSummary } from "../analysis-tab/process/equipments/DrumSummary";
import { ControlValves } from "../analysis-tab/process/instruments/ControlValves";
import { DistillationColumnSummary } from "../analysis-tab/process/equipments/DistillationColumnSummary";
import { Controllers } from "../analysis-tab/process/instruments/Controllers";
import { PipingAnalysis } from "../analysis-tab/piping/PipingAnalysis";
import { DesignCodeAndParameters } from "../analysis-tab/pipe-rack/design-code-and-parameters/DesignCodeAndParameters";
import { getUnicuesArray } from "../../3d-models/utils";
import { DesignCodeAndParametersOF } from "../analysis-tab/open-frame/design-code-and-parameters/DesignCodeAndParameters";
import { DesignCodeAndParametersFS } from "../analysis-tab/factory-shed/design-code-and-parameters/DesignCodeAndParameters";
import { DisplacementComparison } from "../analysis-tab/comparisons/DisplacementComparison";
import { ReportDlgOF } from "../analysis-tab/open-frame/reports/ReportsDlg";
import { ReportDlgFS } from "../analysis-tab/factory-shed/reports/ReportsDlg";
import { addEventAction } from "../../../store/ui/actions";
import { ModelType } from "../../../store/main/types";
import { baseUrl } from "../../../store/main/constants";
import axios from "axios";
import { saveAs } from "file-saver";
import { getJSONForDesignCodesAndParameters } from "../../3d-models/designCodeAndParameters";
import { getJSONForDesignCodesAndParametersOF } from "../../3d-models/designCodeAndParametersOF";
import { Project } from "../../../store/main/types";
import { PipeRack } from "../../../store/main/types";
import { TOpenFrame } from "../../../store/main/openFrameTypes";
import { MaterialTakeOff } from "../analysis-tab/pipe-rack/reports/MaterialTakeOffDlg";
import { MaterialTakeOffFS } from "../analysis-tab/factory-shed/reports/MaterialTakeOffDlg";
import { MaterialTakeOffOF } from "../analysis-tab/open-frame/reports/MaterialTakeOffDlg";
import { ReactionsComparisons } from "../analysis-tab/comparisons/ReactionsComparisons";
import { ForcesComparisons } from "../analysis-tab/comparisons/ForcesComparisons";
import { getAndMapReports } from "../../../store/main/actions";
import { getAndMapReportsOF } from "../../../store/main/actions";
import { ProjectUI } from "../../../store/ui/types";
import { Optimizer } from "../analysis-tab/optimizer/Optimizer";
import { AAMSummary } from "../analysis-tab/process/equipments/AAMSummary";
import { TAMSummary } from "../analysis-tab/process/equipments/TAMSummary";
import { ACSummary } from "../analysis-tab/process/equipments/ACSummary";
import { ESSummary } from "../analysis-tab/process/equipments/ESSummary";
import { AVSummary } from "../analysis-tab/process/equipments/AVSummary";
import { AHSummary } from "../analysis-tab/process/equipments/AHSummary";
import { WHBSummary } from "../analysis-tab/process/equipments/WHBSummary";
import { CCSummary } from "../analysis-tab/process/equipments/CCSummary";
import { NAHSummary } from "../analysis-tab/process/equipments/NAHSummary";
import { TGPSummary } from "../analysis-tab/process/equipments/TGPSummary";
import { IAFSummary } from "../analysis-tab/process/equipments/IAFSummary";
import { DAFSummary } from "../analysis-tab/process/equipments/DAFSummary";
import {BCSummary } from "../analysis-tab/process/equipments/BCSummary";
import {ABPUMPSummary} from "../analysis-tab/process/equipments/ABPUMPSummary";
import { PUMPPRELUBESummary } from "../analysis-tab/process/equipments/PUMPPRELUBESummary";
import { AFDSummary } from "../analysis-tab/process/equipments/AFDSummary";
import { NOX_ABATORSummary } from "../analysis-tab/process/equipments/NOX_ABATORSummary";

type Props = {};

const InstrumentandEquipment: FunctionComponent<Props> = () => {
    const [dlg, setDlg] = useState<JSX.Element>();
    const mode = useSelector((state: ApplicationState) => state.main.workMode);
    const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
    const scene = useSelector((state: ApplicationState) => state.main.scene);
    const project = useSelector((state: ApplicationState) => getCurrentProject(state));
    const process = useSelector((state: ApplicationState) => state.process);
    const dispatch = useDispatch();

    const reportsProgress = useMemo(() => ui?.requests?.reports, [ui]);

    function handleClose(){
        setDlg(undefined);
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

      function drawBtn(
        key: string | number,
        txt: string,
        disabled?: boolean,
        loading?: boolean,
        onClick?: () => any
      ) {
        return (
          <MenuButton
            key={key}
            text={txt}
            disabled={disabled}
            loading={loading}
            onClick={onClick}
          />
        );
      }

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

      function getReportListContent() {
        return (
          <Menu>
            <MenuItem key={0} text={"Design Report"}>
              <Menu style={{ maxHeight: "60vh", overflowY: "auto" }}>
                {getDesignReportsList(project)}
              </Menu>
            </MenuItem>
            <MenuItem
              key={1}
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
              key={2}
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
              key={3}
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
              key={4}
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
              key={5}
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
              key={6}
              text={"Base Plate Check"}
              onClick={() => {}}
              disabled={true}
            />
            <MenuItem
              key={7}
              text={"Splice Plate Check"}
              onClick={() => {}}
              disabled={true}
            />
            <MenuItem key={8} text={"Various Material Take of"}>
              <MenuItem
                key={9}
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
                key={10}
                text={"Platform Area"}
                onClick={() => {}}
                disabled={true}
              />
              <MenuItem
                key={11}
                text={"Paint Area"}
                onClick={() => {}}
                disabled={true}
              />
              <MenuItem
                key={12}
                text={"Handrail Length"}
                onClick={() => {}}
                disabled={true}
              />
              <MenuItem
                key={13}
                text={"Ladder length"}
                onClick={() => {}}
                disabled={true}
              />
              <MenuItem
                key={14}
                text={"Base plate MTO"}
                onClick={() => {}}
                disabled={true}
              />
              <MenuItem
                key={15}
                text={"Splice MTO"}
                onClick={() => {}}
                disabled={true}
              />
              <MenuItem
                key={16}
                text={"Anchor Bolt MTO"}
                onClick={() => {}}
                disabled={true}
              />
              <MenuItem
                key={17}
                text={"Splice Bolt MTO"}
                onClick={() => {}}
                disabled={true}
              />
            </MenuItem>
            <MenuItem key={18} text={"Comparisons"}>
              <MenuItem
                key={19}
                text={"Displacement"}
                onClick={() =>
                  setDlg(<DisplacementComparison onClose={handleClose} />)
                }
              />
              <MenuItem
                key={20}
                text={"Reactions"}
                onClick={() =>
                  setDlg(<ReactionsComparisons onClose={handleClose} />)
                }
              />
              <MenuItem
                key={21}
                text={"Forces"}
                onClick={() => setDlg(<ForcesComparisons onClose={handleClose} />)}
              />
            </MenuItem>
          </Menu>
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
          case EProcessElementType.AAM:
              {
                equipments.push(
                  <MenuButton
                    key={"aam-col"}
                    text={"Air Mixer"}
                    onClick={() =>
                      setDlg(<AAMSummary onClose={handleClose} />)
                    }
                  />
                );
              }
              break;
          case EProcessElementType.TAM:
            {
              equipments.push(
                <MenuButton
                  key={"tam-col"}
                  text={"Tail Gas Mixer"}
                  onClick={() =>
                    setDlg(<TAMSummary onClose={handleClose} />)
                  }
                />
              );
            }
            break;
          case EProcessElementType.COLUMN:
              {
                equipments.push(
                  <MenuButton
                    key={"ac-col"}
                    text={"Absorber Column"}
                    onClick={() =>
                      setDlg(<ACSummary onClose={handleClose} />)
                    }
                  />
                );
              }
              break;
          case EProcessElementType.ES:
              {
                  equipments.push(
                    <MenuButton
                      key={"es-col"}
                      text={"Exhaust Stack"}
                      onClick={() =>
                        setDlg(<ESSummary onClose={handleClose} />)
                      }
                    />
                  );
                }
                break;
          case EProcessElementType.BC:
              {
                  equipments.push(
                    <MenuButton
                      key={"bc-col"}
                      text={"Bleacher Column"}
                      onClick={() =>
                        setDlg(<BCSummary onClose={handleClose} />)
                      }
                    />
                  );
                }
                break;
          case EProcessElementType.AV:
              {
                  equipments.push(
                    <MenuButton
                        key={"av-col"}
                        text={"Vaporizer"}
                        onClick={() =>
                          setDlg(<AVSummary onClose={handleClose} />)
                        }
                    />
                  );
              }
              break;
          case EProcessElementType.AH:
              {
                  equipments.push(
                    <MenuButton
                        key={"ah-col"}
                        text={"Air preheater"}
                        onClick={() =>
                          setDlg(<AHSummary onClose={handleClose} />)
                      }
                    />
                  );
              }
              break;
              case EProcessElementType.WHB:
                {
                    equipments.push(
                      <MenuButton
                          key={"whb-col"}
                          text={"Waste Heat Boiler"}
                          onClick={() =>
                            setDlg(<WHBSummary onClose={handleClose} />)
                        }
                      />
                    );
                }
                break;
                case EProcessElementType.CC:
                  {
                      equipments.push(
                        <MenuButton
                            key={"cc-col"}
                            text={"Cooler Condenser"}
                            onClick={() =>
                              setDlg(<CCSummary onClose={handleClose} />)
                          }
                        />
                      );
                  }
                  break;
                case EProcessElementType.NAH:
                  {
                      equipments.push(
                        <MenuButton
                            key={"nah-col"}
                            text={"Acid Heater"}
                            onClick={() =>
                              setDlg(<NAHSummary onClose={handleClose} />)
                          }
                        />
                      );
                  }
                  break;
                case EProcessElementType.TGP:
                  {
                        equipments.push(
                          <MenuButton
                              key={"tgp-col"}
                              text={"Tail Gas PreHeater"}
                              onClick={() =>
                                setDlg(<TGPSummary onClose={handleClose} />)
                            }
                          />
                        );
                    }
                    break;
                case EProcessElementType.IAF:
                    {
                        equipments.push(
                          <MenuButton
                              key={"iaf-col"}
                              text={"Inlet Air Filter"}
                              onClick={() =>
                                setDlg(<IAFSummary onClose={handleClose} />)
                              }
                            />
                          );
                    }
                    break;
                    case EProcessElementType.DAF:
                      {
                          equipments.push(
                            <MenuButton
                                key={"daf-col"}
                                text={"Discharge Air Filter"}
                                onClick={() =>
                                  setDlg(<DAFSummary onClose={handleClose} />)
                                }
                              />
                            );
                      }
                      break;
                      case EProcessElementType.A_B_PUMP:
                        {
                            equipments.push(
                              <MenuButton
                                  key={"a-b-pump-col"}
                                  text={"Acid Pump"}
                                  onClick={() =>
                                    setDlg(<ABPUMPSummary onClose={handleClose} />)
                                  }
                                />
                              );
                        }
                        break;
                        case EProcessElementType.PUMP_PRELUBE:
                          {
                              equipments.push(
                                <MenuButton
                                    key={"pump-prelube-col"}
                                    text={"Pump Prelube"}
                                    onClick={() =>
                                      setDlg(<PUMPPRELUBESummary onClose={handleClose} />)
                                    }
                                  />
                                );
                          }
                          break;
                          case EProcessElementType.AC:
                            {
                              equipments.push(
                                <MenuButton
                                  key={"ac-col"}
                                  text={"Absorber Feed Tank"}
                                  onClick={() =>
                                    setDlg(<AFDSummary onClose={handleClose} />)
                                  }
                                />
                              );
                            }
                            break;
                            case EProcessElementType.NOX_ABATOR:
                            {
                              equipments.push(
                                <MenuButton
                                  key={"nox-abator-col"}
                                  text={"NOX_ABATOR"}
                                  onClick={() =>
                                    setDlg(<NOX_ABATORSummary onClose={handleClose} />)
                                  }
                                />
                              );
                            }
                            break;
                            /*case EProcessElementType.AC:
                            {
                              equipments.push(
                                <MenuButton
                                  key={"ac-col"}
                                  text={"Absorber Feed Tank"}
                                  onClick={() =>
                                    setDlg(<AFDSummary onClose={handleClose} />)
                                  }
                                />
                              );
                            }
                            break;*/
          }
        }
        return equipments;
      }
      function getProcessInstruments() {
        return [
          <MenuButton
            key={"c-valves"}
            text={"Control Valves"}
            onClick={() => setDlg(<ControlValves onClose={handleClose} />)}
          />,
          <MenuButton
            key={"controllers"}
            text={"Controllers"}
            onClick={() => setDlg(<Controllers onClose={handleClose} />)}
          />,
        ];
      }
      

    return (
      <>
      {dlg}
      <div className={"d-flex"}>
        {drawPopower(
          getProcessEquipments(),
          <MenuButton id="equipment" key={"equip"} text={"Equipment"} />
        )}
        {drawPopower(
          getProcessInstruments(),
          <MenuButton id="instruments" key={"instr"} text={"Instruments"} />
        )}
      </div>
    </>
      );
};

export default InstrumentandEquipment;