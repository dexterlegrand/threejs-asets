import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Icon, Button, FormGroup, Tooltip } from "@blueprintjs/core";

import { ApplicationState } from "../../../../store";
import {
  selectProcessElementAction,
  removeProcessElementAction,
  changeProcessElementAction,
  changeProcessElementConnections,
  createInstrElementAction,
  createInstrLineAction,
} from "../../../../store/process/actions";
import { SimpleNumericInput } from "../../../common/SimpleNumericInput";
import { SimpleSelector } from "../../../common/SimpleSelector";
import {
  round,
  roundM,
  getNextId,
  getUnicuesArray,
  strFilter,
  degToRad,
  roundVectorM,
  MMtoM,
  exportToCSV,
  importFromCSV,
  getRGB,
} from "../../../3d-models/utils";
import {
  TProcessElement,
  EProcessElementType,
  TProcessElementPoint,
  EInstrumentationElementType,
  TInstrumentationLine,
  TInstrumentationElement,
  TProcessState,
  TProcessSupportType,
  PumpParamter,
} from "../../../../store/process/types";
import { Vector3 } from "three";
import {
  valveTypes,
  valveActuators,
  valveControls,
  pedestalColor,
} from "../../../../store/main/constants";
import { ConnectionDetailsDlg } from "./ConnectionDetailsDlg";
import { PipeProfile } from "../../../../store/data/types";
import {
  TValveType,
  TValveActuatorType,
  TValveControlType,
} from "../../../../store/main/types";
import { SimpleInput } from "../../../common/SimpleInput";
import { LegsDetailsDlg } from "./LegsDetailsDlg";
import { Dispatch } from "redux";
import { ElasticityDialog } from "./ElasticityDlg";
import { useRecoilState } from "recoil";
import { mousePipeCreating } from "../../../../recoil/atoms/process-atoms";
import { CustomDlg } from "../../../common/CustomDlg";
import { SketchPicker } from "react-color";
import { SupportDetailsDlg } from "./SupportDetailsDlg";
import { LugDetailsDlg } from "./LugDetailsDlg";

type Props = {
  current: string;
  processState: TProcessState;
  profiles: PipeProfile[];
  disabled: boolean;
};

