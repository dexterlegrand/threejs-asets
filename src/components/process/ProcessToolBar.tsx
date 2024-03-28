import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { ToolButton } from "./ToolButton";
import {
  EProcessElementType,
  EInstrumentationElementType,
  EPipeElementType,
  TProcessElement,
  EConnectionElementType,
} from "../../store/process/types";
import { CustomDlg } from "../common/CustomDlg";
import { CustomTabsDlg } from "../common/CustomTabsDlg";
import { ApplicationState } from "../../store";
import { FreePipe } from "../../store/main/types";
import {
  TPipingCap,
  TPipingElbow,
  TPipingFlange,
  TPipingReducer,
  TPipingReturn,
  TPipingTee,
} from "../../store/data/types";
import { getCurrentProject } from "../3d-models/utils";
import { getAngle } from "../3d-models/pipes/pipesUtils";
import { TPipingValve } from "../../store/data/piping-valves";

const processes = (
  <div key={"processes"} className={"tools-body"}>
    <ToolButton
      type={"process"}
      key={EProcessElementType.SOURCE}
      subtype={EProcessElementType.SOURCE}
      tooltip="Source"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.SINK}
      subtype={EProcessElementType.SINK}
      tooltip="Sink"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.VALVE}
      subtype={EProcessElementType.VALVE}
      tooltip="Valve"
    />

    <ToolButton
      type={"process"}
      key={EProcessElementType.PIPE}
      subtype={EProcessElementType.PIPE}
      tooltip="Pipe"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.MIX}
      subtype={EProcessElementType.MIX}
      tooltip="Mix"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.SPLIT}
      subtype={EProcessElementType.SPLIT}
      tooltip="Split"
    />

    <ToolButton
      type={"process"}
      key={EProcessElementType.HEADER}
      subtype={EProcessElementType.HEADER}
      tooltip="Header"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.DRUM}
      subtype={EProcessElementType.DRUM}
      tooltip="Drum"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.SEPARATOR}
      subtype={EProcessElementType.SEPARATOR}
      tooltip="Separator"
    />

    <ToolButton
      type={"process"}
      key={EProcessElementType.DISTILLATION_COLUMN}
      subtype={EProcessElementType.DISTILLATION_COLUMN}
      tooltip="Distillation Column"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.EXTRACTOR}
      subtype={EProcessElementType.EXTRACTOR}
      tooltip="Extractor"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.TANK}
      subtype={EProcessElementType.TANK}
      tooltip="Tank"
    />

    <ToolButton
      type={"process"}
      key={EProcessElementType.PUMP}
      subtype={EProcessElementType.PUMP}
      tooltip="Pump"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.EXPANDER}
      subtype={EProcessElementType.EXPANDER}
      tooltip="Expander"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.COMPRESSOR}
      subtype={EProcessElementType.COMPRESSOR}
      tooltip="Compressor"
    />

    <ToolButton
      type={"process"}
      key={EProcessElementType.PSV}
      subtype={EProcessElementType.PSV}
      tooltip="PSV"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.ENLARGER}
      subtype={EProcessElementType.ENLARGER}
      tooltip="Enlarger"
    />

    <ToolButton
      type={"process"}
      key={EProcessElementType.PFR}
      subtype={EProcessElementType.PFR}
      tooltip="PFR"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.CSTR}
      subtype={EProcessElementType.CSTR}
      tooltip="CSTR"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.RE}
      subtype={EProcessElementType.RE}
      tooltip="Reactor"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.RC}
      subtype={EProcessElementType.RC}
      tooltip="Reactor Controller"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.RG}
      subtype={EProcessElementType.RG}
      tooltip="RG"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.ST_HE_1P}
      subtype={EProcessElementType.ST_HE_1P}
      tooltip="ST_HE_1P"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.ST_HE_2P}
      subtype={EProcessElementType.ST_HE_2P}
      tooltip="ST_HE_2P"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.HEATER}
      subtype={EProcessElementType.HEATER}
      tooltip="Heater"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.COOLER}
      subtype={EProcessElementType.COOLER}
      tooltip="Cooler"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.ABSORPTION_COLUMN}
      subtype={EProcessElementType.ABSORPTION_COLUMN}
      tooltip="Absorption Column"
    />
    {/*
    <ToolButton
      type={"process"}
      key={EProcessElementType.AIRPHIN_COOLER}
      subtype={EProcessElementType.AIRPHIN_COOLER}
      tooltip="Airphin Cooler"
/>*/}
    <ToolButton
      type={"process"}
      key={EProcessElementType.SKID}
      subtype={EProcessElementType.SKID}
      tooltip="Skid"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.OTHER}
      subtype={EProcessElementType.OTHER}
      tooltip="Other"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.HORIZONTAL_DRUM}
      subtype={EProcessElementType.HORIZONTAL_DRUM}
      tooltip="Horizontal Drum"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.COLUMN}
      subtype={EProcessElementType.COLUMN}
      tooltip="Absorber Column"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.AAM}
      subtype={EProcessElementType.AAM}
      tooltip="Air Mixer"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.TAM}
      subtype={EProcessElementType.TAM}
      tooltip="Tail Gas Mixer"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.AC}
      subtype={EProcessElementType.AC}
      tooltip="Absorber Feed Tank"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.ES}
      subtype={EProcessElementType.ES}
      tooltip="Exhaust Stack"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.BC}
      subtype={EProcessElementType.BC}
      tooltip="Bleacher Column"
    />

    <ToolButton
      type={"process"}
      key={EProcessElementType.AV}
      subtype={EProcessElementType.AV}
      tooltip="Vaporizer"
    />

    <ToolButton
      type={"process"}
      key={EProcessElementType.AH}
      subtype={EProcessElementType.AH}
      tooltip="Air preheater (H)"
    />

    <ToolButton
      type={"process"}
      key={EProcessElementType.WHB}
      subtype={EProcessElementType.WHB}
      tooltip="Waste Heat Boiler"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.CC}
      subtype={EProcessElementType.CC}
      tooltip="Cooler Condenser"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.LEG}
      subtype={EProcessElementType.LEG}
      tooltip="Leg"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.NAH}
      subtype={EProcessElementType.NAH}
      tooltip="Acid Heater"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.TGP}
      subtype={EProcessElementType.TGP}
      tooltip="Tail Gas PreHeater"
    />

    <ToolButton
      type={"process"}
      key={EProcessElementType.IAF}
      subtype={EProcessElementType.IAF}
      tooltip="Inlet Air Filter"
    />

    <ToolButton
      type={"process"}
      key={EProcessElementType.BLOCK}
      subtype={EProcessElementType.BLOCK}
      tooltip="Air Filter block"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.DAF}
      subtype={EProcessElementType.DAF}
      tooltip="Discharge Air Filter"
    />

    {/* <ToolButton
      type={"process"}
      key={EProcessElementType.A_B_PUMP}
      subtype={EProcessElementType.A_B_PUMP}
      tooltip="Acid Pump"
    /> */}
    <ToolButton
      type={"process"}
      key={EProcessElementType.PUMP_PRELUBE}
      subtype={EProcessElementType.PUMP_PRELUBE}
      tooltip="Pump Prelube"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.NOX_ABATOR}
      subtype={EProcessElementType.NOX_ABATOR}
      tooltip="NOX Abator"
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.AIC}
      subtype={EProcessElementType.AIC}
    />
    <ToolButton
      type={"process"}
      key={EProcessElementType.FireHose}
      subtype={EProcessElementType.FireHose}
    />
  </div>
);

