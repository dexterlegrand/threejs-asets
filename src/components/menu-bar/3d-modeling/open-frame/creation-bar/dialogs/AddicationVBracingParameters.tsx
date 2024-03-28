import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { useRecoilState } from "recoil";
import { ApplicationState } from "../../../../../../store";
import { getCurrentUI } from "../../../../../3d-models/utils";
import { CustomDlg } from "../../../../../common/CustomDlg";
import { SimpleSelector } from "../../../../../common/SimpleSelector";
import { Section } from "../../../../../../store/data/types";
import OFCreationAtom from "../../../../../../recoil/atoms/of-creation-atom";
import { BracingType } from "../../../../../../store/main/types";

export default React.memo(function AddicationVBracingParameters() {
  const fabricatedSections = useSelector(
    (state: ApplicationState) => state.main.fabricatedSections
  );
  const rolledSections = useSelector(
    (state: ApplicationState) => state.main.rolledSections
  );
  const combinedSections = useSelector(
    (state: ApplicationState) => state.main.combinedSections
  );
  const CS_Libraries = useSelector(
    (state: ApplicationState) => state.data.CS_Libraries
  );

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const profiles = useMemo(() => {
    return ui?.availableData?.profileSectionData ?? [];
  }, [ui?.availableData?.profileSectionData]);

  const allProfiles = useMemo(() => {
    return [
      ...profiles,
      ...fabricatedSections,
      ...rolledSections,
      ...combinedSections,
    ];
  }, [profiles, fabricatedSections, rolledSections, combinedSections]);

  const libs = useMemo(() => {
    const libs = [
      ...CS_Libraries.filter((lib) =>
        profiles.some((profile) => (profile.country_code?.trim() ?? "") === lib)
      ),
    ];
    if (fabricatedSections.length) libs.push("Fabricated");
    if (rolledSections.length) libs.push("Rolled");
    if (combinedSections.length) libs.push("Combined");
    return libs;
  }, [
    fabricatedSections,
    rolledSections,
    combinedSections,
    CS_Libraries,
    profiles,
  ]);

  const [OFCreationState, setOFCreationState] = useRecoilState(OFCreationAtom);

  return (
    <CustomDlg
      zIndex={10}
      isMinimize={true}
      title={"Additional Beam Parameters"}
      body={
        <div className="d-flex f-grow f-column bg-dark">
          <div className="hr" />
          <div className="p-5">
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                С/S Lib.
              </div>
              <SimpleSelector<string>
                items={libs}
                selected={OFCreationState.lib}
                onSelect={(lib) =>
                  setOFCreationState((prev) => ({ ...prev, lib }))
                }
                autoFocus={true}
                itemLabel={(val) => val}
                className={`fill-select w-150`}
              />
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                Profile
              </div>
              <SimpleSelector<Section>
                items={
                  OFCreationState.lib
                    ? allProfiles.filter(
                        (p) => p.country_code === OFCreationState.lib
                      )
                    : []
                }
                selected={OFCreationState.profile}
                onSelect={(profile) =>
                  setOFCreationState((prev) => ({ ...prev, profile }))
                }
                autoFocus={true}
                itemLabel={(val) => val.designation}
                className={`fill-select w-150`}
              />
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="label-light p-start-10" style={{ minWidth: 100 }}>
                Type
              </div>
              <SimpleSelector<BracingType>
                items={[
                  "X Bracing",
                  "Triangular Up",
                  "Triangular Down",
                  "Diagonal Up",
                  "Diagonal Down",
                ]}
                selected={OFCreationState.bracingType}
                onSelect={(bracingType) =>
                  setOFCreationState((prev) => ({ ...prev, bracingType }))
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
                  From Column: {OFCreationState.fromElement}
                </div>
              </div>
            ) : null}
            {OFCreationState.toElement ? (
              <div className={"d-flex f-ai-center bg-gray p-end-10"}>
                <div
                  className="label-light p-start-10"
                  style={{ minWidth: 100 }}
                >
                  To Column: {OFCreationState.toElement}
                </div>
              </div>
            ) : null}
            {OFCreationState.fromSecondElement ? (
              <div className={"d-flex f-ai-center bg-gray p-end-10"}>
                <div
                  className="label-light p-start-10"
                  style={{ minWidth: 100 }}
                >
                  From Beam: {OFCreationState.fromSecondElement}
                </div>
              </div>
            ) : null}
            {OFCreationState.toSecondElement ? (
              <div className={"d-flex f-ai-center bg-gray p-end-10"}>
                <div
                  className="label-light p-start-10"
                  style={{ minWidth: 100 }}
                >
                  To Beam: {OFCreationState.toSecondElement}
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
