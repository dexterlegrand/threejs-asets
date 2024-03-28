import React, { useEffect, useState, useMemo } from "react";
import {
  FreePipe,
  TProjectMode,
  TSelectedPipeConnector,
  TSelectedPipeSupport,
} from "../../../store/main/types";
import { Font, Group, Mesh, Vector3 } from "three";
import {
  TPipeInsulationLoad,
  TPipeAnalysis,
} from "../../../store/main/pipeTypes";
import { generatePipe, createSupports, drawValve } from "./pipeCreationUtils";
import { AnalysisUI } from "../../../store/ui/types";
import { getStartOffsetFromConnector, getPipeLength } from "./pipesUtils";
import { getSimpleAxisHelper } from "../axisHelper";
import PipeEndConnector from "./PipeEndConnector";
import PipeFlanges from "./PipeFlanges";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { mousePipeCreating } from "../../../recoil/atoms/process-atoms";
import {
  createLSAAnchor,
  createPipeElementАnchors,
  isPrevConnector,
} from "../../../services/pipe-services/pipe-service";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import { getCurrentProject } from "../utils";
import { lsaAtom } from "../../../recoil/atoms/lsa-atoms";

type Props = {
  container: Group;
  pipe: FreePipe;
  pipes: FreePipe[];
  lines: string[];
  mode: TProjectMode | undefined;
  axesHelper: string | undefined;
  insulationsMap: Map<string, TPipeInsulationLoad>;
  isSelectedPipe: boolean | undefined;
  selectedPipeConnector: TSelectedPipeConnector | undefined;
  selectedPipeSupport: TSelectedPipeSupport | undefined;
  pipeAnalysis: TPipeAnalysis | undefined;
  analysisUI: AnalysisUI | undefined;
  font: Font | undefined;
  opacity: number;
};

type State = {
  pipeGroup?: Group;
  pipeMesh?: Mesh | Group;
};