const instrumentations = (
  <div key={"instrumentations"} className={"tools-body"}>
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.ELEMENT}
      subtype={EInstrumentationElementType.ELEMENT}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.INDICATOR}
      subtype={EInstrumentationElementType.INDICATOR}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.RECORDER}
      subtype={EInstrumentationElementType.RECORDER}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.TRANSMITTER}
      subtype={EInstrumentationElementType.TRANSMITTER}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.TEMP_INDICATOR}
      subtype={EInstrumentationElementType.TEMP_INDICATOR}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.FLOW_INDICATOR}
      subtype={EInstrumentationElementType.FLOW_INDICATOR}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.TEMP_TRNASMITTER}
      subtype={EInstrumentationElementType.TEMP_TRNASMITTER}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.FLOW_TRANSMITTER}
      subtype={EInstrumentationElementType.FLOW_TRANSMITTER}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.PRESSURE_INDICATING_CONTROLLER}
      subtype={EInstrumentationElementType.PRESSURE_INDICATING_CONTROLLER}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.TEMP_RECORDER}
      subtype={EInstrumentationElementType.TEMP_RECORDER}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.FLOW_RECORDER}
      subtype={EInstrumentationElementType.FLOW_RECORDER}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.PRESSURE_RECORDING}
      subtype={EInstrumentationElementType.PRESSURE_RECORDING}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.TEMP_CONTROLLER}
      subtype={EInstrumentationElementType.TEMP_CONTROLLER}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.FLOW_CONTROLLER}
      subtype={EInstrumentationElementType.FLOW_CONTROLLER}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.LEVEL_ALARM}
      subtype={EInstrumentationElementType.LEVEL_ALARM}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.LEVEL_INDICATOR}
      subtype={EInstrumentationElementType.LEVEL_INDICATOR}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.PRESSURE_INDICATOR}
      subtype={EInstrumentationElementType.PRESSURE_INDICATOR}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.FLOW_ElEMENT}
      subtype={EInstrumentationElementType.FLOW_ElEMENT}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.LEVEL_TRNASMITTER}
      subtype={EInstrumentationElementType.LEVEL_TRNASMITTER}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.PRESSURE_TRANSMITTER}
      subtype={EInstrumentationElementType.PRESSURE_TRANSMITTER}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.TEMPERATURE_ElEMENT}
      subtype={EInstrumentationElementType.TEMPERATURE_ElEMENT}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.LEVEL_RECORDER}
      subtype={EInstrumentationElementType.LEVEL_RECORDER}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.PRESSURE_RECORDER}
      subtype={EInstrumentationElementType.PRESSURE_RECORDER}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.LEVEL_GAUGE}
      subtype={EInstrumentationElementType.LEVEL_GAUGE}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.LEVEL_CONTROLLER}
      subtype={EInstrumentationElementType.LEVEL_CONTROLLER}
    />
    <ToolButton
      type={"instrumentation"}
      key={EInstrumentationElementType.PRESSURE_CONTROLLER}
      subtype={EInstrumentationElementType.PRESSURE_CONTROLLER}
    />
  </div>
);

