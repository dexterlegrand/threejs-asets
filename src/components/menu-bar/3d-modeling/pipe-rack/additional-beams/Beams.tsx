import React, { FunctionComponent, useState, useEffect } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch } from "react-redux";
import {
  PipeRack,
  PipeRackPortal,
  PipeRackBeam,
  PipeRackCantilever,
  UserDirection,
} from "../../../../../store/main/types";
import { NumericCell } from "../../../../common/NumericCell";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { simpleDirections } from "../../../../../store/main/constants";
import { changeModel } from "../../../../../store/main/actions";
import { Vector3 } from "three";
import {
  getIndexName,
  getNextId,
  exportToCSV,
  importFromCSV,
  getElementByName,
} from "../../../../3d-models/utils";
import { getElementsByParent } from "../../../../3d-models/utils";
import { addEventAction } from "../../../../../store/ui/actions";
import { Section } from "../../../../../store/data/types";
import { concatBeams, splitReleases } from "../../../../3d-models/pipe-rack/pipeRackUtils";

type Props = { models: PipeRack[]; profiles: Section[]; libs: string[] };

type RowData = {
  id: number;
  selected: boolean;
  pr?: PipeRack;
  portal?: PipeRackPortal;
  tier?: number;
  direction: "X" | "Z";
  offset: number;
  CSLibrary?: string;
  profile?: Section;
};

