import React, { useState, useEffect } from "react";
import {
  Side,
  BracingType,
  BracingParams,
  PipeRackVBracing,
} from "../../../../../store/main/types";
import { SelectorCell } from "../../../../common/SelectorCell";
import { bracingTypes } from "../../../../../store/main/constants";
import { MultiSelectorCell } from "../../../../common/MultiSelectorCell";
import { Button } from "@blueprintjs/core";
import { useDispatch } from "react-redux";
import { confirmAction } from "../../../../../store/ui/actions";
import { Section } from "../../../../../store/data/types";

type Props = {
  bracings: PipeRackVBracing[];
  tiers: number[];
  side: Side | "Both";
  CS_Libraries: string[];
  profiles: Section[];
  onChange: (bracing: BracingParams) => any;
  onClear: (side: Side | "Both") => any;
};

export function VerticalBracing(props: Props) {
  const { bracings, tiers, side, CS_Libraries, profiles, onChange, onClear } = props;

  const [init, setInit] = useState<boolean>(true);
  const [type, setType] = useState<BracingType>();
  const [selectedTiers, setSelectedTiers] = useState<number[]>([]);
  const [CSLibrary, setCSLibrary] = useState<string>();
  const [profile, setProfile] = useState<Section>();

  const dispatch = useDispatch();

  useEffect(() => {
    setType(bracings[0]?.bracingType);
    setCSLibrary(bracings[0]?.CSLibrary);
    setProfile(bracings[0]?.profile);
    const tiers: number[] = [];
    bracings.forEach((bracing) => {
      if (!tiers.includes(bracing.tier)) tiers.push(bracing.tier);
    });
    setSelectedTiers(tiers);
  }, [bracings]);

  useEffect(() => {
    if (!init) {
      if (type && selectedTiers.length && CSLibrary && profile && !equal()) {
        onChange({
          bracingType: type,
          sideType: side,
          tiers: selectedTiers,
          CSLibrary,
          profile,
        });
      }
    } else setInit(false);
  }, [type, selectedTiers, CSLibrary, profile]);

  function equal() {
    if (!bracings[0]) return false;
    if (bracings[0].bracingType !== type) return false;
    if (bracings[0].CSLibrary !== CSLibrary) return false;
    if (bracings[0].profile !== profile) return false;
    const tiers: number[] = [];
    bracings.forEach((bracing) => {
      if (!tiers.includes(bracing.tier)) tiers.push(bracing.tier);
    });
    if (tiers.length !== selectedTiers.length) return false;
    for (let i = 0; i < tiers.length; i++) {
      if (!selectedTiers.includes(tiers[i])) return false;
    }
    return true;
  }

  function handleClear() {
    dispatch(
      confirmAction({
        message: "Are you sure you want to delete this entry?",
        onConfirm: () => onClear(side),
      })
    );
  }

  return (
    <>
      <td className="w-50" style={{ borderLeft: "unset" }}>
        <div className="d-flex">
          <div className="d-flex f-grow f-center" style={{ padding: "0 5px" }}>
            {side}
          </div>
          {bracings[0] && <Button icon="cross" minimal onClick={handleClear} />}
        </div>
      </td>
      <SelectorCell<BracingType>
        items={bracingTypes}
        selected={type}
        onSelect={setType}
        itemKey={(item) => item}
        itemLabel={(item) => item}
        className="w-130"
        filterable={false}
      />
      <MultiSelectorCell<number>
        items={tiers}
        selected={selectedTiers}
        itemKey={(item) => item}
        itemLabel={(item) => `${item + 1}`}
        className="w-70"
        onSelect={setSelectedTiers}
      />
      <SelectorCell<string>
        items={CS_Libraries}
        selected={CSLibrary}
        onSelect={setCSLibrary}
        itemKey={(item) => item}
        itemLabel={(item) => item}
        className="w-130"
        filterable={false}
      />
      <SelectorCell<Section>
        items={profiles.filter((profile) => profile.country_code === CSLibrary)}
        selected={profile}
        onSelect={setProfile}
        itemKey={(item) => item.profile_section_id}
        itemLabel={(item) => item.designation}
        className="w-130"
        filterable={true}
        filter={(query, item) =>
          query ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase()) : true
        }
      />
    </>
  );
}
