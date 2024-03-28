import React, { useEffect, useState, useMemo } from "react";
import { Project, ModelItem } from "../../../store/main/types";
import { TOpenFrame, TBeamElement } from "../../../store/main/openFrameTypes";
import { DataState } from "../../../store/data/types";
import { ProjectUI } from "../../../store/ui/types";
import {
  revertColorOfElement,
  changeColorOFElement,
} from "../common/commonUtils";
import { drawOpenFrame, drawOpenFrameLoads } from "../openFrame";
import { Scene, Mesh } from "three";
import { MMtoM } from "../utils";

type Props = {
  model: TOpenFrame;
  ui: ProjectUI | undefined;
  project: Project;
  selected: ModelItem[] | undefined;
  scene: Scene;
  data: DataState;
};

export default function FactoryShedComponent({
  model,
  ui,
  project,
  selected,
  scene,
  data,
}: Props) {
  const [mesh, setMesh] = useState<Mesh>();

  const isStressCheck = useMemo(() => {
    return project.mode === "stressCheck";
  }, [project.mode]);

  const isDeflectionCheck = useMemo(() => {
    return project.mode === "deflectionCheck";
  }, [project.mode]);

  const loadings = useMemo(() => {
    return ui && project.settings.models.modelLoadings
      ? {
          deadLoads:
            ui.openFrameUI.loadingsUI.deadLoadUI.loads.filter(
              (l) => l.model === model.name
            ) ?? [],
          liveLoads:
            ui.openFrameUI.loadingsUI.liveLoadUI.loads.filter(
              (l) => l.model === model.name
            ) ?? [],
          equipmentLoads:
            ui.openFrameUI.loadingsUI.equipmentLoadUI.filter(
              (l) => l.model === model.name
            ) ?? [],
          pipingDirectLoads:
            ui.openFrameUI.loadingsUI.pipingLoadsUI.directLoads.filter(
              (l) => l.model === model.name
            ) ?? [],
          windLoads:
            ui.openFrameUI.loadingsUI.windLoadUI.loads.filter(
              (l) => l.model === model.name
            ) ?? [],
        }
      : null;
  }, [
    model.name,
    ui?.openFrameUI.loadingsUI.deadLoadUI,
    ui?.openFrameUI.loadingsUI.liveLoadUI,
    ui?.openFrameUI.loadingsUI.windLoadUI,
    ui?.openFrameUI.loadingsUI.pipingLoadsUI.directLoads,
    ui?.openFrameUI.loadingsUI.equipmentLoadUI,
    project.settings.models.modelLoadings,
  ]);

  const elements: TBeamElement[] = useMemo(() => {
    return [
      ...model.beams,
      ...model.cantilevers,
      ...model.columns,
      ...model.horizontalBracings,
      ...model.kneeBracings,
      ...model.verticalBracings,
      ...model.staircases,
    ];
  }, [
    model.beams,
    model.cantilevers,
    model.columns,
    model.horizontalBracings,
    model.kneeBracings,
    model.verticalBracings,
    model.staircases,
  ]);

  const fireProofing = useMemo(() => {
    return ui
      ? {
          thickness: ui.openFrameUI.loadingsUI.deadLoadUI.FPt,
          height: ui.openFrameUI.loadingsUI.deadLoadUI.FPh,
          elements:
            ui.openFrameUI.loadingsUI.deadLoadUI.FPto === "All elements",
          limit: MMtoM(ui.openFrameUI.loadingsUI.deadLoadUI.FPdl),
        }
      : undefined;
  }, [
    ui?.openFrameUI.loadingsUI.deadLoadUI.FPt,
    ui?.openFrameUI.loadingsUI.deadLoadUI.FPh,
    ui?.openFrameUI.loadingsUI.deadLoadUI.FPto,
    ui?.openFrameUI.loadingsUI.deadLoadUI.FPdl,
  ]);

  const modelAnalysis = useMemo(() => {
    return ui?.analysisUI[model.name];
  }, [ui?.analysisUI, model.name]);

  const { min, max } = useMemo(() => {
    let min = 0.3;
    let max = 1;
    if (ui?.designCodeAndParametersUI.designCode === "IS 800 : 2007 LSD") {
      min =
        ui.designCodeAndParametersUI.indianDesignCode.minStressRation ?? 0.3;
      max = ui.designCodeAndParametersUI.indianDesignCode.stressRation;
    } else if (ui?.designCodeAndParametersUI.designCode === "AISC LRFD") {
      min =
        ui.designCodeAndParametersUI.americanDesignCode.minStressRation ?? 0.3;
      max = ui.designCodeAndParametersUI.americanDesignCode.stressRation;
    }
    return { min, max };
  }, [
    ui?.designCodeAndParametersUI.designCode,
    ui?.designCodeAndParametersUI.indianDesignCode.minStressRation,
    ui?.designCodeAndParametersUI.indianDesignCode.stressRation,
    ui?.designCodeAndParametersUI.americanDesignCode.minStressRation,
    ui?.designCodeAndParametersUI.americanDesignCode.stressRation,
  ]);

  /**
   * Create OF
   */
  useEffect(() => {
    setMesh(drawOpenFrame(project, ui, model, data.font));
    return () => {
      setMesh(undefined);
    };
  }, [
    project.name,
    project.settings.models.axesHelper,
    project.settings.models.modelAxesHelpers,
    project.settings.models.platformTransparency,
    project.settings.analysis.transparensyOfColors,
    project.settings.analysis.showLabels,
    project.settings.analysis.showNodes,
    isDeflectionCheck,
    isStressCheck,
    modelAnalysis,
    fireProofing,
    min,
    max,
    model,
    scene,
    data.font,
  ]);

  useEffect(() => {
    if (!mesh) return;
    const materials = selected
      ?.filter((s) => s.model === model.name)
      .map((s) => changeColorOFElement(mesh, s));
    return () => {
      materials?.forEach((f) => revertColorOfElement(mesh, f));
    };
  }, [mesh, model.name, selected]);

  useEffect(() => {
    if (!loadings || !mesh || !data.font) return;
    const loadsGroup = drawOpenFrameLoads(elements, loadings, data.font);
    mesh.add(loadsGroup);
    return () => {
      mesh.remove(loadsGroup);
    };
  }, [mesh, elements, loadings, data.font]);

  /**
   * Add container to scene
   */
  useEffect(() => {
    if (!mesh) return;
    scene.add(mesh);
    return () => {
      scene.remove(mesh);
    };
  }, [scene, mesh]);

  return null;
}