export function SelectedProcess({
  current,
  processState,
  profiles,
  disabled,
}: Props) {
  const [MPCState, setMPCState] = useRecoilState(mousePipeCreating);

  const [dlg, setDlg] = useState<JSX.Element>();
  const [legsDlg, setLegsDlg] = useState<JSX.Element>();
  const [lugsDlg, setLugsDlg] = useState<JSX.Element>();
  const [supportDlg, setSupportDlg] = useState<JSX.Element>();
  const [showElasticityDialog, setShowElasticityDialog] = useState(false);

  const item = useSelector((state: ApplicationState) => state.process.selected);

  const dispatch = useDispatch();

  const processes = useMemo(() => {
    return processState.processes;
  }, [processState]);

  useEffect(() => {
    if (supportDlg && item) {
      setSupportDlg(
        <SupportDetailsDlg
          item={item}
          process={processes.get(current)}
          onChange={(changed) =>
            dispatch(changeProcessElementAction(current, changed.name, changed))
          }
          onClose={() => setSupportDlg(undefined)}
        />
      );
    } else if (lugsDlg && item) {
      setLugsDlg(
        <LugDetailsDlg
          item={item}
          process={processes.get(current)}
          onChange={handleChangeLugs}
          onClose={() => setLugsDlg(undefined)}
        />
      );
    } else if ((dlg && item) || (item && MPCState.startPointPipeSegment)) {
      setDlg(
        <ConnectionDetailsDlg
          item={item}
          process={processes.get(current)}
          onChange={handleChangePoints}
          onClose={() => setDlg(undefined)}
        />
      );
    } else if (legsDlg && item) {
      setLegsDlg(
        <LegsDetailsDlg
          item={item}
          onChange={(changed) =>
            dispatch(changeProcessElementAction(current, changed.name, changed))
          }
          onClose={() => setLegsDlg(undefined)}
        />
      );
    }
  }, [processes, current, item, MPCState]);

  function handleClose() {
    dispatch(selectProcessElementAction(undefined));
  }
  function handleExport() {
    exportToCSV(
      [
        {
          "Element name": item?.name,
          "Tag No": item?.tag,
          "Axes Helper": item?.isAxesHelper,
          "Position X": item?.position.x,
          "Position Y": item?.position.y,
          "Position Z": item?.position.z,
          "Rotate X": item?.rotationX,
          "Rotate Y": item?.rotation,
          "Rotate Z": item?.rotationZ,
          Connection: item?.points.length,
          Scale: round((item?.scale ?? 1) * 100),

          // "deg":item.
        },
      ],
      `Selected Process Columns - ${item?.name}`
    );
  }

  function handleImport() {
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      console.log(newData, isCSV);
      const updatedData = newData[0];
      const itemName = updatedData["Element name"];
      const itemTag = updatedData["Tag No"];
      const itemAxes = updatedData["Axes Helper"];
      const itemPosX = parseFloat(updatedData["Position X"]);
      const itemPosY = parseFloat(updatedData["Position Y"]);
      const itemPosZ = parseFloat(updatedData["Position Z"]);
      const itemRotateX = parseFloat(updatedData["Rotate X"]);
      const itemRotateY = parseFloat(updatedData["Rotate Y"]);
      const itemRotateZ = parseFloat(updatedData["Rotate Z"]);
      const itemScale = parseFloat(updatedData["Scale"]);
      const itemConnection = parseFloat(updatedData["Connection"]);

      const updates = [];
      if (itemTag) {
        updates.push({ field: "tag", value: itemTag });
      }
      if (itemAxes) {
        updates.push({ field: "isAxesHelper", value: itemAxes });
      }
      if (itemPosX) {
        updates.push({ field: "x", value: itemPosX });
      }
      if (itemPosY) {
        updates.push({ field: "y", value: itemPosY });
      }
      if (itemPosZ) {
        updates.push({ field: "z", value: itemPosZ });
      }
      if (itemRotateX) {
        updates.push({ field: "rotationX", value: itemRotateX });
      }
      if (itemRotateY) {
        updates.push({ field: "rotation", value: itemRotateY });
      }
      if (itemRotateZ) {
        updates.push({ field: "rotationZ", value: itemRotateZ });
      }
      if (itemScale) {
        updates.push({ field: "scale", value: itemScale / 100 });
      }

      const changed = updateProcessElementAction(updates);
      if (itemConnection) {
        handleChangePointsCount(itemConnection, changed);
      }
    });
  }
  function updateProcessElementAction(
    updates: Array<{ field: string; value: any }>
  ) {
    if (!item) return;
    let changed: TProcessElement = { ...item };
    updates.forEach((update) => {
      if (
        update.field === "x" ||
        update.field === "y" ||
        update.field === "z"
      ) {
        changed = {
          ...changed,
          position: { ...changed.position, [update.field]: update.value },
        };
      } else if (update.field === "scale") {
        const coef = 1 + (update.value - changed.scale);
        changed = {
          ...changed,
          scale: update.value,
        };
      } else changed = { ...changed, [update.field]: update.value };
    });
    dispatch(changeProcessElementAction(current, changed.name, changed));
    return changed;
  }
  function handleChange(field: string, value: any) {
    if (!item) return;
    let changed: TProcessElement = { ...item };
    if (field === "x" || field === "y" || field === "z") {
      changed = {
        ...changed,
        position: { ...changed.position, [field]: value },
      };
    } else if (field === "scale") {
      const coef = 1 + (value - item.scale);
      changed = {
        ...changed,
        scale: value,
        // points: changed.points.map((p) => ({
        //   ...p,
        //   startPosition: p.startPosition.clone().multiplyScalar(coef),
        //   generalPosition: p.generalPosition.clone().multiplyScalar(coef),
        // })),
      };
    } else changed = { ...changed, [field]: value };
    dispatch(changeProcessElementAction(current, changed.name, changed));
  }

  function handleChangePointsCount(
    count: number,
    newChanged?: TProcessElement
  ) {
    if (!item) return;
    let changed;
    if (!newChanged) changed = { ...item };
    else changed = { ...newChanged };

    let points = [...item.points];

    const removed: TProcessElementPoint[] = [];

    const diff = points.length - count;

    const l_2 = roundM(item.scale / 2);
    const l_3 = roundM(item.scale / 3);
    const l_4 = roundM(l_2 / 2);
    const l_5 = item.scale / 5;
    const l_6 = l_3 / 2;

    if (item.type === EProcessElementType.MIX) {
      if (diff < 0) {
        for (let i = 0, len = Math.abs(diff); i < len; i++) {
          points.push({
            id: getNextId(points),
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(),
            // @ts-ignore
            isNew: true,
          });
        }
      } else {
        for (let i = 0; i < diff; i++) {
          let point = points.find((p) => !p.isFixed && !p.element);
          if (!point) {
            point = points.find((p) => !p.isFixed);
          }
          if (!point) break;
          removed.push(point);
          points = points.filter((p) => p.id !== point!.id);
        }
      }
      const l = roundM((l_3 * 2) / points.length);
      let i = 1;
      points = points.map((p) => {
        // @ts-ignore
        if (p.connectionType === "START" || !p.isNew) return p;
        const pos = l_3 - l * i++;
        const newPoint = roundVectorM(new Vector3(-l_2, 0, pos));
        return {
          ...p,
          generalPosition: newPoint.clone(),
          isNew: undefined,
        };
      });
    } else if (item.type === EProcessElementType.SPLIT) {
      if (diff < 0) {
        for (let i = 0, len = Math.abs(diff); i < len; i++) {
          points.push({
            id: getNextId(points),
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3(),
            // @ts-ignore
            isNew: true,
          });
        }
      } else {
        for (let i = 0; i < diff; i++) {
          let point = points.find((p) => !p.isFixed && !p.element);
          if (!point) {
            point = points.find((p) => !p.isFixed);
          }
          if (!point) break;
          removed.push(point);
          points = points.filter((p) => p.id !== point!.id);
        }
      }
      const l = roundM((l_3 * 2) / points.length);
      let i = 1;
      points = points.map((p) => {
        // @ts-ignore
        if (p.connectionType === "END" || !p.isNew) return p;
        const pos = l_3 - l * i++;
        const newPoint = roundVectorM(new Vector3(l_2, 0, pos));
        return {
          ...p,
          generalPosition: newPoint.clone(),
          isNew: undefined,
        };
      });
    } else if (item.type === EProcessElementType.HEADER) {
      if (diff < 0) {
        for (let i = 0, len = Math.abs(diff); i < len; i++) {
          points.push({
            id: getNextId(points),
            startPosition: new Vector3(),
            generalPosition: new Vector3(),
            // @ts-ignore
            isNew: true,
          });
        }
      } else {
        for (let i = 0; i < diff; i++) {
          let point = points.find((p) => !p.isFixed && !p.element);
          if (!point) {
            point = points.find((p) => !p.isFixed);
          }
          if (!point) break;
          removed.push(point);
          points = points.filter((p) => p.id !== point!.id);
        }
      }
      const l = roundM((l_3 * 2) / (points.length - 1));
      let i = 1;
      points = points.map((p) => {
        // @ts-ignore
        if (p.isFixed || !p.isNew) return p;
        const pos = l_3 - l * i++;
        const newPoint = new Vector3(pos, -l_2);
        return {
          ...p,
          generalPosition: newPoint.clone(),
          isNew: undefined,
        };
      });
    } else if (item.type === EProcessElementType.EXTRACTOR) {
      if (diff < 0) {
        for (let i = 0, len = Math.abs(diff); i < len; i++) {
          points.push({
            id: getNextId(points),
            startPosition: new Vector3(),
            generalPosition: new Vector3(),
            // @ts-ignore
            isNew: true,
          });
        }
      } else {
        for (let i = 0; i < diff; i++) {
          let point = points.find((p) => !p.isFixed && !p.element);
          if (!point) {
            point = points.find((p) => !p.isFixed);
          }
          if (!point) break;
          removed.push(point);
          points = points.filter((p) => p.id !== point!.id);
        }
      }
      const l = roundM(item.scale / (points.length - 1));
      let i = 1;
      points = points.map((p) => {
        // @ts-ignore
        if (p.isFixed || !p.isNew) return p;
        const pos = l_2 - l * i++;
        const newPoint = new Vector3(l_5 + l_6, pos);
        return {
          ...p,
          generalPosition: newPoint.clone(),
          isNew: undefined,
        };
      });
    } else if (
      [EProcessElementType.TANK, EProcessElementType.DRUM].includes(item.type)
    ) {
      if (diff < 0) {
        for (let i = 0, len = Math.abs(diff); i < len; i++) {
          points.push({
            id: getNextId(points),
            isVertical: true,
            startPosition: new Vector3(),
            generalPosition: new Vector3(),
            // @ts-ignore
            isNew: true,
          });
        }
      } else {
        for (let i = 0; i < diff; i++) {
          let point = points.find((p) => !p.isFixed && !p.element);
          if (!point) {
            point = points.find((p) => !p.isFixed);
          }
          if (!point) break;
          removed.push(point);
          points = points.filter((p) => p.id !== point!.id);
        }
      }
      const lv = roundM(l_2 / (points.filter((p) => p.isVertical).length + 1));
      const lh = roundM(
        item.scale / (points.filter((p) => !p.isVertical).length + 1)
      );
      let v = 1;
      let h = 1;
      points = points.map((p) => {
        // @ts-ignore
        if (p.isFixed || !p.isNew) return p;
        if (p.isVertical) {
          const pos = l_4 - lv * v++;
          const newPoint = new Vector3(l_2 + l_5, pos);
          return {
            ...p,
            generalPosition: newPoint.clone(),
            isNew: undefined,
          };
        } else {
          const pos = l_2 - lh * h++;
          const newPoint = new Vector3(pos, -item.scale);
          return {
            ...p,
            generalPosition: newPoint.clone(),
            isNew: undefined,
          };
        }
      });
    } else if (
      [
        EProcessElementType.CSTR,
        EProcessElementType.RE,
        EProcessElementType.RC,
        EProcessElementType.RG,
        EProcessElementType.HEATER,
        EProcessElementType.COOLER,
        EProcessElementType.COLUMN,
        EProcessElementType.BC,
        EProcessElementType.ES,
        EProcessElementType.NOX_ABATOR,
        EProcessElementType.HORIZONTAL_DRUM,
        EProcessElementType.AV,
        EProcessElementType.AH,
        EProcessElementType.WHB,
        EProcessElementType.CC,
        EProcessElementType.AAM,
        EProcessElementType.TAM,
        EProcessElementType.AC,
        EProcessElementType.NAH,
        EProcessElementType.DAF,
        EProcessElementType.A_B_PUMP,
        EProcessElementType.PUMP_PRELUBE,

        EProcessElementType.TGP,

        EProcessElementType.IAF,
      ].includes(item.type)
    ) {
      if (diff < 0) {
        for (let i = 0, len = Math.abs(diff); i < len; i++) {
          points.push({
            id: getNextId(points),
            isElectrical: true,
            startPosition: new Vector3(),
            generalPosition: new Vector3(),
            // @ts-ignore
            isNew: true,
          });
        }
      } else {
        for (let i = 0; i < diff; i++) {
          let point = points.find((p) => !p.isFixed && !p.element);
          if (!point) {
            point = points.find((p) => !p.isFixed);
          }
          if (!point) break;
          removed.push(point);
          points = points.filter((p) => p.id !== point!.id);
        }
      }
      const deg = 360 / points.length;
      let i = 0;
      points = points.map((p) => {
        // @ts-ignore
        if (p.isFixed || !p.isElectrical || !p.isNew) return p;
        const newPoint = roundVectorM(
          new Vector3(0, 0, l_2 + l_4).applyAxisAngle(
            new Vector3(0, 1),
            degToRad(deg * i)
          )
        );
        i++;
        return {
          ...p,
          generalPosition: newPoint.clone(),
          isNew: undefined,
        };
      });
    } else if (
      [
        EProcessElementType.AIRPHIN_COOLER,
        EProcessElementType.SKID,
        EProcessElementType.OTHER,
      ].includes(item.type)
    ) {
      if (diff < 0) {
        for (let i = 0, len = Math.abs(diff); i < len; i++) {
          points.push({
            id: getNextId(points),
            isVertical: true,
            startPosition: new Vector3(),
            generalPosition: new Vector3(),
            // @ts-ignore
            isNew: true,
          });
        }
      } else {
        for (let i = 0; i < diff; i++) {
          let point = points.find((p) => !p.isFixed && !p.element);
          if (!point) {
            point = points.find((p) => !p.isFixed);
          }
          if (!point) break;
          removed.push(point);
          points = points.filter((p) => p.id !== point!.id);
        }
      }
      const delta = item.parameters.length / points.length;
      let i = 0;
      points = points.map((p) => {
        // @ts-ignore
        if (p.isFixed || !p.isNew) return p;
        const pos = delta / 2 + delta * i++ - item.parameters.length / 2;
        const newPoint = new Vector3(0, item.parameters.height, pos);
        return {
          ...p,
          generalPosition: newPoint.clone(),
          isNew: undefined,
        };
      });
    }
    changed = { ...changed, points };
    dispatch(changeProcessElementConnections(current, changed, removed));
  }
  function handleChangeLugsCount(count: number, newChanged?: TProcessElement) {
    if (!item) return;
    let changed;
    if (!newChanged) changed = { ...item };
    else changed = { ...newChanged };

    let points = [...item.points];

    const removed: TProcessElementPoint[] = [];

    const diff = points.length - count;

    const l_2 = roundM(item.scale / 2);
    const l_3 = roundM(item.scale / 3);
    const l_4 = roundM(l_2 / 2);
    const l_5 = item.scale / 5;
    const l_6 = l_3 / 2;

    if (item.type === EProcessElementType.MIX) {
      if (diff < 0) {
        for (let i = 0, len = Math.abs(diff); i < len; i++) {
          points.push({
            id: getNextId(points),
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(),
            // @ts-ignore
            isNew: true,
          });
        }
      } else {
        for (let i = 0; i < diff; i++) {
          let point = points.find((p) => !p.isFixed && !p.element);
          if (!point) {
            point = points.find((p) => !p.isFixed);
          }
          if (!point) break;
          removed.push(point);
          points = points.filter((p) => p.id !== point!.id);
        }
      }
      const l = roundM((l_3 * 2) / points.length);
      let i = 1;
      points = points.map((p) => {
        // @ts-ignore
        if (p.connectionType === "START" || !p.isNew) return p;
        const pos = l_3 - l * i++;
        const newPoint = roundVectorM(new Vector3(-l_2, 0, pos));
        return {
          ...p,
          generalPosition: newPoint.clone(),
          isNew: undefined,
        };
      });
    } else if (item.type === EProcessElementType.SPLIT) {
      if (diff < 0) {
        for (let i = 0, len = Math.abs(diff); i < len; i++) {
          points.push({
            id: getNextId(points),
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3(),
            // @ts-ignore
            isNew: true,
          });
        }
      } else {
        for (let i = 0; i < diff; i++) {
          let point = points.find((p) => !p.isFixed && !p.element);
          if (!point) {
            point = points.find((p) => !p.isFixed);
          }
          if (!point) break;
          removed.push(point);
          points = points.filter((p) => p.id !== point!.id);
        }
      }
      const l = roundM((l_3 * 2) / points.length);
      let i = 1;
      points = points.map((p) => {
        // @ts-ignore
        if (p.connectionType === "END" || !p.isNew) return p;
        const pos = l_3 - l * i++;
        const newPoint = roundVectorM(new Vector3(l_2, 0, pos));
        return {
          ...p,
          generalPosition: newPoint.clone(),
          isNew: undefined,
        };
      });
    } else if (item.type === EProcessElementType.HEADER) {
      if (diff < 0) {
        for (let i = 0, len = Math.abs(diff); i < len; i++) {
          points.push({
            id: getNextId(points),
            startPosition: new Vector3(),
            generalPosition: new Vector3(),
            // @ts-ignore
            isNew: true,
          });
        }
      } else {
        for (let i = 0; i < diff; i++) {
          let point = points.find((p) => !p.isFixed && !p.element);
          if (!point) {
            point = points.find((p) => !p.isFixed);
          }
          if (!point) break;
          removed.push(point);
          points = points.filter((p) => p.id !== point!.id);
        }
      }
      const l = roundM((l_3 * 2) / (points.length - 1));
      let i = 1;
      points = points.map((p) => {
        // @ts-ignore
        if (p.isFixed || !p.isNew) return p;
        const pos = l_3 - l * i++;
        const newPoint = new Vector3(pos, -l_2);
        return {
          ...p,
          generalPosition: newPoint.clone(),
          isNew: undefined,
        };
      });
    } else if (item.type === EProcessElementType.EXTRACTOR) {
      if (diff < 0) {
        for (let i = 0, len = Math.abs(diff); i < len; i++) {
          points.push({
            id: getNextId(points),
            startPosition: new Vector3(),
            generalPosition: new Vector3(),
            // @ts-ignore
            isNew: true,
          });
        }
      } else {
        for (let i = 0; i < diff; i++) {
          let point = points.find((p) => !p.isFixed && !p.element);
          if (!point) {
            point = points.find((p) => !p.isFixed);
          }
          if (!point) break;
          removed.push(point);
          points = points.filter((p) => p.id !== point!.id);
        }
      }
      const l = roundM(item.scale / (points.length - 1));
      let i = 1;
      points = points.map((p) => {
        // @ts-ignore
        if (p.isFixed || !p.isNew) return p;
        const pos = l_2 - l * i++;
        const newPoint = new Vector3(l_5 + l_6, pos);
        return {
          ...p,
          generalPosition: newPoint.clone(),
          isNew: undefined,
        };
      });
    } else if (
      [EProcessElementType.TANK, EProcessElementType.DRUM].includes(item.type)
    ) {
      if (diff < 0) {
        for (let i = 0, len = Math.abs(diff); i < len; i++) {
          points.push({
            id: getNextId(points),
            isVertical: true,
            startPosition: new Vector3(),
            generalPosition: new Vector3(),
            // @ts-ignore
            isNew: true,
          });
        }
      } else {
        for (let i = 0; i < diff; i++) {
          let point = points.find((p) => !p.isFixed && !p.element);
          if (!point) {
            point = points.find((p) => !p.isFixed);
          }
          if (!point) break;
          removed.push(point);
          points = points.filter((p) => p.id !== point!.id);
        }
      }
      const lv = roundM(l_2 / (points.filter((p) => p.isVertical).length + 1));
      const lh = roundM(
        item.scale / (points.filter((p) => !p.isVertical).length + 1)
      );
      let v = 1;
      let h = 1;
      points = points.map((p) => {
        // @ts-ignore
        if (p.isFixed || !p.isNew) return p;
        if (p.isVertical) {
          const pos = l_4 - lv * v++;
          const newPoint = new Vector3(l_2 + l_5, pos);
          return {
            ...p,
            generalPosition: newPoint.clone(),
            isNew: undefined,
          };
        } else {
          const pos = l_2 - lh * h++;
          const newPoint = new Vector3(pos, -item.scale);
          return {
            ...p,
            generalPosition: newPoint.clone(),
            isNew: undefined,
          };
        }
      });
    } else if (
      [
        EProcessElementType.CSTR,
        EProcessElementType.RE,
        EProcessElementType.RC,
        EProcessElementType.RG,
        EProcessElementType.HEATER,
        EProcessElementType.COOLER,
        EProcessElementType.COLUMN,
        EProcessElementType.BC,
        EProcessElementType.ES,
        EProcessElementType.NOX_ABATOR,
        EProcessElementType.HORIZONTAL_DRUM,
        EProcessElementType.AV,
        EProcessElementType.AH,
        EProcessElementType.WHB,
        EProcessElementType.CC,
        EProcessElementType.AAM,
        EProcessElementType.TAM,
        EProcessElementType.AC,
        EProcessElementType.NAH,
        EProcessElementType.DAF,
        EProcessElementType.A_B_PUMP,
        EProcessElementType.PUMP_PRELUBE,

        EProcessElementType.TGP,

        EProcessElementType.IAF,
      ].includes(item.type)
    ) {
      if (diff < 0) {
        for (let i = 0, len = Math.abs(diff); i < len; i++) {
          points.push({
            id: getNextId(points),
            isElectrical: true,
            startPosition: new Vector3(),
            generalPosition: new Vector3(),
            // @ts-ignore
            isNew: true,
          });
        }
      } else {
        for (let i = 0; i < diff; i++) {
          let point = points.find((p) => !p.isFixed && !p.element);
          if (!point) {
            point = points.find((p) => !p.isFixed);
          }
          if (!point) break;
          removed.push(point);
          points = points.filter((p) => p.id !== point!.id);
        }
      }
      const deg = 360 / points.length;
      let i = 0;
      points = points.map((p) => {
        // @ts-ignore
        if (p.isFixed || !p.isElectrical || !p.isNew) return p;
        const newPoint = roundVectorM(
          new Vector3(0, 0, l_2 + l_4).applyAxisAngle(
            new Vector3(0, 1),
            degToRad(deg * i)
          )
        );
        i++;
        return {
          ...p,
          generalPosition: newPoint.clone(),
          isNew: undefined,
        };
      });
    } else if (
      [
        EProcessElementType.AIRPHIN_COOLER,
        EProcessElementType.SKID,
        EProcessElementType.OTHER,
      ].includes(item.type)
    ) {
      if (diff < 0) {
        for (let i = 0, len = Math.abs(diff); i < len; i++) {
          points.push({
            id: getNextId(points),
            isVertical: true,
            startPosition: new Vector3(),
            generalPosition: new Vector3(),
            // @ts-ignore
            isNew: true,
          });
        }
      } else {
        for (let i = 0; i < diff; i++) {
          let point = points.find((p) => !p.isFixed && !p.element);
          if (!point) {
            point = points.find((p) => !p.isFixed);
          }
          if (!point) break;
          removed.push(point);
          points = points.filter((p) => p.id !== point!.id);
        }
      }
      const delta = item.parameters.length / points.length;
      let i = 0;
      points = points.map((p) => {
        // @ts-ignore
        if (p.isFixed || !p.isNew) return p;
        const pos = delta / 2 + delta * i++ - item.parameters.length / 2;
        const newPoint = new Vector3(0, item.parameters.height, pos);
        return {
          ...p,
          generalPosition: newPoint.clone(),
          isNew: undefined,
        };
      });
    }
    changed = { ...changed, points };
    dispatch(changeProcessElementConnections(current, changed, removed));
  }
  function handleChangePoints(
    changed: TProcessElement,
    toRemove?: TProcessElementPoint
  ) {
    dispatch(
      changeProcessElementConnections(
        current,
        changed,
        toRemove ? [toRemove] : []
      )
    );
  }
  function handleChangeLugs(
    changed: TProcessElement,
    toRemove?: TProcessElementPoint
  ) {
    dispatch(
      changeProcessElementConnections(
        current,
        changed,
        toRemove ? [toRemove] : []
      )
    );
  }
  function handleChangeSupportParameters(
    item: TProcessElement,
    field: string,
    value: any
  ) {
    const changed: TProcessElement = {
      ...item,
      supportParameters: { ...(item.supportParameters ?? {}), [field]: value },
    };
    dispatch(changeProcessElementAction(current, changed.name, changed));
  }
  function handleChangePumpParameters(
    item: TProcessElement,
    field: string,
    value: any
  ) {
    const changed: TProcessElement = {
      ...item,
      pumpParameters: { ...(item.pumpParameters ?? {}), [field]: value },
    };
    dispatch(changeProcessElementAction(current, changed.name, changed));
  }

  function handleChangeParameters(
    item: TProcessElement,
    field: string,
    value: any
  ) {
    let changed: TProcessElement = {
      ...item,
      parameters: { ...item.parameters, [field]: value },
    };
    if (field === "nps") {
      changed = {
        ...changed,
        parameters: { ...changed.parameters, nps: value, schedule: undefined },
      };
    } else if (field === "schedule") {
      changed = {
        ...changed,
        parameters: {
          ...changed.parameters,
          diameter: value?.outside_diameter_global ?? 1,
        },
      };
    } else if (item.type === EProcessElementType.VALVE) {
      if (field === "type") {
        const l = changed.scale / 2;
        switch (value as TValveType) {
          case "Three-Way Valve":
            changed = {
              ...changed,
              points: [
                {
                  id: 0,
                  connectionType: "START",
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(l),
                },
                {
                  id: 1,
                  connectionType: "END",
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(-l),
                },
                {
                  id: 2,
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(0, 0, l),
                },
              ],
            };
            break;
          case "Four-Way Valve":
            changed = {
              ...changed,
              points: [
                {
                  id: 0,
                  connectionType: "START",
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(l),
                },
                {
                  id: 1,
                  connectionType: "END",
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(-l),
                },
                {
                  id: 2,
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(0, 0, l),
                },
                {
                  id: 3,
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(0, 0, -l),
                },
              ],
            };
            break;
          case "Left Angle Valve":
            changed = {
              ...changed,
              points: [
                {
                  id: 0,
                  connectionType: "START",
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(0, 0, -l),
                },
                {
                  id: 1,
                  connectionType: "END",
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(-l),
                },
              ],
            };
            break;
          case "Right Angle Valve":
            changed = {
              ...changed,
              points: [
                {
                  id: 0,
                  connectionType: "START",
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(0, 0, l),
                },
                {
                  id: 1,
                  connectionType: "END",
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(-l),
                },
              ],
            };
            break;
          case "Up Angle Valve":
            changed = {
              ...changed,
              points: [
                {
                  id: 0,
                  connectionType: "START",
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(0, l),
                },
                {
                  id: 1,
                  connectionType: "END",
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(-l),
                },
              ],
            };
            break;
          case "Down Angle Valve":
            changed = {
              ...changed,
              points: [
                {
                  id: 0,
                  connectionType: "START",
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(0, -l),
                },
                {
                  id: 1,
                  connectionType: "END",
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(-l),
                },
              ],
            };
            break;
          default:
            changed = {
              ...changed,
              points: [
                {
                  id: 0,
                  connectionType: "START",
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(l),
                },
                {
                  id: 1,
                  connectionType: "END",
                  startPosition: new Vector3(),
                  generalPosition: new Vector3(-l),
                },
              ],
            };
            break;
        }
      } else if (field === "control") {
        const p = processes.get(current);
        if (p) {
          const instrs = p.instrumentations ?? [];
          const instr = instrs.some((i) =>
            item.instrumentationIDs?.includes(i.id)
          );
          const instrLines = p.instrumentationLines ?? [];
          if (!instr) {
            const newInstr: TInstrumentationElement = {
              id: getNextId(instrs),
              name: "C",
              parent: item.name,
              parentType: "PROCESS",
              type: EInstrumentationElementType.CONTROLLER,
              x: item.position.x,
              y: item.position.y + 0.5,
              z: item.position.z,
            };
            const line: TInstrumentationLine = {
              id: getNextId(instrLines),
              from: item.name,
              to: newInstr.id,
              type: "Instrument signal",
              connectionType: "PtoI",
            };
            dispatch(createInstrElementAction(current, newInstr));
            dispatch(createInstrLineAction(current, line));
            changed = {
              ...changed,
              instrumentationIDs: [
                ...(changed.instrumentationIDs ?? []),
                newInstr.id,
              ],
            };
          }
        }
      }
    }
    dispatch(changeProcessElementAction(current, changed.name, changed));
  }

  function getAdditionalFields(item: TProcessElement) {
    switch (item.type) {
      case EProcessElementType.VALVE:
        return (
          <>
            <div className="d-flex f-ai-center f-jc-end">
              <div className={"label-light t-end"}>Valve Type: </div>
            </div>
            <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
              <FormGroup className={"f-grow no-m"}>
                <SimpleSelector<TValveType>
                  items={valveTypes}
                  itemLabel={(item) => item}
                  selected={item.parameters.type}
                  onSelect={(val) => handleChangeParameters(item, "type", val)}
                  className={"fill-select"}
                />
              </FormGroup>
            </div>
            <div className="d-flex f-ai-center f-jc-end">
              <div className={"label-light t-end"}>Actuator Type: </div>
            </div>
            <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
              <FormGroup className={"f-grow no-m"}>
                <SimpleSelector<TValveActuatorType>
                  items={valveActuators}
                  itemLabel={(item) => item}
                  selected={item.parameters.actuator}
                  onSelect={(val) =>
                    handleChangeParameters(item, "actuator", val)
                  }
                  className={"fill-select"}
                  clearable={true}
                />
              </FormGroup>
            </div>
            <div className="d-flex f-ai-center f-jc-end">
              <div className={"label-light t-end"}>Control Type: </div>
            </div>
            <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
              <FormGroup className={"f-grow no-m"}>
                <SimpleSelector<TValveControlType>
                  items={valveControls}
                  itemLabel={(item) => item}
                  selected={item.parameters.control}
                  onSelect={(val) =>
                    handleChangeParameters(item, "control", val)
                  }
                  className={"fill-select"}
                  clearable={true}
                />
              </FormGroup>
            </div>
          </>
        );
      case EProcessElementType.PUMP_PRELUBE:
        return (
          <>
            {getPumpDynamicField(
              item,
              "pumpWidth",
              "PumpWidth",
              false,
              handleChangePumpParameters
            )}
            {getPumpDynamicField(
              item,
              "pumpDiam",
              "PumpDiam",
              false,
              handleChangePumpParameters
            )}
            {getPumpDynamicField(
              item,
              "motorDiam",
              "MotorDiam",
              false,
              handleChangePumpParameters
            )}
            {getPumpDynamicField(
              item,
              "motorLength",
              "MotorLength",
              false,
              handleChangePumpParameters
            )}
            {getPumpDynamicField(
              item,
              "shaftLength",
              "ShaftLength",
              false,
              handleChangePumpParameters
            )}
            {getPumpDynamicField(
              item,
              "shaftDiam",
              "ShaftDiam",
              false,
              handleChangePumpParameters
            )}
            {getPumpDynamicField(
              item,
              "heightSupport",
              "HeightSupport",
              false,
              handleChangePumpParameters
            )}
          </>
        );
      case EProcessElementType.HEADER:
        return (
          <>
            {getNPSField(item, profiles, handleChangeParameters)}
            {getScheduleField(item, profiles, handleChangeParameters)}

            {getDiameterField(item, disabled, handleChangeParameters)}
            {getLengthField(item, 0.001, disabled, handleChangeParameters)}
          </>
        );
      case EProcessElementType.AIC:
        return (
          <>
            {getWidthField(item, disabled, handleChangeParameters)}{" "}
            {getHeightField(
              item,
              0.01,
              false,
              disabled,
              handleChangeParameters
            )}
          </>
        );
      case EProcessElementType.AAM:
        return (
          <>
            {getNPSField(item, profiles, handleChangeParameters)}
            {getScheduleField(item, profiles, handleChangeParameters)}

            {getDiameterField(item, disabled, handleChangeParameters)}
            {getLengthField(item, 0.001, disabled, handleChangeParameters)}
          </>
        );

      case EProcessElementType.IAF:
        return (
          <>
            {getWidthField(item, disabled, handleChangeParameters)}{" "}
            {getHeightField(
              item,
              0.01,
              false,
              disabled,
              handleChangeParameters
            )}
            {getLengthField(item, 0.001, disabled, handleChangeParameters)}
          </>
        );
      case EProcessElementType.NOX_ABATOR:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getHeightField(
              item,
              item.parameters.diameter,
              false,
              disabled,
              handleChangeParameters
            )}
          </>
        );
      case EProcessElementType.ES:
        return (
          <>
            {getDiameterField1(item, disabled, handleChangeParameters)}
            {getDiameterField2(item, disabled, handleChangeParameters)}
            {getHeightFieldTot(
              item,
              item.parameters.diameter1,
              false,
              disabled,
              handleChangeParameters
            )}
            {getHeightFieldBase(
              item,
              item.parameters.diameter2,
              false,
              disabled,
              handleChangeParameters
            )}
            {getThickness(item, disabled, handleChangeParameters)}
          </>
        );
      case EProcessElementType.TAM:
        return (
          <>
            {getNPSField(item, profiles, handleChangeParameters)}
            {getScheduleField(item, profiles, handleChangeParameters)}

            {getDiameterField(item, disabled, handleChangeParameters)}
            {getLengthField(item, 0.001, disabled, handleChangeParameters)}
          </>
        );
      case EProcessElementType.SEPARATOR:
        return (
          <>
            {getCenterElevationField(item, disabled, handleChangeParameters)}
            {getOutletElevation(item, disabled, handleChangeParameters)}
            {getPositionFromStartField(item, disabled, handleChangeParameters)}

            {getDiameterField(item, disabled, handleChangeParameters)}
            {getLengthField(
              item,
              MMtoM(item.parameters.diameter ?? 0),
              disabled,
              handleChangeParameters
            )}
          </>
        );
      case EProcessElementType.HORIZONTAL_DRUM:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getLengthField(
              item,
              MMtoM(item.parameters.diameter ?? 0),
              disabled,
              handleChangeParameters
            )}
          </>
        );
      case EProcessElementType.TGP:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getLengthField(
              item,
              MMtoM(item.parameters.diameter ?? 0),
              disabled,
              handleChangeParameters
            )}
          </>
        );
      case EProcessElementType.AV:
        return (
          <>
            {getDiameterField1(item, disabled, handleChangeParameters)}
            {getDiameterField2(item, disabled, handleChangeParameters)}
            {getLengthField1(
              item,
              MMtoM(item.parameters.diameter ?? 0),
              disabled,
              handleChangeParameters
            )}
            {getLengthField2(
              item,
              MMtoM(item.parameters.diameter ?? 0),
              disabled,
              handleChangeParameters
            )}
            {getDistanceField(item, 0, disabled, handleChangeParameters)}
          </>
        );

      case EProcessElementType.PFR:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getLengthField(item, 0.001, disabled, handleChangeParameters)}
          </>
        );
      case EProcessElementType.CSTR:
        return (
          <>
            {getVolumeField(item, disabled, handleChangeParameters)}

            {getDiameterField(item, disabled, handleChangeParameters)}
            {getHeightField(
              item,
              item.parameters.diameter,
              false,
              disabled,
              handleChangeParameters
            )}
          </>
        );
      case EProcessElementType.TANK:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getHeightField(
              item,
              item.parameters.diameter,
              false,
              disabled,
              handleChangeParameters
            )}
          </>
        );
      case EProcessElementType.DRUM:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getHeightField(
              item,
              item.parameters.diameter,
              false,
              disabled,
              handleChangeParameters
            )}
            {/* {getBaseElevation(item, disabled, handleChangeParameters)} */}
          </>
        );
      case EProcessElementType.DISTILLATION_COLUMN:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getHeightField(
              item,
              item.parameters.diameter,
              false,
              disabled,
              handleChangeParameters
            )}
            {/* {getBaseElevation(item, disabled, handleChangeParameters)}
            {getInletElevation(item, disabled, handleChangeParameters)}
            {getOutletElevation(item, disabled, handleChangeParameters)} */}
          </>
        );
      case EProcessElementType.WHB:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getLengthField(item, 1.3, disabled, handleChangeParameters)}

            {/* {getBaseElevation(item, disabled, handleChangeParameters)}
            {getInletElevation(item, disabled, handleChangeParameters)}
            {getOutletElevation(item, disabled, handleChangeParameters)} */}
          </>
        );
      case EProcessElementType.DAF:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getHeightField(
              item,
              item.parameters.diameter,
              false,
              disabled,
              handleChangeParameters
            )}
            {/* {getBaseElevation(item, disabled, handleChangeParameters)} */}
          </>
        );
      case EProcessElementType.ABSORPTION_COLUMN:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getHeightField(
              item,
              item.parameters.diameter,
              false,
              disabled,
              handleChangeParameters
            )}
            {/* {getBaseElevation(item, disabled, handleChangeParameters)} */}
          </>
        );

      case EProcessElementType.NAH:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getHeightField(
              item,
              item.parameters.diameter,
              false,
              disabled,
              handleChangeParameters
            )}
            {getThickness(item, disabled, handleChangeParameters)}
            {/* {getBaseElevation(item, disabled, handleChangeParameters)} */}
          </>
        );
      case EProcessElementType.AH:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getLengthField(item, 1.5, disabled, handleChangeParameters)}

            {/* {getBaseElevation(item, disabled, handleChangeParameters)} */}
          </>
        );
      case EProcessElementType.CC:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getLengthField(item, 1.75, disabled, handleChangeParameters)}
            {/* {getBaseElevation(item, disabled, handleChangeParameters)} */}
          </>
        );
      case EProcessElementType.BC:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getHeightField(
              item,
              item.parameters.diameter,
              false,
              disabled,
              handleChangeParameters
            )}
            {/* {getBaseElevation(item, disabled, handleChangeParameters)} */}
          </>
        );
      case EProcessElementType.COLUMN:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getHeightField(
              item,
              item.parameters.diameter,
              false,
              disabled,
              handleChangeParameters
            )}
          </>
        );
      case EProcessElementType.EXTRACTOR:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getHeightField(item, 1, false, disabled, handleChangeParameters)}
            {/* {getBaseElevation(item, disabled, handleChangeParameters)} */}
          </>
        );
      case EProcessElementType.EXPANDER:
        return (
          <>{getCenterElevationField(item, disabled, handleChangeParameters)}</>
        );
      case EProcessElementType.COMPRESSOR:
        return (
          <>{getCenterElevationField(item, disabled, handleChangeParameters)}</>
        );
      case EProcessElementType.PUMP:
        return (
          <>
            {getInletElevation(item, disabled, handleChangeParameters)}
            {getOutletElevation(item, disabled, handleChangeParameters)}
          </>
        );
      case EProcessElementType.PSV:
        return (
          <>
            {getInletElevation(item, disabled, handleChangeParameters)}
            {getOutletElevation(item, disabled, handleChangeParameters)}
          </>
        );
      case EProcessElementType.AIRPHIN_COOLER:
        return (
          <>
            {getWidthField(item, disabled, handleChangeParameters)}
            {getHeightField(
              item,
              0.001,
              true,
              disabled,
              handleChangeParameters
            )}
            {getLengthField(item, 0.001, disabled, handleChangeParameters)}
            {getParametesOfLegs(item, disabled, current, setLegsDlg, dispatch)}
          </>
        );
      case EProcessElementType.SKID:
      case EProcessElementType.OTHER:
        return (
          <>
            {getWidthField(item, disabled, handleChangeParameters)}
            {getHeightField(
              item,
              0.001,
              true,
              disabled,
              handleChangeParameters
            )}
            {getLengthField(item, 0.001, disabled, handleChangeParameters)}
          </>
        );
      case EProcessElementType.ST_HE_1P:
      case EProcessElementType.ST_HE_2P:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getLengthField(
              item,
              MMtoM(item.parameters.diameter ?? 0),
              disabled,
              handleChangeParameters
            )}
          </>
        );
      case EProcessElementType.ENLARGER:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getLengthField(item, 0.001, disabled, handleChangeParameters)}
          </>
        );
      case EProcessElementType.RG:
      case EProcessElementType.RE:
      case EProcessElementType.RC:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getHeightField(
              item,
              item.parameters.diameter,
              false,
              disabled,
              handleChangeParameters
            )}
          </>
        );
      case EProcessElementType.HEATER:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getHeightField(
              item,
              item.parameters.diameter,
              false,
              disabled,
              handleChangeParameters
            )}
          </>
        );
      case EProcessElementType.COOLER:
        return (
          <>
            {getDiameterField(item, disabled, handleChangeParameters)}
            {getHeightField(
              item,
              item.parameters.diameter,
              false,
              disabled,
              handleChangeParameters
            )}
          </>
        );
      default:
        return null;
    }
  }

  function handleElasticityChange(updatedElement: TProcessElement) {
    const changed: TProcessElement = {
      ...item,
      ...updatedElement,
    };
    console.log("Updated Element:", changed);
    dispatch(changeProcessElementAction(current, changed.name, changed));
  }

  function handleRemove() {
    if (!item) return;
    dispatch(removeProcessElementAction(current, item.name));
  }

  const [isColor, setIsColor] = React.useState(false);

  const [color, setColor] = useState<string | undefined>(item?.color);

  useEffect(() => {
    setColor(item?.color);
  }, [item?.color]);

  // let color: string = "Default";
  // color = (model as TOpenFrame).palette[type];
  return item ? (
    <>
      {showElasticityDialog && (
        <ElasticityDialog
          element={item}
          onClose={() => setShowElasticityDialog(false)}
          onSave={handleElasticityChange}
        />
      )}
      {dlg}
      {legsDlg}
      {supportDlg}
      <div className={"model-item-drawer"}>
        <div className={"header"}>
          <div className={"d-flex f-center"}>
            <Icon icon="info-sign" className={"m-5"} />
            <h2 className={"no-m"}>Element name: {item.name}</h2>
          </div>
          <Button
            large
            minimal
            icon={"cross"}
            onClick={handleClose}
            intent={"danger"}
          />
        </div>
        <div
          className={"body-grid"}
          style={{
            gridTemplateColumns: "105px 1fr",
          }}
        >
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc">Color: </div>
          </div>
          <div
            className="d-flex f-ai-center"
            style={{ gap: 8 }}
            onClick={() => {
              setIsColor(true);
              // setColor(color === "Default" ? DefaultColorPalette[type] : color);
            }}
          >
            <div
              style={{
                width: 15,
                height: 15,
                borderRadius: 15,
                // @ts-ignore
                backgroundColor: color ?? getRGB(pedestalColor),
              }}
            />
            <span>{color}</span>
          </div>

          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc">Tag No.: </div>
          </div>
          <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
            <FormGroup className="f-grow no-m">
              <SimpleInput
                value={item.tag}
                disabled={disabled}
                onChange={(val) => handleChange("tag", val)}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc">Axes Helper: </div>
          </div>
          <div className="d-flex f-ai-center">
            <span
              onClick={() => handleChange("isAxesHelper", !item.isAxesHelper)}
              style={{ cursor: "pointer" }}
            >{`${item.isAxesHelper ?? "false"}`}</span>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc">Position X: </div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              <SimpleNumericInput
                isDecimal={true}
                value={item.position.x}
                disabled={disabled}
                onChange={(val) => handleChange("x", val)}
              />
            </FormGroup>
            <div className="label-light">m</div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc">Position Y: </div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              <SimpleNumericInput
                isDecimal={true}
                value={item.position.y}
                disabled={disabled}
                onChange={(val) => handleChange("y", val)}
              />
            </FormGroup>
            <div className="label-light">m</div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc">Position Z: </div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              <SimpleNumericInput
                isDecimal={true}
                value={item.position.z}
                disabled={disabled}
                onChange={(val) => handleChange("z", val)}
              />
            </FormGroup>
            <div className="label-light">m</div>
          </div>

          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc">Rotation X: </div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              <SimpleSelector<number>
                items={[-270, -180, -90, 0, 90, 180, 270]}
                itemLabel={(val) => `${val}`}
                selected={item.rotationX}
                disabled={disabled}
                onSelect={(val) => handleChange("rotationX", val)}
                className={"fill-select"}
              />
            </FormGroup>
            <div className="label-light">deg</div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc">Rotation Y: </div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              <SimpleSelector<number>
                items={[-270, -180, -90, 0, 90, 180, 270]}
                itemLabel={(val) => `${val}`}
                selected={item.rotation}
                disabled={disabled}
                onSelect={(val) => handleChange("rotation", val)}
                className={"fill-select"}
              />
            </FormGroup>
            <div className="label-light">deg</div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc">Rotation Z: </div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              <SimpleSelector<number>
                items={[-270, -180, -90, 0, 90, 180, 270]}
                itemLabel={(val) => `${val}`}
                selected={item.rotationZ}
                disabled={disabled}
                onSelect={(val) => handleChange("rotationZ", val)}
                className={"fill-select"}
              />
            </FormGroup>
            <div className="label-light">deg</div>
          </div>

          <div className="d-flex f-ai-center f-jc-end">
            <div className={"label-light"}>Scale: </div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              <SimpleNumericInput
                min={1}
                value={round(item.scale * 100)}
                disabled={disabled}
                onChange={(val) => handleChange("scale", val / 100)}
              />
            </FormGroup>
            <div className="label-light">%</div>
          </div>
          <div className="d-flex f-ai-center f-jc-end">
            <div className="label-light w-mc">Transparency: </div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="f-grow no-m">
              <SimpleNumericInput
                min={0}
                value={round((item?.opacity ?? 0) * 100)}
                disabled={disabled}
                onChange={(val) => handleChange("opacity", val / 100)}
              />
            </FormGroup>
            <div className="label-light">%</div>
          </div>
          <div className="d-flex f-ai-center">
            <div className={"label-light"}>Connections: </div>
          </div>
          <div className="d-flex f-ai-center">
            <FormGroup className="no-m">
              <SimpleNumericInput
                min={item.pointsConfig.min}
                value={item.points.length}
                onChange={handleChangePointsCount}
              />
            </FormGroup>
            <FormGroup className="f-grow no-m f-center">
              <Button
                small
                minimal
                icon={"menu"}
                intent={"primary"}
                className={"c-light"}
                disabled={disabled}
                onClick={() =>
                  setDlg(
                    <ConnectionDetailsDlg
                      item={item}
                      process={processes.get(current)}
                      onChange={handleChangePoints}
                      onClose={() => setDlg(undefined)}
                    />
                  )
                }
              />
            </FormGroup>
          </div>
          {item.lugs ? (
            <>
              {" "}
              <div className="d-flex f-ai-center">
                <div className={"label-light"}>Lugs: </div>
              </div>
              <div className="d-flex f-ai-center">
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    min={item.pointsConfig.min}
                    value={item.points.length}
                    onChange={handleChangeLugsCount}
                  />
                </FormGroup>
                <FormGroup className="f-grow no-m f-center">
                  <Button
                    small
                    minimal
                    icon={"menu"}
                    intent={"primary"}
                    className={"c-light"}
                    disabled={disabled}
                    onClick={() =>
                      setLugsDlg(
                        <ConnectionDetailsDlg
                          item={item}
                          process={processes.get(current)}
                          onChange={handleChangeLugs}
                          onClose={() => setLugsDlg(undefined)}
                        />
                      )
                    }
                  />
                </FormGroup>
              </div>
            </>
          ) : null}
          {item.supportParameters ? (
            <>
              <div className="d-flex f-ai-center  f-jc-end">
                <div className={"label-light"}>Support: </div>
              </div>
              <div className="d-flex f-ai-center">
                <FormGroup className="no-m">
                  <SimpleSelector<TProcessSupportType>
                    items={Object.values(TProcessSupportType)}
                    itemLabel={(val) => `${val}`}
                    selected={item.supportParameters?.type}
                    disabled={disabled}
                    onSelect={(val) =>
                      handleChangeSupportParameters(item, "type", val)
                    }
                    className={"w-150"}
                  />
                </FormGroup>
                <FormGroup className="f-grow no-m f-center">
                  <Button
                    small
                    minimal
                    icon={"menu"}
                    intent={"primary"}
                    className={"c-light"}
                    disabled={disabled}
                    onClick={() =>
                      setSupportDlg(
                        <SupportDetailsDlg
                          item={item}
                          process={processes.get(current)}
                          onChange={(changed) =>
                            dispatch(
                              changeProcessElementAction(
                                current,
                                changed.name,
                                changed
                              )
                            )
                          }
                          onClose={() => setSupportDlg(undefined)}
                        />
                      )
                    }
                  />
                </FormGroup>
              </div>
            </>
          ) : null}
          {getAdditionalFields(item)}
          {/* {item.bridge !== undefined ? (
            <>
              <div className="d-flex f-ai-center">
                <div className={"label-light"}>Bridges: </div>
              </div>
              <div className="d-flex f-ai-center">
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    min={0}
                    value={item.bridge ?? 0}
                    onChange={(val) => handleChange("bridge", val)}
                  />
                </FormGroup>
              </div>
            </>
          ) : null}
          <div className="d-flex" style={{ gridColumn: "2/3"}}>
          <Tooltip
            content="Export CSV to for equipment positioning" >
          ) : null} */}
          <div className="d-flex" style={{ gridColumn: "1/3" }}>
            <Button
              large
              icon="export"
              text="Export to CSV"
              intent="success"
              style={{ width: "100%" }}
              onClick={handleExport}
            />
            <Tooltip content="import CSV for equipment positioning">
              <Button
                large
                icon="import"
                text="Import from CSV"
                intent="success"
                style={{ width: "100%" }}
                onClick={handleImport}
              />
            </Tooltip>
          </div>
        </div>

        <Button
          large
          fill
          text={"Remove"}
          intent={"danger"}
          /*disabled={disabled}*/
          onClick={handleRemove}
        />
      </div>
      {isColor && (
        <CustomDlg
          zIndex={3}
          title="Color"
          onClose={() => setIsColor(false)}
          body={
            <SketchPicker
              color={color}
              disableAlpha={true}
              onChange={(color) => setColor(color.hex)}
            />
          }
          actions={
            <Button
              text={"Save"}
              intent={"primary"}
              onClick={() => {
                handleChange("color", color);
                setIsColor(false);
                // if (!model || !type) return;
                // dispatch(
                //   changeModel({
                //     ...model,
                //     palette: {
                //       ...((model as TOpenFrame).palette ?? {}),
                //       [type]: color,
                //     },
                //   } as TOpenFrame)
                // );
              }}
            />
          }
        />
      )}
    </>
  ) : null;
}

