import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import {
  getNextId,
  getUnicuesArray,
  strFilter,
  degToRad,
  getIndexName,
} from "../../../../3d-models/utils";
import { TPipingElbow, DataState } from "../../../../../store/data/types";
import { changeUserDefinedElbows } from "../../../../../store/main/actions";
import GenericTable, {
  THeader,
  TDataField,
  TField,
} from "../../../../common/table/GenericTable";
import { Button } from "@blueprintjs/core";
import { importFromCSV } from "../../../../3d-models/utils";

type RowData = {
  name: string;
  selected: boolean;
  created: boolean;
  isUser: boolean;
} & TPipingElbow;

type Props = {
  resoures: DataState;
};

const header: THeader = {
  rows: [
    {
      columns: [
        { title: "Name" },
        { title: "NPS" },
        { title: "Schedule" },
        { title: "Material" },
        { title: "OD (mm)" },
        { title: "Thickness (mm)" },
        { title: "Angle (deg)" },
        { title: "Length (mm)" },
      ],
    },
  ],
};

export default React.memo(function UserDefinedElbows(props: Props) {
  const [rows, setRows] = useState<RowData[]>([]);

  const UDEs = useSelector(
    (state: ApplicationState) => state.main.userDefinedElbows
  );

  const dispatch = useDispatch();

  const materials = useMemo(() => {
    return props.resoures.materials
      .filter((m) => m.material_type === "PIPING")
      .map((m) => m.material_name);
  }, [props.resoures]);

  const dataFields: TDataField[] = useMemo(() => {
    return rows.map((r) => {
      const NPSs = getUnicuesArray(
        props.resoures.pipingSS.map((profile) => profile.nominal_pipe_size_inch)
      );
      const profiles = props.resoures.pipingSS.filter(
        (profile) => profile.nominal_pipe_size_inch === r.nps
      );
      const fields: TField[] = [
        {
          type: "INPUT",
          props: {
            value: r.name,
            disabled: r.created,
            onChange: (v: any) => handleChangeRow(r, "name", v),
          },
        },
        {
          type: "SELECTOR",
          props: {
            items: NPSs,
            itemLabel: (v) => v,
            validator: (v) => NPSs.includes(v),
            validationPrompt: "This NPS not found! Please update",
            selected: r.nps,
            disabled: r.created,
            onSelect: (v) => handleChangeRow(r, "nps", v),
            filter: strFilter,
            clearable: true,
          },
        },
        {
          type: "SELECTOR",
          props: {
            items: getUnicuesArray(profiles.map((p) => p.schedule)),
            itemLabel: (v) => v,
            selected: r.schedule,
            disabled: r.created,
            onSelect: (v) => handleChangeRow(r, "schedule", v),
            filter: strFilter,
            clearable: true,
          },
        },
        {
          type: "SELECTOR",
          props: {
            items: materials,
            itemLabel: (v) => v,
            selected: r.material,
            disabled: r.created,
            onSelect: (v) => handleChangeRow(r, "material", v),
            filter: strFilter,
            clearable: true,
          },
        },
        {
          type: "NUMERIC",
          props: {
            min: 0,
            value: r.d,
            isDecimal: true,
            disabled:
              profiles.some(
                (p) =>
                  p.nominal_pipe_size_inch === r.nps &&
                  p.schedule === r.schedule
              ) || r.created,
            onChange: (v: any) => handleChangeRow(r, "d", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            min: 0,
            value: r.t,
            isDecimal: true,
            disabled: r.created,
            onChange: (v: any) => handleChangeRow(r, "t", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            min: 0,
            max: 180,
            value: r.degree,
            disabled: r.created,
            onChange: (v: any) => handleChangeRow(r, "degree", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            min: 0,
            value: r.a,
            isDecimal: true,
            disabled: r.created,
            onChange: (v: any) => handleChangeRow(r, "a", v),
          },
        },
      ];
      return { id: r.id, fields };
    });
  }, [rows]);

  useEffect(() => {
    const newRows: RowData[] = [];
    for (const UDE of UDEs) {
      newRows.push({
        ...UDE,
        selected: false,
        created: true,
        isUser: true,
      } as any);
    }
    setRows(newRows);
  }, []);

  function handleAddToLib() {
    dispatch(changeUserDefinedElbows(rows.filter((row) => validRow(row))));
    setRows((prev) =>
      prev.map((p) => (validRow(p) ? { ...p, created: true } : p))
    );
  }

  function validRow(row: RowData) {
    return row.d && row.t && row.a && row.degree;
  }

  function handleAdd() {
    const id = getNextId(rows);
    const newRow: any = {
      id,
      name: `UDE${getIndexName(rows, "UDE")}`,
      created: false,
      selected: false,
      a: 0,
      o: 0,
      d: 0,
      t: 0,
      nps: "",
      schedule: "",
      material: "",
      degree: 45,
      piping_elbows_id: id,
      shape: "",
      weight: 0,
      isUser: true,
    };
    setRows((prev) => [...prev, newRow]);
  }

  function handleDelete(elements: TDataField[]) {
    setRows(rows.filter((row) => !elements.some((e) => e.id === row.id)));
  }

  function handleExport() {
    const csvHeader = "Name,NPS,Schedule,Material,OD (mm),Thickness (mm),Angle (deg),Length (mm)\r\n";
    const csvRows = rows.map(row => 
      `${row.name},${row.nps},${row.schedule},${row.material},${row.d},${row.t},${row.degree},${row.a}`
    ).join("\r\n");
    const csvString = `${csvHeader}${csvRows}`;
    const dataBlob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(dataBlob);
    downloadLink.setAttribute("download", "userDefinedElbows.csv");
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }
  /*function handleImport() {
    importFromCSV((importedData, isCSV) => {
      if (isCSV) {
        const newRows = importedData.map((item:any) => ({
          ...item,
          selected: false,
          created: true,
          isUser: true,
        }));
        setRows(newRows);
      } else {
        const newRows = importedData.map((item:any) => ({
          ...item,
          selected: false,
          created: true,
          isUser: true,
        }));
        setRows(newRows);
      }
    });
  }*/

  function handleImport() {
    importFromCSV((importedData, isCSV) => {
      if (isCSV) {
        importedData.forEach(item => {
          const matchingRow = rows.find(row => row.id === item.id);
          if (matchingRow) {
            handleChangeRow(matchingRow, 'name', item.name);
            handleChangeRow(matchingRow, 'nps', item.nps);
          }
        });
      }
    });
  }
  
  
  

  function handleChangeRow(row: RowData, field: string, value: any) {
    let changed = { ...row, [field]: value };
    if (field === "name") {
      changed = {
        ...changed,
        name: rows.some((r) => r.name === value) ? value + "1" : value,
      };
    } else if (field === "a") {
      changed = { ...changed, o: value * 2 };
    } else if (field === "nps") {
      changed = { ...changed, schedule: "" };
    } else if (field === "schedule") {
      const profile = props.resoures.pipingSS.find(
        (p) =>
          p.nominal_pipe_size_inch === changed.nps &&
          p.schedule === changed.schedule
      );
      changed = {
        ...changed,
        d: profile?.outside_diameter_global ?? 0,
        t: profile?.wall_thickness_global ?? 0,
      };
      changed = { ...changed, a: getMinA(changed) };
    } else if (field === "d" || field === "degree") {
      changed = { ...changed, a: getMinA(changed) };
    }
    setRows(rows.map((item) => (item.id === row.id ? changed : item)));
  }

  function getMinA(row: RowData) {
    if (row.degree <= 90) {
      return row.d;
    } else if (row.degree < 180) {
      const il = row.d / 2 / Math.sin(degToRad(180 - row.degree) / 2);
      const A0 = il * Math.cos(degToRad(180 - row.degree) / 2);
      return A0;
    } else return 0;
  }

  return (
    <GenericTable
      header={header}
      dataFields={dataFields}
      onAdd={handleAdd}
      onDelete={handleDelete}
      onExport={handleExport}
      onImport={handleImport}
      titleElement={
        <Button
          small
          text="Add list To Library"
          intent="primary"
          onClick={handleAddToLib}
        />
      }
    />
  );
});
