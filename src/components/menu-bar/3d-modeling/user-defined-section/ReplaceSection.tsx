import React, { useState, useEffect, useMemo } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import { Button, FormGroup } from "@blueprintjs/core";
import { SimpleSelector } from "../../../common/SimpleSelector";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import { Section } from "../../../../store/data/types";
import { getCurrentUI } from "../../../3d-models/utils";

type Props = {
  profile: string;
  onClose: () => any;
  onConfirm: (profile: Section) => any;
};

export function ReplaceSection(props: Props) {
  const { profile, onClose, onConfirm } = props;

  const [lib, setLib] = useState<string>();
  const [newProfile, setNewProfile] = useState<Section>();

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const libs = useSelector(
    (state: ApplicationState) => state.data.CS_Libraries
  );
  const profileSectionData = useSelector(
    (state: ApplicationState) => state.data.profileSectionData
  );
  const fabricatedSections = useSelector(
    (state: ApplicationState) => state.main.fabricatedSections
  );
  const rolledSections = useSelector(
    (state: ApplicationState) => state.main.rolledSections
  );
  const combinedSections = useSelector(
    (state: ApplicationState) => state.main.combinedSections
  );

  const profiles = useMemo(() => {
    return [
      ...(ui?.availableData?.profileSectionData ?? []),
      ...fabricatedSections,
      ...rolledSections,
      ...combinedSections,
    ];
  }, [ui, fabricatedSections, rolledSections, combinedSections]);

  useEffect(() => {
    setLib(undefined);
    setNewProfile(undefined);
  }, [profile]);

  function handleConfirm() {
    newProfile && onConfirm(newProfile);
  }

  return (
    <CustomDlg
      title={`Replace profile "${profile}"`}
      zIndex={3}
      onClose={onClose}
      body={
        <div className={"d-flex f-column f-grow"}>
          <FormGroup label={"C/S Library"}>
            <SimpleSelector
              items={libs}
              selected={lib}
              itemLabel={(item) => item}
              onSelect={setLib}
              className={"fill-select"}
            />
          </FormGroup>
          <FormGroup label={"New Profile"}>
            <SimpleSelector
              items={profiles.filter(
                (item) => (item.country_code?.trim() ?? "") === lib?.trim()
              )}
              selected={newProfile}
              itemLabel={(item) => item.designation}
              onSelect={setNewProfile}
              className={"fill-select"}
              filter={(query, item) =>
                query
                  ? item.designation
                      .toLocaleLowerCase()
                      .includes(query.toLocaleLowerCase())
                  : true
              }
            />
          </FormGroup>
        </div>
      }
      actions={
        <>
          <Button text={"Cancel"} onClick={onClose} />
          <Button
            text={"Ok"}
            onClick={handleConfirm}
            intent={"primary"}
            disabled={!newProfile}
          />
        </>
      }
    />
  );
}
