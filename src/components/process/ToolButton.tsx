import React, { useEffect, useMemo, useState } from "react";
import { useRecoilState } from "recoil";
import { mousePipeCreating } from "../../recoil/atoms/process-atoms";
import {
  ECabelElementType,
  EConnectionElementType,
  EInstrumentationElementType,
  EPipeElementType,
  EProcessElementType,
  ERoadElementType,
} from "../../store/process/types";
import { getLocalStorageImage, getLocalStorageSTL } from "../3d-models/utils";
import "./ToolButton.css";

type Props = {
  type:
    | "process"
    | "instrumentation"
    | "pipe-elements"
    | "connections"
    | "road";
  subtype:
    | EProcessElementType
    | EInstrumentationElementType
    | EPipeElementType
    | ECabelElementType
    | EConnectionElementType
    | ERoadElementType;
  draggable?: boolean;
  disabled?: boolean;
  tooltip?: string;
  idText?: string;
};

export function ToolButton({
  type,
  subtype,
  draggable = true,
  disabled = false,
  tooltip,
  idText,
}: Props) {
  const [png, setPng] = useState("");

  const [MPCState, setMPCState] = useRecoilState(mousePipeCreating);

  const className = useMemo(() => {
    return `process-tool-element ${draggable ? "draggable" : ""} ${
      MPCState.processPipeElement === subtype ? "active" : ""
    } ${disabled ? "disabled" : ""}`;
  }, [MPCState.processPipeElement, draggable, disabled, subtype]);

  useEffect(() => {
    setPng(localStorage.getItem(`${type}/${subtype}.png`) || "");
    // if (subtype) getLocalStorageSTL(`stl/${subtype}.stl`);
    getLocalStorageImage(`${type}/${subtype}.png`).then(
      (data) => data && setPng(data)
    );
  }, [type, subtype]);

  function handleDragStart(event: React.DragEvent<HTMLDivElement>) {
    if (disabled) return;
    event.dataTransfer.setData("text/html", `${type}&${subtype}`);
  }

  function handleSelect() {
    if (draggable || disabled) return;
    setMPCState({
      pipeSegmentParams: MPCState.pipeSegmentParams,
      processPipeElement:
        MPCState.processPipeElement !== subtype
          ? (subtype as EPipeElementType | EConnectionElementType)
          : undefined,
      connectionSegmentParams: MPCState.connectionSegmentParams,
    });
  }

  return (
    <div
      className={className}
      style={{ position: 'relative', padding:'5px' }}
      draggable={draggable}
      onDragStart={handleDragStart}
      onClick={handleSelect}
      data-tooltip={tooltip}
      id={idText}
    >
      <div>
        <img src={png} alt={subtype} />
        <div />
      </div>
    </div>
  );
}
