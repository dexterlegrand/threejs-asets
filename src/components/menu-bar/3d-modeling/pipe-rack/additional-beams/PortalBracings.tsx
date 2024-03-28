import React, { useEffect, useState } from "react";
import { Button } from "@blueprintjs/core";
import {
  BracingType,
  PipeRack,
  PipeRackPortal,
  PipeRackVBracing,
} from "../../../../../store/main/types";
import { useDispatch } from "react-redux";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { MultiSelectorCell } from "../../../../common/MultiSelectorCell";
import { bracingTypes } from "../../../../../store/main/constants";
import {
  getIndexName,
  getNextId,
  exportToCSV,
  importFromCSV,
  getElementByName,
  arrayToString,
  stringToArray,
} from "../../../../3d-models/utils";
import { changeModel } from "../../../../../store/main/actions";
import { addEventAction } from "../../../../../store/ui/actions";
import { Section } from "../../../../../store/data/types";
import {
  createVBracing,
  splitBeamsByVBracings,
  concatBeams,
} from "../../../../3d-models/pipe-rack/pipeRackUtils";

type Props = {
  models: PipeRack[];
  profiles: Section[];
  libs: string[];
};

type RowData = {
  id: number;
  selected: boolean;
  pr?: PipeRack;
  portal?: PipeRackPortal;
  type?: BracingType;
  tiers: number[];
  CSLibrary?: string;
  profile?: Section;
};

