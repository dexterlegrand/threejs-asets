import React, { useCallback, useEffect, useMemo, useState } from "react";
import GenericTable, {
  TDataField,
  TField,
  THeader,
} from "../../../../common/table/GenericTable";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import {
  getCurrentProject,
  getIndexName,
  getNextId,
  importFromCSV,
  roundM,
  strFilter,
} from "../../../../3d-models/utils";
import { getOFModels } from "../../../../3d-models/openFrame";
import { addEventAction } from "../../../../../store/ui/actions";
import { TOpenFrame } from "../../../../../store/main/openFrameTypes";
import { Section } from "../../../../../store/data/types";
import { changeModel } from "../../../../../store/main/actions";

const header: THeader = {
  rows: [
    {
      columns: [
        { title: "OF No." },
        { title: "Railing No." },
        { title: "Beam No." },
        { title: "Total Height, (m)" },
        { title: "Middle Height, (m)" },
        { title: "Dist. from Start Node, (m)" },
        { title: "Length of Railing, (m)" },
        { title: "No. of Spacings" },
        { title: "C/S Lib" },
        { title: "Top Rail" },
        { title: "Middle Rail" },
        { title: "Vertical Rail" },
      ],
    },
  ],
};

type TRow = {
  id: number;
  uiId: number;
  model?: string;
  name?: string;
  element?: string;
  totalHeight: number; // meters
  middleHeight: number; // meters
  distFromStartNode: number; // meters
  length: number; // meters
  noOfSpacings: number;
  lib?: string;
  topRail?: Section;
  middleRail?: Section;
  verticalRail?: Section;
};

type Props = {
  profiles: Section[];
  libs: string[];
};

