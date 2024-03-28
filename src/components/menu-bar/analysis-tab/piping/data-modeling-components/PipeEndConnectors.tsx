import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Project,
  PipeConnectorType,
  FreePipe,
  TReducerType,
} from "../../../../../store/main/types";
import {
  DataState,
  TPipingAccessory,
  TPipingElbow,
  TPipingTee,
  TPipingReturn,
} from "../../../../../store/data/types";
import { Button } from "@blueprintjs/core";
import {
  importFromCSV,
  exportToCSV,
  checkRange,
  fixNumberToStr,
  MMtoM,
  roundVectorM,
  getPosByDistance,
  checkImportedNumber,
  roundM,
  radToDeg,
} from "../../../../3d-models/utils";
import { addEventAction } from "../../../../../store/ui/actions";
import { changeProjectAction } from "../../../../../store/main/actions";
import { EndConnectorDetails } from "../EndConnectorDetails";
import { Vector3 } from "three";
import { reducerTypes } from "../../../../../store/main/constants";
import { ApplicationState } from "../../../../../store";
import GenericTable, {
  THeader,
  TDataField,
  TField,
} from "../../../../common/table/GenericTable";
import {
  getAngle,
  getPipingAccessories,
  continuePipe,
  rotationV,
} from "../../../../3d-models/pipes/pipesUtils";

type Props = {
  project: Project | undefined;
  resoures: DataState;
  setDialog: (dialog?: JSX.Element) => any;
  pipes: FreePipe[];
};

const header: THeader = {
  rows: [
    {
      columns: [
        { title: "Pipe. No." },
        { title: "Preceding Pipe" },
        { title: "NPS" },
        { title: "Schedule" },
        { title: "Material" },
        { title: "OD (mm)" },
        { title: "Thickness (mm)" },
        { title: "Angle to Preceding, (deg)" },
        { title: "End Connector Type" },
        { title: "End Connector" },
        { title: "End Connector Details" },
      ],
    },
  ],
};

