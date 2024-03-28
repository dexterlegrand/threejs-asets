import React, { useState, useEffect } from "react";
import {
  Side,
  UserDirection,
  CantileverParams,
  PipeRackPortal,
  PipeRackCantilever,
} from "../../../../../store/main/types";
import { MultiSelectorCell } from "../../../../common/MultiSelectorCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { NumericCell } from "../../../../common/NumericCell";
import { Button } from "@blueprintjs/core";
import { useDispatch } from "react-redux";
import { confirmAction } from "../../../../../store/ui/actions";
import { Section } from "../../../../../store/data/types";

type Props = {
  cantilevers: PipeRackCantilever[];
  index: number;
  portals: PipeRackPortal[];
  tiers: number[];
  side: Side | "Both";
  CS_Libraries: string[];
  profiles: Section[];
  onChange: (params: CantileverParams) => any;
  onClear: (position: UserDirection | "Outsides") => any;
};

export function Cantilever({
  cantilevers,
  index,
  portals,
  tiers,
  side,
  CS_Libraries,
  profiles,
  onChange,
  onClear,
}: Props) {
  const [init, setInit] = useState<boolean>(true);
  const [selectedTiers, setSelectedTiers] = useState<number[]>([]);
  const [position, setPosition] = useState<UserDirection | "Outsides">();
  const [CSLibrary, setCSLibrary] = useState<string>();
  const [profile, setProfile] = useState<Section>();
  const [length, setLength] = useState<number>(0);

  const dispatch = useDispatch();

  useEffect(() => {
    setPosition(cantilevers[0]?.positionType);
    setCSLibrary(cantilevers[0]?.CSLibrary);
    setProfile(cantilevers[0]?.profile);
    setLength(cantilevers[0]?.length);
    const tiers: number[] = [];
    cantilevers.forEach((cantilever) => {
      if (!tiers.includes(cantilever.tier)) tiers.push(cantilever.tier);
    });
    setSelectedTiers(tiers);
  }, [cantilevers]);

  useEffect(() => {
    if (!init) {
      if (selectedTiers.length && position && CSLibrary && profile && length && !equal()) {
        onChange({
          tiers: selectedTiers,
          sideType: side,
          position,
          CSLibrary,
          profile,
          length,
        });
      }
    } else setInit(false);
  }, [selectedTiers, position, CSLibrary, profile, length]);

  function equal() {
    if (!cantilevers[0]) return false;
    if (cantilevers[0].positionType !== position) return false;
    if (cantilevers[0].CSLibrary !== CSLibrary) return false;
    if (cantilevers[0].profile !== profile) return false;
    if (cantilevers[0].length !== length) return false;
    const tiers: number[] = [];
    cantilevers.forEach((cantilever) => {
      if (!tiers.includes(cantilever.tier)) tiers.push(cantilever.tier);
    });
    if (tiers.length !== selectedTiers.length) return false;
    for (let i = 0; i < tiers.length; i++) {
      if (!selectedTiers.includes(tiers[i])) return false;
    }
    return true;
  }

  function filterDirections() {
    const dirs: (UserDirection | "Outsides")[] = [];
    if (side === "L") dirs.push("Left");
    if (side === "R") dirs.push("Right");
    if (side === "Both") dirs.push("Outsides");
    if (
      !portals[index - 1] ||
      portals[index - 1].tiers !== portals[index].tiers ||
      portals[index - 1].width !== portals[index].width
    )
      dirs.push("Front");
    if (
      !portals[index + 1] ||
      portals[index + 1].tiers !== portals[index].tiers ||
      portals[index + 1].width !== portals[index].width
    )
      dirs.push("Back");
    return dirs;
  }

  function handleClear() {
    if (!position) return;
    dispatch(
      confirmAction({
        message: "Are you sure you want to delete this entry?",
        onConfirm: () => onClear(position),
      })
    );
  }

  return (
    <>
      <td className="w-50">
        <div className="d-flex">
          <div className="d-flex f-grow f-center" style={{ padding: "0 5px" }}>
            {side}
          </div>
          {cantilevers[0] && <Button icon="cross" minimal onClick={handleClear} />}
        </div>
      </td>
      <MultiSelectorCell<number>
        items={tiers}
        selected={selectedTiers}
        itemKey={(item) => item}
        itemLabel={(item) => `${item + 1}`}
        className="w-70"
        onSelect={setSelectedTiers}
      />
      <SelectorCell<UserDirection | "Outsides">
        items={filterDirections()}
        selected={position}
        onSelect={setPosition}
        itemKey={(item) => item}
        itemLabel={(item) => item}
        className="w-130"
        filterable={false}
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
      <NumericCell min={0} value={length} isDecimal={true} onChange={setLength} className="w-50" />
    </>
  );
}
