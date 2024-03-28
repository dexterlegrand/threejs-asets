import React, { FunctionComponent, useEffect, useState } from "react";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import {
  Orientation,
  PipeRack,
  PipeRackBeam,
  PipeRackCantilever,
  PipeRackHBracing,
} from "../../../../../store/main/types";
import { useDispatch } from "react-redux";
import { SelectorCell } from "../../../../common/SelectorCell";
import { orientations } from "../../../../../store/main/constants";
import { NumericCell } from "../../../../common/NumericCell";
import { changeModel } from "../../../../../store/main/actions";
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
  element?: PipeRackBeam | PipeRackHBracing | PipeRackCantilever;
  lib?: string;
  profile?: Section;
  orientation?: Orientation;
  elevation?: number;
};

const GeometryBeams: FunctionComponent<Props> = ({ models, libs, profiles }) => {
  const [init, setInit] = useState<boolean>(true);
  const [afterUpdate, setAfterUpdate] = useState<boolean>(true);
  const [rowIndex, setRowIndex] = useState<number>(0);
  const [rows, setRows] = useState<RowData[]>([]);

  const dispatch = useDispatch();

  useEffect(() => {
    const newRows: RowData[] = [];
    let lastId = 0;
    models.forEach((model) => {
      model.beams.forEach((b) => {
        if (b.memberId !== undefined) {
          lastId = Math.max(lastId, b.memberId);
          newRows.push({
            id: b.memberId,
            selected: false,
            pr: model,
            element: b,
            lib: b.CSLibrary,
            profile: b.profile,
            orientation: b.orientation,
            elevation: b.elevation,
          });
        }
      });
      model.hBracings.forEach((hb) => {
        if (hb.memberId !== undefined) {
          lastId = Math.max(lastId, hb.memberId);
          newRows.push({
            id: hb.memberId,
            selected: false,
            pr: model,
            element: hb,
            lib: hb.CSLibrary,
            profile: hb.profile,
            orientation: hb.orientation,
            elevation: hb.elevation,
          });
        }
      });
      model.cantilevers.forEach((cnt) => {
        if (cnt.memberId !== undefined) {
          lastId = Math.max(lastId, cnt.memberId);
          newRows.push({
            id: cnt.memberId,
            selected: false,
            pr: model,
            element: cnt,
            lib: cnt.CSLibrary,
            profile: cnt.profile,
            orientation: cnt.orientation,
            elevation: cnt.elevation,
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
        let newBeams: PipeRackBeam[] = model.beams.map((item) => ({
          ...item,
          memberId: undefined,
        }));
        let newHbracings: PipeRackHBracing[] = model.hBracings.map((item) => ({
          ...item,
          memberId: undefined,
        }));
        let newCnts: PipeRackCantilever[] = model.cantilevers.map((item) => ({
          ...item,
          memberId: undefined,
        }));
        vRowsByModel.forEach((vr) => {
          if (vr.element?.type === "PipeRackBeam") {
            newBeams = newBeams.map((nb) =>
              nb.name === vr.element?.name
                ? ({
                    ...nb,
                    CSLibrary: vr.lib,
                    profile: vr.profile,
                    orientation: vr.orientation,
                    elevation: vr.elevation,
                    memberId: vr.id,
                  } as PipeRackBeam)
                : nb
            );
          } else if (vr.element?.type === "PipeRackHBracing") {
            newHbracings = newHbracings.map((nhb) =>
              nhb.name === vr.element?.name
                ? ({
                    ...nhb,
                    CSLibrary: vr.lib,
                    profile: vr.profile,
                    orientation: vr.orientation,
                    elevation: vr.elevation,
                    memberId: vr.id,
                  } as PipeRackHBracing)
                : nhb
            );
          } else if (vr.element?.type === "PipeRackCantilever") {
            newCnts = newCnts.map((ncnt) =>
              ncnt.name === vr.element?.name
                ? ({
                    ...ncnt,
                    CSLibrary: vr.lib,
                    profile: vr.profile,
                    orientation: vr.orientation,
                    elevation: vr.elevation,
                    memberId: vr.id,
                  } as PipeRackCantilever)
                : ncnt
            );
          }
        });
        if (
          !equal(model.beams, newBeams) ||
          !equal(model.hBracings, newHbracings) ||
          !equal(model.cantilevers, newCnts)
        ) {
          dispatch(
            changeModel({
              ...model,
              beams: newBeams,
              hBracings: newHbracings,
              cantilevers: newCnts,
            } as PipeRack)
          );
        }
      });
    }
    init && setInit(false);
    afterUpdate && setAfterUpdate(false);
  }, [rows]);

  function validRow(row: RowData) {
    return row.pr && row.element && row.lib && row.profile;
  }

  function equal(
    old: (PipeRackBeam | PipeRackHBracing | PipeRackCantilever)[],
    news: (PipeRackBeam | PipeRackHBracing | PipeRackCantilever)[]
  ) {
    for (let i = 0; i < old.length; i++) {
      if (old[i].orientation !== news[i].orientation) return false;
      if (old[i].CSLibrary !== news[i].CSLibrary) return false;
      if (old[i].profile !== news[i].profile) return false;
      if (old[i].elevation !== news[i].elevation) return false;
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
              elevation: undefined,
            }
          : item
      )
    );
  }

  function handleChangeElement(
    row: RowData,
    element?: PipeRackBeam | PipeRackHBracing | PipeRackCantilever
  ) {
    setRows(
      rows.map((item) =>
        item.id === row.id
          ? {
              ...row,
              element,
              lib: element?.CSLibrary,
              profile: element?.profile,
              orientation: element?.orientation,
              elevation: element?.elevation,
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
        <SelectorCell<PipeRackBeam | PipeRackHBracing | PipeRackCantilever>
          items={item.pr ? [...item.pr.beams, ...item.pr.hBracings, ...item.pr.cantilevers] : []}
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
          onSelect={(value) => handleChangeRow(item, "orientation", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          filterable={false}
        />
        <NumericCell
          className="w-200"
          isDecimal={true}
          value={item.elevation}
          onChange={(value) => handleChangeRow(item, "elevation", value)}
        />
      </tr>
    );
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Geometry Beams</span>
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
              <th></th>
              <th>PR No.</th>
              <th>Name</th>
              <th>C/S Library</th>
              <th>Profile</th>
              <th>Orientation</th>
              <th>Elevation (m)</th>
            </tr>
          </thead>
          <tbody>{rows.map((row) => getRow(row))}</tbody>
        </table>
      </div>
    </div>
  );
};

export default GeometryBeams;
