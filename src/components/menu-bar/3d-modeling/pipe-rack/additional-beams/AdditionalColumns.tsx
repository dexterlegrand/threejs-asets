import React, { useEffect, useState } from "react";
import {
  Orientation,
  PipeRack,
  PipeRackBeam,
  PipeRackCantilever,
  PipeRackColumn,
} from "../../../../../store/main/types";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { orientations } from "../../../../../store/main/constants";
import { NumericCell } from "../../../../common/NumericCell";
import { useDispatch } from "react-redux";
import { changeModel } from "../../../../../store/main/actions";
import {
  getIndexName,
  getOffsetB,
  exportToCSV,
  importFromCSV,
  getElementByName,
} from "../../../../3d-models/utils";
import { Vector3 } from "three";
import { addEventAction } from "../../../../../store/ui/actions";
import { Section } from "../../../../../store/data/types";
import { splitBeamsByColumns, concatBeams } from "../../../../3d-models/pipe-rack/pipeRackUtils";

type Props = {
  models: PipeRack[];
  profiles: Section[];
  libs: string[];
};

type RowData = {
  id: number;
  selected: boolean;
  pr?: PipeRack;
  lowerBeam?: PipeRackBeam | PipeRackCantilever;
  offset: number;
  upperBeam?: PipeRackBeam | PipeRackCantilever;
  height?: number;
  lib?: string;
  profile?: Section;
  orientation: Orientation;
};

