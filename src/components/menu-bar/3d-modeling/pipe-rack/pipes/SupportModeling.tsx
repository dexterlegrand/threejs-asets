import React, { useEffect, useState } from "react";
import { Button } from "@blueprintjs/core";
import {
  PipeRack,
  Pipe,
  PipeSupportType,
  SupType,
  PipeRackBeam,
  PipeRackCantilever,
} from "../../../../../store/main/types";
import { useDispatch } from "react-redux";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { pipeSupportTypes } from "../../../../../store/main/constants";
import { changeModel } from "../../../../../store/main/actions";
import { NumericCell } from "../../../../common/NumericCell";
import { Vector3 } from "three";
import { getElementByName, getPosByDistance } from "../../../../3d-models/utils";
import {
  getAccessoryBeams,
  getSupportPosByBeam,
  getDistanceForDirectLoad,
  getPipeSupportBeams,
} from "../../../../3d-models/pipe-rack/pipeRackUtils";

type Props = { models: PipeRack[] };

type RowData = {
  id: number;
  selected: boolean;
  pr?: PipeRack;
  pipe?: Pipe;
  type?: PipeSupportType;
  KforSpring: number;
  distance: number;
  position?: Vector3;
  beam?: string;
};

export function SupportModeling({ models }: Props) {
  const [initial, setInitial] = useState<boolean>(true);
  const [rowIndex, setRowIndex] = useState<number>(0);
  const [rows, setRows] = useState<RowData[]>([]);

  const dispatch = useDispatch();

  useEffect(() => {
    let newRows: RowData[] = [];
    let index = 0;
    models.forEach((model) =>
      model.pipes.forEach((pipe) => {
        if (pipe.supTypes.length) {
          newRows = [
            ...newRows,
            ...pipe.supTypes.map((sup) => {
              const newRow: RowData = {
                ...sup,
                id: index++,
                selected: false,
                pr: model,
                pipe,
                KforSpring: sup.KforSpring ?? 0,
              };
              return newRow;
            }),
          ];
        }
      })
    );
    setRowIndex(index);
    setRows(newRows);
  }, []);

  useEffect(() => {
    if (!initial) {
      const validRows = rows.filter((row) => row.pr && row.pipe && row.type);
      models.forEach((model) => {
        let beams = [...model.beams];
        let cantilevers = [...model.cantilevers];
        let agBeams = getAccessoryBeams(model.accessories);
        const pipes = model.pipes.map((pipe) => {
          const supTypes = validRows
            .filter((row) => row.pipe!.name === pipe.name)
            .map((row) => {
              const rowBeam = getElementByName([...beams, ...cantilevers, ...agBeams], row.beam);
              switch (rowBeam?.type) {
                case "PipeRackBeam":
                  beams = addDirectLoad(model, pipe, row, beams) as PipeRackBeam[];
                  break;
                case "PipeRackCantilever":
                  cantilevers = addDirectLoad(
                    model,
                    pipe,
                    row,
                    cantilevers
                  ) as PipeRackCantilever[];
                  break;
                case "AccessoryBeam":
                  agBeams = addDirectLoad(model, pipe, row, agBeams);
                  break;
              }
              const pos = rowBeam
                ? getSupportPosByBeam(pipe.start, pipe.end, pipe.direction, rowBeam)
                : getPosByDistance(row.distance, pipe.start, pipe.end);
              return {
                type: row.type,
                beam: row.beam,
                distance: pipe.start.distanceTo(pos),
                position: pos,
              } as SupType;
            });
          return {
            ...pipe,
            supTypes,
          };
        });
        !equalPipeSupTypes(model.pipes, pipes) &&
          dispatch(
            changeModel({
              ...model,
              beams,
              cantilevers,
              accessories: convertBeamsToAccessories(model, agBeams),
              pipes,
            } as PipeRack)
          );
      });
    } else setInitial(false);
  }, [rows]);

  function addDirectLoad(
    model: PipeRack,
    pipe: Pipe,
    row: RowData,
    arr: (PipeRackBeam | PipeRackCantilever)[]
  ) {
    const changed = arr.map((beam) => {
      if (beam.name === row.beam) {
        const id = arr.reduce((max, item) => Math.max(max, item.directLoadId ?? 0), 0) + 1;
        return {
          ...beam,
          directLoadId: id,
          directLoad: {
            id,
            lineNo: `${id}-${beam.name}`,
            model: model.name,
            element: beam.name,
            distance: getDistanceForDirectLoad(beam, pipe),
            empty_Fy: 0,

            test_Fx: 0,
            test_Fy: 0,
            test_Fz: 0,
            test_Mx: 0,
            test_My: 0,
            test_Mz: 0,

            operating_Fx: 0,
            operating_Fy: 0,
            operating_Fz: 0,
            operating_Mx: 0,
            operating_My: 0,
            operating_Mz: 0,

            thermalAnchor_Fx: 0,
            thermalAnchor_Fy: 0,
            thermalAnchor_Fz: 0,
            thermalAnchor_Mx: 0,
            thermalAnchor_My: 0,
            thermalAnchor_Mz: 0,

            thermalFriction_Fx: 0,
            thermalFriction_Fy: 0,
            thermalFriction_Fz: 0,
            thermalFriction_Mx: 0,
            thermalFriction_My: 0,
            thermalFriction_Mz: 0,

            surgeLoad_Fx: 0,
            surgeLoad_Fy: 0,
            surgeLoad_Fz: 0,

            windLoadX_Fx: 0,
            windLoadX_Fy: 0,
            windLoadX_Fz: 0,

            windLoadZ_Fx: 0,
            windLoadZ_Fy: 0,
            windLoadZ_Fz: 0,

            snowLoad: 0,
          },
        };
      } else {
        return beam;
      }
    });
    return changed;
  }

  function convertBeamsToAccessories(model: PipeRack, beams: any[]) {
    const changed = model.accessories.map((ag) => {
      const elements = ag.elements.map((el) => {
        const beamItems = el.beamItems.map((beam) => {
          const changedBeam = beams.find((item) => {
            return (
              beam.name === item.name &&
              beam.position === item.position &&
              beam.parent === item.parent &&
              beam.parentGroup === item.parentGroup
            );
          });
          return changedBeam;
        });
        return { ...el, beamItems };
      });
      return { ...ag, elements };
    });
    return changed;
  }

  function equalPipeSupTypes(pipes: Pipe[], newPipes: Pipe[]) {
    for (let i = 0; i < pipes.length; i++) {
      if (pipes[i].supTypes.length !== newPipes[i].supTypes.length) return false;
      for (let j = 0; j < pipes[i].supTypes.length; j++) {
        if (pipes[i].supTypes[j].type !== newPipes[i].supTypes[j].type) return false;
        if (pipes[i].supTypes[j].beam !== newPipes[i].supTypes[j].beam) return false;
        if (pipes[i].supTypes[j].distance !== newPipes[i].supTypes[j].distance) return false;
        if (pipes[i].supTypes[j].KforSpring !== newPipes[i].supTypes[j].KforSpring) return false;
      }
    }
    return true;
  }

  function handleAddRow() {
    setRows([...rows, { id: rowIndex, selected: false, KforSpring: 0, distance: 0 }]);
    setRowIndex(rowIndex + 1);
  }

  function handleDeleteRows() {
    setRows(rows.filter((row) => !row.selected));
  }

  function handleChangePR(id: number, pr?: PipeRack) {
    setRows(
      rows.map((row) => (row.id === id ? { ...row, pr, pipe: undefined, beam: undefined } : row))
    );
  }

  function handleChangePipe(id: number, pipe?: Pipe) {
    setRows(rows.map((row) => (row.id === id ? { ...row, pipe, beam: undefined } : row)));
  }

  function handleChangeRow(item: RowData, field: string, value: any) {
    let changed = { ...item, [field]: value };
    if (changed.pr && changed.pipe && field === "beam") {
      const beam = getElementByName(getPipeSupportBeams(changed.pr, changed.pipe), changed.beam);
      const pos = beam
        ? getSupportPosByBeam(changed.pipe.start, changed.pipe.end, changed.pipe.direction, beam)
        : getPosByDistance(item.distance, changed.pipe.start, changed.pipe.end);
      changed = {
        ...changed,
        position: pos.clone(),
        distance: changed.pipe.start.distanceTo(pos),
      };
    }
    setRows(rows.map((row) => (row.id === item.id ? changed : row)));
  }

  function getRow(data: RowData, arr: RowData[]) {
    return (
      <tr key={data.id}>
        <CheckBoxCell
          key={data.id}
          value={data.selected}
          onChange={(value) => handleChangeRow(data, "selected", value)}
        />
        <SelectorCell<PipeRack>
          items={models}
          selected={data.pr}
          onSelect={(value) => handleChangePR(data.id, value)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={false}
        />
        <SelectorCell<Pipe>
          items={data.pr ? data.pr.pipes : []}
          selected={data.pipe}
          onSelect={(value) => handleChangePipe(data.id, value)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={true}
          filter={(query, item) => (query ? item.name.includes(query.toUpperCase()) : true)}
        />
        <SelectorCell<PipeSupportType>
          items={pipeSupportTypes}
          selected={data.type}
          onSelect={(value) => handleChangeRow(data, "type", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <NumericCell
          isDecimal={true}
          value={data.KforSpring}
          onChange={(value) => handleChangeRow(data, "KforSpring", value)}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={data.distance}
          disabled={!!data.beam}
          onChange={(value) => handleChangeRow(data, "distance", value)}
        />
        <td>
          {data.position ? `(${data.position.x}; ${data.position.y}; ${data.position.z})` : null}
        </td>
        <SelectorCell<string>
          items={getBeams(data, arr)}
          selected={data.beam}
          onSelect={(value) => handleChangeRow(data, "beam", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
          clearable={true}
        />
      </tr>
    );
  }

  function getBeams(data: RowData, arr: RowData[]) {
    if (!data.pr || !data.pipe) return [];
    return getPipeSupportBeams(data.pr, data.pipe)
      .filter((b) => {
        return !arr.some((item) => item.pipe?.name === data.pipe?.name && item.beam === b.name);
      })
      .map((b) => b.name);
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Support Modeling</span>
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        <Button small icon="export" text="Export to CSV" intent="success" disabled={true} />
        <Button small icon="import" text="Import from CSV" intent="success" disabled={true} />
        <Button small icon="plus" text="Add row" intent="primary" onClick={handleAddRow} />
      </div>
      <div className="hr" />
      <div className="d-flex p-5">
        <div className="d-flex f-grow table-container">
          <table className="table bg-gray">
            <thead>
              <tr>
                <th></th>
                <th>PR No.</th>
                <th>Pipe Line No.</th>
                <th>Support Type</th>
                <th>
                  K for Spring (KN/M<sup>2</sup>/m)
                </th>
                <th>Distance from start of Pipe</th>
                <th>Position</th>
                <th>Supporting Beam No.</th>
              </tr>
            </thead>
            <tbody>{rows.map((row, i, arr) => getRow(row, arr))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
