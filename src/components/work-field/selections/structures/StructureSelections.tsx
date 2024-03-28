import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import { getCurrentProject, getCurrentUI } from "../../../3d-models/utils";
import { HoveredMember } from "./HoveredMember";
import { SelectedElement } from "../../SelectedElement";
import { SelectedElements } from "../../SelectedElements";
import SelectedPlatform from "./SelectedPlatform";

export default function StructureSelections() {
  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const project = useSelector((state: ApplicationState) => getCurrentProject(state));
  const items = useSelector((state: ApplicationState) => state.selections.selectedItems);

  const item = useMemo(() => {
    return items && items.length === 1 ? items[0] : undefined;
  }, [items]);

  const models = useMemo(() => {
    return project?.models ?? [];
  }, [project]);

  return (
    <>
      <SelectedElement item={item} ui={ui} project={project} models={models} />
      <SelectedElements items={items ?? []} ui={ui} project={project} />
      <SelectedPlatform />

      <HoveredMember />
    </>
  );
}