export function ProcessToolBar() {
  const [id, setId] = useState(0);

  const mode = useSelector((state: ApplicationState) => state.main.workMode);
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );
  const resources = useSelector((state: ApplicationState) => state.data);
  const UDEs = useSelector(
    (state: ApplicationState) => state.main.userDefinedElbows
  );
  const processesState = useSelector(
    (state: ApplicationState) => state.process
  );

  const pipes = useMemo(() => {
    return project?.freePipes ?? [];
  }, [project?.freePipes]);

  const tabs = useMemo(() => {
    const tabs = [
      { id: 0, name: "Process" },
      { id: 1, name: "Instrumentation" },
    ];
    if (mode === "DESIGNER" || mode === "PIPDESIGNER")
      tabs.push({ id: 2, name: "Pipe Elements" });
    if (mode === "DESIGNER")
      tabs.push({ id: 3, name: "Tie-in points" }, { id: 4, name: "others" });
    /*if (mode === "DESIGNER") tabs.push({ id: 3, name: "Cabel Elements" });*/
    return tabs;
  }, [mode]);

  const flanges = useMemo(() => {
    return [
      ...resources.pipingFlangesAllPresRating,
      ...resources.pipingFlangesBlind,
      ...resources.pipingFlangesLapped,
      ...resources.pipingFlangesRingJointFacing,
      ...resources.pipingFlangesSlipon,
      ...resources.pipingFlangesSocketWelding,
      ...resources.pipingFlangesThreaded,
      ...resources.pipingFlangesWeldingneck,
    ];
  }, [
    resources.pipingFlangesAllPresRating,
    resources.pipingFlangesBlind,
    resources.pipingFlangesLapped,
    resources.pipingFlangesRingJointFacing,
    resources.pipingFlangesSlipon,
    resources.pipingFlangesSocketWelding,
    resources.pipingFlangesThreaded,
    resources.pipingFlangesWeldingneck,
  ]);

  const pipeToolButton = useMemo(() => {
    return (
      <ToolButton
        type={"pipe-elements"}
        key={EPipeElementType.PIPE}
        subtype={EPipeElementType.PIPE}
        draggable={false}
        idText="pipe-tool"
        tooltip="Pipe"
      />
    );
  }, []);

  const elbowToolButton = useMemo(() => {
    return (
      <ToolButton
        type={"pipe-elements"}
        key={EPipeElementType.ELBOW}
        subtype={EPipeElementType.ELBOW}
        draggable={false}
        disabled={!checkElbows(pipes, resources.pipingElbows)}
        idText="elbow-tool"
        tooltip="Elbow"
      />
    );
  }, [pipes, resources.pipingElbows]);

  const teeToolButton = useMemo(() => {
    return (
      <ToolButton
        type={"pipe-elements"}
        key={EPipeElementType.TEE}
        subtype={EPipeElementType.TEE}
        draggable={false}
        disabled={!checkTees(pipes, resources.pipingTees)}
        idText="tee-joint-tool"
        tooltip="Tee"
      />
    );
  }, [pipes, resources.pipingTees]);

  const capToolButton = useMemo(() => {
    return (
      <ToolButton
        type={"pipe-elements"}
        key={EPipeElementType.CAP}
        subtype={EPipeElementType.CAP}
        draggable={false}
        disabled={!checkCaps(pipes, resources.pipingCaps)}
        idText="cap-tool"
        tooltip="Cap"
      />
    );
  }, [pipes, resources.pipingCaps]);

  const returnToolButton = useMemo(() => {
    return (
      <ToolButton
        type={"pipe-elements"}
        key={EPipeElementType.RETURN}
        subtype={EPipeElementType.RETURN}
        draggable={false}
        disabled={!checkReturns(pipes, resources.pipingReturns)}
        idText="return-tool"
        tooltip="Return"
      />
    );
  }, [pipes, resources.pipingReturns]);

  const reducerToolButton = useMemo(() => {
    return (
      <ToolButton
        type={"pipe-elements"}
        key={EPipeElementType.REDUCER}
        subtype={EPipeElementType.REDUCER}
        draggable={false}
        disabled={!checkReducers(pipes, resources.pipingReducers)}
        idText="reducer-tool"
        tooltip="Reducer"
      />
    );
  }, [pipes, resources.pipingReducers]);

  const flangeToolButton = useMemo(() => {
    return (
      <ToolButton
        type={"pipe-elements"}
        key={EPipeElementType.FLANGE}
        subtype={EPipeElementType.FLANGE}
        draggable={false}
        disabled={!checkFlanges(pipes, flanges)}
        idText="flange-tool"
        tooltip="Flange"
      />
    );
  }, [pipes, flanges]);

  const valveToolButton = useMemo(() => {
    const process = processesState.processes.get(project?.name ?? "");
    const elements = process ? Array.from(process.elements.values()) : [];
    return (
      <ToolButton
        type={"pipe-elements"}
        key={EPipeElementType.VALVE}
        subtype={EPipeElementType.VALVE}
        draggable={false}
        disabled={!checkValves(pipes, elements, resources.pipingValves)}
        tooltip="Valve"
        idText="valve-tool"
      />
    );
  }, [pipes, processesState, project?.name, resources.pipingValves]);

  const UDEToolButton = useMemo(() => {
    return (
      <ToolButton
        type={"pipe-elements"}
        key={EPipeElementType.UDE}
        subtype={EPipeElementType.UDE}
        draggable={false}
        disabled={!checkElbows(pipes, UDEs)}
        tooltip="User Defined Elbow"
        idText="ude-tool"
      />
    );
  }, [pipes, UDEs]);

  const suppToolButton = useMemo(() => {
    return (
      <ToolButton
        type={"pipe-elements"}
        key={EPipeElementType.SUPP}
        subtype={EPipeElementType.SUPP}
        draggable={false}
        disabled={!pipes.length}
        tooltip="Support"
        idText="support-tool"
      />
    );
  }, [pipes]);

  const pipeElements = useMemo(() => {
    return (
      <div key={"pipe-elements"} className={"tools-body"}>
        {pipeToolButton}
        {elbowToolButton}
        {teeToolButton}
        {capToolButton}
        {returnToolButton}
        {reducerToolButton}
        {flangeToolButton}
        {valveToolButton}
        {UDEToolButton}
        {suppToolButton}
        <ToolButton
          type={"pipe-elements"}
          key={EPipeElementType.DIMENSION}
          subtype={EPipeElementType.DIMENSION}
          draggable={false}
          idText="dimension-tool"
          tooltip="Dimension"
        />
      </div>
    );
  }, [
    pipeToolButton,
    elbowToolButton,
    teeToolButton,
    capToolButton,
    returnToolButton,
    reducerToolButton,
    flangeToolButton,
    valveToolButton,
    UDEToolButton,
    suppToolButton,
  ]);

  const tieEndPointsToolButton = useMemo(() => {
    return (
      <>
        <ToolButton
          type={"connections"}
          key={EConnectionElementType.NOZZLE}
          subtype={EConnectionElementType.NOZZLE}
          draggable={false}
          tooltip="Nozzle"
          idText="nozzle-tool-button"
        />
        <ToolButton
          type={"connections"}
          key={EConnectionElementType.LUG}
          subtype={EConnectionElementType.LUG}
          tooltip="Lug"
        />
        <ToolButton
          type={"connections"}
          key={EConnectionElementType.SKIRT}
          subtype={EConnectionElementType.SKIRT}
          tooltip="Skirt"
        />
        <ToolButton
          type={"connections"}
          key={EConnectionElementType.RECTANGULAR_BP}
          subtype={EConnectionElementType.RECTANGULAR_BP}
          tooltip="Rectangular Base Plate"
        />
        <ToolButton
          type={"connections"}
          key={EConnectionElementType.CIRCULAR_BP}
          subtype={EConnectionElementType.CIRCULAR_BP}
          tooltip="Circular Base Plate"
        />
      </>
    );
  }, []);

  const accessoryElements = useMemo(() => {
    return (
      <div key={"cabel-elements"} className={"tools-body"}>
        {tieEndPointsToolButton}
      </div>
    );
  }, [tieEndPointsToolButton]);  const others = useMemo(() => {
    return (
      <div key={"cabel-elements"} className={"tools-body"}>
        {tieEndPointsToolButton}
      </div>
    );
  }, [tieEndPointsToolButton]);

  function getTools(id: number) {
    switch (id) {
      case 0:
        return processes;
      case 1:
        return instrumentations;
      case 2:
        return pipeElements;
      case 3:
        return accessoryElements;
        case 4:
          return others;
      default:
        return null;
    }
  }

  return (
    <CustomDlg
      title={"Process tools"}
      idText="process-tools-dialog"
      isMinimize={true}
      zIndex={5}
      body={
        <>
          <CustomTabsDlg tabs={tabs} selected={id} onSelect={setId} />
          {getTools(id)}
        </>
      }
    />
  );
}