export function AdditionalColumns({ models, profiles, libs }: Props) {
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
        if (item.additional) {
          lastId = Math.max(lastId, item.id);
          let lowerBeam: PipeRackBeam | PipeRackCantilever | undefined = model.beams.find(
            (beam) => beam.name === item.lowerBeam
          );
          if (!lowerBeam) {
            lowerBeam = model.cantilevers.find((beam) => beam.name === item.lowerBeam);
          }
          if (lowerBeam) {
            let offset;
            if (lowerBeam.type === "PipeRackBeam") {
              offset = Math.abs(
                (lowerBeam as PipeRackBeam).direction === "X"
                  ? item.startPos.x - lowerBeam.startPos.x
                  : item.startPos.z - lowerBeam.startPos.z
              );
            } else {
              const cnt = lowerBeam as PipeRackCantilever;
              offset = Math.abs(
                cnt.position === "Front" || cnt.position === "Back"
                  ? item.startPos.x - lowerBeam.startPos.x
                  : item.startPos.z - lowerBeam.startPos.z
              );
            }
            let upperBeam: PipeRackBeam | PipeRackCantilever | undefined = model.beams.find(
              (beam) => beam.name === item.upperBeam
            );
            if (!upperBeam) {
              upperBeam = model.cantilevers.find((beam) => beam.name === item.upperBeam);
            }
            newRows.push({
              id: item.id,
              selected: false,
              pr: model,
              lowerBeam,
              offset: offset,
              upperBeam,
              height: upperBeam ? undefined : item.endPos.y - item.startPos.y,
              lib: item.CSLibrary,
              profile: item.profile,
              orientation: item.orientation ?? 0,
            });
          }
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
        let newColumns: PipeRackColumn[] = model.columns.filter((item) => !item.additional);
        vRows
          .filter((vr) => vr.pr?.name === model.name)
          .forEach((vr) => {
            const index = getIndexName(newColumns, "C");
            const startPos = new Vector3();
            const endPos = new Vector3();
            if (vr.lowerBeam!.type === "PipeRackBeam") {
              const beam = vr.lowerBeam as PipeRackBeam;
              startPos.set(
                beam.startPos.x + (beam.direction === "X" ? vr.offset : 0),
                beam.startPos.y,
                beam.startPos.z -
                  (beam.direction === "Z"
                    ? vr.offset
                    : getOffsetB(
                        beam.startPos.x,
                        beam.startPos.z,
                        beam.endPos.x,
                        beam.endPos.z,
                        vr.offset
                      ))
              );
              endPos.set(
                beam.startPos.x + (beam.direction === "X" ? vr.offset : 0),
                vr.upperBeam
                  ? vr.upperBeam!.startPos.y
                  : vr.lowerBeam!.startPos.y + (vr.height ?? 0),
                beam.startPos.z -
                  (beam.direction === "Z"
                    ? vr.offset
                    : getOffsetB(
                        beam.startPos.x,
                        beam.startPos.z,
                        beam.endPos.x,
                        beam.endPos.z,
                        vr.offset
                      ))
              );
            } else {
              const beam = vr.lowerBeam as PipeRackCantilever;
              startPos.set(
                beam.startPos.x +
                  (beam.position === "Front"
                    ? -vr.offset
                    : beam.position === "Back"
                    ? vr.offset
                    : 0),
                beam.startPos.y,
                beam.startPos.z -
                  (beam.position === "Left"
                    ? vr.offset
                    : beam.position === "Right"
                    ? -vr.offset
                    : getOffsetB(
                        beam.startPos.x,
                        beam.startPos.z,
                        beam.endPos.x,
                        beam.endPos.z,
                        vr.offset
                      ))
              );
              endPos.set(
                beam.startPos.x +
                  (beam.position === "Front"
                    ? -vr.offset
                    : beam.position === "Back"
                    ? vr.offset
                    : 0),
                vr.upperBeam ? vr.upperBeam!.startPos.y : beam.startPos.y + (vr.height ?? 0),
                beam.startPos.z -
                  (beam.position === "Left"
                    ? vr.offset
                    : beam.position === "Right"
                    ? -vr.offset
                    : getOffsetB(
                        beam.startPos.x,
                        beam.startPos.z,
                        beam.endPos.x,
                        beam.endPos.z,
                        vr.offset
                      ))
              );
            }
            newColumns = [
              ...newColumns,
              {
                id: index,
                name: `C${index}`,
                type: "PipeRackColumn",
                parent: vr.lowerBeam!.name,
                tier: vr.lowerBeam!.tier,
                lowerBeam: vr.lowerBeam!.name,
                upperBeam: vr.upperBeam?.name,
                startPos,
                endPos,
                orientation: vr.orientation,
                CSLibrary: vr.lib!,
                profile: vr.profile!,
                additional: true,
              },
            ];
          });
        if (!equalColumns(model.columns, newColumns))
          dispatch(
            changeModel({
              ...model,
              columns: newColumns,
              beams: splitBeamsByColumns(concatBeams(model.beams, "C"), newColumns),
              cantilevers: splitBeamsByColumns(concatBeams(model.cantilevers, "C"), newColumns),
            } as PipeRack)
          );
      });
    }
    init && setInit(false);
    afterUpdate && setAfterUpdate(false);
  }, [rows]);

  function validRow(row: RowData) {
    return row.pr && row.lowerBeam && (row.upperBeam || row.height) && row.lib && row.profile;
  }

  function equalColumns(old: PipeRackColumn[], news: PipeRackColumn[]) {
    if (old.length !== news.length) return false;
    for (let i = 0; i < old.length; i++) {
      if (old[i].tier !== news[i].tier) return false;
      if (old[i].lowerBeam !== news[i].lowerBeam) return false;
      if (old[i].upperBeam !== news[i].upperBeam) return false;
      if (!old[i].startPos.equals(news[i].startPos)) return false;
      if (!old[i].endPos.equals(news[i].endPos)) return false;
      if (old[i].CSLibrary !== news[i].CSLibrary) return false;
      if (old[i].profile !== news[i].profile) return false;
      if (old[i].orientation !== news[i].orientation) return false;
    }
    return true;
  }

  function handleAddRow() {
    setRows([...rows, { id: rowIndex, selected: false, offset: 0, orientation: 0 }]);
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
              lowerBeam: undefined,
              offset: 0,
              upperBeam: undefined,
              lib: pr?.CSLibrary,
              profile: pr?.portalColProfile,
            }
          : item
      )
    );
  }

  function handleChangeLowerBeam(row: RowData, lowerBeam?: PipeRackBeam | PipeRackCantilever) {
    setRows(
      rows.map((item) =>
        item.id === row.id
          ? {
              ...row,
              lowerBeam,
              offset: 0,
              upperBeam: undefined,
            }
          : item
      )
    );
  }

  function handleChangeRow(row: RowData, field: string, value: any) {
    setRows(rows.map((item) => (item.id === row.id ? { ...row, [field]: value } : item)));
  }

  function getRow(row: RowData) {
    return (
      <tr key={row.id}>
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
        <SelectorCell<PipeRackBeam | PipeRackCantilever>
          items={getBeams(row, "lower")}
          selected={row.lowerBeam}
          onSelect={(beam) => handleChangeLowerBeam(row, beam)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={true}
          filter={(query, item) => (query ? item.name.includes(query.toUpperCase()) : true)}
        />
        <NumericCell
          className="w-100"
          isDecimal={true}
          min={0}
          max={row.lowerBeam ? row.lowerBeam.startPos.distanceTo(row.lowerBeam.endPos) : 0}
          value={row.offset}
          onChange={(value) => handleChangeRow(row, "offset", value)}
        />
        <SelectorCell<PipeRackBeam | PipeRackCantilever>
          items={getBeams(row, "upper")}
          selected={row.upperBeam}
          onSelect={(beam) => handleChangeRow(row, "upperBeam", beam)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={true}
          filter={(query, item) => (query ? item.name.includes(query.toUpperCase()) : true)}
        />
        {row.upperBeam ? (
          <td></td>
        ) : (
          <NumericCell
            className="w-100"
            isDecimal={true}
            min={0}
            value={row.height}
            onChange={(value) => handleChangeRow(row, "height", value)}
          />
        )}
        <SelectorCell<string>
          items={libs}
          selected={row.lib}
          onSelect={(value) => handleChangeRow(row, "lib", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <SelectorCell<Section>
          items={profiles.filter((profile) => profile.country_code === row.lib)}
          selected={row.profile}
          onSelect={(value) => handleChangeRow(row, "profile", value)}
          itemKey={(item) => item.profile_section_id}
          itemLabel={(item) => item.designation}
          filterable={true}
          filter={(query, item) =>
            query ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase()) : true
          }
        />
        <SelectorCell<number>
          items={orientations}
          selected={row.orientation}
          onSelect={(value) => handleChangeRow(row, "orientation", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          filterable={false}
        />
      </tr>
    );
  }

  function getBeams(row: RowData, type: "lower" | "upper") {
    if (!row.pr) return [];
    if (type === "lower") {
      return [...row.pr.beams, ...row.pr.cantilevers];
    } else {
      if (!row.lowerBeam) return [];
      return [...row.pr.beams, ...row.pr.cantilevers].filter(
        (beam) => beam.startPos.y > row.lowerBeam!.startPos.y
      );
    }
  }

  function handleExport() {
    const exportData = rows.map((row: RowData) => {
      const exportRow = {
        pr: row.pr?.name,
        lowerBeam: row.lowerBeam?.name,
        offset: row.offset,
        upperBeam: row.upperBeam?.name,
        height: row.height,
        lib: row.lib,
        profile: row.profile?.designation,
        orientation: row.orientation,
      };
      return exportRow;
    });
    exportToCSV(exportData, "Additional Columns");
  }

  function handleImport(models: PipeRack[], profiles: Section[]) {
    importFromCSV((arr) => {
      let newRows: RowData[] = [];
      try {
        arr.forEach((item) => {
          const model = getElementByName(models, item.pr);
          const elements = model ? [...model.beams, ...model.cantilevers] : [];
          const newRow: RowData = {
            id: newRows.length,
            selected: false,
            pr: model,
            lowerBeam: getElementByName(elements, item.lowerBeam),
            offset: item.offset,
            upperBeam: getElementByName(elements, item.upperBeam),
            height: item.height,
            lib: item.lib,
            profile: profiles.find((profile) => profile.designation === item.profile),
            orientation: item.orientation,
          };
          newRows = [...newRows, newRow];
        });
      } catch (e) {
        dispatch(addEventAction(`Additional Columns (Import): Parse error`, "danger"));
      }
      setRows(newRows);
    });
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Additional columns</span>
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
        <div className="table-container">
          <table className="table bg-gray">
            <thead>
              <tr>
                <th></th>
                <th>PR No.</th>
                <th>On Beam No. (Lower Beam)</th>
                <th>At Distance from Start of beam (m)</th>
                <th>To Beam (Upper Beam)</th>
                <th>Height (m)</th>
                <th>C/S Library</th>
                <th>Profile</th>
                <th>orientation</th>
              </tr>
            </thead>
            <tbody>{rows.map((row) => getRow(row))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
