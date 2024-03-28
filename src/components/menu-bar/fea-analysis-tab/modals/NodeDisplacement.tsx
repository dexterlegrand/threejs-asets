import { Button } from "@blueprintjs/core";
import React, { useMemo, useState, useEffect } from "react";
import { NodeDisplacementUI } from "../../../../store/ui/types";
import { CustomDlg } from "../../../common/CustomDlg";
import GenericTable, {
  TDataField,
  TField,
  THeader,
} from "../../../common/table/GenericTable";

export type TRow = NodeDisplacementUI & { id: number };

type Props = {
  data: TRow[];
  onSave: (data: TRow[]) => any;
  onClose: () => any;
};

const header: THeader = {
  rows: [
    {
      columns: [
        { title: "Line No.", rowSpan: 2 },
        { title: "Node No.", rowSpan: 2 },
        { title: "L/C", rowSpan: 2 },
        { title: "Transitional, Units: mm", colSpan: 4 },
        { title: "Rotational, Units: rad", colSpan: 4 },
      ],
    },
    {
      columns: [
        { title: "Dx" },
        { title: "Dy" },
        { title: "Dz" },
        { title: "Resultant" },
        { title: "Rz" },
        { title: "Rx" },
        { title: "Ry" },
        { title: "Resultant" },
      ],
    },
  ],
};

export function NodeDisplacement({ data, onSave, onClose }: Props) {
  const [changed, setChanged] = useState<TRow[]>(data);
  const [changedMap, setChangedMap] = useState(() =>{
    const map: any ={};
    data.forEach((el) =>{
      map[el.id] = el;
    })
    return map;
  })

  useEffect(() => {
    const updatedChanged: TRow[] = Object.values(changedMap);
    setChanged(updatedChanged);
  }, [changedMap]);


  const handleChange = (row: TRow, field: string, value: number) => {
    setChangedMap((prev: { [key: number]: TRow }) => {
      const newMap = { ...prev };
      newMap[row.id] = { ...newMap[row.id], [field]: value };
      return newMap;
    });
  };
  
  

  const changedArray: TRow[] = useMemo(() => Object.values(changedMap), [changedMap]);

  const dataFields: TDataField[] = useMemo(() => {
    return changed.map((el) => {
      const fields: TField[] = [
        { type: "CELL", value: el.model },
        { type: "CELL", value: el.nodeNumber },
        { type: "CELL", value: el.LCNumber },
        {
          type: "NUMERIC",
          props: {
            value: el.du,
            isDecimal: true,
            onChange: (v: any) => handleChange(el, "du", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            value: el.dv,
            isDecimal: true,
            onChange: (v: any) => handleChange(el, "dv", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            value: el.dw,
            isDecimal: true,
            onChange: (v: any) => handleChange(el, "dw", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            value: el.tResultant,
            isDecimal: true,
            onChange: (v: any) => handleChange(el, "tResultant", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            value: el.rz,
            isDecimal: true,
            onChange: (v: any) => handleChange(el, "rz", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            value: el.rx,
            isDecimal: true,
            onChange: (v: any) => handleChange(el, "rx", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            value: el.ry,
            isDecimal: true,
            onChange: (v: any) => handleChange(el, "ry", v),
          },
        },
        {
          type: "NUMERIC",
          props: {
            value: el.rResultant,
            isDecimal: true,
            onChange: (v: any) => handleChange(el, "rResultant", v),
          },
        },
      ];
      return { id: el.id, fields };
    });
  },/*[data]*/ [changedArray]);

  /*function handleChange(row: TRow, field: string, value: number) {
    setChanged((prev) =>
      prev.map((el) => (el.id === row.id ? { ...el, [field]: value } : el))
    );
  }*/
  
  

  return (
    <CustomDlg
      title={"User Nodal Displacements"}
      isMinimize={true}
      zIndex={5}
      body={
        <div className={"d-flex f-column f-grow bg-dark"}>
          <div className="hr" />
          <GenericTable
            isSmall={true}
            header={header}
            dataFields={dataFields}
          />
          <div className="hr" />
          <div className="d-flex f-grow f-jc-end bg-gray">
            {/*<Button text={"Save"} onClick={() => onSave(changed)} />*/}
            <Button text={"Save"} onClick={() => onSave(changedArray)} />
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
}