function checkElbows(pipes: FreePipe[], items: TPipingElbow[]) {
  for (const pipe of pipes) {
    const nexts = pipes.filter((p) => p.preceding === pipe.pipe);
    if (!nexts.length || nexts.length > 1) continue;
    const next = nexts[0];
    const angle = getAngle(next, pipe);
    if (!angle) continue;
    const absAngle = Math.abs(angle);
    if (
      items.some(
        (item) =>
          item.degree === absAngle &&
          item.nps === pipe.params.profile?.nominal_pipe_size_inch &&
          !pipe.params.endConnector
      )
    )
      return true;
  }
  return false;
}

function checkReturns(pipes: FreePipe[], items: TPipingReturn[]) {
  for (const pipe of pipes) {
    if (pipe.params.endConnector || !pipe.params.profile) continue;
    const nexts = pipes.filter((p) => p.preceding === pipe.pipe);
    if (!nexts.length || nexts.length > 1) continue;
    const next = nexts[0];
    const angle = getAngle(next, pipe);
    if (!angle) continue;
    const absAngle = Math.abs(angle);
    if (
      items.some(
        (item) =>
          absAngle === 180 &&
          item.nps === pipe.params.profile!.nominal_pipe_size_inch
      )
    )
      return true;
  }
  return false;
}

