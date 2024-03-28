import React, { useState, useEffect, useMemo } from "react";
import { PipeRack, Project, ModelItem, Accessory } from "../../../store/main/types";
import { ProjectUI } from "../../../store/ui/types";
import { DataState } from "../../../store/data/types";
import { Scene, Mesh } from "three";
import { changeColorOFElement, revertColorOfElement } from "../common/commonUtils";
import { drawPipeRackObject } from "./pipeRackModeling";
import { drawPipeRackLoads } from "./pipeRackUtils";

type Props = {
  model: PipeRack;
  ui: ProjectUI | undefined;
  project: Project;
  selected: ModelItem[] | undefined;
  scene: Scene;
  data: DataState;
};

export default function PipeRackComponent({ data, model, project, scene, selected, ui }: Props) {
  const [mesh, setMesh] = useState<Mesh>();

  const isStressCheck = useMemo(() => {
    return project.mode === "stressCheck";
  }, [project.mode]);

  const isDeflectionCheck = useMemo(() => {
    return project.mode === "deflectionCheck";
  }, [project.mode]);

  const modelAnalysis = useMemo(() => {
    return ui?.analysisUI[model.name];
  }, [ui?.analysisUI, model.name]);

  const { min, max } = useMemo(() => {
    let min = 0.3;
    let max = 1;
    if (project.designCode === "IS 800 : 2007 LSD") {
      min = project.indianDesignCode.minStressRation ?? 0.3;
      max = project.indianDesignCode.stressRation;
    } else if (ui?.designCodeAndParametersUI.designCode === "AISC LRFD") {
      min = project.americanDesignCode.minStressRation ?? 0.3;
      max = project.americanDesignCode.stressRation;
    }
    return { min, max };
  }, [project.designCode, project.indianDesignCode, project.americanDesignCode]);

  const elements = useMemo(() => {
    return [
      ...model.columns,
      ...model.beams,
      ...model.cantilevers,
      ...getAccessoryElements(model.accessories),
    ];
  }, [
    model.beams,
    model.cantilevers,
    model.columns,
    model.accessories,
  ]);


  useEffect(() => {
    setMesh(drawPipeRackObject(project, model, ui, data.font));
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
    project.ladderParams,
    isDeflectionCheck,
    isStressCheck,
    modelAnalysis,
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
    if (!mesh || !data.font) return;
    const loadsGroup = drawPipeRackLoads(elements, data.font);
    mesh.add(loadsGroup);
    return () => {
      mesh.remove(loadsGroup);
    };
  }, [mesh, elements, data.font]);

  /**
   * Add model to scene
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

function getAccessoryElements(accessory: Accessory[]) {
  let elements: any[] = [];
  accessory.forEach((ag) => {
    ag.elements.forEach((el) => {
      elements = [...elements, ...el.colItems, ...el.beamItems];
    });
  });
  return elements;
}