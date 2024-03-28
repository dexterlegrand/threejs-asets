import React, { FunctionComponent, useState, useEffect, useRef } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch } from "react-redux";
import {
  PipeRack,
  PipeRackPortal,
  PipeRackHBracing,
  PipeRackBeam,
  Releases,
  PipeRackCantilever,
} from "../../../../../store/main/types";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import {
  getIndexName,
  getNextId,
  getTopOffset,
  exportToCSV,
  importFromCSV,
} from "../../../../3d-models/utils";
import { changeModel } from "../../../../../store/main/actions";
import { getElementByName } from "../../../../3d-models/utils";
import { NumericCell } from "../../../../common/NumericCell";
import { addEventAction } from "../../../../../store/ui/actions";
import { Section } from "../../../../../store/data/types";
import { concatBeams, splitBeamsByHBracings } from "../../../../3d-models/pipe-rack/pipeRackUtils";

type Props = { models: PipeRack[]; profiles: Section[]; libs: string[] };

type RowData = {
  id: number;
  selected: boolean;
  pr?: PipeRack;
  portal?: PipeRackPortal;
  tier?: number;
  start?: PipeRackBeam | PipeRackCantilever;
  startOffset: number;
  end?: PipeRackBeam | PipeRackCantilever;
  endOffset: number;
  CSLibrary?: string;
  profile?: Section;
  releases?: Releases;
};