export default React.memo(function Railings({ profiles, libs }: Props) {
  const [isInit, setInit] = useState(true);
  const [rows, setRows] = useState<TRow[]>([]);

  const dispatch = useDispatch();

  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const models = useMemo(() => getOFModels(project), [project]);

  useEffect(() => {
    if (!isInit) return;
    setInit(false);
    setRows(initRows(models));
  }, [isInit, models]);

  const handleAddRow = useCallback(() => {
    setRows((prev) => {
      const id = getNextId(prev);
      const uiId = getNextId(prev, "uiId");
      const newItem: TRow = {
        id,
        uiId,
        distFromStartNode: 0,
        length: 0,
        middleHeight: 0,
        noOfSpacings: 1,
        totalHeight: 0,
      };
      return [...prev, newItem];
    });
  }, []);

  const handleChangeRow = useCallback(
    (models: TOpenFrame[], row: TRow, field: string, value: any) => {
      let changed = { ...row, [field]: value };
      const isModelField = [
        "model",
        "element",
        "totalHeight",
        "middleHeight",
        "distFromStartNode",
        "length",
        "noOfSpacings",
        "lib",
        "topRail",
        "middleRail",
        "verticalRail",
      ].includes(field);
      if (field === "model" && row.model && row.model !== value) {
        const model = models.find((m) => m.name === row.model);
        if (model) {
          dispatch(
            changeModel({
              ...model,
              railings: model.railings?.filter((r) => r.id !== row.id),
            } as TOpenFrame)
          );
        }
      }
      if (
        ["totalHeight", "length", "topRail", "verticalRail"].includes(field) &&
        !value
      ) {
        const model = models.find((m) => m.name === row.model);
        if (model) {
          dispatch(
            changeModel({
              ...model,
              railings: model.railings?.filter((r) => r.id === row.id),
            } as TOpenFrame)
          );
        }
      }
      if (
        changed.model &&
        changed.element &&
        changed.totalHeight &&
        changed.length &&
        changed.topRail &&
        changed.verticalRail &&
        isModelField
      ) {
        const model = models.find((m) => m.name === changed.model);
        let railings = model?.railings ?? [];
        if (railings.some((r) => r.id === changed.id)) {
          railings = railings.map((r) =>
            r.id === changed.id ? { ...r, [field]: value } : r
          );
        } else {
          changed = { ...changed, name: `RL${getIndexName(railings, "RL")}` };
          railings = [
            ...railings,
            {
              id: changed.id,
              name: changed.name!,
              distFromStartNode: changed.distFromStartNode,
              element: changed.element!,
              length: changed.length,
              lib: changed.lib!,
              middleHeight: changed.middleHeight,
              noOfSpacings: changed.noOfSpacings,
              topRail: changed.topRail!,
              totalHeight: changed.totalHeight,
              verticalRail: changed.verticalRail!,
              middleRail: changed.middleRail,
            },
          ];
        }
        dispatch(changeModel({ ...model, railings } as TOpenFrame));
      }
      setRows((prev) =>
        prev.map((el) => (el.uiId === changed.uiId ? changed : el))
      );
    },
    [dispatch]
  );

  const handleDeleteRows = useCallback(
    (selected: TDataField[]) => {
      setRows((prev) =>
        prev.filter((el) => !selected.some((sel) => sel.id === el.uiId))
      );
      for (const sel of selected) {
        const row = rows.find((r) => r.uiId === sel.id);
        const model = row?.model && models.find((m) => m.name === row.model);
        if (!model) continue;
        dispatch(
          changeModel({
            ...model,
            railings: model.railings?.filter((r) => r.id !== row!.id),
          } as TOpenFrame)
        );
      }
    },
    [models, rows, dispatch]
  );

  const dataFields: TDataField[] = useMemo(() => {
    const modelsNames = models.map((m) => m.name);
    return rows.map((r) => {
      const model = r.model && models.find((m) => m.name === r.model);
      const beams = model ? [...model.beams, ...model.staircases, ...model.cantilevers] : [];
      const beam = r.element && beams.find((b) => b.name === r.element);
      const beamLength = beam
        ? roundM(beam.startPos.distanceTo(beam.endPos))
        : 0;
      const selectedProfiles = r.lib
        ? profiles.filter((p) => p.country_code === r.lib)
        : [];
      const fields: TField[] = [
        {
          type: "SELECTOR",
          props: {
            items: modelsNames,
            itemLabel: (item) => item,
            selected: r.model,
            onSelect: (v) => handleChangeRow(models, r, "model", v),
            filter: strFilter,
          },
        },
        { type: "CELL", value: r.name },
        {
          type: "SELECTOR",
          props: {
            items: beams.map((b) => b.name),
            itemLabel: (item) => item,
            selected: r.element,
            onSelect: (v) => handleChangeRow(models, r, "element", v),
            filter: strFilter,
          },
        },
        {
          type: "NUMERIC",
          props: {
            min: 0,
            isDecimal: true,
            value: r.totalHeight,
            onChange: (v: any) => handleChangeRow(models, r, "totalHeight", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            min: 0,
            max: r.totalHeight,
            isDecimal: true,
            value: r.middleHeight,
            onChange: (v: any) => handleChangeRow(models, r, "middleHeight", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            min: 0,
            max: beamLength,
            isDecimal: true,
            value: r.distFromStartNode,
            onChange: (v: any) =>
              handleChangeRow(models, r, "distFromStartNode", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            min: 0,
            max: roundM(beamLength - r.distFromStartNode),
            isDecimal: true,
            value: r.length,
            onChange: (v: any) => handleChangeRow(models, r, "length", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            min: 1,
            value: r.noOfSpacings,
            onChange: (v: any) => handleChangeRow(models, r, "noOfSpacings", v),
          },
        },
        {
          type: "SELECTOR",
          props: {
            items: libs,
            itemLabel: (item) => item,
            selected: r.lib,
            onSelect: (v) => handleChangeRow(models, r, "lib", v),
            filter: strFilter,
          },
        },
        {
          type: "SELECTOR",
          props: {
            items: selectedProfiles,
            itemLabel: (item) => item.designation,
            selected: r.topRail,
            onSelect: (v) => handleChangeRow(models, r, "topRail", v),
            filter: strFilter,
          },
        },
        {
          type: "SELECTOR",
          props: {
            items: selectedProfiles,
            itemLabel: (item) => item.designation,
            selected: r.middleRail,
            onSelect: (v) => handleChangeRow(models, r, "middleRail", v),
            filter: strFilter,
          },
        },
        {
          type: "SELECTOR",
          props: {
            items: selectedProfiles,
            itemLabel: (item) => item.designation,
            selected: r.verticalRail,
            onSelect: (v) => handleChangeRow(models, r, "verticalRail", v),
            filter: strFilter,
          },
        },
      ];
      return { id: r.uiId, fields };
    });
  }, [profiles, libs, models, rows]);

  const handleExport = useCallback(() => {
    // exportToCSV(
    //   models.map((row) => {
    //     return {
    //       id: row.id,
    //       "Line. No.": row.line,
    //       Tag: row.tag ?? "",
    //       Structure: row.structure ?? "",
    //       "Pipe. No.": row.pipe,
    //       "*C.L. Elevation (m)": fixNumberToStr(row.elevation),
    //       "*Length (m)": fixNumberToStr(row.length),
    //       "Preceding Pipe No.": row.preceding,
    //       "Start Point X (m)": fixNumberToStr(row.x1),
    //       "Start Point Y (m)": fixNumberToStr(row.y1),
    //       "Start Point Z (m)": fixNumberToStr(row.z1),
    //       "Change in Plan Direction (deg)": row.hDir,
    //       "Change in Elevation Direction (deg)": row.vDir,
    //       "End Point X (m)": fixNumberToStr(row.x2),
    //       "End Point Y (m)": fixNumberToStr(row.y2),
    //       "End Point Z (m)": fixNumberToStr(row.z2),
    //     };
    //   }),
    //   "Railings OF"
    // );
  }, [models]);

  const showErrorMsg = useCallback(
    (msg: string) => {
      dispatch(addEventAction(`Railings OF (Import): ${msg}`, "danger"));
    },
    [dispatch]
  );

  const handleImport = useCallback(() => {
    importFromCSV((imported, isCSV) => {
      if (!isCSV || !Array.isArray(imported)) return;
      //   const newPipes: FreePipe[] = [];
      //   for (const item of imported) {
      //     if (item.id === undefined || item.id === null) continue;
      //     const id = getNextId(newPipes);
      //     let newPipe: FreePipe = {
      //       ...initialPipe,
      //       id,
      //       line: id,
      //       pipe: `PP${id}`,
      //     };
      //     const lineNo = checkImportedNumber(item["Line. No."]) ?? 0;
      //     let tag = "";
      //     if (item["Tag"]) tag = `${item["Tag"]}`.trim();
      //     let structure = "";
      //     if (item["Structure"] && typeof item["Structure"] === "string") {
      //       structure = item["Structure"].trim();
      //     }
      //     const pipeNo = `${item["Pipe. No."]}`.trim();
      //     const preceding = `${item["Preceding Pipe No."]}`.trim();
      //     const x1 = item["Start Point X (m)"];
      //     const y1 = item["Start Point Y (m)"];
      //     const z1 = item["Start Point Z (m)"];
      //     const x2 = item["End Point X (m)"];
      //     const y2 = item["End Point Y (m)"];
      //     const z2 = item["End Point Z (m)"];
      //     const hDir = checkImportedNumber(
      //       item["Change in Plan Direction (deg)"]
      //     );
      //     const vDir = checkImportedNumber(
      //       item["Change in Elevation Direction (deg)"]
      //     );
      //     if (lineNo) newPipe = { ...newPipe, line: lineNo };
      //     if (tag) newPipe = { ...newPipe, tag };
      //     if (structure) newPipe = { ...newPipe, structure };
      //     if (lineNo) newPipe = { ...newPipe, line: lineNo };
      //     if (pipeNo) newPipe = { ...newPipe, pipe: pipeNo };
      //     if (preceding) newPipe = { ...newPipe, preceding };
      //     if (hDir) {
      //       if ([-180, -90, -45, 45, 90, 180].includes(hDir)) {
      //         newPipe = { ...newPipe, hDir };
      //       } else {
      //         showErrorMsg(
      //           `(id: ${item.id}) - Incorrect "Change in Plan Direction" (${hDir})!`
      //         );
      //       }
      //     }
      //     if (vDir) {
      //       if ([-90, -45, 45, 90].includes(vDir)) {
      //         newPipe = { ...newPipe, vDir };
      //       } else {
      //         showErrorMsg(
      //           `(id: ${item.id}) - Incorrect "Change in Elevation Direction" (${vDir})!`
      //         );
      //       }
      //     }
      //     const start = new Vector3(
      //       checkImportedNumber(x1),
      //       checkImportedNumber(y1),
      //       checkImportedNumber(z1)
      //     );
      //     const end = new Vector3(
      //       checkImportedNumber(x2),
      //       checkImportedNumber(y2),
      //       checkImportedNumber(z2)
      //     );
      //     newPipe = {
      //       ...newPipe,
      //       x1: start.x,
      //       y1: start.y,
      //       z1: start.z,
      //       x2: end.x,
      //       y2: end.y,
      //       z2: end.z,
      //       elevation: roundM((start.y + end.y) / 2),
      //       length: roundM(start.distanceTo(end)),
      //     };
      //     newPipe = {
      //       ...newPipe,
      //       ...getPrecedingDirs(
      //         newPipes.find((item) => item.pipe === newPipe.preceding),
      //         newPipe
      //       ),
      //     };
      //     newPipes.push(newPipe);
      //   }
      //   dispatch(setPipesAction(newPipes));
    });
  }, [dispatch, showErrorMsg]);

  return (
    <GenericTable
      header={header}
      dataFields={dataFields}
      onAdd={handleAddRow}
      onDelete={handleDeleteRows}
      //   onExport={handleExport}
      //   onImport={handleImport}
    />
  );
});

function initRows(models: TOpenFrame[]) {
  const rows: TRow[] = [];
  for (const model of models) {
    for (const railing of model.railings ?? []) {
      rows.push({
        ...railing,
        model: model.name,
        uiId: getNextId(rows, "uiId"),
      });
    }
  }
  return rows;
}
