import React, { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import {
  Project,
  TSupportDetail,
  FreePipe,
} from "../../../../../store/main/types";
import { DataState, PipeProfile } from "../../../../../store/data/types";
import { Button } from "@blueprintjs/core";
import {
  checkImportedNumber,
  importFromCSV,
  fixNumberToStr,
  exportToCSV,
  getUnicuesArray,
  roundM,
  arrayToString,
  stringToArray,
} from "../../../../3d-models/utils";
import { addEventAction } from "../../../../../store/ui/actions";
import { TemperatureDlg } from "../TemperatureDlg";
import {
  changeProjectAction,
  setPipesAction,
} from "../../../../../store/main/actions";
import { Vector3 } from "three";
import { SupportDetailsDlg } from "../SupportDetailsDlg";
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
        { title: "Pipe No.", rowSpan: 2 },
        { title: "C/S Lib.", rowSpan: 2 },
        { title: "NPS", rowSpan: 2 },
        { title: "Schedule", rowSpan: 2 },
        { title: "Standard", rowSpan: 3 },
        { title: "Material", rowSpan: 2 },
        { title: "OD (mm)", rowSpan: 2 },
        { title: "Thickness (mm)", rowSpan: 2 },
        { title: "Corrosion Allowance (mm)", rowSpan: 2 },
        { title: "Mill Tolerance (%)", rowSpan: 2 },
        { title: "Long. Weld type", rowSpan: 2 },
        { title: "Restraints", colSpan: 2 },
        { title: "Design Parameters", colSpan: 2 },
      ],
    },
    {
      columns: [
        { title: "Nos" },
        { title: "Details" },
        { title: "Fluid Density, kg/m^3" },
        { title: "T&P" },
      ],
    },
  ],
};