function getNPSField(
  item: TProcessElement,
  profiles: PipeProfile[],
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>NPS: </div>
      </div>
      <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
        <FormGroup className={"f-grow no-m"}>
          <SimpleSelector<string>
            items={getUnicuesArray(
              profiles.map((p) => p.nominal_pipe_size_inch)
            )}
            itemLabel={(item) => item}
            selected={item.parameters.nps}
            onSelect={(val) => handleChangeParameters(item, "nps", val)}
            filter={strFilter}
            className={"fill-select"}
            clearable={true}
          />
        </FormGroup>
      </div>
    </>
  );
}

function getScheduleField(
  item: TProcessElement,
  profiles: PipeProfile[],
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Schedule: </div>
      </div>
      <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
        <FormGroup className={"f-grow no-m"}>
          <SimpleSelector<PipeProfile>
            items={profiles.filter(
              (p) => p.nominal_pipe_size_inch === item.parameters.nps
            )}
            itemLabel={(item) =>
              `${item.nominal_pipe_size_inch} ${item.schedule}`
            }
            selected={item.parameters.schedule}
            onSelect={(val) => handleChangeParameters(item, "schedule", val)}
            filter={(query, item) =>
              `${item.nominal_pipe_size_inch} ${item.schedule}`
                .toLowerCase()
                .includes(query.toLowerCase())
            }
            clearable={true}
            className={"fill-select"}
          />
        </FormGroup>
      </div>
    </>
  );
}

