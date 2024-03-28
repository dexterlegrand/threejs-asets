import React from "react";
import { CustomDlg } from "../../../../common/CustomDlg";
import { useRecoilValue } from "recoil";
import OFCreationAtom from "../../../../../recoil/atoms/of-creation-atom";
import CreationTool from "./tool-button/CreationTool";
import AdditionalBeamParameters from "./dialogs/AdditionalBeamParameters";
import AdditionalPlatformParameters from "./dialogs/AdditionalPlatformParameters";
import AddicationVBracingParameters from "./dialogs/AddicationVBracingParameters";
import { Tooltip } from "@blueprintjs/core";
import { CustomTabsDlg } from "../../../../common/CustomTabsDlg";
import { ToolButton } from "../../../../process/ToolButton";
import AdditionalCableTrayParameters from "./dialogs/AdditionalCableTrayParameters";

export default React.memo(function OFCreationBar() {
  const OFCreationState = useRecoilValue(OFCreationAtom);
  const [id, setId] = React.useState(0);

  /*console.log(OFCreationState.type);*/
  const tabs = React.useMemo(() => {
    const tabs = [
      { id: 0, name: "Structure tools" },
      { id: 1, name: "Others" },
    ];
    return tabs;
  }, []);
  return (
    <>
      <CustomDlg
        title={"Structure Tools"}
        isMinimize={true}
        zIndex={5}
        idText="structure-tools-dialog"
        body={
          <>
            <CustomTabsDlg tabs={tabs} selected={id} onSelect={setId} />
            {id === 0 ? (
              <div className={"tools-body"}>
                <Tooltip content="Beam Element">
                  <CreationTool type={"BEAM"} />
                </Tooltip>
                <Tooltip content="Vertical Bracing">
                  <CreationTool type={"V-BRACING"} />
                </Tooltip>
                <Tooltip content="Horizontal Bracing">
                  <CreationTool type={"H-BRACING"} />
                </Tooltip>
                <Tooltip content="K Bracing">
                  <CreationTool type={"K-BRACING"} />
                </Tooltip>
                <Tooltip content="Platform">
                  <CreationTool type={"PLATFORM"} />
                </Tooltip>
                <Tooltip content="Cable tray">
                  <CreationTool type={"CABLE-TRAY"} />
                </Tooltip>
              </div>
            ) : (
              <div key={"cabel-elements"} className={"tools-body"}>
                <Tooltip content="Tree">
                  <CreationTool type={"TREE"} draggable />
                </Tooltip>
                <Tooltip content="Lamp">
                  <CreationTool type={"LAMP"} draggable />
                </Tooltip>
              </div>
            )}
          </>
        }
      />
      {OFCreationState.type === "BEAM" ||
      OFCreationState.type === "H-BRACING" ||
      OFCreationState.type === "K-BRACING" ? (
        <AdditionalBeamParameters />
      ) : null}
      {OFCreationState.type === "V-BRACING" ? (
        <AddicationVBracingParameters />
      ) : null}
      {OFCreationState.type === "PLATFORM" ? (
        <AdditionalPlatformParameters />
      ) : null}
      {OFCreationState.type === "CABLE-TRAY" ? (
        <AdditionalCableTrayParameters />
      ) : null}
    </>
  );
});