export default React.memo(function PipeData(props: Props) {
  const { project, resoures, setDialog } = props;

  const dispatch = useDispatch();

  const libs = useMemo(() => {
    return getUnicuesArray(
      resoures.pipingSS.map((profile) => profile.country_code?.trim() ?? "")
    );
  }, [resoures]);

  const handleChangeRow = useCallback(
    (pipes: FreePipe[], row: FreePipe, field: string, value: any) => {
      const changed = { ...row, params: { ...row.params, [field]: value } };
      dispatch(
        setPipesAction(
          pipes.map((item) => (item.id === row.id ? changed : item))
        )
      );
    },
    [dispatch]
  );

  const handleChangeSupportDetails = useCallback(
    (pipes: FreePipe[], row: FreePipe, supportDetails: TSupportDetail[]) => {
      if (!project) return;
      const changed: FreePipe = {
        ...row,
        params: {
          ...row.params,
          numberOfSupports: supportDetails.length,
          supportDetails,
        },
      };
      dispatch(
        setPipesAction(
          pipes.map((item) => (item.id === row.id ? changed : item))
        )
      );
    },
    [dispatch]
  );

  const handleChangeTP = useCallback(
    (pipes: FreePipe[], row: FreePipe) => {
      let freePipes = pipes.map((item) => (item.id === row.id ? row : item));
      let next = freePipes.find((fp) => fp.preceding === row.pipe);
      while (next !== undefined) {
        // @ts-ignore
        freePipes = freePipes.map((item) =>
          item.id === next!.id
            ? {
                ...next,
                params: {
                  ...next!.params,
                  T1: row.params.T1,
                  T2: row.params.T2,
                  T3: row.params.T3,
                  T4: row.params.T4,
                  T5: row.params.T5,
                  P1: row.params.P1,
                  HP: row.params.HP,
                },
              }
            : item
        );
        next = freePipes.find((fp) => fp.preceding === next!.pipe);
      }
      dispatch(setPipesAction(freePipes));
    },
    [dispatch]
  );

  const handleChangeProfile = useCallback(
    (pipes: FreePipe[], row: FreePipe, profile?: PipeProfile) => {
      const changed = {
        ...row,
        params: {
          ...row.params,
          profile,
          od: profile?.outside_diameter_global ?? 0,
          thickness: profile?.wall_thickness_global ?? 0,
        },
      };
      dispatch(
        setPipesAction(
          pipes.map((item) => (item.id === row.id ? changed : item))
        )
      );
    },
    [dispatch]
  );

  const handleChangeParamsRow = useCallback(
    (pipes: FreePipe[], row: FreePipe, field: string, value: any) => {
      let changed = {
        ...row,
        params: { ...row.params, [field]: value },
      };
      if (field === "nps") {
        changed = {
          ...changed,
          params: {
            ...changed.params,
            profile: undefined,
            endConnector: undefined,
            endConnectorDetails: undefined,
            startFlange: undefined,
            endFlange: undefined,
          },
        };
      }
      dispatch(
        setPipesAction(
          pipes.map((item) => (item.id === row.id ? changed : item))
        )
      );
    },
    [dispatch]
  );

  const dataFields: TDataField[] = useMemo(() => {
    const dataFields: TDataField[] = props.pipes.map((r) => {
      const isSelectedProfile = !!r.params.profile;
      const filteredProfiles = resoures.pipingSS.filter(
        (profile) =>
          profile.country_code === r.params.lib &&
          profile.outside_diameter_global &&
          profile.wall_thickness_global
      );
      const NPSs = getUnicuesArray(
        filteredProfiles.map((profile) => profile.nominal_pipe_size_inch)
      );
      const profiles = filteredProfiles.filter(
        (profile) => profile.nominal_pipe_size_inch === r.params.nps
      );
      const fields: TField[] = [
        { type: "CELL", value: r.pipe },
        {
          type: "SELECTOR",
          props: {
            items: libs,
            itemLabel: (v) => v,
            selected: r.params.lib,
            validator: (v) => libs.includes(v),
            validationPrompt: `This C/S Library not found! Please update`,
            onSelect: (v) => handleChangeParamsRow(props.pipes, r, "lib", v),
          },
        },
        {
          type: "SELECTOR",
          props: {
            items: NPSs,
            itemLabel: (v) => v,
            selected: r.params.nps,
            validator: (v) => NPSs.includes(v),
            validationPrompt: `This NPS not found! Please update`,
            onSelect: (v) => handleChangeParamsRow(props.pipes, r, "nps", v),
            filter: (q, v) => !q || v.toLowerCase().includes(q.toLowerCase()),
            clearable: true,
          },
        },
        {
          type: "SELECTOR",
          props: {
            items: profiles,
            itemLabel: (v) => v.schedule,
            selected: r.params.profile,
            onSelect: (v) => handleChangeProfile(props.pipes, r, v),
            filter: (q, v) =>
              !q || v.schedule.toLowerCase().includes(q.toLowerCase()),
            clearable: true,
          },
        },
        { type: "CELL", value: r.params.profile?.material },
        {
          type: "SELECTOR",
          props: {
            items: resoures.materials.filter(
              (m) => m.material_type === "PIPING"
            ),
            itemLabel: (v) => v.material_name,
            selected: r.params.material,
            onSelect: (v) => handleChangeParamsRow(props.pipes, r, "material", v),
            filter: (q, v) =>
              !q || v.material_name.toLowerCase().includes(q.toLowerCase()),
          },
        },
        {
          type: "NUMERIC",
          props: {
            min: 0,
            isDecimal: true,
            value: r.params.od,
            disabled: isSelectedProfile,
            onChange: (v: any) => handleChangeParamsRow(props.pipes, r, "od", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            min: 0,
            isDecimal: true,
            value: r.params.thickness,
            disabled: isSelectedProfile,
            onChange: (v: any) => handleChangeParamsRow(props.pipes, r, "thickness", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            min: 0,
            isDecimal: true,
            value: r.params.corrosionAllowance,
            onChange: (v: any) =>
              handleChangeParamsRow(props.pipes, r, "corrosionAllowance", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            isDecimal: true,
            value: r.params.millTolerance,
            onChange: (v: any) => handleChangeParamsRow(props.pipes, r, "millTolerance", v),
          },
        },
        {
          type: "SELECTOR",
          props: {
            items: ["S", "EFW", "ERW", "FBW"],
            itemLabel: (v) => v,
            selected: r.params.longWeldType,
            validator: (v) => ["S", "EFW", "ERW", "FBW"].includes(v),
            validationPrompt: `This Type not found! Please update`,
            onSelect: (v) => handleChangeParamsRow(props.pipes, r, "longWeldType", v),
          },
        },
        { type: "CELL", value: r.params.numberOfSupports },
        {
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
                  <SupportDetailsDlg
                    pipe={r}
                    pipes={props.pipes}
                    onClose={() => setDialog(undefined)}
                    onSave={(news) => {
                      handleChangeSupportDetails(props.pipes, r, news);
                      setDialog(undefined);
                    }}
                  />
                );
              }}
            />
          ),
        },
        {
          type: "NUMERIC",
          props: {
            isDecimal: true,
            value: r.params.fluidDensity,
            onChange: (v: any) =>
              handleChangeRow(props.pipes, r, "fluidDensity", v),
          },
        },
        {
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
                  <TemperatureDlg
                    pipe={r}
                    onClose={() => setDialog(undefined)}
                    onSave={(changed) => {
                      handleChangeTP(props.pipes, changed);
                      setDialog(undefined);
                    }}
                  />
                );
              }}
            />
          ),
        },
      ];
      return { id: r.id, fields };
    });
    return dataFields;
  }, [
    props.pipes,
    libs,
    resoures.pipingSS,
    resoures.materials,
    handleChangeRow,
    handleChangeSupportDetails,
    handleChangeTP,
    handleChangeProfile,
    handleChangeParamsRow,
  ]);

  const handleExport = useCallback(() => {
    exportToCSV(
      props.pipes.map((row) => {
        return {
          id: row.id,
          "Pipe. No.": row.pipe,
          "C/S Lib.": row.params.lib ?? "",
          NPS: row.params.nps ?? "",
          Schedule: row.params.profile?.schedule ?? "",
          Material: row.params.material?.material_name ?? "",
          "OD (mm)": fixNumberToStr(row.params.od),
          "Thickness (mm)": fixNumberToStr(row.params.thickness),
          "Corrosion Allowance (mm)": fixNumberToStr(
            row.params.corrosionAllowance
          ),
          "Mill Tolerance (%)": fixNumberToStr(row.params.millTolerance),
          "Long. Weld type": row.params.longWeldType,
          "Number of Restraints": row.params.numberOfSupports ?? 0,
          "Restraints Details": arrayToString(
            row.params.supportDetails?.map(
              (sd) =>
                `${sd.type}_${sd.direction}_${sd.distance}_${
                  sd.valueType
                }_${sd.x ?? ""}_${sd.y ?? ""}_${sd.z ?? ""}_${sd.Rx ??
                  ""}_${sd.Ry ?? ""}_${sd.Rz ?? ""}_${sd.Mu ??
                  ""}_${sd.masterNodeDist ?? ""}_${sd.masterNodePipe ?? ""}`
            ) ?? []
          ),
          "Fluid Density": fixNumberToStr(row.params.fluidDensity),
          T1: fixNumberToStr(row.params.T1),
          T2: fixNumberToStr(row.params.T2),
          T3: fixNumberToStr(row.params.T3),
          T4: fixNumberToStr(row.params.T4),
          T5: fixNumberToStr(row.params.T5),
          P1: fixNumberToStr(row.params.P1),
          HP: fixNumberToStr(row.params.HP),
        };
      }),
      "Pipe Data"
    );
  }, [props.pipes]);

  const showErrorMsg = useCallback(
    (msg: string) => {
      dispatch(addEventAction(`Pipe Data (Import): ${msg}`, "danger"));
    },
    [dispatch]
  );

  const handleImport = useCallback(() => {
    importFromCSV((imported, isCSV) => {
      if (!isCSV || !Array.isArray(imported)) return;
      let changedPipes = [...props.pipes];
      imported.forEach((item: any) => {
        const pipeNo = item["Pipe. No."];
        let changedPipe = changedPipes.find((cp) => cp.pipe === pipeNo);
        if (changedPipe) {
          const fluidDensity = item["Fluid Density"];
          const restraints =
            checkImportedNumber(item["Number of Restraints"], false) ?? 0;
          const details = stringToArray(item["Restraints Details"]).filter(
            (val) => val
          );
          const lib = `${item["C/S Lib."]}`.trim();
          const nps = `${item.NPS}`.trim();
          const schedule = `${item.Schedule}`.trim();
          const material = item.Material;
          const lwt = `${item["Long. Weld type"]}`.trim();
          changedPipe = {
            ...changedPipe,
            params: {
              ...changedPipe.params,
              lib,
              nps,
              od: checkImportedNumber(item["OD (mm)"], false),
              thickness: checkImportedNumber(item["Thickness (mm)"], false),
              material: resoures.materials.find(
                (m) => m.material_name === material
              ),
              longWeldType: lwt as any,
            },
          };
          if (schedule) {
            const profile = resoures.pipingSS.find(
              (p) =>
                p.country_code.trim() === lib &&
                p.nominal_pipe_size_inch === nps &&
                p.schedule === schedule
            );
            if (profile) {
              changedPipe = {
                ...changedPipe,
                params: {
                  ...changedPipe.params,
                  profile,
                  od: profile.outside_diameter_global,
                  thickness: profile.wall_thickness_global,
                },
              };
            }
          }
          const supportDetails = !details.length
            ? handleCreateSupportDetails(
                new Vector3(changedPipe.x1, changedPipe.y1, changedPipe.z1),
                new Vector3(changedPipe.x2, changedPipe.y2, changedPipe.z2),
                restraints
              )
            : details.map((d, i) => {
                const arr = `${d}`.split("_");
                const type = `${arr[0]}`.trim() as any;
                const direction = `${arr[1]}`.trim() as any;
                const valueType = `${arr[3]}`.trim() as any;
                const supp: TSupportDetail = {
                  id: i + 1,
                  type,
                  direction,
                  distance: checkImportedNumber(arr[2], false) ?? 0,
                  valueType,
                  x: getRelease(type, arr[4], "X"),
                  y: getRelease(type, arr[5], "Y"),
                  z: getRelease(type, arr[6], "Z"),
                  Rx: getRelease(type, arr[7]),
                  Ry: getRelease(type, arr[8]),
                  Rz: getRelease(type, arr[9]),
                  Mu: checkImportedNumber(arr[10]) ?? 0,
                  masterNodeDist: checkImportedNumber(arr[11]) ?? 0,
                  masterNodePipe: `${arr[12]}`.trim() as any,
                };
                return supp;
              });
          changedPipe = {
            ...changedPipe,
            params: {
              ...changedPipe.params,
              numberOfSupports: details.length || restraints,
              supportDetails,
              corrosionAllowance:
                checkImportedNumber(item["Corrosion Allowance (mm)"], false) ??
                0,
              millTolerance:
                checkImportedNumber(item["Mill Tolerance (%)"]) ?? 0,
              fluidDensity: checkImportedNumber(fluidDensity),
              T1: checkImportedNumber(item.T1),
              T2: checkImportedNumber(item.T2),
              T3: checkImportedNumber(item.T3),
              T4: checkImportedNumber(item.T4),
              T5: checkImportedNumber(item.T5),
              P1: checkImportedNumber(item.P1),
              HP: checkImportedNumber(item.HP),
            },
          };
          changedPipes = changedPipes.map((cp) =>
            cp.pipe === changedPipe?.pipe ? changedPipe : cp
          );
        } else if (item.id !== undefined && item.id !== null) {
          showErrorMsg(`(id: ${item.id}) - a pipe (${pipeNo}) not found!`);
        }
      });
      dispatch(setPipesAction(changedPipes));
    });
  }, [dispatch, props.pipes, resoures, showErrorMsg]);

  return (
    <GenericTable
      header={header}
      dataFields={dataFields}
      onExport={handleExport}
      onImport={handleImport}
    />
  );
});

function handleCreateSupportDetails(
  start: Vector3,
  end: Vector3,
  count: number
) {
  let supportDetails: TSupportDetail[] = [];
  const length = start.distanceTo(end);
  const distance = length / (count + 1);
  for (let i = 1; i <= count; i++) {
    supportDetails = [
      ...supportDetails,
      {
        id: i,
        type: "Anchor",
        distance: roundM(distance * i),
        valueType: "K",
        Mu: 0,
      },
    ];
  }
  return supportDetails;
}

function getRelease(type: string, value: any, dir?: "X" | "Y" | "Z") {
  if (type.includes("Custom")) {
    return value
      ? value === "Released"
        ? "Released"
        : `${Number(value) || 0}`
      : undefined;
  } else if (type === "Sliding X" && dir === "X") {
    return "Released";
  } else if (type === "Sliding Y" && dir === "Y") {
    return "Released";
  } else if (type === "Sliding Z" && dir === "Z") {
    return "Released";
  }
  return undefined;
}
