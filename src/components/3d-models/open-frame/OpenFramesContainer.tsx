import React, { useEffect, useMemo } from "react";
import { useRecoilState } from "recoil";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import { Project } from "../../../store/main/types";
import { DataState } from "../../../store/data/types";
import { getCurrentProject, getCurrentUI } from "../utils";
import { getOFModels } from "../openFrame";
import {
  createAnchors,
  createElement,
} from "../../../services/of-services/elements-creation-service";
import OpenFrameComponent from "./OpenFrameComponent";
import OFCreationAtom from "../../../recoil/atoms/of-creation-atom";

type Props = {
  project: Project;
  data: DataState;
};

export default React.memo(function OpenFramesContainer({
  project,
  data,
}: Props) {
  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const scene = useSelector((state: ApplicationState) => state.main.scene);
  const selected = useSelector(
    (state: ApplicationState) => state.selections.selectedItems
  );
  const currentProject = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );
  const dispatch = useDispatch();

  const [OFCreationState, setOFCreationState] = useRecoilState(OFCreationAtom);

  const models = useMemo(() => {
    return getOFModels(project);
  }, [project]);

  function generateOpenFrames() {
    return models.map((m, i) => {
      return (
        <OpenFrameComponent
          key={`${m.name}-${i}`}
          model={m}
          ui={ui}
          selected={selected}
          project={project}
          scene={scene}
          data={data}
          ofCreationState={OFCreationState}
        />
      );
    });
  }

  useEffect(() => {
    if (
      !OFCreationState.fromElementType ||
      OFCreationState.toElement ||
      OFCreationState.toPoint
      // &&
      // OFCreationState.type !== "ROAD" && OFCreationState.type !== "DRAIN"
    )
      return;
    const anchors = createAnchors(OFCreationState);
    scene.add(...anchors);
    return () => {
      scene.remove(...anchors);
    };
  }, [OFCreationState]);

  useEffect(() => {
    if (
      !OFCreationState.fromElement ||
      !(OFCreationState.toElement || OFCreationState.toPoint)
    )
      return;
    getOFModels(project).length > 0 &&
      createElement(
        ui,
        getOFModels(project),
        OFCreationState,
        setOFCreationState,
        dispatch
      );
  }, [ui, OFCreationState]);

  return <>{generateOpenFrames()}</>;
});
