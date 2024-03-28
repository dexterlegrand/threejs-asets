import { Tooltip } from "@blueprintjs/core";
import React, { useCallback, useMemo } from "react";
import { useRecoilState } from "recoil";
import {
  beamConnections,
  TBeamConnections,
} from "../../../../recoil/atoms/beam-connections-atom";
import { CustomDlg } from "../../../common/CustomDlg";

type TAnchor = "BP" | "SF" | "BB" | "BC" | "HB" | "VB" | "KB";

export default function ToolBar() {
  const [BCS, setBCS] = useRecoilState(beamConnections);

  const handleSelect = useCallback((anchor: TAnchor) => {
    setBCS((prev) => ({
      type: prev.type,
      subtype: prev.subtype,
      anchor,
    }));
  }, []);

  return (
    <CustomDlg
      onClose={() => setBCS({})}
      title={"Beam connections"}
      isMinimize={true}
      zIndex={5}
      body={
        <div className={"tools-body"}>
          <Tool
            BCS={BCS}
            type={"BP"}
            title={"Base Plates"}
            handleSelect={handleSelect}
          />
          <Tool
            BCS={BCS}
            type={"SF"}
            title={"Splice Flanges"}
            handleSelect={handleSelect}
          />
          <Tool
            BCS={BCS}
            type={"BB"}
            title={"Beam to Beam"}
            handleSelect={handleSelect}
          />
          <Tool
            BCS={BCS}
            type={"BC"}
            title={"Beam to Column"}
            handleSelect={handleSelect}
          />
          <Tool
            BCS={BCS}
            type={"HB"}
            title={"Horizontal Bracings"}
            handleSelect={handleSelect}
          />
          <Tool
            BCS={BCS}
            type={"VB"}
            title={"Vertical Bracings"}
            handleSelect={handleSelect}
          />
          <Tool
            BCS={BCS}
            type={"KB"}
            title={"Knee Bracings"}
            handleSelect={handleSelect}
          />
        </div>
      }
    />
  );
}

type ToolProps = {
  BCS: TBeamConnections;
  type: TAnchor;
  title: string;
  handleSelect: (type: TAnchor) => any;
};

function Tool({ BCS, type, title, handleSelect }: ToolProps) {
  const className = useMemo(() => {
    return `process-tool-element ${BCS.anchor === type ? "active" : ""}`;
  }, [BCS.anchor, type]);

  return (
    <Tooltip position="bottom" content={title}>
      <div className={className} onClick={() => handleSelect(type)}>
        <div className="d-flex f-center">
          <span style={{ fontWeight: "bold", color: "#4b4b4b" }}>{type}</span>
        </div>
      </div>
    </Tooltip>
  );
}
