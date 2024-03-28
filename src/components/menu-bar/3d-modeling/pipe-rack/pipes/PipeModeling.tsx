import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  PipeRack,
  Direction3,
  Pipe,
  Model,
  PipeRackPortal,
} from "../../../../../store/main/types";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { NumericCell } from "../../../../common/NumericCell";
import { directions3 } from "../../../../../store/main/constants";
import { useDispatch, useSelector } from "react-redux";
import { changeModel } from "../../../../../store/main/actions";
import {
  getTopOffset,
  MMtoM,
  MtoMM,
  checkFileType,
  getIndexName,
  getElementByName,
  getNextId,
  getUnicuesArray,
} from "../../../../3d-models/utils";
import { ApplicationState } from "../../../../../store";
import { importPipesToModels } from "../../../../3d-models/pipe-importing/toPipeRack";
import { NumericInputDlg } from "../../../../common/NumericInputDlg";
import { Material, PipeProfile } from "../../../../../store/data/types";
import { getPipeVector } from "../../../../3d-models/pipe-rack/pipeRackUtils";

type Props = {
  models: PipeRack[];
};

type RowData = {
  id: number;
  selected: boolean;
  pr?: PipeRack;
  name: string;
  direction: Direction3;
  startBay?: number;
  startElevation: number;
  startLeftDist: number;
  startBayDist: number;
  endBay?: number;
  endElevation: number;
  endLeftDist: number;
  endBayDist: number;
  diameter: number;
  thickness: number;
  lib?: string;
  profile?: PipeProfile;
  material?: Material;
  succeeding: string;
};