export function PortalBracings(props: Props) {
  const { models, profiles, libs } = props;

  const [rows, setRows] = useState<RowData[]>([]);
  const [blockMap, setBlockMap] = useState<boolean>(true);

  const dispatch = useDispatch();

  useEffect(() => {
    let newRows: RowData[] = [];
    models.forEach((model) => {
      const vBracings = model.vBracings.filter((item) => item.side === "Portal");
      vBracings.forEach((item) => {
        const portal = model.portals.find((portal) => portal.name === item.parent);
        if (
          !newRows.some(
            (newRow) =>
              newRow.pr?.name === model.name &&
              newRow.portal?.name === portal?.name &&
              newRow.type === item.bracingType &&
              newRow.CSLibrary === item.CSLibrary &&
              newRow.profile?.designation === item.profile.designation
          )
        ) {
          newRows.push({
            id: item.uiId ?? -1,
            selected: false,
            pr: model,
            portal,
            tiers: vBracings
              .filter(
                (vb) =>
                  vb.parent === item.parent &&
                  vb.bracingType === item.bracingType &&
                  vb.CSLibrary === item.CSLibrary &&
                  vb.profile.designation === item.profile.designation
              )
              .reduce((acc, vb) => {
                if (!acc.includes(vb.tier)) {
                  return [...acc, vb.tier];
                } else {
                  return acc;
                }
              }, [] as number[]),
            type: item.bracingType,
            CSLibrary: item.CSLibrary,
            profile: item.profile,
          });
        }
      });
    });
    newRows = [...rows.filter((row) => !validRow(row)), ...newRows];
    for (let i = 0, len = newRows.length; i < len; ++i) {
      const item = newRows[i];
      if (item.id === -1) {
        newRows[i] = { ...item, id: getNextId(newRows) };
      }
    }
    setBlockMap(true);
    setRows(newRows.sort((a, b) => a.id - b.id));
  }, [models]);

  useEffect(() => {
    if (!blockMap) {
      const vRows = rows.filter((row) => validRow(row));
      models.forEach((model) => {
        const vBracings: PipeRackVBracing[] = model.vBracings.filter((vb) => vb.side !== "Portal");
        model.portals.forEach((p) => {
          vRows
            .filter((row) => row.pr?.name === model.name && row.portal?.name === p.name)
            .forEach((row) => {
              row.tiers.forEach((tier) => {
                if (row.type === "Diagonal Up" || row.type === "Diagonal Down") {
                  const isUp = row.type === "Diagonal Up";
                  const index = getIndexName(vBracings, `VB`);
                  vBracings.push(
                    createVBracing(
                      index,
                      `VB${index}`,
                      row.portal!,
                      row.portal!,
                      tier,
                      "Portal",
                      "Portal",
                      row.type!,
                      row.CSLibrary!,
                      row.profile!,
                      model.baseElevation,
                      isUp,
                      row.id
                    )
                  );
                } else {
                  let index = getIndexName(vBracings, `VB`);
                  vBracings.push(
                    createVBracing(
                      index,
                      `VB${index}`,
                      row.portal!,
                      row.portal!,
                      tier,
                      "Portal",
                      "Portal",
                      row.type!,
                      row.CSLibrary!,
                      row.profile!,
                      model.baseElevation,
                      true,
                      row.id
                    )
                  );
                  index = getIndexName(vBracings, `VB`);
                  vBracings.push(
                    createVBracing(
                      index,
                      `VB${index}`,
                      row.portal!,
                      row.portal!,
                      tier,
                      "Portal",
                      "Portal",
                      row.type!,
                      row.CSLibrary!,
                      row.profile!,
                      model.baseElevation,
                      false,
                      row.id
                    )
                  );
                }
              });
            });
        });
        !equalBracings(model.vBracings, vBracings) &&
          dispatch(
            changeModel({
              ...model,
              beams: splitBeamsByVBracings(concatBeams(model.beams, "VB"), vBracings),
              vBracings,
            } as PipeRack)
          );
      });
    } else {
      setBlockMap(false);
    }
  }, [rows]);

  function validRow(row: RowData) {
    return row.pr && row.portal && row.type && row.tiers.length && row.profile;
  }

  function equalBracings(items: PipeRackVBracing[], newItems: PipeRackVBracing[]) {
    if (items.length !== newItems.length) return false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].parent !== newItems[i].parent) return false;
      if (items[i].bracingType !== newItems[i].bracingType) return false;
      if (items[i].tier !== newItems[i].tier) return false;
      if (items[i].CSLibrary !== newItems[i].CSLibrary) return false;
      if (items[i].profile !== newItems[i].profile) return false;
    }
    return true;
  }

  function handleAddRow() {
    setRows([...rows, { id: getNextId(rows), selected: false, tiers: [] }]);
  }

  function handleDeleteRows() {
    setRows(rows.filter((row) => !row.selected));
  }

  function handleChangePR(row: RowData, pr?: PipeRack) {
    setRows(
      rows.map((item) =>
        item.id === row.id
          ? {
              ...row,
              pr,
              portal: undefined,
              tiers: [],
              CSLibrary: pr?.CSLibrary,
              profile: pr?.portalTieProfile,
            }
          : item
      )
    );
  }

  function handleChangePortal(row: RowData, portal?: PipeRackPortal) {
    setRows(rows.map((item) => (item.id === row.id ? { ...row, portal, tiers: [] } : item)));
  }

  function handleChangeRow(row: RowData, field: string, value: any) {
    setRows(rows.map((item) => (item.id === row.id ? { ...row, [field]: value } : item)));
  }

  function getRow(row: RowData, index: number) {
    return (
      <tr key={index}>
        <CheckBoxCell
          key={row.id}
          value={row.selected}
          onChange={(checked) => handleChangeRow(row, "selected", checked)}
        />
        <SelectorCell<PipeRack>
          items={models}
          selected={row.pr}
          onSelect={(pr) => handleChangePR(row, pr)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={false}
        />
        <SelectorCell<PipeRackPortal>
          items={row.pr ? row.pr.portals : []}
          selected={row.portal}
          onSelect={(portal) => handleChangePortal(row, portal)}
          itemKey={(item) => item.name}
          itemLabel={(item) => `${(row.pr?.portals.indexOf(item) ?? 0) + 1}`}
          filterable={false}
        />
        <SelectorCell<BracingType>
          items={bracingTypes}
          selected={row.type}
          onSelect={(value) => handleChangeRow(row, "type", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <MultiSelectorCell<number>
          items={row.portal?.tiers.map((tier, i) => i) ?? []}
          selected={row.tiers}
          onSelect={(tiers) => handleChangeRow(row, "tiers", tiers)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item + 1}`}
        />
        <SelectorCell<string>
          items={libs}
          selected={row.CSLibrary}
          onSelect={(value) => handleChangeRow(row, "CSLibrary", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <SelectorCell<Section>
          items={profiles.filter((profile) => profile.country_code === row.CSLibrary)}
          selected={row.profile}
          onSelect={(value) => handleChangeRow(row, "profile", value)}
          itemKey={(item) => item.profile_section_id}
          itemLabel={(item) => item.designation}
          filterable={true}
          filter={(query, item) =>
            query ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase()) : true
          }
        />
      </tr>
    );
  }

  function handleExport() {
    const exportData = rows.map((row: RowData) => {
      const exportRow = {
        pr: row.pr?.name,
        portal: row.portal?.name,
        type: row.type,
        tiers: arrayToString(row.tiers),
        CSLibrary: row.CSLibrary,
        profile: row.profile?.designation,
      };
      return exportRow;
    });
    exportToCSV(exportData, "Portal Bracings");
  }

  function handleImport(models: PipeRack[], profiles: Section[]) {
    importFromCSV((arr) => {
      let newRows: RowData[] = [];
      try {
        arr.forEach((item) => {
          const model = getElementByName(models, item.pr);
          const newRow: RowData = {
            id: newRows.length,
            selected: false,
            pr: model,
            portal: getElementByName(model?.portals ?? [], item.portal),
            tiers: stringToArray(item.tiers).map((tier) => parseInt(tier)),
            type: item.type,
            CSLibrary: item.CSLibrary,
            profile: profiles.find((profile) => profile.designation === `${item.profile}`),
          };
          newRows = [...newRows, newRow];
        });
      } catch (e) {
        dispatch(addEventAction(`Portal Bracings (Import): Parse error`, "danger"));
      }
      setRows(newRows);
    });
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Portal Bracings</span>
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        <Button small icon="export" text="Export to CSV" intent="success" onClick={handleExport} />
        <Button
          small
          icon="import"
          text="Import from CSV"
          intent="success"
          onClick={() => handleImport(models, profiles)}
        />
        <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
      </div>
      <div className="hr" />
      <div className="p-5">
        <div className={"table-container"}>
          <table className="table bg-gray">
            <thead>
              <tr>
                <th></th>
                <th>PR No.</th>
                <th>Portal No.</th>
                <th>Type</th>
                <th>Applicable Tier List</th>
                <th>C/S Library</th>
                <th>Profile</th>
              </tr>
            </thead>
            <tbody>{rows.map((row, index) => getRow(row, index))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