function getDiameterField(
  item: TProcessElement,
  disabled: boolean,
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Diameter: </div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <SimpleNumericInput
            min={1}
            value={item.parameters.diameter}
            disabled={disabled}
            onChange={(val) => handleChangeParameters(item, "diameter", val)}
          />
        </FormGroup>
        <div className="label-light">mm</div>
      </div>
    </>
  );
}

function getDiameterField1(
  item: TProcessElement,
  disabled: boolean,
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Diameter 1: </div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <SimpleNumericInput
            min={1}
            value={item.parameters.diameter1}
            disabled={disabled}
            onChange={(val) => handleChangeParameters(item, "diameter1", val)}
          />
        </FormGroup>
        <div className="label-light">mm</div>
      </div>
    </>
  );
}

function getThickness(
  item: TProcessElement,
  disabled: boolean,
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Thickness: </div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <SimpleNumericInput
            min={1}
            value={item.parameters.thickness}
            disabled={disabled}
            onChange={(val) => handleChangeParameters(item, "thickness", val)}
          />
        </FormGroup>
        <div className="label-light">mm</div>
      </div>
    </>
  );
}
function getDiameterField2(
  item: TProcessElement,
  disabled: boolean,
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Diameter 2: </div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <SimpleNumericInput
            min={1}
            value={item.parameters.diameter2}
            disabled={disabled}
            onChange={(val) => handleChangeParameters(item, "diameter2", val)}
          />
        </FormGroup>
        <div className="label-light">mm</div>
      </div>
    </>
  );
}