export function PipeModeling({ models }: Props) {
  const [dialog, setDialog] = useState<JSX.Element>();
  const [initial, setInitial] = useState<boolean>(true);
  const [rows, setRows] = useState<RowData[]>([]);
  const [imported, setImported] = useState<boolean>(false);

  const [offsetTop, setOffsetTop] = useState<number>(0);

  const resoures = useSelector((state: ApplicationState) => state.data);
  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const dispatch = useDispatch();

  const tableRef = useRef<HTMLTableElement>(null);

  const pipeLibs = useMemo(() => {
    return getUnicuesArray(
      resoures.pipingSS.map((profile) => profile.country_code?.trim() ?? "")
    );
  }, [resoures]);

  useEffect(() => {
    const newRows: RowData[] = [];
    models.forEach((model) => {
      model.pipes.forEach((pipe) => {
        newRows.push({
          id: newRows.length,
          selected: false,
          pr: model,
          name: pipe.name,
          direction: pipe.direction,
          startBay: getPortalIndex(model.portals, pipe.fromPortal),
          startElevation: pipe.startElevation,
          startBayDist: pipe.startBayDist,
          startLeftDist: pipe.startLeftDist,
          endBay: getPortalIndex(model.portals, pipe.toPortal),
          endElevation: pipe.endElevation,
          endBayDist: pipe.endBayDist,
          endLeftDist: pipe.endLeftDist,
          diameter: MtoMM(pipe.diameter),
          thickness: MtoMM(pipe.thickness),
          lib: pipe.lib,
          profile: pipe.profile,
          material: pipe.material,
          succeeding: pipe.succeeding,
        });
      });
      setRows(newRows);
    });
  }, []);

  useEffect(() => {
    if (!imported) return;
    const newRows: RowData[] = [];
    models.forEach((model) => {
      model.pipes.forEach((pipe) => {
        newRows.push({
          id: newRows.length,
          selected: false,
          pr: model,
          name: pipe.name,
          direction: pipe.direction,
          startBay: getPortalIndex(model.portals, pipe.fromPortal),
          startElevation: pipe.startElevation,
          startBayDist: pipe.startBayDist,
          startLeftDist: pipe.startLeftDist,
          endBay: getPortalIndex(model.portals, pipe.toPortal),
          endElevation: pipe.endElevation,
          endBayDist: pipe.endBayDist,
          endLeftDist: pipe.endLeftDist,
          diameter: MtoMM(pipe.diameter),
          thickness: MtoMM(pipe.thickness),
          lib: pipe.lib,
          profile: pipe.profile,
          material: pipe.material,
          succeeding: pipe.succeeding,
        });
      });
      setImported(false);
      setRows(newRows);
    });
  }, [models]);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
    if (!initial) {
      const validRows = rows.filter(
        (row) =>
          row.pr &&
          row.startBay !== undefined &&
          row.endBay !== undefined &&
          row.diameter &&
          row.thickness
      );
      models.forEach((model) => {
        const pipes: Pipe[] = validRows
          .filter((row) => row.pr?.name === model.name)
          .map((row, i, arr) => {
            const prevPipe = arr.find((item) => item.succeeding === row.name);
            const fromPortal =
              model.portals[prevPipe ? prevPipe.endBay! : row.startBay!];
            const toPortal = model.portals[row.endBay!];
            const newPipe = {
              name: row.name,
              parent: row.pr?.name,
              direction: row.direction,
              diameter: MMtoM(row.diameter),
              thickness: MMtoM(row.thickness),
              lib: row.lib,
              profile: row.profile,
              material: row.material,
              fromPortal: fromPortal.name,
              startElevation: row.startElevation,
              startLeftDist: row.startLeftDist,
              startBayDist: row.startBayDist,
              start: prevPipe
                ? getPipeVector(
                    prevPipe.direction,
                    prevPipe.endLeftDist,
                    prevPipe.endBayDist,
                    prevPipe.endElevation,
                    fromPortal,
                    model.portals,
                    "end"
                  )
                : getPipeVector(
                    row.direction,
                    row.startLeftDist,
                    row.startBayDist,
                    row.startElevation,
                    fromPortal,
                    model.portals,
                    "start"
                  ),
              toPortal: toPortal.name,
              endElevation: row.endElevation,
              endLeftDist: row.endLeftDist,
              endBayDist: row.endBayDist,
              end: getPipeVector(
                row.direction,
                row.endLeftDist,
                row.endBayDist,
                row.endElevation,
                toPortal,
                model.portals,
                "end"
              ),
              succeeding: row.succeeding,
              supTypes:
                model.pipes.find((p) => p.name === row.name)?.supTypes ?? [],
            } as Pipe;
            return newPipe;
          });
        dispatch(changeModel({ ...model, pipes } as Model));
      });
    } else setInitial(false);
  }, [rows]);

  function getPortalIndex(portals: PipeRackPortal[], name: string) {
    const portal = portals.find((portal) => portal.name === name);
    return portal ? portals.indexOf(portal) : undefined;
  }

  function handleAddRow() {
    const index = getIndexName(rows, "PP");
    setRows([
      ...rows,
      {
        id: getNextId(rows),
        selected: false,
        name: `PP${index}`,
        direction: "+X",
        startElevation: 0,
        startLeftDist: 0,
        startBayDist: 0,
        endElevation: 0,
        endLeftDist: 0,
        endBayDist: 0,
        diameter: 0,
        thickness: 0,
        succeeding: "END",
      },
    ]);
  }

  function handleDeleteRows() {
    const newRows = rows.filter((row) => !row.selected);
    setRows(
      newRows.map((nr) =>
        newRows.find((nrf) => nrf.pr?.name === nr.succeeding)
          ? nr
          : { ...nr, succeeding: "END" }
      )
    );
  }

  function handleChangePR(item: RowData, pr?: PipeRack) {
    setRows(
      rows.map((row) =>
        row.id === item.id
          ? { ...row, pr, startBay: undefined, endBay: undefined }
          : row
      )
    );
  }

  function handleChangeDirection(item: RowData, direction?: Direction3) {
    setRows(
      rows.map((row) =>
        row.id === item.id
          ? {
              ...row,
              direction: direction ?? "+X",
              endBay: row.startBay,
              succeeding: "END",
            }
          : row.succeeding === item.name
          ? { ...row, succeeding: "END" }
          : row
      )
    );
  }

  function handleChangeStartPoint(
    item: RowData,
    field: string,
    value?: number
  ) {
    if (field === "startBay") handleChangeStartBay(item, value ?? 0);
    else handleChangeStartOffset(item, field, value ?? 0);
  }

  function handleChangeStartBay(item: RowData, startBay: number) {
    setRows(
      rows.map((row) =>
        row.id === item.id
          ? {
              ...row,
              startBay,
              endBay: !(row.direction === "+X" || row.direction === "-X")
                ? startBay
                : undefined,
            }
          : row.succeeding === item.name
          ? {
              ...row,
              succeeding: "END",
            }
          : row
      )
    );
  }

  function handleChangeStartOffset(
    item: RowData,
    field: string,
    value: number
  ) {
    setRows(
      rows.map((row) =>
        row.id === item.id
          ? {
              ...row,
              [field]: value,
            }
          : row.succeeding === item.name
          ? {
              ...row,
              succeeding: "END",
            }
          : row
      )
    );
  }

  function handleChangeEndPoint(item: RowData, field: string, value?: number) {
    setRows(
      rows.map((row) =>
        row.id === item.id
          ? {
              ...row,
              [field]: value,
              succeeding: "END",
            }
          : row
      )
    );
  }

  function handleChangeSucceeding(item: RowData, sName?: string) {
    setRows(
      rows.map((row) =>
        row.id === item.id
          ? { ...row, succeeding: sName ?? "END" }
          : row.succeeding === sName
          ? {
              ...row,
              succeeding: "END",
            }
          : row
      )
    );
  }

  function handleChangeDiameter(item: RowData, diameter: any) {
    setRows(
      rows.map((row) =>
        row.id === item.id
          ? { ...row, diameter, succeeding: "END" }
          : row.succeeding === item.name
          ? {
              ...row,
              succeeding: "END",
            }
          : row
      )
    );
  }

  function handleChangeProfile(item: RowData, value: any) {
    // todo selecting necessary variables
    setRows(
      rows.map((row) =>
        row.id === item.id
          ? {
              ...row,
              diameter: value?.d_global ?? 0,
              thickness: value?.t_global ?? 0,
              profile: value,
            }
          : row
      )
    );
  }

  function handleChangeRow(item: RowData, field: string, value: any) {
    setRows(
      rows.map((row) => (row.id === item.id ? { ...row, [field]: value } : row))
    );
    console.log(item);
  }

  function getRow(data: RowData, arr: RowData[]) {
    return (
      <tr key={data.name}>
        <CheckBoxCell
          key={data.name}
          value={data.selected}
          onChange={(value) => handleChangeRow(data, "selected", value)}
        />
        <SelectorCell<PipeRack>
          items={models}
          selected={data.pr}
          onSelect={(value) => handleChangePR(data, value)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={false}
        />
        <td>{data.name}</td>
        <SelectorCell<Direction3>
          items={directions3}
          selected={data.direction}
          onSelect={(value) => handleChangeDirection(data, value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <SelectorCell<number>
          items={getBays(data)}
          disabled={rows.some((row) => row.succeeding === data.name)}
          selected={data.startBay}
          onSelect={(value) => handleChangeStartPoint(data, "startBay", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item + 1}`}
          filterable={false}
        />
        <NumericCell
          isDecimal={true}
          value={data.startElevation}
          onChange={(value) =>
            handleChangeEndPoint(data, "startElevation", value)
          }
        />
        <NumericCell
          isDecimal={true}
          disabled={rows.some((row) => row.succeeding === data.name)}
          value={data.startLeftDist}
          onChange={(value) =>
            handleChangeStartPoint(data, "startLeftDist", value)
          }
        />
        <NumericCell
          isDecimal={true}
          disabled={rows.some((row) => row.succeeding === data.name)}
          value={data.startBayDist}
          onChange={(value) =>
            handleChangeStartPoint(data, "startBayDist", value)
          }
        />
        <SelectorCell<number>
          items={getBays(data, true)}
          selected={data.endBay}
          onSelect={(value) => handleChangeEndPoint(data, "endBay", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item + 1}`}
          filterable={false}
        />
        <NumericCell
          isDecimal={true}
          value={data.endElevation}
          onChange={(value) =>
            handleChangeEndPoint(data, "endElevation", value)
          }
        />
        <NumericCell
          isDecimal={true}
          value={data.endLeftDist}
          onChange={(value) => handleChangeEndPoint(data, "endLeftDist", value)}
        />
        <NumericCell
          isDecimal={true}
          value={data.endBayDist}
          onChange={(value) => handleChangeEndPoint(data, "endBayDist", value)}
        />
        <NumericCell
          isDecimal={true}
          value={data.diameter}
          disabled={!!data.profile}
          onChange={(value) => handleChangeDiameter(data, value)}
        />
        <NumericCell
          isDecimal={true}
          value={data.thickness}
          disabled={!!data.profile}
          onChange={(value) => handleChangeRow(data, "thickness", value)}
        />
        <SelectorCell<string>
          items={pipeLibs}
          selected={data.lib}
          onSelect={(value) => handleChangeRow(data, "lib", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <SelectorCell<PipeProfile>
          items={resoures.pipingSS}
          selected={data.profile}
          onSelect={(value) => handleChangeProfile(data, value)}
          itemKey={(item) => item.piping_details_id}
          itemLabel={(item) =>
            `${item.nominal_pipe_size_inch} - ${item.schedule}`
          }
          filterable={true}
          filter={(query, item) =>
            query
              ? `${item.nominal_pipe_size_inch} - ${item.schedule}`
                  .toLocaleLowerCase()
                  .includes(query.toLocaleLowerCase())
              : true
          }
        />
        <SelectorCell<Material>
          items={resoures.materials}
          selected={data.material}
          onSelect={(value) => handleChangeRow(data, "material", value)}
          itemKey={(item) => item.material_id}
          itemLabel={(item) => item.material_name}
          filterable={false}
        />
        <SelectorCell<string>
          items={getPipes(data, arr)}
          selected={data.succeeding}
          onSelect={(value) => handleChangeSucceeding(data, value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
      </tr>
    );
  }

  function getBays(data: RowData, isEnd: boolean = false): number[] {
    if (!data.pr) return [];
    if (
      !(data.direction === "+X" || data.direction === "-X") &&
      data.startBay !== undefined &&
      isEnd
    )
      return [data.startBay];
    const bays: number[] = [];
    if (isEnd) {
      if (data.startBay !== undefined)
        data.pr.portals.forEach(
          (portal, index) =>
            portal.position !== "end" &&
            (data.direction === "+X"
              ? index >= data.startBay!
              : index <= data.startBay!) &&
            bays.push(index)
        );
    } else {
      data.pr.portals.forEach(
        (portal, index) => portal.position !== "end" && bays.push(index)
      );
    }
    return bays;
  }

  function getPipes(pipe: RowData, arr: RowData[]) {
    const pipes = [];
    arr.forEach(
      (item) =>
        item.pr &&
        item.pr.name === pipe.pr?.name &&
        item.name !== pipe.name &&
        item.startBay !== undefined &&
        item.startBay === pipe.endBay &&
        item.diameter === pipe.diameter &&
        pipes.push(item.name)
    );
    pipes.push("END");
    return pipes;
  }

  function handleImportPipes() {
    if (!project) return;
    setDialog(
      <NumericInputDlg
        title={"Distance around models"}
        label={"Margin in meters around structure for importing pipe"}
        isDecimal={true}
        defaultValue={2}
        onClose={() => setDialog(undefined)}
        onSubmit={(value) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".xch, .pps";
          input.onchange = (event: any) => {
            const file = (event.target.files as FileList)[0];
            if (!file) return;
            file.text().then((text) => {
              const json = JSON.parse(text);
              const extension = checkFileType(file.name);
              if (extension === "xch" || extension === "pps") {
                setImported(true);
                importPipesToModels(
                  dispatch,
                  project,
                  resoures,
                  extension,
                  json,
                  value
                );
              }
            });
          };
          input.click();
          input.remove();
          setDialog(undefined);
        }}
      />
    );
  }

  return (
    <>
      {dialog}
      <div className="d-flex f-column">
        <div className="hr" />
        <div className="label-light bg-dark">
          <span>Pipe Modeling</span>
          <Button
            small
            icon="trash"
            text="Delete"
            intent="warning"
            onClick={handleDeleteRows}
          />
          <Button
            small
            icon="export"
            text="Export to CSV"
            intent="success"
            disabled={true}
          />
          <Button
            small
            icon="import"
            text="Import from CSV"
            intent="success"
            disabled={true}
          />
          <Button
            small
            icon="plus"
            text="Add row"
            intent="primary"
            onClick={handleAddRow}
          />
          <Button
            small
            text="Import 3D Piping"
            intent="primary"
            onClick={handleImportPipes}
          />
        </div>
        <div className="hr" />
        <div className="d-flex p-5">
          <div className="d-flex f-grow table-container">
            <table ref={tableRef} className="table bg-gray">
              <thead>
                <tr>
                  <th rowSpan={2}></th>
                  <th rowSpan={2}>PR No.</th>
                  <th rowSpan={2}>Line No.</th>
                  <th rowSpan={2}>Direction</th>
                  <th colSpan={4}>Start Point</th>
                  <th colSpan={4}>End Point</th>
                  <th colSpan={5}>Pipe Profile</th>
                  <th rowSpan={2}>Succeeding Pipe</th>
                </tr>
                <tr>
                  <th style={{ top: offsetTop }}>Bay No.</th>
                  <th style={{ top: offsetTop }}>Elevation (m)</th>
                  <th style={{ top: offsetTop }}>Dist. From Left Side (m)</th>
                  <th style={{ top: offsetTop }}>Dist. From Bay Start (m)</th>
                  <th style={{ top: offsetTop }}>Bay No.</th>
                  <th style={{ top: offsetTop }}>Elevation (m)</th>
                  <th style={{ top: offsetTop }}>Dist. From Left Side (m)</th>
                  <th style={{ top: offsetTop }}>Dist. From Bay End (m)</th>
                  <th style={{ top: offsetTop }}>Outer Dia (mm)</th>
                  <th style={{ top: offsetTop }}>Thickness (mm)</th>
                  <th style={{ top: offsetTop }}>C/S Library</th>
                  <th style={{ top: offsetTop }}>Profile</th>
                  <th style={{ top: offsetTop }}>Material</th>
                </tr>
              </thead>
              <tbody>{rows.map((row, index, arr) => getRow(row, arr))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
