import React, { FunctionComponent, useState, useEffect } from "react";
import { Button } from "@blueprintjs/core";
import { NumericCell } from "../../../../common/NumericCell";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import {
  PipeRack,
  PipeRackPortal,
  PlatformPosition,
  PipeRackPlatform,
  PipeRackBeam,
  PipeRackCantilever,
} from "../../../../../store/main/types";
import { useDispatch } from "react-redux";
import { changeModel } from "../../../../../store/main/actions";
import { getIndexName, getElementsByParent, MMtoM, MtoMM } from "../../../../3d-models/utils";
import { platformPositions } from "../../../../../store/main/constants";

type OwnProps = { models: PipeRack[] };

type Props = OwnProps;

type RowData = {
  selected: boolean;
  name: string;
  pr?: PipeRack;
  from?: PipeRackPortal;
  to?: PipeRackPortal;
  tier?: number;
  side: PlatformPosition;
  width: number;
  thickness: number;
};

const Platforms: FunctionComponent<Props> = (props) => {
  const { models } = props;
  const [rows, setRows] = useState<RowData[]>([]);

  const dispatch = useDispatch();

  useEffect(() => {
    const newRows: RowData[] = [];
    models.forEach((model) =>
      model.platforms.forEach((pl) => {
        newRows.push({
          selected: false,
          name: pl.name,
          pr: model,
          from: model.portals.find((p) => p.name === pl.fromPortal),
          to: model.portals.find((p) => p.name === pl.toPortal),
          tier: pl.tier,
          side: pl.side,
          width: pl.width,
          thickness: MtoMM(pl.thickness),
        });
      })
    );
    setRows(
      [...rows.filter((row) => !validRow(row)), ...newRows].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
  }, []);

  useEffect(() => {
    const vRows = rows.filter((row) => validRow(row));
    models.forEach((model) => {
      const platforms = vRows
        .filter((row) => row.pr!.name === model.name)
        .map(
          (row) =>
            ({
              name: row.name,
              parent: row.pr!.name,
              fromPortal: row.from!.name,
              toPortal: row.to!.name,
              tier: row.tier,
              side: row.side,
              width: row.width,
              valid: checkCreating(row),
              thickness: MMtoM(row.thickness),
            } as PipeRackPlatform)
        );
      !equalPlatforms(model.platforms, platforms) &&
        dispatch(
          changeModel({
            ...model,
            platforms,
          } as PipeRack)
        );
    });
  }, [rows]);

  function validRow(row: RowData) {
    return row.pr && row.from && row.to && row.tier !== undefined && row.width && row.thickness;
  }

  function equalPlatforms(items: PipeRackPlatform[], newItems: PipeRackPlatform[]) {
    if (items.length !== newItems.length) return false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].fromPortal !== newItems[i].fromPortal) return false;
      if (items[i].toPortal !== newItems[i].toPortal) return false;
      if (items[i].tier !== newItems[i].tier) return false;
      if (items[i].side !== newItems[i].side) return false;
      if (items[i].width !== newItems[i].width) return false;
      if (items[i].thickness !== newItems[i].thickness) return false;
    }
    return true;
  }

  function handleAddRow() {
    setRows([
      ...rows,
      {
        selected: false,
        name: `PL${getIndexName(rows, "PL")}`,
        side: "MID",
        width: 0,
        thickness: 25,
      },
    ]);
  }

  function handleDeleteRows() {
    setRows(rows.filter((row) => !row.selected));
  }

  function handleChangePR(row: RowData, pr?: PipeRack) {
    setRows(
      rows.map((item) =>
        item.name === row.name
          ? {
              ...row,
              name: pr
                ? `${pr.name}-PL${getIndexName(rows, `${pr.name}-PL`)}`
                : `PL${getIndexName(rows, "PL")}`,
              pr,
              from: undefined,
              to: undefined,
              tier: undefined,
            }
          : item
      )
    );
  }

  function handleChangeFromPortal(row: RowData, from?: PipeRackPortal) {
    setRows(
      rows.map((item) =>
        item.name === row.name
          ? {
              ...row,
              from,
              to: undefined,
              tier: undefined,
            }
          : item
      )
    );
  }

  function handleChangeToPortal(row: RowData, to?: PipeRackPortal) {
    setRows(
      rows.map((item) =>
        item.name === row.name
          ? {
              ...row,
              to,
              tier: undefined,
            }
          : item
      )
    );
  }

  function handleChangeRow(row: RowData, field: string, value: any) {
    setRows(rows.map((item) => (item.name === row.name ? { ...row, [field]: value } : item)));
  }

  function getRow(row: RowData, i: number, arr: RowData[]) {
    return (
      <tr key={row.name}>
        <CheckBoxCell
          key={row.name}
          value={row.selected}
          onChange={(value) => handleChangeRow(row, "selected", value)}
        />
        <td>{row.name}</td>
        <SelectorCell<PipeRack>
          items={models}
          selected={row.pr}
          onSelect={(value) => handleChangePR(row, value)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={false}
        />
        <SelectorCell<PipeRackPortal>
          items={row.pr ? row.pr.portals : []}
          selected={row.from}
          onSelect={(value) => handleChangeFromPortal(row, value)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={false}
        />
        <SelectorCell<PipeRackPortal>
          items={row.pr ? row.pr.portals.filter((p) => p !== row.from) : []}
          selected={row.to}
          onSelect={(value) => handleChangeToPortal(row, value)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={false}
        />
        <SelectorCell<number>
          items={getTiers(row)}
          selected={row.tier}
          onSelect={(value) => handleChangeRow(row, "tier", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item + 1}`}
          filterable={false}
        />
        <SelectorCell<PlatformPosition>
          items={platformPositions}
          selected={row.side}
          onSelect={(value) => handleChangeRow(row, "side", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <NumericCell
          min={getMinimalWidth(row)}
          className="w-80"
          isDecimal={true}
          value={row.width}
          onChange={(value) => handleChangeRow(row, "width", value)}
        />
        <NumericCell
          min={0}
          className="w-80"
          value={row.thickness}
          onChange={(value) => handleChangeRow(row, "thickness", value)}
        />
      </tr>
    );
  }

  function getTiers(row: RowData) {
    if (!row.from || !row.to) return [];
    const tiers =
      row.from.tiers.length > row.to.tiers.length ? row.to.tiers.length : row.from.tiers.length;
    const arr: number[] = [];
    for (let tier = 0; tier < tiers; tier++) {
      arr.push(tier);
    }
    return arr;
  }

  function getMinimalWidth(row: RowData) {
    let minW = 0;
    if (!row.pr || !row.from || !row.to) return minW;
    const indexFrom = row.pr.portals.indexOf(row.from);
    const indexTo = row.pr.portals.indexOf(row.to);
    const from = indexFrom > indexTo ? indexTo : indexFrom;
    const to = indexFrom > indexTo ? indexFrom : indexTo;
    for (let i = from; i < to; i++) {
      const p = row.pr.portals[i];
      if (row.side !== "LEFT OUT" && row.side !== "RIGHT OUT") {
        if (p.width > minW) minW = p.width;
        const beams: PipeRackBeam[] = getElementsByParent(row.pr.beams, p.name).filter(
          (b) => b.additional && b.direction === "X" && b.tier === row.tier
        );
        if (beams.length) {
          if (beams.length > 1 && row.side === "MID") {
            beams.forEach((b) => {
              const z = Math.abs(b.startPos.z);
              if (
                z > 0 &&
                z < minW / 2 &&
                beams.find((b2) => Math.abs(b2.startPos.z) <= z && b2.name !== b.name)
              )
                minW = z * 2;
            });
          }
          if (row.side === "RIGHT IN") {
            let minZ = p.width / -2;
            beams.forEach((b) => {
              if (b.startPos.z > minZ) minZ = b.startPos.z;
            });
            minW = p.width / 2 - minZ;
          }
          if (row.side === "LEFT IN") {
            let minZ = p.width / 2;
            beams.forEach((b) => {
              if (b.startPos.z < minZ) minZ = b.startPos.z;
            });
            minW = Math.abs(p.width / -2 - minZ);
          }
        }
      } else if (row.side === "LEFT OUT") {
        let minZ = 0;
        getSupBeams(row, p).forEach((b) => {
          const z = (b.startPos.z + b.endPos.z) / 2;
          if (minZ > z) minZ = z;
        });
        minW = Math.abs(minZ) - p.width / 2;
      } else if (row.side === "RIGHT OUT") {
        let minZ = 0;
        getSupBeams(row, p).forEach((b) => {
          const z = (b.startPos.z + b.endPos.z) / 2;
          if (minZ < z) minZ = z;
        });
        minW = minZ - p.width / 2;
      }
    }
    return minW;
  }

  function checkCreating(row: RowData) {
    if (!row.pr || !row.from || !row.to) return false;
    const indexFrom = row.pr.portals.indexOf(row.from);
    const indexTo = row.pr.portals.indexOf(row.to);
    const from = indexFrom > indexTo ? indexTo : indexFrom;
    const to = indexFrom > indexTo ? indexFrom : indexTo;
    for (let i = from; i < to; i++) {
      const p = row.pr.portals[i];
      if (row.side === "LEFT OUT" || row.side === "RIGHT OUT") {
        if (getSupCantilevers(row, p, i).length < 2) return false;
        if (getSupBeams(row, p).filter((b) => b.direction === "X").length < 2) return false;
      } else {
        const supBeams = getSupBeams(row, p);
        if (
          supBeams.filter((b) => b.direction === "X").length < 2 ||
          supBeams.filter((b) => b.direction === "Z").length < 2
        )
          return false;
      }
    }
    return true;
  }

  function getSupCantilevers(row: RowData, p: PipeRackPortal, i: number) {
    return [
      ...getElementsByParent(row.pr!.cantilevers, p.name),
      ...getElementsByParent(row.pr!.cantilevers, row.pr!.portals[i + 1].name),
    ].filter((item: PipeRackCantilever) => {
      if (row.side === "LEFT OUT") {
        if (item.side !== "L" || item.position !== "Left") return false;
      }
      if (row.side === "RIGHT OUT") {
        if (item.side !== "R" || item.position !== "Right") return false;
      }
      return row.tier === item.tier;
    });
  }

  function getSupBeams(row: RowData, p: PipeRackPortal) {
    const supBeams = getElementsByParent(row.pr!.beams, p.name).filter((b: PipeRackBeam) => {
      let checkByPos = false;
      if (row.side === "MID") {
        const z = Math.abs(b.startPos.z + b.endPos.z) / 2;
        checkByPos = z <= row.width / 2;
      } else if (row.side === "LEFT IN") {
        const z = (b.startPos.z + b.endPos.z) / 2;
        checkByPos = p.width / -2 + row.width >= z;
      } else if (row.side === "LEFT OUT") {
        const z = (b.startPos.z + b.endPos.z) / 2;
        checkByPos = p.width / -2 - row.width <= z && p.width / -2 >= z;
      } else if (row.side === "RIGHT IN") {
        const z = (b.startPos.z + b.endPos.z) / 2;
        checkByPos = p.width / 2 - row.width <= z;
      } else if (row.side === "RIGHT OUT") {
        const z = (b.startPos.z + b.endPos.z) / 2;
        checkByPos = p.width / 2 + row.width >= z && p.width / 2 <= z;
      }
      return b.tier === row.tier && ((b.direction === "X" && checkByPos) || b.direction === "Z");
    }) as PipeRackBeam[];
    const nextBeam = row.pr!.beams.find(
      (beam) =>
        beam.tier === row.tier &&
        beam.startPos.x === p.chainage + p.length &&
        beam.endPos.x === p.chainage + p.length
    );
    return nextBeam ? [...supBeams, nextBeam] : supBeams;
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Platforms</span>
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        <Button small icon="export" text="Export to CSV" intent="success" disabled={true} />
        <Button small icon="import" text="Import from CSV" intent="success" disabled={true} />
        <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
      </div>
      <div className="hr" />
      <div className="p-5">
        <div className="table-container">
          <table className="table bg-gray">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>PR No.</th>
                <th>From Portal No.</th>
                <th>To Portal No.</th>
                <th>Tier No.</th>
                <th>Side</th>
                <th>Width (m)</th>
                <th>Grating Thickness (mm)</th>
              </tr>
            </thead>
            <tbody>{rows.map(getRow)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Platforms;
