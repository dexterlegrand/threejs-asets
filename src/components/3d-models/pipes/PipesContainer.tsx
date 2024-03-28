import React, { useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import { Project } from "../../../store/main/types";
import { DataState } from "../../../store/data/types";
import { TPipeInsulationLoad } from "../../../store/main/pipeTypes";
import {
  MemberStressCheckUI,
  PipeThicknessCheckUI,
} from "../../../store/ui/types";
import { showColoredElements, showEndForces } from "./pipeCreationUtils";
import { getCurrentUI, getUnicuesArray } from "../utils";
import PipeComponent from "./PipeComponent";
import { Group } from "three";
import { drawPipingLoads } from "./pipesUtils";

type Props = {
  project: Project;
  data: DataState;
};

export default function PipesContainer(props: Props) {
  const scene = useSelector((state: ApplicationState) => state.main.scene);
  const analysisUI = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.analysisUI
  );
  const selectedPipes = useSelector(
    (state: ApplicationState) => state.selections.selectedPipes
  );
  const selectedPipeSupport = useSelector(
    (state: ApplicationState) => state.selections.selectedPipeSupport
  );
  const selectedPipeConnector = useSelector(
    (state: ApplicationState) => state.selections.selectedConnector
  );

  const opacity = useMemo(() => {
    return (props.project.settings.models.pipeTransparency ?? 100) / 100;
  }, [props.project.settings.models.pipeTransparency]);

  const container = useMemo(() => {
    const group = new Group();
    group.name = `${props.project.name}-Pipes`;
    return group;
  }, [props.project.name]);

  const pipes = useMemo(() => {
    return props.project.freePipes ?? [];
  }, [props.project.freePipes]);

  const lines = useMemo(() => {
    const lines = getUnicuesArray(pipes.map((p) => `${p.line}`));
    return lines;
  }, [pipes]);

  const insulationsMap = useMemo(() => {
    const map = new Map<string, TPipeInsulationLoad>();
    for (const ins of props.project.pipeLoadings.deadLoad?.insulations ?? []) {
      if (!ins.element) continue;
      map.set(ins.element, ins);
    }
    return map;
  }, [props.project.pipeLoadings.deadLoad?.insulations]);

  const coloredParams = useMemo(() => {
    if (
      props.project.mode === "stressCheck" ||
      props.project.mode === "endForces"
    ) {
      return props.project.pipeAnalysis?.stressCheckParams;
    } else if (props.project.mode === "thicknessCheck") {
      return props.project.pipeAnalysis?.thicknessCheckParams;
    }
    return undefined;
  }, [props.project.mode, props.project.pipeAnalysis]);

  const coloredElements = useMemo(() => {
    if (!coloredParams?.lines || !analysisUI) return [];
    return coloredParams.lines.reduce((acc, line) => {
      const lineAnalysis = analysisUI[line];
      if (!lineAnalysis) return acc;
      const checks =
        props.project.mode === "stressCheck"
          ? lineAnalysis.memberStressChecks ?? []
          : props.project.mode === "thicknessCheck"
          ? lineAnalysis.thicknessChecks ?? []
          : [];
      const filtered = (checks as any[]).filter(
        (val: MemberStressCheckUI | PipeThicknessCheckUI) =>
          val.LCNumber === coloredParams.LC &&
          coloredParams.lines!.some((l) => `${val.model}` === `${l}`)
      );
      return [...acc, ...filtered];
    }, [] as any[]);
  }, [props.project.mode, analysisUI, coloredParams?.lines, coloredParams?.LC]);

  useEffect(() => {
    const group = showColoredElements(
      props.project.mode,
      coloredElements,
      coloredParams,
      analysisUI,
      props.data.font,
      props.project.settings.analysis.showLabels,
      props.project.settings.analysis.showNodes
    );
    container.add(group);
    return () => {
      container.remove(group);
    };
  }, [
    container,
    props.project.mode,
    coloredElements,
    coloredParams,
    analysisUI,
    props.data.font,
    props.project.settings.analysis.showLabels,
    props.project.settings.analysis.showNodes,
  ]);

  useEffect(() => {
    if (
      props.project.mode !== "endForces" ||
      !analysisUI ||
      !props.data.font ||
      !coloredParams?.LC ||
      !coloredParams?.lines?.length
    )
      return;
    const group = showEndForces(analysisUI, coloredParams, props.data.font);
    container.add(group);
    return () => {
      container.remove(group);
    };
  }, [
    container,
    props.project.mode,
    analysisUI,
    coloredParams?.lines,
    coloredParams?.element,
    coloredParams?.LC,
    props.data.font,
  ]);

  useEffect(() => {
    if (!container || !props.data.font) return;
    const loadsGroup = drawPipingLoads(
      pipes,
      props.project.pipeLoadings.deadLoad,
      props.project.pipeLoadings.windLoad,
      props.data.font
    );
    container.add(loadsGroup);
    return () => {
      container.remove(loadsGroup);
    };
  }, [
    container,
    pipes,
    props.project.pipeLoadings.deadLoad,
    props.project.pipeLoadings.windLoad,
    props.data.font,
  ]);

  useEffect(() => {
    scene.add(container);
    return () => {
      scene.remove(container);
    };
  }, [scene, container]);

  function generatePipes() {
    return pipes.map((p, i, arr) => {
      const isSelectedPipe =
        selectedPipes?.some((sp) => sp.pipeName === p.pipe) ?? false;
      return (
        <PipeComponent
          key={i}
          container={container}
          pipe={p}
          pipes={arr}
          lines={lines}
          mode={props.project.mode}
          axesHelper={props.project.settings.models.axesHelper}
          isSelectedPipe={isSelectedPipe}
          selectedPipeConnector={selectedPipeConnector}
          selectedPipeSupport={selectedPipeSupport}
          insulationsMap={insulationsMap}
          pipeAnalysis={props.project.pipeAnalysis}
          analysisUI={analysisUI}
          font={props.data.font}
          opacity={opacity}
        />
      );
    });
  }

  return <>{generatePipes()}</>;
}
