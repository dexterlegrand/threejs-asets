import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import {
  Project,
  FreePipe,
  TFlangeType,
  TFlangeLoads,
} from "../../../../../store/main/types";
import { DataState, TPipingFlange } from "../../../../../store/data/types";
import { changeProjectAction } from "../../../../../store/main/actions";
import {
  getUnicuesArray,
  exportToCSV,
  importFromCSV,
  fixNumberToStr,
  checkImportedNumber,
  getNextId,
  roundM,
  checkRange,
} from "../../../../3d-models/utils";
import { addEventAction } from "../../../../../store/ui/actions";
import { flangeTypes } from "../../../../../store/main/constants";
import { Button } from "@blueprintjs/core";
import { Vector3 } from "three";
import { FlangeLoadsDlg } from "../FlangeLoadsDlg";
import { workingPressure } from "../../../../../store/data/constants";
import GenericTable, {
  THeader,
  TDataField,
  TField,
} from "../../../../common/table/GenericTable";

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
        { title: "Pipe. No", rowSpan: 2 },
        { title: "NPS", rowSpan: 2 },
        { title: "Schedule", rowSpan: 2 },
        { title: "Material", rowSpan: 2 },
        { title: "OD (mm)", rowSpan: 2 },
        { title: "Thickness (mm)", rowSpan: 2 },
        { title: "Start Flange", colSpan: 5 },
        { title: "End Flange", colSpan: 5 },
      ],
    },
    {
      columns: [
        { title: "Type" },
        { title: "Class" },
        { title: "Material" },
        { title: "Flange Check ANSI B16.5 -1988" },
        { title: "Max. allow. Nozzle Load" },
        { title: "Type" },
        { title: "Class" },
        { title: "Material" },
        { title: "Flange Check ANSI B16.5 -1988" },
        { title: "Max. allow. Nozzle Load" },
      ],
    },
  ],
};

