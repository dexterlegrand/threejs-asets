import React from "react";
import { useRecoilState } from "recoil";
import { CustomDlg } from "../../../../../common/CustomDlg";
import { SimpleNumericInput } from "../../../../../common/SimpleNumericInput";
import OFCreationAtom from "../../../../../../recoil/atoms/of-creation-atom";
import { SimpleSelector } from "../../../../../common/SimpleSelector";

export default React.memo(function AdditionalRoadParameters() {
  const [OFCreationState, setOFCreationState] = useRecoilState(OFCreationAtom);

  return (
    <CustomDlg
      zIndex={10}
      isMinimize={true}
      title={`Additional ${
        OFCreationState.type === "ROAD"
          ? "Road"
          : OFCreationState.type === "DRAIN"
          ? "Drain"
          : "Tranch"
      } Parameters`}
      body={
        <div className="d-flex f-grow f-column bg-dark">
          <div className="hr" />
          <div className="p-5">
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                Thickness (mm)
              </div>
              <SimpleNumericInput
                min={1}
                value={OFCreationState.thickness ?? 1}
                onChange={(thickness) =>
                  setOFCreationState((prev) => ({ ...prev, thickness }))
                }
              />
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                Width (mm)
              </div>
              <SimpleNumericInput
                min={1}
                value={OFCreationState.width ?? 1000}
                onChange={(width) =>
                  setOFCreationState((prev) => ({ ...prev, width }))
                }
              />
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                Routing
              </div>
              <SimpleSelector<string>
                items={["AUTO", "MANUAL"]}
                selected={OFCreationState.routing}
                onSelect={(routing: any) =>
                  setOFCreationState((prev) => ({ ...prev, routing }))
                }
                autoFocus={true}
                itemLabel={(val) => val}
                className={`fill-select w-150`}
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
          bracingType: prev.bracingType,
          routing: prev.routing,
        }))
      }
    />
  );
});
