import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Button, Icon } from "@blueprintjs/core";
import { ModelItem, Project } from "../../store/main/types";
import { selectModelItem } from "../../store/selections/actions";
import { ProjectUI } from "../../store/ui/types";
import { confirmAction } from "../../store/ui/actions";
import { removeElementsFromOpenFrame } from "../3d-models/openFrame";

type Props = {
  ui: ProjectUI | undefined;
  items: ModelItem[];
  project: Project | undefined;
};

export function SelectedElements({ ui, items, project }: Props) {
  const [toChangingElevations, setToChangingElevations] = useState<string[]>([]);

  const dispatch = useDispatch();

  function getBody(elements: ModelItem[]) {
    const map = new Map<string, ModelItem[]>();
    for (const el of elements) {
      const els = map.get(el.model);
      if (els) {
        map.set(el.model, [...els, el]);
      } else {
        map.set(el.model, [el]);
      }
    }
    return Array.from(map.entries()).map(([model, els]) => {
      const tCE = toChangingElevations.includes(model);
      return (
        <div key={model} className={"d-flex f-column"}>
          <div>
            <h2 className={"p-5 no-m"}>Model name: {model}</h2>
            {/* <Button
              minimal
              icon={"arrows-vertical"}
              onClick={() => {
                if (tCE) {
                  setToChangingElevations(
                    toChangingElevations.filter((item) => item !== model)
                  );
                } else {
                  setToChangingElevations([...toChangingElevations, model]);
                }
              }}
            /> */}
          </div>
          {els.map((el, i) => (
            <h3 key={i} className={"no-m"} style={{ paddingLeft: 10 }}>
              Element name: {el.name}
            </h3>
          ))}
        </div>
      );
    });
  }

  function handleRemove() {
    if (!ui) return;
    dispatch(
      confirmAction({
        message: "Are you sure you want to delete the selected items?",
        onConfirm: () => {
          if (project?.modelType === "Open Frame") {
            removeElementsFromOpenFrame(dispatch, ui.openFrameUI, project, items);
            dispatch(selectModelItem());
          }
        },
      })
    );
  }

  function handleClose() {
    dispatch(selectModelItem());
  }

  return items.length > 1 ? (
    <div className={"model-item-drawer"}>
      <div className={"header"}>
        <div className={"d-flex f-center"}>
          <Icon icon="info-sign" className={"m-5"} />
          <h2 className={"no-m"}>Selected Elements:</h2>
        </div>
        <Button large minimal icon={"cross"} onClick={handleClose} intent={"danger"} />
      </div>
      <div className={"body"}>{getBody(items)}</div>
      <Button
        large
        fill
        text={"Remove"}
        intent={"danger"}
        onClick={handleRemove}
        disabled={project?.modelType !== "Open Frame"}
      />
    </div>
  ) : null;
}