export default React.memo(function PipeFlanges(props: Props) {
  const { project, resoures, setDialog } = props;

  const dispatch = useDispatch();

  const dataFields: TDataField[] = useMemo(() => {
    return props.pipes.map((p) => {
      const sFlanges = getFlanges(p.params.startFlangeType);
      const sfClasses = getUnicuesArray(
        sFlanges.map((f: TPipingFlange) => f.class)
      );
      const eFlanges = getFlanges(p.params.endFlangeType);
      const efClasses = getUnicuesArray(
        eFlanges.map((f: TPipingFlange) => f.class)
      );
      const maxT = Math.max(
        p.params.T1 ?? 0,
        p.params.T2 ?? 0,
        p.params.T3 ?? 0,
        p.params.T4 ?? 0,
        p.params.T5 ?? 0
      );
      const maxP = Math.max(p.params.P1 ?? 0, p.params.HP ?? 0);
      const sfCheck =
        p.params.startFlangeLoads &&
        p.params.startFlangeLoads.code !== "API 517"
          ? changeFlangeBy3FM(p.params.startFlangeLoads)
          : changeFlange(maxT, maxP, p.params.startFlangeClass);
      const efCheck =
        p.params.endFlangeLoads && p.params.endFlangeLoads.code !== "API 517"
          ? changeFlangeBy3FM(p.params.endFlangeLoads)
          : changeFlange(maxT, maxP, p.params.endFlangeClass);
      const fields: TField[] = [
        { type: "CELL", value: p.pipe },
        { type: "CELL", value: p.params.nps },
        { type: "CELL", value: p.params.profile?.schedule },
        { type: "CELL", value: p.params.material?.material_name },
        { type: "CELL", value: p.params.od },
        { type: "CELL", value: p.params.thickness },
        {
          type: "SELECTOR",
          props: {
            items: flangeTypes,
            itemLabel: (v) => v,
            validator: (v) => flangeTypes.includes(v),
            validationPrompt: "This Start Flange Type not found! Please update",
            selected: p.params.startFlangeType,
            onSelect: (v) => handleChangeRow(p, "startFlangeType", v),
            clearable: true,
          },
        },
        {
          type: "SELECTOR",
          props: {
            items: sfClasses,
            itemLabel: (v) => v,
            validator: (v) => sfClasses.includes(v),
            validationPrompt:
              "This Start Flange Class not found! Please update",
            selected: p.params.startFlangeClass,
            onSelect: (v) => handleChangeRow(p, "startFlangeClass", v),
            clearable: true,
          },
        },
        {
          type: "SELECTOR",
          props: {
            items: sFlanges.filter(
              (f) =>
                f.nps === p.params.nps && f.class === p.params.startFlangeClass
            ),
            itemLabel: (v) => `${v.nps} - ${v.material}`,
            selected: p.params.startFlange,
            onSelect: (v) => handleChangeRow(p, "startFlange", v),
            filter: (q, v) =>
              !q ||
              `${v.nps} - ${v.material}`
                .toLowerCase()
                .includes(q.toLowerCase()),
            clearable: true,
          },
        },
        {
          type: "VALIDATOR",
          props: {
            value: sfCheck,
            validator: (v) => v !== "FAILED",
            valueFormater: (v) => v,
          },
        },
        {
          type: "CELL",
          value: p.params.startFlange ? (
            <Button
              small
              minimal
              icon={"menu"}
              intent={"primary"}
              className={"c-light"}
              onClick={() => {
                setDialog(
                  <FlangeLoadsDlg
                    pipe={p}
                    isStart={true}
                    onSave={(changed) => {
                      if (project) {
                        handleChangeData({
                          ...project,
                          freePipes: props.pipes.map((item) =>
                            item.id === p.id ? changed : item
                          ),
                        });
                      }
                      setDialog(undefined);
                    }}
                    onClose={() => setDialog(undefined)}
                  />
                );
              }}
            />
          ) : null,
        },
        {
          type: "SELECTOR",
          props: {
            items: flangeTypes,
            itemLabel: (v) => v,
            validator: (v) => flangeTypes.includes(v),
            validationPrompt: "This End Flange Type not found! Please update",
            selected: p.params.endFlangeType,
            onSelect: (v) => handleChangeRow(p, "endFlangeType", v),
            clearable: true,
          },
        },
        {
          type: "SELECTOR",
          props: {
            items: efClasses,
            itemLabel: (v) => v,
            validator: (v) => efClasses.includes(v),
            validationPrompt: "This End Flange Class not found! Please update",
            selected: p.params.endFlangeClass,
            onSelect: (v) => handleChangeRow(p, "endFlangeClass", v),
            clearable: true,
          },
        },
        {
          type: "SELECTOR",
          props: {
            items: eFlanges.filter(
              (f) =>
                f.nps === p.params.nps && f.class === p.params.endFlangeClass
            ),
            itemLabel: (v) => `${v.nps} - ${v.material}`,
            selected: p.params.endFlange,
            onSelect: (v) => handleChangeRow(p, "endFlange", v),
            filter: (q, v) =>
              !q ||
              `${v.nps} - ${v.material}`
                .toLowerCase()
                .includes(q.toLowerCase()),
            clearable: true,
          },
        },
        {
          type: "VALIDATOR",
          props: {
            value: efCheck,
            validator: (v) => v !== "FAILED",
            valueFormater: (v) => v,
          },
        },
        {
          type: "CELL",
          value: p.params.endFlange ? (
            <Button
              small
              minimal
              icon={"menu"}
              intent={"primary"}
              className={"c-light"}
              onClick={() => {
                setDialog(
                  <FlangeLoadsDlg
                    pipe={p}
                    onSave={(changed) => {
                      if (project) {
                        handleChangeData({
                          ...project,
                          freePipes: props.pipes.map((item) =>
                            item.id === p.id ? changed : item
                          ),
                        });
                      }
                      setDialog(undefined);
                    }}
                    onClose={() => setDialog(undefined)}
                  />
                );
              }}
            />
          ) : null,
        },
      ];
      return { id: p.id, fields };
    });
  }, [props.pipes]);

  function handleChangeData(project: Project) {
    dispatch(changeProjectAction(project));
  }

  function handleChangeRow(row: FreePipe, field: string, value: any) {
    if (!project) return;
    let changed = { ...row, params: { ...row.params, [field]: value } };

    switch (field) {
      case "startFlangeType":
        changed = {
          ...changed,
          params: {
            ...changed.params,
            startFlangeClass: undefined,
            startFlange: undefined,
            startFlangeLoads: undefined,
            ...changeSupportDetails(
              changed,
              true,
              !!changed.params.startFlange
            ),
          },
        };
        break;
      case "startFlangeClass":
        changed = {
          ...changed,
          params: {
            ...changed.params,
            startFlange: undefined,
            startFlangeLoads: undefined,
            ...changeSupportDetails(
              changed,
              true,
              !!changed.params.startFlange
            ),
          },
        };
        break;
      case "startFlange":
        changed = {
          ...changed,
          params: {
            ...changed.params,
            ...getFlangeLoads(changed, true),
            ...changeSupportDetails(changed, true, !value),
          },
        };
        break;
      case "endFlangeType":
        changed = {
          ...changed,
          params: {
            ...changed.params,
            endFlangeClass: undefined,
            endFlange: undefined,
            endFlangeLoads: undefined,
            ...changeSupportDetails(changed, false, !!changed.params.endFlange),
          },
        };
        break;
      case "endFlangeClass":
        changed = {
          ...changed,
          params: {
            ...changed.params,
            endFlange: undefined,
            endFlangeLoads: undefined,
            ...changeSupportDetails(changed, false, !!changed.params.endFlange),
          },
        };
        break;
      case "endFlange":
        changed = {
          ...changed,
          params: {
            ...changed.params,
            ...getFlangeLoads(changed),
            ...changeSupportDetails(changed, false, !value),
          },
        };
        break;
    }

    handleChangeData({
      ...project,
      freePipes: props.pipes.map((item) =>
        item.id === row.id ? changed : item
      ),
    });
  }

  function getFlangeLoads(pipe: FreePipe, isStart?: boolean) {
    let fx = 0;
    let fy = 0;
    let fz = 0;
    let mx = 0;
    let my = 0;
    let mz = 0;
    const dn = pipe.params.od ?? 0;
    if (dn > 40 && dn <= 125) {
      fx = -0.0595 * Math.pow(dn, 2) + 17.82 * dn - 297.33;
    } else if (dn > 125) {
      fx = (-0.0000000000002 * dn) ^ (2 + 4.45 * dn + 445);
    }
    if (dn > 40 && dn <= 150) {
      fy = fz =
        -0.000008 * Math.pow(dn, 4) +
        0.0045 * Math.pow(dn, 3) -
        0.9446 * Math.pow(dn, 2) +
        95.824 * dn -
        2049.7;
      mx = -0.0149 * Math.pow(dn, 2) + 8.2333 * dn + 109.3;
      my = mz = 383.51 * Math.log(dn) - 1163.5;
    } else if (dn > 150) {
      fy = fz = 4.4505 * dn + 1779.5;
      mx = 1.8991 * dn + 786.43;
      my = mz = 1.3565 * dn + 610.18;
    }

    const loads: TFlangeLoads = {
      code: "API 517",
      fx: roundM(fx),
      fy: roundM(fy),
      fz: roundM(fz),
      mx: roundM(mx),
      my: roundM(my),
      mz: roundM(mz),
    };

    return { [isStart ? "startFlangeLoads" : "endFlangeLoads"]: loads };
  }

  function changeSupportDetails(
    pipe: FreePipe,
    isStart?: boolean,
    isDeliting?: boolean
  ) {
    let supportDetails = pipe.params.supportDetails ?? [];
    if (isStart) {
      if (isDeliting) {
        supportDetails = supportDetails.filter((sd) => sd.distance !== 0);
      } else if (!supportDetails.some((sd) => sd.distance === 0)) {
        supportDetails.push({
          id: getNextId(supportDetails),
          type: "Anchor",
          distance: 0,
          valueType: "K",
          Mu: 0,
        });
      }
    } else {
      const s = new Vector3(pipe.x1, pipe.y1, pipe.z1);
      const e = new Vector3(pipe.x2, pipe.y2, pipe.z2);
      const distance = roundM(s.distanceTo(e));
      if (isDeliting) {
        supportDetails = supportDetails.filter(
          (sd) => sd.distance !== distance
        );
      } else if (!supportDetails.some((sd) => sd.distance === distance)) {
        supportDetails.push({
          id: getNextId(supportDetails),
          type: "Anchor",
          distance,
          valueType: "K",
          Mu: 0,
        });
      }
    }
    return {
      supportDetails,
      numberOfSupports: supportDetails.length,
    };
  }

  function getFlanges(type?: TFlangeType): TPipingFlange[] {
    switch (type) {
      case "Blind":
        return resoures.pipingFlangesBlind;
      case "Lapped":
        return resoures.pipingFlangesLapped;
      // case "Ring Joint Facing":
      // return resoures.pipingFlangesRingJointFacing;
      case "Slip On":
        return resoures.pipingFlangesSlipon.filter((f) => f.class !== 2500);
      case "Socket Welding":
        return resoures.pipingFlangesSocketWelding;
      case "Threaded":
        return resoures.pipingFlangesThreaded;
      case "Welding Neck":
        return resoures.pipingFlangesWeldingneck;
      default:
        return [];
    }
  }

  function changeFlangeBy3FM(l: TFlangeLoads) {
    const F = Math.sqrt(l.fx ^ (2 + l.fy) ^ (2 + l.fz) ^ 2);
    const F3_lb = F * 3 * 0.2248089431;

    const M = Math.sqrt(l.mx ^ (2 + l.my) ^ (2 + l.mz) ^ 2);
    const M_ft_lb = M * 0.0007376;

    return F3_lb + M_ft_lb < (l["3F+M"] ?? 0) ? "PASS" : "FAILED";
  }

  function changeFlange(T: number, P: number, flangeClass?: number) {
    if (!flangeClass) return "";
    const ts = Object.keys(workingPressure)
      .map((el) => Number(el))
      .sort((a, b) => a - b);
    if (!checkRange(T, ts[0], ts[ts.length - 1], true, true)) return "";
    let checkedT;
    for (const t of ts) {
      if (t >= T) {
        checkedT = t;
        break;
      }
    }
    if (!checkedT) return "";
    // @ts-ignore
    const classes = workingPressure[checkedT];
    if (!classes) return "";
    const p = classes[flangeClass];
    return p > P ? "PASS" : "FAILED";
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
          "Start Flange Type": row.params.startFlangeType ?? "",
          "Start Flange Class": row.params.startFlangeClass ?? "",
          "Start Flange Material": row.params.startFlange
            ? `${row.params.startFlange.nps} - ${row.params.startFlange.material}`
            : "",
          "Start Flange Load Code": row.params.startFlangeLoads?.code ?? "",
          "Start Flange Loads": row.params.startFlangeLoads
            ? `${row.params.startFlangeLoads.fx}_${row.params.startFlangeLoads.fy}_${row.params.startFlangeLoads.fz}_${row.params.startFlangeLoads.mx}_${row.params.startFlangeLoads.my}_${row.params.startFlangeLoads.mz}`
            : "",
          "End Flange Type": row.params.endFlangeType ?? "",
          "End Flange Class": row.params.endFlangeClass ?? "",
          "End Flange Material": row.params.endFlange
            ? `${row.params.endFlange.nps} - ${row.params.endFlange.material}`
            : "",
          "End Flange Load Code": row.params.endFlangeLoads?.code ?? "",
          "End Flange Loads": row.params.endFlangeLoads
            ? `${row.params.endFlangeLoads.fx}_${row.params.endFlangeLoads.fy}_${row.params.endFlangeLoads.fz}_${row.params.endFlangeLoads.mx}_${row.params.endFlangeLoads.my}_${row.params.endFlangeLoads.mz}`
            : "",
        };
      }),
      "Pipe Flanges"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Pipe Flanges (Import): ${msg}`, "danger"));
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
          const sft = item["Start Flange Type"];
          const sfc = checkImportedNumber(item["Start Flange Class"]);
          const sfm = `${item["Start Flange Material"]}`.split(" - ");
          const sfl = `${item["Start Flange Loads"]}`.split("_");
          const eft = item["End Flange Type"];
          const efc = checkImportedNumber(item["End Flange Class"]);
          const efm = `${item["End Flange Material"]}`.split(" - ");
          const efl = `${item["End Flange Loads"]}`.split("_");
          changedPipe = {
            ...changedPipe,
            params: {
              ...changedPipe.params,
              startFlangeType: sft,
              startFlangeClass: sfc,
              startFlange: getFlanges(sft)
                .filter(
                  (f) => f.nps === changedPipe!.params.nps && f.class === sfc
                )
                .find((val) => val.material === sfm[1]),
              startFlangeLoads: {
                code: "API 517",
                fx: Number(sfl[0]) || 0,
                fy: Number(sfl[1]) || 0,
                fz: Number(sfl[2]) || 0,
                mx: Number(sfl[3]) || 0,
                my: Number(sfl[4]) || 0,
                mz: Number(sfl[5]) || 0,
              },
              endFlangeType: eft,
              endFlangeClass: efc,
              endFlange: getFlanges(eft)
                .filter(
                  (f) => f.nps === changedPipe!.params.nps && f.class === efc
                )
                .find((val) => val.material === efm[1]),
              endFlangeLoads: {
                code: "API 517",
                fx: Number(sfl[0]) || 0,
                fy: Number(sfl[1]) || 0,
                fz: Number(sfl[2]) || 0,
                mx: Number(sfl[3]) || 0,
                my: Number(sfl[4]) || 0,
                mz: Number(sfl[5]) || 0,
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