const PlanBracings: FunctionComponent<Props> = (props) => {
  const { models, profiles, libs } = props;
  const [init, setInit] = useState<boolean>(true);
  const [rowIndex, setRowIndex] = useState<number>(0);
  const [rows, setRows] = useState<RowData[]>([]);

  const dispatch = useDispatch();

  useEffect(() => {
    const newRows: RowData[] = [];
    models.forEach((model) =>
      model.hBracings.forEach((hb) => {
        newRows.push({
          id: hb.uiId ?? -1,
          selected: false,
          pr: model,
          portal: model.portals.find((p) => p.name === hb.parent),
          tier: hb.tier,
          start: getElementByName([...model.beams, ...model.cantilevers], hb.start),
          startOffset: hb.startOffset,
          end: getElementByName([...model.beams, ...model.cantilevers], hb.end),
          endOffset: hb.endOffset,
          CSLibrary: hb.CSLibrary,
          profile: hb.profile,
        });
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

  useEffect(() => {
    if (!init) {
      const vRows = rows.filter((row) => validRow(row));
      models.forEach((model) => {
        const hBracings: PipeRackHBracing[] = [];
        const fr = vRows.filter((row) => row.pr?.name === model.name);
        model.portals.forEach((p) => {
          fr.filter(
            (row) => row.portal?.name === p.name && row.tier !== undefined && row.start && row.end
          ).forEach((row) => {
            const index = getIndexName(hBracings, "HB");
            hBracings.push({
              id: index,
              uiId: row.id,
              name: `HB${index}`,
              type: "PipeRackHBracing",
              parent: p.name,
              tier: row.tier,
              start: row.start?.name,
              startOffset: row.startOffset,
              end: row.end?.name,
              endOffset: row.endOffset,
              CSLibrary: row.CSLibrary,
              profile: row.profile,
              releases: row.releases ?? {
                my1: true,
                mz1: true,
                my2: true,
                mz2: true,
              },
            } as PipeRackHBracing);
          });
        });
        !equalBracings(model.hBracings, hBracings) &&
          dispatch(
            changeModel({
              ...model,
              beams: splitBeamsByHBracings(concatBeams(model.beams, "HB"), hBracings),
              cantilevers: splitBeamsByHBracings(concatBeams(model.cantilevers, "HB"), hBracings),
              hBracings,
            } as PipeRack)
          );
      });
    } else setInit(false);
  }, [rows]);

  function validRow(row: RowData) {
    return row.pr && row.portal && row.tier !== undefined && row.start && row.end && row.profile;
  }

  function equalBracings(items: PipeRackHBracing[], newItems: PipeRackHBracing[]) {
    if (items.length !== newItems.length) return false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].parent !== newItems[i].parent) return false;
      if (items[i].tier !== newItems[i].tier) return false;
      if (items[i].start !== newItems[i].start) return false;
      if (items[i].startOffset !== newItems[i].startOffset) return false;
      if (items[i].end !== newItems[i].end) return false;
      if (items[i].endOffset !== newItems[i].endOffset) return false;
      if (items[i].CSLibrary !== newItems[i].CSLibrary) return false;
      if (items[i].profile !== newItems[i].profile) return false;
    }
    return true;
  }

  function handleAddRow() {
    setRows([...rows, { id: rowIndex, selected: false, startOffset: 0, endOffset: 0 }]);
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
              portal: undefined,
              tier: undefined,
              CSLibrary: pr?.CSLibrary,
              profile: pr?.portalTieProfile,
            }
          : item
      )
    );
  }

  function handleChangePortal(row: RowData, portal?: PipeRackPortal) {
    setRows(rows.map((item) => (item.id === row.id ? { ...row, portal, tier: undefined } : item)));
  }

  function handleChangeRow(row: RowData, field: string, value: any) {
    setRows(rows.map((item) => (item.id === row.id ? { ...row, [field]: value } : item)));
  }

  function getTiers(portal?: PipeRackPortal) {
    if (!portal) return [];
    const tiers: number[] = [];
    for (let tier = 0; tier < portal.tiers.length; tier++) {
      tiers.push(tier);
    }
    return tiers;
  }

  function getBeams(row: RowData, isEnd?: boolean): (PipeRackBeam | PipeRackCantilever)[] {
    const model = models.find((model) => model.name === row.pr?.name);
    if (!model) return [];
    return row.portal
      ? [...model.beams, ...model.cantilevers].filter((b) => {
          if (b.type === "PipeRackBeam") {
            const beam = b as PipeRackBeam;
            return (
              (beam.parent === row.portal!.name ||
                (!beam.additional &&
                  beam.direction === "Z" &&
                  beam.parent === model.portals[model.portals.indexOf(row.portal!) + 1]?.name)) &&
              beam.tier === row.tier &&
              (row.start && isEnd ? b.name !== row.start.name : true)
            );
          } else {
            const beam = b as PipeRackCantilever;
            return (
              (beam.parent === row.portal!.name ||
                beam.parent === model.portals[model.portals.indexOf(row.portal!) + 1]?.name) &&
              beam.tier === row.tier &&
              (row.start && isEnd ? b.name !== row.start.name : true)
            );
          }
        })
      : [];
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
        <SelectorCell<PipeRackBeam | PipeRackCantilever>
          items={getBeams(row)}
          selected={row.start}
          onSelect={(beam) => handleChangeRow(row, "start", beam)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={true}
          filter={(query, item) => (query ? item.name.includes(query.toUpperCase()) : true)}
        />
        <NumericCell
          min={0}
          max={row.start ? row.start.startPos.distanceTo(row.start.endPos) : 0}
          isDecimal={true}
          value={row.startOffset}
          onChange={(value) => handleChangeRow(row, "startOffset", value)}
          className={"w-80"}
        />
        <SelectorCell<PipeRackBeam | PipeRackCantilever>
          items={getBeams(row, true)}
          selected={row.end}
          onSelect={(beam) => handleChangeRow(row, "end", beam)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={true}
          filter={(query, item) => (query ? item.name.includes(query.toUpperCase()) : true)}
        />
        <NumericCell
          min={0}
          max={row.end ? row.end.startPos.distanceTo(row.end.endPos) : 0}
          isDecimal={true}
          value={row.endOffset}
          onChange={(value) => handleChangeRow(row, "endOffset", value)}
          className={"w-80"}
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

  const tableRef = useRef<HTMLTableElement>(null);

  const [offsetTop, setOffsetTop] = useState<number>(0);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [rows]);

  function handleExport() {
    const exportData = rows.map((row: RowData) => {
      const exportRow = {
        pr: row.pr?.name,
        portal: row.portal?.name,
        tier: row.tier,
        start: row.start?.name,
        startOffset: row.startOffset,
        end: row.end?.name,
        endOffset: row.endOffset,
        CSLibrary: row.CSLibrary,
        profile: row.profile?.designation,
      };
      return exportRow;
    });
    exportToCSV(exportData, "Horizontal Bracings");
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
            portal: getElementByName(model?.portals ?? [], item.portal),
            tier: item.tier,
            start: getElementByName(elements, item.start),
            startOffset: item.startOffset,
            end: getElementByName(elements, item.end),
            endOffset: item.endOffset,
            CSLibrary: item.CSLibrary,
            profile: profiles.find((profile) => profile.designation === item.profile),
          };
          newRows = [...newRows, newRow];
        });
      } catch (e) {
        dispatch(addEventAction(`Horizontal Bracings (Import): Parse error`, "danger"));
      }
      setRows(newRows);
    });
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Plan Bracings</span>
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
          <table ref={tableRef} className="table bg-gray">
            <thead>
              <tr>
                <th rowSpan={2}></th>
                <th rowSpan={2}>PR No.</th>
                <th rowSpan={2}>Bay No.</th>
                <th rowSpan={2}>Tier No.</th>
                <th colSpan={2}>From</th>
                <th colSpan={2}>To</th>
                <th rowSpan={2}>C/S Library</th>
                <th rowSpan={2}>Profile</th>
              </tr>
              <tr>
                <th style={{ top: offsetTop }}>Beam No.</th>
                <th style={{ top: offsetTop }}>Dist. from Start (m)</th>
                <th style={{ top: offsetTop }}>Beam No.</th>
                <th style={{ top: offsetTop }}>Dist. from Start (m)</th>
              </tr>
            </thead>
            <tbody>{rows.map((row, index) => getRow(row, index))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlanBracings;
