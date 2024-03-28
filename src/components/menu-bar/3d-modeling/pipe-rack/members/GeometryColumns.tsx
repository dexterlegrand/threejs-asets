import React, { FunctionComponent, useEffect, useState } from "react";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { useDispatch } from "react-redux";
import { changeModel } from "../../../../../store/main/actions";
import {
  Orientation,
  PipeRack,
  PipeRackColumn,
  PipeRackVBracing,
} from "../../../../../store/main/types";
import { SelectorCell } from "../../../../common/SelectorCell";
import { orientations } from "../../../../../store/main/constants";
import { Section } from "../../../../../store/data/types";

type Props = {
  models: PipeRack[];
  profiles: Section[];
  libs: string[];
};

type RowData = {
  id: number;
  selected: boolean;
  pr?: PipeRack;
  element?: PipeRackColumn | PipeRackVBracing;
  lib?: string;
  profile?: Section;
  orientation?: Orientation;
};

const GeometryColumns: FunctionComponent<Props> = ({ models, libs, profiles }) => {
  const [init, setInit] = useState<boolean>(true);
  const [afterUpdate, setAfterUpdate] = useState<boolean>(true);
  const [rowIndex, setRowIndex] = useState<number>(0);
  const [rows, setRows] = useState<RowData[]>([]);

  const dispatch = useDispatch();

  useEffect(() => {
    const newRows: RowData[] = [];
    let lastId = 0;
    models.forEach((model) => {
      model.columns.forEach((item) => {
        if (item.memberId !== undefined) {
          lastId = Math.max(lastId, item.memberId);
          newRows.push({
            id: item.memberId,
            selected: false,
            pr: model,
            element: item,
            lib: item.CSLibrary,
            profile: item.profile,
            orientation: item.orientation,
          });
        }
      });
      model.vBracings.forEach((item) => {
        if (item.memberId !== undefined) {
          lastId = Math.max(lastId, item.memberId);
          newRows.push({
            id: item.memberId,
            selected: false,
            pr: model,
            element: item,
            lib: item.CSLibrary,
            profile: item.profile,
            orientation: item.orientation,
          });
        }
      });
    });
    setAfterUpdate(true);
    setRows(newRows.sort((a, b) => a.id - b.id));
    setRowIndex(++lastId);
  }, [models]);

  useEffect(() => {
    if (!init && !afterUpdate) {
      const vRows = rows.filter((row) => validRow(row));
      models.forEach((model) => {
        const vRowsByModel = vRows.filter((vr) => vr.pr?.name === model.name);
        let newColumns: PipeRackColumn[] = model.columns.map((item) => ({
          ...item,
          memberId: undefined,
        }));
        vRowsByModel
          .filter((vr) => vr.element?.type === "PipeRackColumn")
          .forEach((vr) => {
            newColumns = newColumns.map((item) => {
              if (item.name === vr.element?.name) {
                return {
                  ...item,
                  CSLibrary: vr.lib,
                  profile: vr.profile,
                  orientation: vr.orientation,
                  memberId: vr.id,
                } as PipeRackColumn;
              } else if (item.name === (vr.element! as PipeRackColumn).next) {
                return {
                  ...item,
                  orientation: vr.orientation,
                } as PipeRackColumn;
              } else return item;
            });
          });
        let newVbracings: PipeRackVBracing[] = model.vBracings.map((item) => ({
          ...item,
          memberId: undefined,
        }));
        vRowsByModel
          .filter((vr) => vr.element?.type === "PipeRackVBracing")
          .forEach((vr) => {
            newVbracings = newVbracings.map((item) =>
              item.name === vr.element?.name
                ? ({
                    ...item,
                    CSLibrary: vr.lib,
                    profile: vr.profile,
                    orientation: vr.orientation,
                    memberId: vr.id,
                  } as PipeRackVBracing)
                : item
            );
          });
        if (!equal(model.columns, newColumns) || !equal(model.vBracings, newVbracings))
          dispatch(
            changeModel({
              ...model,
              columns: newColumns,
              vBracings: newVbracings,
            } as PipeRack)
          );
      });
    }
    init && setInit(false);
    afterUpdate && setAfterUpdate(false);
  }, [rows]);

  function validRow(row: RowData) {
    return row.pr && row.element && row.lib && row.profile;
  }

  function equal(
    old: (PipeRackColumn | PipeRackVBracing)[],
    news: (PipeRackColumn | PipeRackVBracing)[]
  ) {
    for (let i = 0; i < old.length; i++) {
      if (old[i].orientation !== news[i].orientation) return false;
      if (old[i].CSLibrary !== news[i].CSLibrary) return false;
      if (old[i].profile !== news[i].profile) return false;
      if (old[i].memberId !== news[i].memberId) return false;
    }
    return true;
  }

  function handleAddRow() {
    setRows([...rows, { id: rowIndex, selected: false }]);
    setRowIndex(rowIndex + 1);
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
              element: undefined,
              orientation: undefined,
            }
          : item
      )
    );
  }

  function handleChangeElement(row: RowData, element?: PipeRackColumn | PipeRackVBracing) {
    setRows(
      rows.map((item) =>
        item.id === row.id
          ? {
              ...row,
              element,
              lib: element?.CSLibrary,
              profile: element?.profile,
              orientation: element?.orientation,
            }
          : item
      )
    );
  }

  function handleChangeRow(row: RowData, field: string, value: any) {
    setRows(rows.map((item) => (item.id === row.id ? { ...row, [field]: value } : item)));
  }

  function getRow(item: RowData) {
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.selected}
          onChange={(value) => handleChangeRow(item, "selected", value)}
        />
        <SelectorCell<PipeRack>
          items={models}
          selected={item.pr}
          onSelect={(value) => handleChangePR(item, value)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={false}
        />
        <SelectorCell<PipeRackColumn | PipeRackVBracing>
          items={item.pr ? [...item.pr.columns, ...item.pr.vBracings] : []}
          selected={item.element}
          onSelect={(value) => handleChangeElement(item, value)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={true}
          filter={(query, element) => element.name.includes(query.toUpperCase())}
        />
        <SelectorCell<string>
          items={libs}
          selected={item.lib}
          onSelect={(value) => handleChangeRow(item, "lib", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <SelectorCell<Section>
          items={profiles.filter((profile) => profile.country_code === item.lib)}
          selected={item.profile}
          onSelect={(value) => handleChangeRow(item, "profile", value)}
          itemKey={(item) => item.profile_section_id}
          itemLabel={(item) => item.designation}
          filterable={true}
          filter={(query, item) =>
            query ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase()) : true
          }
        />
        <SelectorCell<number>
          items={orientations}
          selected={item.orientation}
          disabled={item.pr?.columns.some(
            (column) => item.element && column.next === item.element.name
          )}
          onSelect={(value) => handleChangeRow(item, "orientation", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          filterable={false}
        />
      </tr>
    );
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Geometry Columns</span>
        <Button
          small
          icon="trash"
          text="Delete"
          intent="warning"
          onClick={() => handleDeleteRows()}
        />
        <Button small icon="export" text="Export to CSV" intent="success" disabled={true} />
        <Button small icon="import" text="Import from CSV" intent="success" disabled={true} />
        <Button small icon="plus" text="Add Row" intent="primary" onClick={() => handleAddRow()} />
      </div>
      <div className="hr" />
      <div className={"table-container p-5"}>
        <table className="table bg-gray">
          <thead>
            <tr>
              <th>{""}</th>
              <th>PR No.</th>
              <th>Name</th>
              <th>C/S Library</th>
              <th>Profile</th>
              <th>Orientation</th>
            </tr>
          </thead>
          <tbody>{rows.map((row) => getRow(row))}</tbody>
        </table>
      </div>
    </div>
  );
};

export default GeometryColumns;