export default function PipeComponent(props: Props) {
  const [state, setState] = useState<State>({});
  const workMode = useSelector(
    (state: ApplicationState) => state.main.workMode
  );

  const mode = useSelector(
    (state: ApplicationState) => getCurrentProject(state)?.mode
  );

  const setLSAElement = useSetRecoilState(lsaAtom);

  const resoures = useSelector((state: ApplicationState) => state.data);
  const UDEs = useSelector(
    (state: ApplicationState) => state.main.userDefinedElbows
  );

  const MPCState = useRecoilValue(mousePipeCreating);

  const start = useMemo(() => {
    return new Vector3(props.pipe.x1, props.pipe.y1, props.pipe.z1);
  }, [props.pipe.x1, props.pipe.y1, props.pipe.z1]);

  const end = useMemo(() => {
    return new Vector3(props.pipe.x2, props.pipe.y2, props.pipe.z2);
  }, [props.pipe.x2, props.pipe.y2, props.pipe.z2]);

  const prev = useMemo(() => {
    return props.pipes.find((p) => p.pipe === props.pipe.preceding);
  }, [props.pipe, props.pipes]);

  const nexts = useMemo(() => {
    return props.pipes.filter((p) => p.preceding === props.pipe.pipe);
  }, [props.pipe, props.pipes]);

  const offset = useMemo(() => {
    return prev
      ? getStartOffsetFromConnector(
          prev,
          Math.abs(props.pipe.vDir) === 90 || Math.abs(props.pipe.hDir) === 90
        )
      : 0;
  }, [prev, props.pipe.vDir, props.pipe.hDir]);

  const offsetNext = useMemo(() => {
    return getStartOffsetFromConnector(props.pipe);
  }, [props.pipe]);

  const length = useMemo(() => {
    const length = getPipeLength(
      start,
      end,
      props.pipe.params.endConnectorType,
      props.pipe.params.endConnector
    );
    return length;
  }, [
    start,
    end,
    props.pipe.params.endConnectorType,
    props.pipe.params.endConnector,
  ]);

  const pipeIns = useMemo(() => {
    return props.insulationsMap.get(props.pipe.pipe);
  }, [props.insulationsMap, props.pipe.pipe]);

  const isAxesHelper = useMemo(() => {
    return props.axesHelper === "ALL" || props.axesHelper === props.pipe.pipe;
  }, [props.axesHelper, props.pipe.pipe]);

  const isPrevC = useMemo(() => {
    return isPrevConnector(props.pipe, props.pipes);
  }, [props.pipe, props.pipes]);

  /**
   * Creating of pipe
   */
  useEffect(() => {
    const { pipeGroup, pipeMesh } = generatePipe(
      props.pipe.pipe,
      start,
      end,
      offset,
      length,
      props.pipe.params.od,
      props.pipe.params.thickness,
      props.mode,
      pipeIns,
      props.isSelectedPipe,
      props.opacity,
      props.pipe.color,
      workMode
    );
    setState({ pipeGroup, pipeMesh });
  }, [
    props.container,
    props.pipe.params.od,
    props.pipe.params.thickness,
    start,
    end,
    offset,
    length,
    props.mode,
    pipeIns,
    props.isSelectedPipe,
    props.opacity,
  ]);

  /**
   * Supports for pipe (need refactoring)
   */
  useEffect(() => {
    if (!state.pipeGroup || !props.pipe.params.supportDetails?.length) return;
    const { container, meshes } = createSupports(
      props.pipe,
      props.pipes,
      state.pipeGroup,
      state.pipeMesh!,
      offset,
      props.pipe.params.supportDetails,
      props.selectedPipeSupport,
      props.font
    );
    container.name = `SUPPORTS-${props.pipe.pipe}`;
    props.container.add(container);
    return () => {
      props.container.remove(container);
      meshes.forEach((m) => state.pipeMesh?.remove(m));
    };
  }, [
    props.container,
    props.pipe,
    props.pipes,
    state,
    offset,
    props.pipe.params.supportDetails,
    props.selectedPipeSupport,
    props.font,
  ]);

  /**
   * Valve for pipe
   */
  useEffect(() => {
    const { valve, valvePosition } = drawValve(
      props.opacity,
      props.pipe.params.od,
      props.pipe.params.valveType,
      props.pipe.params.valvePosition,
      start,
      end
    );
    if (!valve || !state.pipeGroup) return;
    valve.position.setX(valvePosition - offset);
    state.pipeGroup.add(valve);
    return () => {
      state.pipeGroup?.remove(valve);
    };
  }, [
    props.opacity,
    props.pipe.params.od,
    props.pipe.params.valveType,
    props.pipe.params.valvePosition,
    start,
    end,
    offset,
    state.pipeGroup,
  ]);

  /**
   * Axes Helper for pipe
   */
  useEffect(() => {
    if (!state.pipeGroup || !state.pipeMesh || !isAxesHelper) return;
    const helper = getSimpleAxisHelper();
    state.pipeGroup.add(helper);
    state.pipeMesh.userData.isAxesHelper = isAxesHelper;
    return () => {
      state.pipeGroup?.remove(helper);
    };
  }, [isAxesHelper, state.pipeGroup]);

  /**
   * Update pipe name
   */
  useEffect(() => {
    if (!state.pipeMesh) return;
    state.pipeMesh.userData.pipe = props.pipe;
  }, [state.pipeMesh, props.pipe]);

  /**
   * Add pipe to group
   */
  useEffect(() => {
    if (!state.pipeMesh) return;
    props.container.add(state.pipeGroup ?? state.pipeMesh);
    return () => {
      if (!state.pipeMesh) return;
      props.container.remove(state.pipeGroup ?? state.pipeMesh);
    };
  }, [props.container, state]);

  useEffect(() => {
    if (!state.pipeGroup) return;
    const meshes = createPipeElementАnchors(
      props.pipe,
      nexts,
      offset + offsetNext,
      MPCState,
      resoures,
      UDEs
    );
    for (const mesh of meshes) {
      state.pipeGroup.add(mesh);
    }
    return () => {
      if (!state.pipeGroup) return;
      for (const mesh of meshes) {
        state.pipeGroup.remove(mesh);
      }
    };
  }, [
    MPCState,
    props.pipe,
    nexts,
    offset,
    offsetNext,
    resoures,
    UDEs,
    state.pipeGroup,
  ]);

  useEffect(() => {
    if (mode !== "LSA" || !state.pipeGroup) return;
    const anchor = createLSAAnchor(props.pipe, "pipe", setLSAElement);
    anchor.position.setX((length - offset) / 2);
    state.pipeGroup.add(anchor);
    return () => {
      state.pipeGroup?.remove(anchor);
    };
  }, [mode, props.pipe, state.pipeGroup, length, offset]);

  return (
    <>
      <PipeEndConnector
        pipe={props.pipe}
        pipes={props.pipes}
        start={start}
        end={end}
        length={start.distanceTo(end) - offset}
        axesHelper={props.axesHelper}
        container={state.pipeGroup}
        selectedPipeConnector={props.selectedPipeConnector}
        opacity={props.opacity}
      />
      <PipeFlanges
        pipe={props.pipe}
        length={length - offset}
        mode={props.mode}
        container={state.pipeGroup}
        analysisUI={props.analysisUI}
        pipeAnalysis={props.pipeAnalysis}
        isPrevConnector={isPrevC}
        isNextConnector={!!props.pipe.params.endConnector}
        opacity={props.opacity}
      />
    </>
  );
}
