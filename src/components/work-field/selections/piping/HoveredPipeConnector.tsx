import React, { useMemo } from "react";
import { Icon } from "@blueprintjs/core";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import { TPipingElbow } from "../../../../store/data/types";
import { Project } from "../../../../store/main/types";

type Props = {
  project: Project | undefined;
};

export function HoveredPipeConnector({ project }: Props) {
  const selected = useSelector((state: ApplicationState) => state.selections.hoveredPipeConnector);

  const name = useMemo(() => {
    if (!selected) return "";
    return `${(selected.connector as TPipingElbow).isUser ? "UDE - " : ""}${
      selected.connector.nps
    } - ${selected.connector.schedule} - ${
      (selected.connector as TPipingElbow).degree
        ? `${(selected.connector as TPipingElbow).degree} - `
        : ""
    }${selected.connector.material}`;
  }, [selected]);

  const pipes = useMemo(() => {
    return project?.freePipes ?? [];
  }, [project]);

  const prev = useMemo(() => {
    if (!selected) return undefined;
    return pipes.find((p) => p.pipe === selected.prev);
  }, [selected, pipes]);

  const nexts = useMemo(() => {
    if (!selected) return [];
    return pipes.filter((p) => selected.nexts.includes(p.pipe));
  }, [selected, pipes]);

  return selected ? (
    <div className={"model-item-drawer"}>
      <div className={"header"}>
        <div className={"d-flex f-center"}>
          <Icon icon="info-sign" className={"m-5"} />
          <h2 className={"no-m"}>Element name: {name}</h2>
        </div>
      </div>
      <div className={"body-grid full"}>
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light"}>Line No.: </div>
        </div>
        <div className="d-flex f-ai-center">{selected.lineNo}</div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light"}>Previous Pipe: </div>
        </div>
        <div className="d-flex f-ai-center">{prev?.pipe}</div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light"}>Next Pipes: </div>
        </div>
        <div className="d-flex f-ai-center">{selected.nexts.join(", ")}</div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light"}>Type: </div>
        </div>
        <div className="d-flex f-ai-center">{selected.type}</div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc">Connector: </div>
        </div>
        <div className="d-flex f-ai-center">
          {`${(selected.connector as TPipingElbow).isUser ? "UDE - " : ""}${
            selected.connector.nps
          } - ${selected.connector.schedule} - ${
            (selected.connector as TPipingElbow).degree
              ? `${(selected.connector as TPipingElbow).degree} - `
              : ""
          }${selected.connector.material}`}
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">Plan Direction: </div>
        </div>
        <div className={"d-flex f-ai-center"}>
          {nexts[0]?.hDir ?? prev?.hNextDir}
          <div className="label-light">deg</div>
        </div>

        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc t-end">Elevation Direction: </div>
        </div>
        <div className={"d-flex f-ai-center"}>
          {nexts[0]?.vDir ?? prev?.vNextDir}

          <div className="label-light">deg</div>
        </div>
      </div>
    </div>
  ) : null;
}
