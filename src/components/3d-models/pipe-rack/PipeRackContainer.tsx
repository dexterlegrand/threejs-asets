import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import { Project } from "../../../store/main/types";
import { DataState } from "../../../store/data/types";
import { getPRModels } from "./pipeRackUtils";
import { getCurrentUI } from "../utils";
import PipeRackComponent from "./PipeRackComponent";
import { useRecoilState } from "recoil";
import OFCreationAtom from "../../../recoil/atoms/of-creation-atom";
import { createElement } from "../../../services/of-services/elements-creation-service";

type Props = {
  project: Project;
  data: DataState;
};

export default function PipeRackContainer({ project, data }: Props) {
  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const scene = useSelector((state: ApplicationState) => state.main.scene);
  const selected = useSelector(
    (state: ApplicationState) => state.selections.selectedItems
  );

  const dispatch = useDispatch();

  const [OFCreationState, setOFCreationState] = useRecoilState(OFCreationAtom);

  const models = useMemo(() => {
    return getPRModels(project);
  }, [project]);

  function generatePipeRacks() {
    return models.map((m, i) => {
      return (
        <PipeRackComponent
          key={`${m.name}-${i}`}
          model={m}
          ui={ui}
          selected={selected}
          project={project}
          scene={scene}
          data={data}
        />
      );
    });
  }

  useEffect(() => {
    if (
      !OFCreationState.fromElement ||
      !(OFCreationState.toElement || OFCreationState.toPoint)
    )
      return;
    models.length > 0 &&
      createElement(
        undefined,
        models,
        OFCreationState,
        setOFCreationState,
        dispatch
      );
  }, [models, OFCreationState]);

  return <>{generatePipeRacks()}</>;
}
