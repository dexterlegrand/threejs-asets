import React from "react";
import { useRecoilState } from "recoil";
import { CustomDlg } from "../../../../../common/CustomDlg";
import { SimpleNumericInput } from "../../../../../common/SimpleNumericInput";
import OFCreationAtom from "../../../../../../recoil/atoms/of-creation-atom";

export default React.memo(function AdditionalPlatformParameters() {
  const [OFCreationState, setOFCreationState] = useRecoilState(OFCreationAtom);

  return (
    <CustomDlg
      zIndex={10}
      isMinimize={true}
      title={"Additional Platform Parameters"}
      body={
        <div className="d-flex f-grow f-column bg-dark">
          <div className="hr" />
          <div className="p-5">
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                Distance (mm)
              </div>
              <SimpleNumericInput
                min={0}
                value={(OFCreationState.distance ?? 0) * 1000}
                onChange={(distance) =>
                  setOFCreationState((prev) => ({
                    ...prev,
                    distance: distance / 1000,
                  }))
                }
              />
            </div>
            {OFCreationState.model ? (
              <div className={"d-flex f-ai-center bg-gray p-end-10"}>
                <div
                  className="label-light p-start-10"
                  style={{ minWidth: 100 }}
                >
                  Model: {OFCreationState.model}
                </div>
              </div>
            ) : null}
            {OFCreationState.fromElement ? (
              <div className={"d-flex f-ai-center bg-gray p-end-10"}>
                <div
                  className="label-light p-start-10"
                  style={{ minWidth: 100 }}
                >
                  From: {OFCreationState.fromElement}
                </div>
              </div>
            ) : null}
            {OFCreationState.toElement ? (
              <div className={"d-flex f-ai-center bg-gray p-end-10"}>
                <div
                  className="label-light p-start-10"
                  style={{ minWidth: 100 }}
                >
                  To: {OFCreationState.toElement}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      }
      onClose={() =>
        setOFCreationState((prev) => ({
          type: undefined,
          lib: prev.lib,
          profile: prev.profile,
          thickness: prev.thickness,
          distance: prev.distance,
          bracingType: prev.bracingType,
          routing: prev.routing,
        }))
      }
    />
  );
});