const Beams: FunctionComponent<Props> = (props) => {
  const { models, profiles, libs } = props;
  const [init, setInit] = useState<boolean>(true);
  const [rowIndex, setRowIndex] = useState<number>(0);
  const [rows, setRows] = useState<RowData[]>([]);

  const dispatch = useDispatch();

  useEffect(() => {
    const newRows: RowData[] = [];
    models.forEach((model) =>
      model.beams.forEach((b) => {
        if (b.additional && !b.next) {
          const portal = model.portals.find((p) => p.name === b.parent);
          const nextP = portal ? model.portals[model.portals.indexOf(portal) + 1] : undefined;
          newRows.push({
            id: b.uiId ?? -1,
            selected: false,
            pr: model,
            portal,
            tier: b.tier,
            direction: b.direction,
            offset: portal
              ? b.direction === "X"
                ? portal.width / 2 + b.startPos.z
                : nextP
                ? nextP.chainage - b.startPos.x
                : 0
              : 0,
            CSLibrary: b.CSLibrary,
            profile: b.profile,
          });
        }
      })
    );
    for (let i = 0, len = newRows.length; i < len; ++i) {
      const item = newRows[i];
      if (item.id === -1) {
        newRows[i] = { ...item, id: getNextId(newRows) };
      }
    }
    setRows(newRows.sort((a, b) => a.id - b.id));
    setRowIndex(getNextId(newRows));
  }, []);

  function sortRows(a: RowData, b: RowData) {
    return a.direction === "X" && b.direction === "Z"
      ? -1
      : a.direction === "Z" && b.direction === "X"
      ? 1
      : b.offset - a.offset;
  }

  useEffect(() => {
    if (!init) {
      const vRows = rows.filter((row) => validRow(row));
      models.forEach((model) => {
        let oldBeams: PipeRackBeam[] = concatBeams(model.beams, "AB");
        let oldCnts: PipeRackCantilever[] = concatBeams(model.cantilevers, "AB");
        // generate new beams
        model.portals.forEach((p) => {
          vRows
            .filter((row) => row.pr?.name === model.name && row.portal?.name === p.name)
            .sort(sortRows)
            .forEach((vRow) => {
              const height = p.tiers[vRow.tier!];
              const startPos = new Vector3(
                vRow.direction === "Z" ? p.chainage + p.length - vRow.offset : p.chainage,
                height,
                vRow.direction === "X" ? p.width / -2 + vRow.offset : p.width / 2
              );
              const endPos = new Vector3(
                vRow.direction === "Z"
                  ? p.chainage + p.length - vRow.offset
                  : p.chainage + p.length,
                height,
                vRow.direction === "X" ? p.width / -2 + vRow.offset : p.width / -2
              );
              if (
                !oldBeams.some((b) => {
                  if (b.startPos.equals(startPos) && b.endPos.equals(endPos)) return true;
                  if (vRow.direction === "Z") {
                    return (
                      startPos.x === b.startPos.x &&
                      startPos.x === b.endPos.x &&
                      startPos.y === b.startPos.y &&
                      ((b.startPos.z < startPos.z && b.startPos.z > endPos.z) ||
                        (b.endPos.z < startPos.z && b.endPos.z > endPos.z))
                    );
                  } else {
                    return (
                      ((b.startPos.x > startPos.x && b.startPos.x < endPos.x) ||
                        (b.endPos.x > startPos.x && b.endPos.x < endPos.x)) &&
                      startPos.y === b.startPos.y &&
                      startPos.z === b.startPos.z &&
                      startPos.z === b.endPos.z
                    );
                  }
                })
              ) {
                const index = getIndexName(oldBeams, "B");
                // genereate additional beam
                let ab = {
                  id: index,
                  uiId: vRow.id,
                  name: `B${index}`,
                  parent: p.name,
                  type: "PipeRackBeam",
                  tier: vRow.tier,
                  direction: vRow.direction,
                  startPos,
                  endPos,
                  CSLibrary: vRow.CSLibrary,
                  profile: vRow.profile,
                  additional: true,
                  releases: {
                    my1: true,
                    mz1: true,
                    my2: true,
                    mz2: true,
                  },
                } as PipeRackBeam;
                if (vRow.direction === "X") ab.side = "L";
                // getting available beams
                const beams = oldBeams.filter((b) => {
                  if (ab.direction === "Z") {
                    return (
                      b.direction === "X" &&
                      b.startPos.y === ab.startPos.y &&
                      ab.startPos.x >= b.startPos.x &&
                      ab.startPos.x <= b.endPos.x &&
                      b.startPos.z >= p.width / -2 &&
                      b.startPos.z <= p.width / 2
                    );
                  } else {
                    return (
                      b.direction === "Z" &&
                      b.startPos.y === ab.startPos.y &&
                      b.startPos.x >= ab.startPos.x &&
                      b.startPos.x <= ab.endPos.x &&
                      ab.startPos.z <= b.startPos.z &&
                      ab.startPos.z >= b.endPos.z
                    );
                  }
                });
                // split beams
                beams.forEach((b) => {
                  // check the start and end of the beam
                  if (
                    (b.direction === "X" &&
                      ab.direction === "Z" &&
                      (b.startPos.x === ab.startPos.x || b.endPos.x === ab.startPos.x) &&
                      b.startPos.z !== ab.startPos.z &&
                      b.startPos.z !== ab.endPos.z) ||
                    (b.direction === "Z" &&
                      ab.direction === "X" &&
                      (b.startPos.z === ab.startPos.z || b.endPos.z === ab.startPos.z) &&
                      b.startPos.x !== ab.startPos.x &&
                      b.endPos.x !== ab.startPos.x &&
                      b.startPos.x !== ab.endPos.x &&
                      b.endPos.x !== ab.endPos.x)
                  ) {
                    // In this case, only the additional beam is splitting
                    const nextId = getIndexName([...oldBeams, { name: ab.name }], "B");
                    const nextAb =
                      ab.direction === "Z"
                        ? {
                            ...ab,
                            id: nextId,
                            name: `B${nextId}`,
                            startPos: new Vector3().add(b.startPos).setX(ab.startPos.x),
                            next: undefined,
                            releases: splitReleases(ab, true),
                          }
                        : {
                            ...ab,
                            id: nextId,
                            name: `B${nextId}`,
                            startPos: new Vector3().add(ab.startPos).setX(b.startPos.x),
                            next: undefined,
                            releases: splitReleases(ab, true),
                          };
                    oldBeams.push({
                      ...ab,
                      endPos: nextAb.startPos,
                      next: nextAb.name,
                      releases: splitReleases(ab),
                    });
                    ab = nextAb;
                  } else if (
                    (b.direction === "X" &&
                      ab.direction === "Z" &&
                      b.endPos.x === ab.startPos.x &&
                      (b.endPos.z === ab.startPos.z || b.endPos.z === ab.endPos.z)) ||
                    (b.direction === "Z" &&
                      ab.direction === "X" &&
                      b.endPos.z === ab.startPos.z &&
                      (b.endPos.x === ab.startPos.x || b.endPos.x === ab.endPos.x))
                  ) {
                    oldBeams = oldBeams.map((ob) =>
                      ob.name === b.name
                        ? {
                            ...b,
                            splitters: b.splitters ? [...b.splitters, "AB"] : ["AB"],
                          }
                        : ob
                    );
                  } else if (
                    (b.direction === "X" &&
                      ab.direction === "Z" &&
                      ab.startPos.x > b.startPos.x &&
                      ab.startPos.x < b.endPos.x) ||
                    (b.direction === "Z" &&
                      ab.direction === "X" &&
                      ab.startPos.z < b.startPos.z &&
                      ab.startPos.z > b.endPos.z)
                  ) {
                    const nextId = getIndexName([...oldBeams, { name: ab.name }], "B");
                    const nextBeam: PipeRackBeam = {
                      ...b,
                      id: nextId,
                      name: `B${nextId}`,
                      startPos:
                        ab.direction === "Z"
                          ? new Vector3().add(b.startPos).setX(ab.startPos.x)
                          : new Vector3().add(b.startPos).setZ(ab.startPos.z),
                      next: b.next,
                      splitters: b.splitters,
                      releases: splitReleases(b, true),
                    };
                    const prevBeam = {
                      ...b,
                      endPos: nextBeam.startPos,
                      next: nextBeam.name,
                      splitters: ["AB"],
                      releases: splitReleases(b),
                    } as PipeRackBeam;
                    if (
                      ab.direction === "Z" &&
                      ab.startPos.z > b.startPos.z &&
                      ab.endPos.z < b.startPos.z
                    ) {
                      const nextAbId = getIndexName(
                        [...oldBeams, { name: ab.name }, { name: nextBeam.name }],
                        "B"
                      );
                      const nextAb = {
                        ...ab,
                        id: nextAbId,
                        name: `B${nextAbId}`,
                        startPos: new Vector3().add(b.startPos).setX(ab.startPos.x),
                        next: undefined,
                        releases: splitReleases(ab, true),
                      };
                      oldBeams.push({
                        ...ab,
                        endPos: nextAb.startPos,
                        next: nextAb.name,
                        releases: splitReleases(ab),
                      });
                      ab = nextAb;
                    }
                    oldBeams = [
                      ...oldBeams.map((ob) => (ob.name === b.name ? prevBeam : ob)),
                      nextBeam,
                    ];
                  }
                });
                if (!beams.length) {
                  const cantilevers = oldCnts.filter((cnt) => {
                    if (ab.direction === "Z") {
                      return (
                        cnt.startPos.y === ab.startPos.y &&
                        ((cnt.position === "Front" &&
                          ab.startPos.x <= cnt.startPos.x &&
                          ab.startPos.x >= cnt.endPos.x) ||
                          (cnt.position === "Back" &&
                            ab.startPos.x >= cnt.startPos.x &&
                            ab.startPos.x <= cnt.endPos.x)) &&
                        cnt.startPos.z >= p.width / -2 &&
                        cnt.startPos.z <= p.width / 2
                      );
                    } else {
                      return (
                        cnt.startPos.y === ab.startPos.y &&
                        cnt.startPos.x >= ab.startPos.x &&
                        cnt.startPos.x <= ab.endPos.x &&
                        ((cnt.position === "Left" &&
                          ab.startPos.z <= cnt.startPos.z &&
                          ab.startPos.z >= cnt.endPos.z) ||
                          (cnt.position === "Right" &&
                            ab.startPos.z >= cnt.startPos.z &&
                            ab.startPos.z <= cnt.endPos.z))
                      );
                    }
                  });
                  cantilevers.forEach((cnt) => {
                    if (
                      (ab.direction === "Z" &&
                        (cnt.position === "Front" || cnt.position === "Back") &&
                        cnt.endPos.x === ab.startPos.x &&
                        (cnt.endPos.z === ab.startPos.z || cnt.endPos.z === ab.endPos.z)) ||
                      (ab.direction === "X" &&
                        (cnt.position === "Left" || cnt.position === "Right") &&
                        cnt.endPos.z === ab.startPos.z &&
                        (cnt.endPos.x === ab.startPos.x || cnt.endPos.x === ab.endPos.x))
                    ) {
                      oldCnts = oldCnts.map((ocnt) =>
                        ocnt.name === cnt.name
                          ? {
                              ...cnt,
                              splitters: cnt.splitters ? [...cnt.splitters, "AB"] : ["AB"],
                            }
                          : ocnt
                      );
                    } else if (
                      (ab.direction === "Z" &&
                        ((cnt.position === "Front" &&
                          ab.startPos.x < cnt.startPos.x &&
                          ab.startPos.x > cnt.endPos.x) ||
                          (cnt.position === "Back" &&
                            ab.startPos.x > cnt.startPos.x &&
                            ab.startPos.x < cnt.endPos.x))) ||
                      (ab.direction === "X" &&
                        ((cnt.position === "Left" &&
                          ab.startPos.z < cnt.startPos.z &&
                          ab.startPos.z > cnt.endPos.z) ||
                          (cnt.position === "Right" &&
                            ab.startPos.z > cnt.startPos.z &&
                            ab.startPos.z < cnt.endPos.z)))
                    ) {
                      const nextId = getIndexName(oldCnts, `CNT-${cnt.side}`);
                      const nextCnt: PipeRackCantilever = {
                        ...cnt,
                        id: nextId,
                        name: `CNT-${cnt.side}${nextId}`,
                        startPos:
                          ab.direction === "Z"
                            ? new Vector3().add(cnt.startPos).setX(ab.startPos.x)
                            : new Vector3().add(cnt.startPos).setZ(ab.startPos.z),
                        next: cnt.next,
                        splitters: cnt.splitters,
                      };
                      const prevCnt = {
                        ...cnt,
                        endPos: nextCnt.startPos,
                        next: nextCnt.name,
                        splitters: ["AB"],
                      } as PipeRackCantilever;
                      oldCnts = [
                        ...oldCnts.map((ocnt) => (ocnt.name === cnt.name ? prevCnt : ocnt)),
                        nextCnt,
                      ];
                    }
                    // end
                  });
                }
                oldBeams.push(ab);
              }
            });
        });
        oldBeams.sort((a, b) => a.id - b.id);
        if (!equalBeams(model.beams, oldBeams)) {
          dispatch(
            changeModel({
              ...model,
              beams: oldBeams,
              cantilevers: oldCnts,
            } as PipeRack)
          );
        }
      });
    } else setInit(false);
  }, [rows]);

  function validRow(row: RowData) {
    return row.pr && row.portal && row.tier !== undefined && row.profile;
  }

  function equalBeams(items: PipeRackBeam[], newItems: PipeRackBeam[]) {
    if (items.length !== newItems.length) return false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].parent !== newItems[i].parent) return false;
      if (items[i].tier !== newItems[i].tier) return false;
      if (items[i].side !== newItems[i].side) return false;
      if (items[i].direction !== newItems[i].direction) return false;
      if (!items[i].startPos.equals(newItems[i].startPos)) return false;
      if (!items[i].endPos.equals(newItems[i].endPos)) return false;
      if (items[i].CSLibrary !== newItems[i].CSLibrary) return false;
      if (items[i].profile !== newItems[i].profile) return false;
    }
    return true;
  }

  function handleAddRow() {
    setRows([
      ...rows,
      {
        id: rowIndex,
        selected: false,
        direction: "X",
        offset: 0,
      },
    ]);
    setRowIndex(rowIndex + 1);
  }

  function handleDeleteRow() {
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
              tier: undefined,
              offset: 0,
              CSLibrary: pr?.CSLibrary,
              profile: pr?.portalTieProfile,
            }
          : item
      )
    );
  }

  function handleChangePortal(row: RowData, portal?: PipeRackPortal) {
    setRows(
      rows.map((item) =>
        item.id === row.id ? { ...row, portal, tier: undefined, offset: 0 } : item
      )
    );
  }

  function handleChangeRow(row: RowData, field: string, value: any) {
    setRows(rows.map((item) => (item.id === row.id ? { ...row, [field]: value } : item)));
  }

  function getTiers(portal?: PipeRackPortal) {
    if (!portal) return [];
    const tiers: number[] = [];
    for (let tier = 0; tier < portal.tiers.length; tier++) tiers.push(tier);
    return tiers;
  }

  function getCantilevers(
    row: RowData,
    p: PipeRackPortal,
    nextP: PipeRackPortal,
    dir: UserDirection
  ) {
    return [
      ...getElementsByParent(row.pr!.cantilevers, p.name),
      ...getElementsByParent(row.pr!.cantilevers, nextP.name),
    ].filter((item: PipeRackCantilever) => {
      if (item.position !== dir) return false;
      return row.tier === item.tier;
    });
  }

  function getMinOffset(row: RowData) {
    let result = 0;
    if (!row.pr || !row.portal) return result;
    const nextP = row.pr.portals[row.pr.portals.indexOf(row.portal) + 1];
    if (row.direction === "X") {
      const cnts = getCantilevers(row, row.portal, nextP, "Left") as PipeRackCantilever[];
      if (cnts.length > 1) {
        let minL = 0;
        cnts.forEach((cnt) => {
          if (cnt.length > minL) minL = cnt.length;
        });
        cnts.forEach((cnt) => {
          if (cnt.length < minL) minL = cnt.length;
        });
        result = -minL;
      }
    } else {
      const cnts = (getElementsByParent(
        row.pr.cantilevers,
        nextP.name
      ) as PipeRackCantilever[]).filter((cnt) => {
        if (cnt.position !== "Back") return false;
        return row.tier === cnt.tier;
      });
      if (cnts.length > 1) {
        let max = 0;
        cnts.forEach((cnt) => {
          max = Math.max(max, cnt.length);
        });
        result = -max;
      }
    }
    return result;
  }

  function getMaxOffset(row: RowData) {
    let result = 0;
    if (row.pr && row.portal) {
      const nextP = row.pr.portals[row.pr.portals.indexOf(row.portal) + 1];
      if (row.direction === "X") {
        const cnts = getCantilevers(row, row.portal, nextP, "Right") as PipeRackCantilever[];
        result = row.portal.width <= nextP.width ? row.portal.width : nextP.width;
        if (cnts.length > 1) {
          let minL = 0;
          cnts.forEach((cnt) => {
            if (cnt.length > minL) minL = cnt.length;
          });
          cnts.forEach((cnt) => {
            if (cnt.length < minL) minL = cnt.length;
          });
          result += minL;
        }
      } else {
        const cnts = (getElementsByParent(
          row.pr.cantilevers,
          row.portal.name
        ) as PipeRackCantilever[]).filter((cnt) => {
          if (cnt.position !== "Front") return false;
          return row.tier === cnt.tier;
        });
        if (cnts.length > 1) {
          let max = 0;
          cnts.forEach((cnt) => {
            max = Math.max(max, cnt.length);
          });
          result = row.portal.length + max;
        } else result = row.portal.length;
      }
    }
    return result;
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
          items={row.pr ? row.pr.portals.filter((p) => p.position !== "end") : []}
          selected={row.portal}
          onSelect={(portal) => handleChangePortal(row, portal)}
          itemKey={(item) => item.name}
          itemLabel={(item) => `${(row.pr?.portals.indexOf(item) ?? 0) + 1}`}
          filterable={false}
        />
        <SelectorCell<number>
          items={getTiers(row.portal)}
          selected={row.tier}
          onSelect={(tier) => handleChangeRow(row, "tier", tier)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item + 1}`}
          filterable={false}
        />
        <SelectorCell<string>
          items={simpleDirections}
          selected={row.direction}
          onSelect={(direction) => handleChangeRow(row, "direction", direction)}
          itemKey={(item) => item}
          itemLabel={(item) =>
            row.pr?.direction === "+Z" || row.pr?.direction === "-Z"
              ? item === "X"
                ? "Z"
                : "X"
              : item
          }
          filterable={false}
        />
        <NumericCell
          min={getMinOffset(row)}
          max={getMaxOffset(row)}
          className="w-200"
          isDecimal={true}
          value={row.offset}
          onChange={(offset) => handleChangeRow(row, "offset", offset)}
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
        tier: row.tier,
        direction: row.direction,
        offset: row.offset,
        CSLibrary: row.CSLibrary,
        profile: row.profile?.designation,
      };
      return exportRow;
    });
    exportToCSV(exportData, "Additional Beams");
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
            tier: item.tier,
            direction: item.direction.toUpperCase(),
            offset: item.offset,
            CSLibrary: item.CSLibrary,
            profile: profiles.find((profile) => profile.designation === item.profile),
          };
          newRows = [...newRows, newRow];
        });
      } catch (e) {
        dispatch(addEventAction(`Additional Beams (Import): Parse error`, "danger"));
      }
      setRows(newRows);
    });
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Beams</span>
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRow} />
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
                <th>{""}</th>
                <th>PR No.</th>
                <th>Bay No.</th>
                <th>Tier No.</th>
                <th>Direction</th>
                <th>Dist. from left Side (m)</th>
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
};

export default Beams;