export default React.memo(function PipeEndConnectors(props: Props) {
  const { project, resoures, setDialog } = props;

  const UDEs = useSelector(
    (state: ApplicationState) => state.main.userDefinedElbows
  );

  const dispatch = useDispatch();

  const dataFields: TDataField[] = useMemo(() => {
    return (
      props.pipes.map((fp, i, arr) => {
        let connTypes: PipeConnectorType[] = [];
        const prev = arr.find((r) => r.pipe === fp.preceding);
        const nexts = arr.filter((r) => r.preceding === fp.pipe);
        const anglesR: { angle: number; pipe: FreePipe }[] = [];
        if (nexts.length) {
          for (const next of nexts) {
            const angle = getAngle(next, fp) || 0;
            anglesR.push({ pipe: next, angle });
          }
          if (anglesR.length === 1) {
            if (
              anglesR.find((item) => item.angle === 180 || item.angle === -180)
            ) {
              connTypes.push("Return");
            } else if (
              anglesR.some((item) => checkRange(Math.abs(item.angle), 0, 180))
            ) {
              connTypes.push("Elbow");
            } else connTypes.push("Reducer");
          } else if (anglesR.length === 2) {
            anglesR
              .map((item) => item.angle)
              .some((a) => a === 90 || a === -90 || a === 0) &&
              connTypes.push("Tee");
          }
        } else connTypes = ["Cap", "Elbow", "Return", "Tee", "Reducer"];
        const label = getEndConnectorLabel(fp.params.endConnector);
        const fields: TField[] = [
          { type: "CELL", value: fp.pipe },
          { type: "CELL", value: fp.preceding },
          { type: "CELL", value: fp.params.nps },
          { type: "CELL", value: fp.params.profile?.schedule },
          { type: "CELL", value: fp.params.material?.material_name },
          { type: "CELL", value: fp.params.od },
          { type: "CELL", value: fp.params.thickness },
          { type: "CELL", value: getAngle(fp, prev) },
          {
            type: "SELECTOR",
            props: {
              items: connTypes,
              itemKey: (v) => v,
              itemLabel: (v) => v,
              selected: fp.params.endConnectorType,
              validator: (v) => connTypes.includes(v),
              validationPrompt:
                "This End Connector Type not found! Please update",
              onSelect: (v) => handleChangeParamsRow(fp, "endConnectorType", v),
              clearable: true,
            },
          },
          {
            type: "SELECTOR",
            props: {
              items: getPipingAccessories(resoures, UDEs, fp, nexts, anglesR),
              itemKey: (v) => v.id,
              itemLabel: (v) => getEndConnectorLabel(v),
              itemSecondLabel: (v) => v.name,
              selected: fp.params.endConnector,
              onSelect: (v) => handleChangeParamsRow(fp, "endConnector", v),
              filter: (q, v) =>
                !q ||
                getEndConnectorLabel(v)
                  .toLowerCase()
                  .includes(q.toLowerCase()),
              clearable: true,
            },
          },
          getEndConnectorDetailsField(fp, nexts),
        ];

        return { id: fp.id, fields };
      }) ?? []
    );
  }, [props.pipes]);

  function getEndConnectorLabel(item?: TPipingAccessory) {
    return item
      ? `${(item as TPipingElbow).isUser ? "UDE - " : ""}${item.nps} - ${
          item.schedule
        } - ${
          (item as TPipingElbow).degree
            ? `${(item as TPipingElbow).degree} - `
            : ""
        }${item.material}`
      : "";
  }

  function handleChangeData(project: Project) {
    dispatch(changeProjectAction(project));
  }

  function handleChangeParamsRow(row: FreePipe, field: string, value: any) {
    if (!project) return;
    let freePipes = [...props.pipes];
    let changed = {
      ...row,
      params: { ...row.params, [field]: value },
    };
    if (field === "endConnectorType") {
      changed = {
        ...changed,
        params: {
          ...changed.params,
          endConnector: undefined,
          endConnectorDetails: undefined,
        },
      };
    } else if (field === "endConnector") {
      const type = changed.params.endConnectorType;
      const tn =
        (changed.params.endConnector as TPipingElbow)?.t ??
        (changed.params.endConnector as TPipingTee)?.t1 ??
        (changed.params.endConnector as TPipingTee)?.t2 ??
        0;
      const d =
        (changed.params.endConnector as TPipingElbow)?.d ??
        (changed.params.endConnector as TPipingTee)?.d1 ??
        (changed.params.endConnector as TPipingTee)?.d2 ??
        0;
      changed = {
        ...changed,
        params: {
          ...changed.params,
          endConnectorDetails:
            type === "Elbow" || type === "Tee"
              ? {
                  type: type === "Elbow" ? "BWE" : "TW",
                  tn,
                  r: (d - tn) / 2,
                  R: (changed.params.endConnector as TPipingElbow)?.a,
                }
              : undefined,
        },
      };
      if (changed.params.endConnectorType === "Return") {
        const o = MMtoM((value as TPipingReturn).o);
        const startA = new Vector3(changed.x1, changed.y1, changed.z1);
        const endA = new Vector3(changed.x2, changed.y2, changed.z2);
        const next = props.pipes.find(
          (item) => item.preceding === changed.pipe
        );
        if (next) {
          const start = endA.clone();
          const end = continuePipe(row, next);
          rotationV(start, end, next.length, next.hDir, 0);
          start.copy(
            roundVectorM(getPosByDistance(changed.length + o, startA, endA))
          );
          rotationV(endA, start, o, next.hDir < 0 ? -90 : 90, 0);
          rotationV(endA, start, o, 0, next.vDir);
          end.add(start.clone().sub(endA));
          freePipes = freePipes.map((fp) =>
            fp.id === next.id
              ? {
                  ...fp,
                  x1: start.x,
                  y1: start.y,
                  z1: start.z,
                  x2: end.x,
                  y2: end.y,
                  z2: end.z,
                }
              : fp
          );
        }
      }
    }
    freePipes = freePipes.map((item) =>
      item.id === changed.id ? changed : item
    );
    handleChangeData({ ...project, freePipes });
  }

  function handleChangeRow(changed: FreePipe) {
    if (!project) return;
    const freePipes = props.pipes.map((item) =>
      item.id === changed.id ? changed : item
    );
    handleChangeData({ ...project, freePipes });
  }

  function getEndConnectorDetailsField(
    fp: FreePipe,
    nexts: FreePipe[]
  ): TField {
    if (!fp.params.endConnector) return { type: "CELL" };
    if (
      fp.params.endConnectorType === "Elbow" ||
      fp.params.endConnectorType === "Tee"
    ) {
      return {
        type: "CELL",
        value: (
          <Button
            small
            minimal
            icon={"menu"}
            intent={"primary"}
            className={"c-light"}
            onClick={() => {
              setDialog(
                <EndConnectorDetails
                  pipe={fp}
                  nexts={nexts}
                  resoures={resoures}
                  onSave={(changed) => {
                    handleChangeRow(changed);
                    setDialog(undefined);
                  }}
                  onClose={() => setDialog(undefined)}
                />
              );
            }}
          />
        ),
      };
    } else if (fp.params.endConnectorType === "Reducer") {
      const next = nexts[0];
      return {
        type: "SELECTOR",
        props: {
          items: reducerTypes,
          itemKey: (v) => v,
          itemLabel: (v) => v,
          selected: fp.params.reducerType ?? "Concentric",
          onSelect: (v) => handleChangeReducerType(fp, next, v),
        },
      };
    }
    return { type: "CELL" };
  }

  function handleChangeReducerType(
    row: FreePipe,
    oldnext: FreePipe,
    reducerType?: TReducerType
  ) {
    if (!project) return;
    let prev = { ...row, params: { ...row.params, reducerType } };
    let next = { ...oldnext };
    const r_2 =
      reducerType !== "Concentric"
        ? MMtoM(Math.abs((prev.params.od ?? 0) - (next?.params.od ?? 0)) / 2)
        : 0;
    const start = new Vector3(prev.x1, prev.y1, prev.z1);
    const end = new Vector3(prev.x2, prev.y2, prev.z2);
    const l = start.distanceTo(end);
    const rStart = end.clone();
    const rEnd = new Vector3(next.x1, next.y1, next.z1);
    const diff = rEnd.clone().sub(rStart);
    const toConcentric = () => {
      if (row.params.reducerType === "Eccentric Left (Preceding)") {
        prev = {
          ...prev,
          x1: roundM(prev.x1 + diff.x),
          y1: roundM(prev.y1 + diff.y),
          z1: roundM(prev.z1 + diff.z),
          x2: roundM(prev.x2 + diff.x),
          y2: roundM(prev.y2 + diff.y),
          z2: roundM(prev.z2 + diff.z),
        };
      } else if (row.params.reducerType === "Eccentric Right (Preceding)") {
        prev = {
          ...prev,
          x1: roundM(prev.x1 + diff.x),
          y1: roundM(prev.y1 + diff.y),
          z1: roundM(prev.z1 + diff.z),
          x2: roundM(prev.x2 + diff.x),
          y2: roundM(prev.y2 + diff.y),
          z2: roundM(prev.z2 + diff.z),
        };
      } else if (row.params.reducerType === "Eccentric Left (Succeeding)") {
        next = {
          ...next,
          x1: roundM(next.x1 - diff.x),
          y1: roundM(next.y1 - diff.y),
          z1: roundM(next.z1 - diff.z),
          x2: roundM(next.x2 - diff.x),
          y2: roundM(next.y2 - diff.y),
          z2: roundM(next.z2 - diff.z),
        };
      } else if (row.params.reducerType === "Eccentric Right (Succeeding)") {
        next = {
          ...next,
          x1: roundM(next.x1 - diff.x),
          y1: roundM(next.y1 - diff.y),
          z1: roundM(next.z1 - diff.z),
          x2: roundM(next.x2 - diff.x),
          y2: roundM(next.y2 - diff.y),
          z2: roundM(next.z2 - diff.z),
        };
      }
    };
    const toELP = () => {
      const pos = getPosByDistance(l + r_2, start, end);
      rotationV(end, pos, r_2, 90, 0);
      pos.sub(end);
      prev = {
        ...prev,
        x1: roundM(prev.x1 - pos.x),
        y1: roundM(prev.y1 - pos.y),
        z1: roundM(prev.z1 - pos.z),
        x2: roundM(prev.x2 - pos.x),
        y2: roundM(prev.y2 - pos.y),
        z2: roundM(prev.z2 - pos.z),
      };
    };
    const toELS = () => {
      const pos = getPosByDistance(l + r_2, start, end);
      rotationV(end, pos, r_2, 90, 0);
      pos.sub(end);
      next = {
        ...next,
        x1: roundM(next.x1 - pos.x),
        y1: roundM(next.y1 - pos.y),
        z1: roundM(next.z1 - pos.z),
        x2: roundM(next.x2 - pos.x),
        y2: roundM(next.y2 - pos.y),
        z2: roundM(next.z2 - pos.z),
      };
    };
    const toERP = () => {
      const pos = getPosByDistance(l + r_2, start, end);
      rotationV(end, pos, r_2, -90, 0);
      pos.sub(end);
      prev = {
        ...prev,
        x1: roundM(prev.x1 - pos.x),
        y1: roundM(prev.y1 - pos.y),
        z1: roundM(prev.z1 - pos.z),
        x2: roundM(prev.x2 - pos.x),
        y2: roundM(prev.y2 - pos.y),
        z2: roundM(prev.z2 - pos.z),
      };
    };
    const toERS = () => {
      const pos = getPosByDistance(l + r_2, start, end);
      rotationV(end, pos, r_2, -90, 0);
      pos.sub(end);
      next = {
        ...next,
        x1: roundM(next.x1 - pos.x),
        y1: roundM(next.y1 - pos.y),
        z1: roundM(next.z1 - pos.z),
        x2: roundM(next.x2 - pos.x),
        y2: roundM(next.y2 - pos.y),
        z2: roundM(next.z2 - pos.z),
      };
    };
    if (reducerType === "Concentric") {
      toConcentric();
    } else {
      if (row.params.reducerType && row.params.reducerType !== "Concentric") {
        toConcentric();
      }
      if (reducerType === "Eccentric Left (Preceding)") toELP();
      if (reducerType === "Eccentric Left (Succeeding)") toELS();
      if (reducerType === "Eccentric Right (Preceding)") toERP();
      if (reducerType === "Eccentric Right (Succeeding)") toERS();
    }

    const freePipes = fixPipeLine(
      props.pipes.map((item) =>
        item.id === prev.id ? prev : item.id === next.id ? next : item
      ),
      prev,
      next,
      reducerType?.includes("Succeeding")
    );
    handleChangeData({ ...project, freePipes });
  }

  function fixPipeLine(
    pipes: FreePipe[],
    prev: FreePipe,
    next: FreePipe,
    isNext?: boolean
  ): FreePipe[] {
    if (isNext) {
      return pipes.map((p) =>
        p.preceding === next.pipe
          ? { ...p, x1: next.x2, y1: next.y2, z1: next.z2 }
          : p
      );
    } else {
      return pipes.map((p) =>
        p.pipe === prev.preceding
          ? { ...p, x2: prev.x1, y2: prev.y1, z2: prev.z1 }
          : p
      );
    }
  }

  function handleExport() {
    exportToCSV(
      props.pipes.map((row) => {
        return {
          id: row.id,
          "Pipe. No.": row.pipe,
          "*NPS": row.params.nps ?? "",
          "*Schedule": row.params.profile?.schedule ?? "",
          "*Material": row.params.material?.material_name ?? "",
          "*OD (mm)": fixNumberToStr(row.params.od),
          "*Thickness (mm)": fixNumberToStr(row.params.thickness),
          "End Connector Type": row.params.endConnectorType ?? "",
          "End Connector": row.params.endConnector
            ? `${row.params.endConnector.nps} - ${row.params.endConnector.schedule} - ${row.params.endConnector.material}`
            : "",
          "End Connector Subtype": row.params.endConnectorDetails?.type ?? "",
          tn: fixNumberToStr(row.params.endConnectorDetails?.tn),
          R: fixNumberToStr(row.params.endConnectorDetails?.R),
          S: fixNumberToStr(row.params.endConnectorDetails?.S),
          r: fixNumberToStr(row.params.endConnectorDetails?.r),
          Re: fixNumberToStr(row.params.endConnectorDetails?.Re),
          Theta: fixNumberToStr(row.params.endConnectorDetails?.Theta),
          tr: fixNumberToStr(row.params.endConnectorDetails?.tr),
          tc: fixNumberToStr(row.params.endConnectorDetails?.tc),
          rx: fixNumberToStr(row.params.endConnectorDetails?.rx),
        };
      }),
      "Pipe End Connectors"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Pipe End Connectors (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((imported, isCSV) => {
      if (!isCSV || !Array.isArray(imported)) return;
      let changedPipes = [...props.pipes];
      imported.forEach((item: any) => {
        const pipeNo = item["Pipe. No."];
        let changedPipe = changedPipes.find((cp) => cp.pipe === pipeNo);
        if (changedPipe) {
          const ect = item["End Connector Type"];
          changedPipe = {
            ...changedPipe,
            params: { ...changedPipe.params, endConnectorType: ect },
          };
          const ec = `${item["End Connector"]}`.split(" - ");
          const nexts = changedPipes.filter(
            (r) => r.preceding === changedPipe!.pipe
          );
          const anglesR: { angle: number; pipe: FreePipe }[] = [];
          for (const next of nexts) {
            const a = new Vector3(
              changedPipe.x2 - changedPipe.x1,
              changedPipe.y2 - changedPipe.y1,
              changedPipe.z2 - changedPipe.z1
            );
            const b = new Vector3(
              next.x2 - next.x1,
              next.y2 - next.y1,
              next.z2 - next.z1
            );
            const rad = a.angleTo(b);
            const angle = roundM(radToDeg(rad));
            if (!anglesR.find((item) => item.angle === angle))
              anglesR.push({ pipe: next, angle });
          }
          const ecs = getPipingAccessories(
            resoures,
            UDEs,
            changedPipe,
            nexts,
            anglesR
          );
          changedPipe = {
            ...changedPipe,
            params: {
              ...changedPipe.params,
              endConnector: ecs.find(
                (val) => val.schedule === ec[1] && val.material === ec[2]
              ),
              endConnectorDetails: {
                type: item["End Connector Subtype"],
                S: checkImportedNumber(item.S, false),
                tn: checkImportedNumber(item.tn, false),
                R: checkImportedNumber(item.R, false),
                r: checkImportedNumber(item.r, false),
                Re: checkImportedNumber(item.Re, false),
                Theta: checkImportedNumber(item.Theta, false),
                tr: checkImportedNumber(item.tr, false),
                tc: checkImportedNumber(item.tc, false),
                rx: checkImportedNumber(item.rx, false),
              },
            },
          };
          changedPipes = changedPipes.map((cp) =>
            cp.pipe === changedPipe?.pipe ? changedPipe : cp
          );
        } else if (item.id !== undefined && item.id !== null) {
          showErrorMsg(`(id: ${item.id}) - a pipe (${pipeNo}) not found!`);
        }
      });
      handleChangeData({ ...project, freePipes: changedPipes });
    });
  }

  return (
    <GenericTable
      header={header}
      dataFields={dataFields}
      onExport={handleExport}
      onImport={handleImport}
    />
  );
});