function getWidthField(
  item: TProcessElement,
  disabled: boolean,
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Width: </div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <SimpleNumericInput
            min={0.001}
            value={item.parameters.width}
            isDecimal={true}
            disabled={disabled}
            onChange={(val) => handleChangeParameters(item, "width", val)}
          />
        </FormGroup>
        <div className="label-light">mm</div>
      </div>
    </>
  );
}

function getHeightFieldTot(
  item: TProcessElement,
  min: number,
  isDecimal: boolean | undefined,
  disabled: boolean,
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Height Tot: </div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <SimpleNumericInput
            min={min}
            value={item.parameters.heightTot}
            isDecimal={isDecimal}
            disabled={disabled}
            onChange={(val) => handleChangeParameters(item, "heightTot", val)}
          />
        </FormGroup>
        <div className="label-light">{isDecimal ? "m" : "mm"}</div>
      </div>
    </>
  );
}
function getHeightFieldBase(
  item: TProcessElement,
  min: number,
  isDecimal: boolean | undefined,
  disabled: boolean,
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Height Base: </div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <SimpleNumericInput
            min={min}
            value={item.parameters.heightBase}
            isDecimal={isDecimal}
            disabled={disabled}
            onChange={(val) => handleChangeParameters(item, "heightBase", val)}
          />
        </FormGroup>
        <div className="label-light">{isDecimal ? "m" : "mm"}</div>
      </div>
    </>
  );
}
function getHeightField(
  item: TProcessElement,
  min: number,
  isDecimal: boolean | undefined,
  disabled: boolean,
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Height: </div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <SimpleNumericInput
            min={min}
            value={item.parameters.height}
            isDecimal={isDecimal}
            disabled={disabled}
            onChange={(val) => handleChangeParameters(item, "height", val)}
          />
        </FormGroup>
        <div className="label-light">{isDecimal ? "m" : "mm"}</div>
      </div>
    </>
  );
}

