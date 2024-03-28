import React, { useCallback, useMemo } from "react";
import {
  getNextId,
  getPosByDistance,
  roundVectorM,
  roundM,
  MMtoM,
  exportToCSV,
  importFromCSV,
  checkImportedNumber,
  fixNumberToStr,
  strFilter,
  getCurrentProject,
} from "../../../../3d-models/utils";
import { FreePipe } from "../../../../../store/main/types";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import {
  createPipeAction,
  deletePipesAction,
  setPipesAction,
} from "../../../../../store/main/actions";
import { addEventAction } from "../../../../../store/ui/actions";
import { Vector3 } from "three";
import { TPipingReturn } from "../../../../../store/data/types";
import { initialPipe } from "../../../../../store/main/constants";
import GenericTable, {
  THeader,
  THeaderRow,
  TDataField,
  TField,
} from "../../../../common/table/GenericTable";
import {
  getAngle,
  continuePipe,
  rotationV,
} from "../../../../3d-models/pipes/pipesUtils";
import {
  changePipeLineTag,
  getPrecedingDirs,
} from "../../../../../services/pipe-services/pipe-service";

type Props = {
  pipes: FreePipe[];
};

export default React.memo(function LineModeling(props: Props) {
  const dispatch = useDispatch();

  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const isProcessExist = useMemo(() => {
    return props.pipes.some((r) => r.processLine !== undefined);
  }, [props.pipes]);

  const header: THeader = useMemo(() => {
    const firstRow: THeaderRow = {
      columns: [
        { title: "Line No.", rowSpan: 2 },
        { title: "Tag", rowSpan: 2 },
        { title: "Supporting Structures", rowSpan: 2 },
        { title: "Pipe No.", rowSpan: 2 },
        { title: "C.L. Elevation (m)", rowSpan: 2 },
        { title: "Length (m)", rowSpan: 2 },
        { title: "Preceding Pipe No.", rowSpan: 2 },
        { title: "Start Point Co-ordinate, (m)", colSpan: 3 },
        { title: "Change in Direction, (deg)", colSpan: 2 },
        { title: "Angle to Preceding, (deg)", rowSpan: 2 },
        { title: "End Point Co-ordinate, (m)", colSpan: 3 },
      ],
    };
    if (isProcessExist)
      firstRow.columns.unshift({ title: "Process Line No.", rowSpan: 2 });
    const secondRow: THeaderRow = {
      columns: [
        { title: "X" },
        { title: "Y" },
        { title: "Z" },
        { title: "Plan" },
        { title: "Elevation" },
        { title: "X" },
        { title: "Y" },
        { title: "Z" },
      ],
    };
    const rows: THeaderRow[] = [firstRow, secondRow];
    return { rows };
  }, [isProcessExist]);

  const handleAddRow = useCallback(() => {
    dispatch(createPipeAction());
  }, [dispatch]);

  const handleChangeRow = useCallback(
    (pipes: FreePipe[], row: FreePipe, field: string, value: any) => {
      let freePipes = [...pipes];
      if (field === "elevation") {
        freePipes = handleChangeElevation(pipes, row, value);
      } else if (field === "length") {
        freePipes = handleChangeLength(pipes, row, value);
      } else if (field === "preceding") {
        freePipes = handleChangePreceding(pipes, row, value);
      } else if (["x2", "y2", "z2"].includes(field)) {
        // @ts-ignore
        freePipes = handleChangeEndPoint(pipes, row, field, value);
      } else {
        let changed = { ...row, [field]: value };
        const start = new Vector3(changed.x1, changed.y1, changed.z1);
        const end = new Vector3(changed.x2, changed.y2, changed.z2);
        if (changed.preceding !== "START") {
          const prev = pipes.find((r) => r.pipe === row.preceding);
          if (prev) {
            if (field === "vDir" || field === "hDir") {
              start.set(prev.x2, prev.y2, prev.z2);
              end.copy(continuePipe(prev, row));
              if (Math.abs(changed.hDir) === 180) {
                rotationV(start, end, changed.length, changed.hDir, 0);
                if (
                  prev.params.endConnectorType === "Return" &&
                  prev.params.endConnector
                ) {
                  const o = MMtoM(
                    (prev.params.endConnector as TPipingReturn).o
                  );
                  const startA = new Vector3(prev.x1, prev.y1, prev.z1);
                  const endA = new Vector3(prev.x2, prev.y2, prev.z2);
                  start.copy(
                    roundVectorM(
                      getPosByDistance(prev.length + o, startA, endA)
                    )
                  );
                  rotationV(endA, start, o, changed.hDir < 0 ? -90 : 90, 0);
                  rotationV(endA, start, o, 0, changed.vDir);
                  end.add(start.clone().sub(endA));
                }
              } else {
                rotationV(
                  start,
                  end,
                  changed.length,
                  changed.hDir,
                  changed.vDir
                );
              }
              if (
                Math.max(Math.abs(changed.hDir), Math.abs(changed.vDir)) !==
                Math.max(Math.abs(row.hDir), Math.abs(row.vDir))
              ) {
                freePipes = removeEndConnector(freePipes, prev);
              }
            } else if (field === "x1" || field === "y1" || field === "z1") {
              if (field === "y1") {
                changed = {
                  ...changed,
                  elevation: (changed.y2 + value) / 2,
                  hDir: 0,
                  vDir: 0,
                };
              }
              const connectedPipe = pipes.find(
                (item) => item.pipe === changed.preceding
              );
              if (connectedPipe) {
                freePipes =
                  field === "y1"
                    ? pipes.map((item) =>
                        item.id === connectedPipe.id
                          ? {
                              ...item,
                              y2: value,
                              elevation: (value + item.y1) / 2,
                            }
                          : item
                      )
                    : pipes.map((item) =>
                        item.id === connectedPipe.id
                          ? { ...item, [field === "x1" ? "x2" : "z2"]: value }
                          : item
                      );
              }
            }
          }
          changed = {
            ...changed,
            x1: start.x,
            y1: start.y,
            z1: start.z,
            x2: end.x,
            y2: end.y,
            z2: end.z,
          };
        } else {
          if (field === "line") {
            freePipes = changePipeLineParams(freePipes, changed.pipe, value);
          } else if (field === "tag") {
            freePipes = changePipeLineParams(
              freePipes,
              changed.pipe,
              undefined,
              value
            );
          }
        }
        changed = { ...changed, length: roundM(start.distanceTo(end)) };
        freePipes = freePipes.map((item) =>
          item.id === row.id ? changed : item
        );
      }
      dispatch(setPipesAction(freePipes));
    },
    [dispatch]
  );

  const handleDeleteRows = useCallback(
    (selected: TDataField[]) => {
      dispatch(deletePipesAction(selected.map((s) => s.id)));
    },
    [dispatch]
  );

  const models = useMemo(() => {
    if (!project) return [];
    return [...(project.models ?? []), ...(project.flares ?? [])].map(
      (m) => m.name
    );
  }, [project]);

  const dataFields: TDataField[] = useMemo(() => {
    const dataFields: TDataField[] = props.pipes.map((r) => {
      const prev = props.pipes.find((el) => el.pipe === r.preceding);
      const nexts = props.pipes.filter((el) => el.preceding === r.pipe);
      const fields: TField[] = [
        {
          type: "NUMERIC",
          props: {
            min: 0,
            value: r.line,
            disabled: r.preceding !== "START",
            onChange: (v: any) => handleChangeRow(props.pipes, r, "line", v),
          },
        },
        {
          type: "INPUT",
          props: {
            value: r.tag,
            disabled: r.preceding !== "START",
            onChange: (v: any) => handleChangeRow(props.pipes, r, "tag", v),
          },
        },
        {
          type: "SELECTOR",
          props: {
            items: models,
            itemLabel: (item) => item,
            selected: r.structure,
            onSelect: (v) => handleChangeRow(props.pipes, r, "structure", v),
            filter: strFilter,
          },
        },
        {
          type: "VALIDATOR",
          props: {
            value: r.pipe,
            valueFormater: (v) => v,
            validator: (value) => /^PP\d+$/.test(value),
            validationPrompt: `The name should look like "PP1"`,
          },
        },
        {
          type: "NUMERIC",
          props: {
            min: 0,
            noRound: true,
            isDecimal: true,
            value: r.elevation,
            disabled: !!nexts.length || !!prev,
            onChange: (v: any) =>
              handleChangeRow(props.pipes, r, "elevation", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            min: 0,
            noRound: true,
            isDecimal: true,
            value: r.length,
            onChange: (v: any) => handleChangeRow(props.pipes, r, "length", v),
          },
        },
        {
          type: "SELECTOR",
          props: {
            items: [
              "START",
              ...props.pipes
                .filter(
                  (item) => item.pipe !== r.pipe && item.preceding !== "END"
                )
                .map((item) => item.pipe),
            ],
            itemLabel: (item) => item,
            selected: r.preceding,
            validator: (value) =>
              value === "START" || props.pipes.some((r) => r.pipe === value),
            validationPrompt: `This value must be either "START" or an existing pipe name`,
            onSelect: (value) =>
              handleChangeRow(props.pipes, r, "preceding", value),
            filter: strFilter,
          },
        },
        {
          type: "NUMERIC",
          props: {
            noRound: true,
            isDecimal: true,
            value: r.x1,
            onChange: (v: any) => handleChangeRow(props.pipes, r, "x1", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            noRound: true,
            isDecimal: true,
            value: r.y1,
            onChange: (v: any) => handleChangeRow(props.pipes, r, "y1", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            noRound: true,
            isDecimal: true,
            value: r.z1,
            onChange: (v: any) => handleChangeRow(props.pipes, r, "z1", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            min: -180,
            max: 180,
            noRound: true,
            isDecimal: true,
            disabled: !prev,
            value: r.hDir,
            onChange: (v: any) => handleChangeRow(props.pipes, r, "hDir", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            min: -90,
            max: 90,
            noRound: true,
            isDecimal: true,
            disabled: !prev,
            value: r.vDir,
            onChange: (v: any) => handleChangeRow(props.pipes, r, "vDir", v),
          },
        },
        {
          type: "CELL",
          value: getAngle(r, prev),
        },
        {
          type: "NUMERIC",
          props: {
            noRound: true,
            isDecimal: true,
            value: r.x2,
            onChange: (v: any) => handleChangeRow(props.pipes, r, "x2", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            noRound: true,
            isDecimal: true,
            value: r.y2,
            onChange: (v: any) => handleChangeRow(props.pipes, r, "y2", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            noRound: true,
            isDecimal: true,
            value: r.z2,
            onChange: (v: any) => handleChangeRow(props.pipes, r, "z2", v),
          },
        },
      ];
      if (isProcessExist)
        fields.unshift({ type: "CELL", value: r.processLine });
      return { id: r.id, fields };
    });
    return dataFields;
  }, [props.pipes, isProcessExist, models, handleChangeRow]);

  const handleExport = useCallback(() => {
    exportToCSV(
      props.pipes.map((row) => {
        return {
          id: row.id,
          "Line. No.": row.line,
          Tag: row.tag ?? "",
          Structure: row.structure ?? "",
          "Pipe. No.": row.pipe,
          "*C.L. Elevation (m)": fixNumberToStr(row.elevation),
          "*Length (m)": fixNumberToStr(row.length),
          "Preceding Pipe No.": row.preceding,
          "Start Point X (m)": fixNumberToStr(row.x1),
          "Start Point Y (m)": fixNumberToStr(row.y1),
          "Start Point Z (m)": fixNumberToStr(row.z1),
          "Change in Plan Direction (deg)": row.hDir,
          "Change in Elevation Direction (deg)": row.vDir,
          "End Point X (m)": fixNumberToStr(row.x2),
          "End Point Y (m)": fixNumberToStr(row.y2),
          "End Point Z (m)": fixNumberToStr(row.z2),
        };
      }),
      "Line Modeling"
    );
  }, [props.pipes]);

  const showErrorMsg = useCallback(
    (msg: string) => {
      dispatch(addEventAction(`Line Modeling (Import): ${msg}`, "danger"));
    },
    [dispatch]
  );

  const handleImport = useCallback(() => {
    importFromCSV((imported, isCSV) => {
      if (!isCSV || !Array.isArray(imported)) return;
      const newPipes: FreePipe[] = [];
      for (const item of imported) {
        if (item.id === undefined || item.id === null) continue;
        const id = getNextId(newPipes);
        let newPipe: FreePipe = {
          ...initialPipe,
          id,
          line: id,
          pipe: `PP${id}`,
        };
        const lineNo = checkImportedNumber(item["Line. No."]) ?? 0;
        let tag = "";
        if (item["Tag"]) tag = `${item["Tag"]}`.trim();
        let structure = "";
        if (item["Structure"] && typeof item["Structure"] === "string") {
          structure = item["Structure"].trim();
        }
        const pipeNo = `${item["Pipe. No."]}`.trim();
        const preceding = `${item["Preceding Pipe No."]}`.trim();
        const x1 = item["Start Point X (m)"];
        const y1 = item["Start Point Y (m)"];
        const z1 = item["Start Point Z (m)"];
        const x2 = item["End Point X (m)"];
        const y2 = item["End Point Y (m)"];
        const z2 = item["End Point Z (m)"];
        const hDir = checkImportedNumber(
          item["Change in Plan Direction (deg)"]
        );
        const vDir = checkImportedNumber(
          item["Change in Elevation Direction (deg)"]
        );
        if (lineNo) newPipe = { ...newPipe, line: lineNo };
        if (tag) newPipe = { ...newPipe, tag };
        if (structure) newPipe = { ...newPipe, structure };
        if (lineNo) newPipe = { ...newPipe, line: lineNo };
        if (pipeNo) newPipe = { ...newPipe, pipe: pipeNo };
        if (preceding) newPipe = { ...newPipe, preceding };
        if (hDir) {
          if ([-180, -90, -45, 45, 90, 180].includes(hDir)) {
            newPipe = { ...newPipe, hDir };
          } else {
            showErrorMsg(
              `(id: ${item.id}) - Incorrect "Change in Plan Direction" (${hDir})!`
            );
          }
        }
        if (vDir) {
          if ([-90, -45, 45, 90].includes(vDir)) {
            newPipe = { ...newPipe, vDir };
          } else {
            showErrorMsg(
              `(id: ${item.id}) - Incorrect "Change in Elevation Direction" (${vDir})!`
            );
          }
        }
        const start = new Vector3(
          checkImportedNumber(x1),
          checkImportedNumber(y1),
          checkImportedNumber(z1)
        );
        const end = new Vector3(
          checkImportedNumber(x2),
          checkImportedNumber(y2),
          checkImportedNumber(z2)
        );
        newPipe = {
          ...newPipe,
          x1: start.x,
          y1: start.y,
          z1: start.z,
          x2: end.x,
          y2: end.y,
          z2: end.z,
          elevation: roundM((start.y + end.y) / 2),
          length: roundM(start.distanceTo(end)),
        };
        newPipe = {
          ...newPipe,
          ...getPrecedingDirs(
            newPipes.find((item) => item.pipe === newPipe.preceding),
            newPipe
          ),
        };
        newPipes.push(newPipe);
      }
      dispatch(setPipesAction(newPipes));
    });
  }, [dispatch, showErrorMsg]);

  return (
    <GenericTable
      header={header}
      dataFields={dataFields}
      onAdd={handleAddRow}
      onDelete={handleDeleteRows}
      onExport={handleExport}
      onImport={handleImport}
    />
  );
});

function handleChangeElevation(
  pipes: FreePipe[],
  row: FreePipe,
  elevation: number
) {
  const start = new Vector3(row.x1, elevation, row.z1);
  const end = new Vector3(row.x2, elevation, row.z2);
  const length = roundM(start.distanceTo(end));
  const changed = { ...row, elevation, length, y1: elevation, y2: elevation };
  const connectedPipe = pipes.find((item) => item.preceding === row.pipe);
  const freePipes = connectedPipe
    ? pipes.map((item) =>
        item.id === row.id
          ? changed
          : item.id === connectedPipe.id
          ? {
              ...item,
              y1: elevation,
              elevation: (elevation + item.y2) / 2,
            }
          : item
      )
    : pipes.map((item) => (item.id === row.id ? changed : item));
  return freePipes;
}

function handleChangeLength(pipes: FreePipe[], row: FreePipe, length: number) {
  const start = new Vector3(row.x1, row.y1, row.z1);
  const end = new Vector3(row.x2, row.y2, row.z2);
  const newEnd = new Vector3().copy(end);
  if (start.distanceTo(end)) {
    newEnd.copy(roundVectorM(getPosByDistance(length, start, end)));
  } else {
    newEnd.setX(start.x + length);
  }
  const changed: FreePipe = {
    ...row,
    length,
    x2: newEnd.x,
    y2: newEnd.y,
    z2: newEnd.z,
  };
  const freePipes = pipes.map((item) =>
    item.id === row.id
      ? changed
      : item.preceding === changed.pipe
      ? {
          ...item,
          x1: newEnd.x,
          y1: newEnd.y,
          z1: newEnd.z,
          elevation: roundM((newEnd.y + item.y2) / 2),
          length: roundM(
            newEnd.distanceTo(new Vector3(item.x2, item.y2, item.z2))
          ),
        }
      : item
  );
  return freePipes;
}

function handleChangePreceding(
  pipes: FreePipe[],
  row: FreePipe,
  preceding?: string
) {
  if (preceding === "START") {
    const changed: FreePipe = {
      ...row,
      line: getNextId(pipes),
      preceding,
      hDir: 0,
      vDir: 0,
    };
    const changedPipes = pipes.map((p) => (p.id === changed.id ? changed : p));
    return changePipeLineParams(changedPipes, changed.pipe, changed.line);
  }

  const prev = pipes.find((item) => item.pipe === preceding);
  if (!prev) return pipes;
  const changed = {
    ...row,
    line: prev.line,
    tag: prev.tag,
    preceding: preceding ?? "START",
    x1: prev.x2,
    y1: prev.y2,
    z1: prev.z2,
  };
  const changedPipes = pipes.map((item) =>
    item.id === row.id
      ? ({
          ...changed,
          length: roundM(
            new Vector3(changed.x1, changed.y1, changed.z1).distanceTo(
              new Vector3(changed.x2, changed.y2, changed.z2)
            )
          ),
          elevation: roundM((changed.y1 + changed.y2) / 2),
          ...getPrecedingDirs(prev, changed),
        } as FreePipe)
      : item
  );
  return changePipeLineParams(changedPipes, prev.pipe, prev.line, prev.tag);
}

function handleChangeEndPoint(
  pipes: FreePipe[],
  row: FreePipe,
  field: "x2" | "y2" | "z2",
  value: number
) {
  let changed = { ...row, [field]: value };
  const start = new Vector3(changed.x1, changed.y1, changed.z1);
  const end = new Vector3(changed.x2, changed.y2, changed.z2);
  changed = {
    ...changed,
    length: roundM(start.distanceTo(end)),
    elevation: (start.y + end.y) / 2,
    ...getPrecedingDirs(
      pipes.find((item) => item.pipe === changed.preceding),
      changed
    ),
  };
  let connectedPipe = pipes.find((item) => item.preceding === row.pipe);
  let freePipes = pipes.map((item) => (item.id === row.id ? changed : item));
  if (connectedPipe) {
    connectedPipe = { ...connectedPipe, x1: end.x, y1: end.y, z1: end.z };
    connectedPipe = {
      ...connectedPipe,
      elevation: (connectedPipe.y1 + connectedPipe.y2) / 2,
      length: roundM(
        new Vector3(
          connectedPipe.x1,
          connectedPipe.y1,
          connectedPipe.z1
        ).distanceTo(
          new Vector3(connectedPipe.x2, connectedPipe.y2, connectedPipe.z2)
        )
      ),
      ...getPrecedingDirs(changed, connectedPipe),
    };
    freePipes = freePipes.map((item) =>
      item.id === connectedPipe!.id
        ? connectedPipe!
        : item.preceding === connectedPipe!.pipe
        ? { ...item, ...getPrecedingDirs(connectedPipe, item) }
        : item
    );
  }
  return freePipes;
}

function removeEndConnector(pipes: FreePipe[], pipe: FreePipe) {
  return pipes.map((item) =>
    item.id === pipe.id
      ? {
          ...pipe,
          params: {
            ...pipe.params,
            endConnectorType: undefined,
            endConnector: undefined,
            endConnectorDetails: undefined,
          },
        }
      : item
  );
}

function changePipeLineParams(
  pipes: FreePipe[],
  current: string,
  line?: number,
  tag?: string
) {
  let changedPipes = [...pipes];
  const nextPipes = pipes.filter((p) => p.preceding === current);

  for (const nextPipe of nextPipes) {
    let changed = { ...nextPipe };
    if (line !== undefined) changed = { ...changed, line };
    if (tag !== undefined) changed = { ...changed, tag };
    changedPipes = changePipeLineParams(
      changedPipes.map((p) => (p.id === changed.id ? changed : p)),
      changed.pipe,
      line,
      tag
    );
    console.log("pipechanged");
    
  }

  return changedPipes;
}
