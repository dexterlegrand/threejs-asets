import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import { Project, FreePipe } from "../../../../../store/main/types";
import { changeProjectAction } from "../../../../../store/main/actions";
import {
  exportToCSV,
  importFromCSV,
  fixNumberToStr,
  roundM,
} from "../../../../3d-models/utils";
import { addEventAction } from "../../../../../store/ui/actions";
import {
  valveTypes,
  valveActuators,
  valveControls,
} from "../../../../../store/main/constants";
import GenericTable, {
  THeader,
  TDataField,
  TField,
} from "../../../../common/table/GenericTable";

type Props = {
  project: Project | undefined;
  pipes: FreePipe[];
};

const header: THeader = {
  rows: [
    {
      columns: [
        { title: "Pipe. No." },
        { title: "NPS" },
        { title: "Schedule" },
        { title: "Material" },
        { title: "OD (mm)" },
        { title: "Thickness (mm)" },
        { title: "Valve Type" },
        { title: "Valve Actuator Type" },
        { title: "Valve Control Type" },
        { title: "Valve Position" },
        { title: "Valve Mass (Kg)"},
        { title: "Valve Length (m)" },
      ],
    },
  ],
};

export default React.memo(function PipeValves(props: Props) {
  const { project } = props;

  const dispatch = useDispatch();

  const dataFields: TDataField[] = useMemo(() => {
    return props.pipes.map((p) => {
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
            items: valveTypes,
            itemLabel: (v) => v,
            validator: (v) => valveTypes.includes(v),
            validationPrompt: "This Valve Type not found! Please update",
            selected: p.params.valveType,
            onSelect: (v) => handleChangeRow(p, "valveType", v),
            clearable: true,
          },
        },
        {
          type: "SELECTOR",
          props: {
            items: valveActuators,
            itemLabel: (v) => v,
            validator: (v) => valveActuators.includes(v),
            validationPrompt:
              "This Valve Actuator Type not found! Please update",
            selected: p.params.valveActuator,
            onSelect: (v) => handleChangeRow(p, "valveActuator", v),
            clearable: true,
          },
        },
        {
          type: "SELECTOR",
          props: {
            items: valveControls,
            itemLabel: (v) => v,
            validator: (v) => valveControls.includes(v),
            validationPrompt:
              "This Valve Control Type not found! Please update",
            selected: p.params.valveControl,
            onSelect: (v) => handleChangeRow(p, "valveControl", v),
            clearable: true,
          },
        },
        {
          type: "SELECTOR",
          props: {
            items: ["START", "END"],
            itemLabel: (v) => v,
            validator: (v) =>
              typeof v === "number" || ["START", "END"].includes(v),
            validationPrompt: "This Valve Position not found! Please update",
            selected: p.params.valvePosition,
            onSelect: (v) => handleChangeRow(p, "valvePosition", v),
            onCreate: (v) => roundM(Number(v) || 0),
            filter: (q, v) => !q || `${v}`.includes(q),
            clearable: true,
          },
        },
        {
          type: "NUMERIC",
          props: {
            min: 0,
            value: p.params.valveMass,
            isDecimal: true,
            /*disabled:
              project?.nominal_pipe_size_inch === p.params.nps,*/
            onChange: (v: any) => handleChangeRow(p, "valveMass", v),
          }
        },
        {
          type: "NUMERIC",
          props: {
            min: 0,
            value: p.params.valveLength,
            isDecimal: true,
            /*disabled:
              project?.nominal_pipe_size_inch === p.params.nps,*/
            onChange: (v: any) => handleChangeRow(p, "valveLength", v),
          }
        }
      ];
      return { id: p.id, fields };
    });
  }, [props.pipes]);

  function handleChangeData(project: Project) {
    dispatch(changeProjectAction(project));
  }

  function handleChangeRow(row: FreePipe, field: string, value: any) {
    if (!project) return;
    const changed = { ...row, params: { ...row.params, [field]: value } };
    handleChangeData({
      ...project,
      freePipes: props.pipes.map((item) =>
        item.id === row.id ? changed : item
      ),
    });
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
          "Valve Type": row.params.valveType ?? "",
          "Valve Actuator Type": row.params.valveActuator ?? "",
          "Valve Control Type": row.params.valveControl ?? "",
          "Valve Position":
            typeof row.params.valvePosition === "number"
              ? fixNumberToStr(row.params.valvePosition)
              : row.params.valvePosition ?? "",
        };
      }),
      "Pipe Valves"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Pipe Valves (Import): ${msg}`, "danger"));
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
          const valveType = item["Valve Type"];
          const valveActuator = item["Valve Actuator Type"];
          const valveControl = item["Valve Control Type"];
          const valvePosition = item["Valve Position"];
          changedPipe = {
            ...changedPipe,
            params: {
              ...changedPipe.params,
              valveType,
              valveActuator,
              valveControl,
              valvePosition,
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
