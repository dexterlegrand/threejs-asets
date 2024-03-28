import React, { FunctionComponent, useState, useEffect } from "react";
import { Button } from "@blueprintjs/core";
import { NumericCell } from "../../../../common/NumericCell";
import { PipeRack, PipeRackPortal } from "../../../../../store/main/types";
import { useDispatch } from "react-redux";
import { changeModel } from "../../../../../store/main/actions";
import { Vector3 } from "three";
import { exportToCSV } from "../../../../3d-models/utils";

type Props = { models: PipeRack[] };

type RowData = {
  id: number;
  selected: boolean;
  pr: string;
  tier: number;
  elevation: number;
};

const TierElevations: FunctionComponent<Props> = (props) => {
  const { models } = props;
  const [afterUpdate, setAfterUpdate] = useState<boolean>(true);
  const [rows, setRows] = useState<RowData[]>([]);

  const dispatch = useDispatch();

  useEffect(() => {
    let newRows: RowData[] = [];
    models.forEach((model) => {
      model.portals.forEach((portal) => {
        portal.tiers.forEach((height, index) => {
          const row = newRows.find(
            (row) => row.pr === model.name && row.tier === index
          );
          if (row) {
            if (row.elevation > height) {
              newRows = newRows.map((item) =>
                item.id === row.id ? { ...item, elevation: height } : item
              );
            }
          } else {
            newRows = [
              ...newRows,
              {
                id: newRows.length + 1,
                selected: false,
                pr: model.name,
                tier: index,
                elevation: height,
              },
            ];
          }
        });
      });
    });
    setAfterUpdate(true);
    setRows(newRows);
  }, [models]);

  useEffect(() => {
    if (!afterUpdate) {
      models.forEach((model) => {
        const portals: PipeRackPortal[] = model.portals.map((portal) => ({
          ...portal,
          tiers: rows
            .filter((row) => row.pr === model.name)
            .sort((a, b) => a.tier - b.tier)
            .map((row) => row.elevation),
        }));
        let newModel = { ...model, portals };
        portals.forEach((portal) => {
          newModel = {
            ...newModel,
            columns: newModel.columns.map((column) =>
              column.parent === portal.name
                ? {
                    ...column,
                    startPos: new Vector3(
                      column.startPos.x,
                      portal.tiers[column.tier - 1] ??
                        newModel.baseElevation ??
                        0,
                      column.startPos.z
                    ),
                    endPos: new Vector3(
                      column.endPos.x,
                      portal.tiers[column.tier],
                      column.endPos.z
                    ),
                  }
                : column
            ),
            beams: newModel.beams.map((beam) =>
              beam.parent === portal.name
                ? {
                    ...beam,
                    startPos: new Vector3(
                      beam.startPos.x,
                      portal.tiers[beam.tier],
                      beam.startPos.z
                    ),
                    endPos: new Vector3(
                      beam.endPos.x,
                      portal.tiers[beam.tier],
                      beam.endPos.z
                    ),
                  }
                : beam
            ),
            cantilevers: newModel.cantilevers.map((cnt) =>
              cnt.parent === portal.name
                ? {
                    ...cnt,
                    startPos: new Vector3(
                      cnt.startPos.x,
                      portal.tiers[cnt.tier],
                      cnt.startPos.z
                    ),
                    endPos: new Vector3(
                      cnt.endPos.x,
                      portal.tiers[cnt.tier],
                      cnt.endPos.z
                    ),
                  }
                : cnt
            ),
            vBracings: newModel.vBracings.map((vb) =>
              vb.parent === portal.name
                ? {
                    ...vb,
                    startPos: new Vector3(
                      vb.startPos.x,
                      portal.tiers[vb.isUp ? vb.tier - 1 : vb.tier] ??
                        newModel.baseElevation ??
                        0,
                      vb.startPos.z
                    ),
                    endPos: new Vector3(
                      vb.endPos.x,
                      portal.tiers[vb.isUp ? vb.tier : vb.tier - 1] ??
                        newModel.baseElevation ??
                        0,
                      vb.endPos.z
                    ),
                  }
                : vb
            ),
          };
        });
        dispatch(
          changeModel({
            ...newModel,
          } as PipeRack)
        );
      });
    } else setAfterUpdate(false);
  }, [rows]);

  function handleChangeRow(row: RowData, field: string, value: any) {
    setRows(
      rows.map((item) =>
        item.id === row.id ? { ...row, [field]: value } : item
      )
    );
  }

  function getElevation(row: RowData, i: number, arr: RowData[]) {
    return (
      arr.filter((item) => item.pr === row.pr).find((item) => item.tier === i)
        ?.elevation ??
      (i === -1
        ? models.find((model) => model.name === row.pr)?.baseElevation
        : undefined)
    );
  }

  function getRow(row: RowData, i: number, arr: RowData[]) {
    const min = getElevation(row, row.tier - 1, arr);
    const max = getElevation(row, row.tier + 1, arr);
    return (
      <tr key={row.id}>
        <td>{row.pr}</td>
        <td>{row.tier + 1}</td>
        <NumericCell
          min={min}
          max={max}
          isDecimal={true}
          className="w-80"
          value={row.elevation}
          onChange={(value) => handleChangeRow(row, "elevation", value)}
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      rows.map((row) => ({
        pr: row.pr,
        tier: row.tier,
        elevation: row.elevation,
      })),
      "Tier Elevation"
    );
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Tier Elevations</span>
        <Button
          small
          icon="export"
          text="Export to CSV"
          intent="success"
          onClick={handleExport}
        />
      </div>
      <div className="hr" />
      <div className="p-5">
        <div className="table-container">
          <table className="table bg-gray">
            <thead>
              <tr>
                <th>PR No.</th>
                <th>Tier No.</th>
                <th>Elevation (m)</th>
              </tr>
            </thead>
            <tbody>{rows.map(getRow)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TierElevations;