function getLengthField(
  item: TProcessElement,
  min: number,
  disabled: boolean,
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Length: </div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <SimpleNumericInput
            min={min}
            isDecimal={true}
            value={item.parameters.length}
            disabled={disabled}
            onChange={(val) => handleChangeParameters(item, "length", val)}
          />
        </FormGroup>
        <div className="label-light">mm</div>
      </div>
    </>
  );
}

function getPumpDynamicField(
  item: TProcessElement,
  field: string,
  fieldLabel: string,
  disabled: boolean,
  handleChangePumpParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>{`${fieldLabel}: `}</div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <SimpleNumericInput
            min={0}
            isDecimal={true}
            value={item.pumpParameters?.[field as keyof PumpParamter]}
            disabled={disabled}
            onChange={(val) => handleChangePumpParameters(item, field, val)}
          />
        </FormGroup>
        <div className="label-light">mm</div>
      </div>
    </>
  );
}
function getLengthField1(
  item: TProcessElement,
  min: number,
  disabled: boolean,
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Length 1: </div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <SimpleNumericInput
            min={min}
            isDecimal={true}
            value={item.parameters.length1}
            disabled={disabled}
            onChange={(val) => handleChangeParameters(item, "length1", val)}
          />
        </FormGroup>
        <div className="label-light">m</div>
      </div>
    </>
  );
}
function getLengthField2(
  item: TProcessElement,
  min: number,
  disabled: boolean,
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Length 2: </div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <SimpleNumericInput
            min={min}
            isDecimal={true}
            value={item.parameters.length2}
            disabled={disabled}
            onChange={(val) => handleChangeParameters(item, "length2", val)}
          />
        </FormGroup>
        <div className="label-light">m</div>
      </div>
    </>
  );
}