function checkReducers(pipes: FreePipe[], items: TPipingReducer[]) {
  for (const pipe of pipes) {
    if (pipe.params.endConnector || !pipe.params.profile) continue;
    const nexts = pipes.filter((p) => p.preceding === pipe.pipe);
    if (!nexts.length || nexts.length > 1) continue;
    const next = nexts[0];
    const angle = getAngle(next, pipe);
    if (angle) continue;
    if (
      items.some((item) => {
        const npss = item.nps.split(" x ");
        return nexts.length
          ? (npss[0] === pipe.params.profile!.nominal_pipe_size_inch &&
              npss[1] === nexts[0]?.params.nps) ||
              (npss[1] === pipe.params.profile!.nominal_pipe_size_inch &&
                npss[0] === nexts[0]?.params.nps)
          : npss[0] === pipe.params.profile!.nominal_pipe_size_inch ||
              npss[1] === pipe.params.profile!.nominal_pipe_size_inch;
      })
    )
      return true;
  }
  return false;
}

function checkTees(pipes: FreePipe[], items: TPipingTee[]) {
  for (const pipe of pipes) {
    if (pipe.params.endConnector || !pipe.params.profile) continue;
    const nexts = pipes.filter((p) => p.preceding === pipe.pipe);
    const next0 = nexts.find(
      (item) => Math.abs(getAngle(item, pipe) || 0) === 0
    );
    const next90 = nexts.find(
      (item) => Math.abs(getAngle(item, pipe) || 0) === 90
    );
    if (
      items.some((item) => {
        const npss = item.nps.split(" x ");
        if (npss[0] !== pipe.params.profile!.nominal_pipe_size_inch)
          return false;
        if (next0 && next90) {
          if (next0.params.nps !== next90.params.nps) {
            return (
              npss[0] === next0.params.nps && npss[1] === next90.params.nps
            );
          }
          return (
            npss[0] === next0.params.nps &&
            (npss[1] ? npss[1] === next90.params.nps : true)
          );
        } else if (next0) {
          return npss[0] === next0.params.nps;
        } else if (next90) {
          return (npss[1] ?? npss[0]) === next90.params.nps;
        }
      })
    )
      return true;
  }
  return false;
}

function checkCaps(pipes: FreePipe[], items: TPipingCap[]) {
  for (const pipe of pipes) {
    if (pipe.params.endConnector || !pipe.params.profile) continue;
    if (pipes.some((p) => p.preceding === pipe.pipe)) continue;
    if (
      items.some(
        (item) => item.nps === pipe.params.profile!.nominal_pipe_size_inch
      )
    )
      return true;
  }
  return false;
}

function checkValves(
  pipes: FreePipe[],
  elements: TProcessElement[],
  items: TPipingValve[]
) {
  for (const element of elements) {
    if (element.type !== EProcessElementType.VALVE) continue;
    if (
      pipes.some((p) => element.points.some((point) => point.prevPipe === p.id))
    )
      return true;
  }
  return false;
}

function checkFlanges(pipes: FreePipe[], items: TPipingFlange[]) {
  for (const pipe of pipes) {
    if (!pipe.params.profile) continue;
    if (
      items.some(
        (i) =>
          i.nps === pipe.params.profile?.nominal_pipe_size_inch &&
          (!pipe.params.startFlange || !pipe.params.endFlange)
      )
    )
      return true;
  }
  return false;
}
