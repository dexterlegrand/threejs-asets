import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import { Project } from "../../../store/main/types";
import { DataState } from "../../../store/data/types";
import { getCurrentUI } from "../utils";
import { getFSModels, getOFModels } from "../openFrame";
import FactoryShedComponent from "./FactoryShedComponent";

type Props = {
  project: Project;
  data: DataState;
};

export default function FactoryShedsContainer({ project, data }: Props) {
  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const scene = useSelector((state: ApplicationState) => state.main.scene);
  const selected = useSelector(
    (state: ApplicationState) => state.selections.selectedItems
  );

  const models = useMemo(() => {
    return getFSModels(project);
  }, [project]);

  function generateOpenFrames() {
    return models.map((m, i) => {
      return (
        <FactoryShedComponent
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

  return <>{generateOpenFrames()}</>;
}