function getDistanceField(
  item: TProcessElement,
  min: number,
  disabled: boolean,
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Distance: </div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <SimpleNumericInput
            min={min}
            isDecimal={true}
            value={item.parameters.distance}
            disabled={disabled}
            onChange={(val) => handleChangeParameters(item, "distance", val)}
          />
        </FormGroup>
        <div className="label-light">m</div>
      </div>
    </>
  );
}
function getBaseElevation(
  item: TProcessElement,
  disabled: boolean,
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Base Elevation: </div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <SimpleNumericInput
            isDecimal={true}
            value={item.parameters.baseElevation}
            disabled={disabled}
            onChange={(val) =>
              handleChangeParameters(item, "baseElevation", val)
            }
          />
        </FormGroup>
        <div className="label-light">m</div>
      </div>
    </>
  );
}

function getCenterElevationField(
  item: TProcessElement,
  disabled: boolean,
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Center line elevation: </div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <SimpleNumericInput
            min={0}
            isDecimal={true}
            value={item.parameters.centerElevation}
            disabled={disabled}
            onChange={(val) =>
              handleChangeParameters(item, "centerElevation", val)
            }
          />
        </FormGroup>
        <div className="label-light">m</div>
      </div>
    </>
  );
}

function getInletElevation(
  item: TProcessElement,
  disabled: boolean,
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Inlet Elevation: </div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <SimpleNumericInput
            isDecimal={true}
            value={item.parameters.inletElevation}
            disabled={disabled}
            onChange={(val) =>
              handleChangeParameters(item, "inletElevation", val)
            }
          />
        </FormGroup>
        <div className="label-light">m</div>
      </div>
    </>
  );
}

function getOutletElevation(
  item: TProcessElement,
  disabled: boolean,
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Outlet line elevation: </div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <SimpleNumericInput
            min={0}
            isDecimal={true}
            value={item.parameters.outletElevation}
            disabled={disabled}
            onChange={(val) =>
              handleChangeParameters(item, "outletElevation", val)
            }
          />
        </FormGroup>
        <div className="label-light">m</div>
      </div>
    </>
  );
}

function getPositionFromStartField(
  item: TProcessElement,
  disabled: boolean,
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Position from start: </div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <SimpleNumericInput
            min={0}
            isDecimal={true}
            value={item.parameters.offset}
            disabled={disabled}
            onChange={(val) => handleChangeParameters(item, "offset", val)}
          />
        </FormGroup>
        <div className="label-light">m</div>
      </div>
    </>
  );
}

function getVolumeField(
  item: TProcessElement,
  disabled: boolean,
  handleChangeParameters: (
    item: TProcessElement,
    field: string,
    value: any
  ) => any
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Volume: </div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <SimpleNumericInput
            min={1}
            value={item.parameters.volume}
            disabled={disabled}
            onChange={(val) => handleChangeParameters(item, "volume", val)}
          />
        </FormGroup>
      </div>
    </>
  );
}

function getParametesOfLegs(
  item: TProcessElement,
  disabled: boolean,
  current: string,
  setLegsDlg: React.Dispatch<React.SetStateAction<JSX.Element | undefined>>,
  dispatch: Dispatch<any>
) {
  return (
    <>
      <div className="d-flex f-ai-center f-jc-end">
        <div className={"label-light t-end"}>Legs: </div>
      </div>
      <div className="d-flex f-ai-center">
        <FormGroup className="f-grow no-m">
          <Button
            small
            minimal
            icon={"menu"}
            intent={"primary"}
            className={"c-light"}
            disabled={disabled}
            onClick={() =>
              setLegsDlg(
                <LegsDetailsDlg
                  item={item}
                  onChange={(changed) =>
                    dispatch(
                      changeProcessElementAction(current, changed.name, changed)
                    )
                  }
                  onClose={() => setLegsDlg(undefined)}
                />
              )
            }
          />
        </FormGroup>
      </div>
    </>
  );
}
