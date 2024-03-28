import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch } from "react-redux";
import {
  getTopOffset,
  getNextId,
  exportToCSV,
  importFromCSV,
  checkImportedNumber,
} from "../../../3d-models/utils";
import { addEventAction } from "../../../../store/ui/actions";
import { NumericCell } from "../../../common/NumericCell";
import { CheckBoxCell } from "../../../common/CheckBoxCell";
import { SelectorCell } from "../../../common/SelectorCell";
import { loadTypes } from "../../../../store/main/constants";
import { Vector3 } from "three";
import { LoadType, FreePipe } from "../../../../store/main/types";
import { TPipeAdditionalLoad, TPipeNF } from "../../../../store/main/pipeTypes";

type Props = {
  type: "DL" | "WL";
  pipes: FreePipe[];
  NFs?: TPipeNF[];
  loads: TPipeAdditionalLoad[];
  onChange: (loads: TPipeAdditionalLoad[]) => any;
};

const initLoad = {
  id: 0,
  selected: false,
  distance: 0,
  type: "Point Load" as LoadType,
  lengthOfUDL: 0,
  Fx: 0,
  Fy: 0,
  Fz: 0,
  Mx: 0,
  My: 0,
  Mz: 0,
};

export function AdditionalLoadsPP({ type, pipes, NFs, loads, onChange }: Props) {
  const [offsetTop, setOffsetTop] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(true);
  const [tab, setTab] = useState<"AL" | "NF">("AL");

  const dispatch = useDispatch();

  const tableRef = useRef<HTMLTableElement>(null);

  const isNF = useMemo(() => {
    return !!NFs?.length;
  }, [NFs]);

  useEffect(() => {
    setTab(NFs?.length ? "NF" : "AL");
  }, [NFs]);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [loads]);

  function handleAddRow() {
    onChange([...loads, { ...initLoad, id: getNextId(loads) }]);
  }

  function handleDeleteRows() {
    onChange(loads.filter((item) => !item.selected));
  }

  function handleChange(item: TPipeAdditionalLoad, field: string, value: any) {
    onChange(
      loads.map((load) => {
        if (load.id === item.id) {
          return { ...load, [field]: value };
        }
        return load;
      })
    );
  }

  function getRow(item: TPipeAdditionalLoad) {
    const element = pipes.find((pipe) => pipe.pipe === item.element);
    const start = new Vector3(element?.x1, element?.y1, element?.z1);
    const end = new Vector3(element?.x2, element?.y2, element?.z2);
    const maxDistance = start.distanceTo(end);
    let Fx = false;
    let Fy = false;
    let Fz = false;
    let Mx = false;
    let My = false;
    let Mz = false;
    if (type === "WL") {
      Fx = !!(!item.Fx && (item.Fz || item.Mx));
      Fy = !item.Fx && !item.Fz && !item.Mx && !item.Mz;
      Fz = !!(!item.Fz && (item.Fx || item.Mz));
      Mx = !!(!item.Mx && (item.Fx || item.Mz));
      My = !item.Fx && !item.Fz && !item.Mx && !item.Mz;
      Mz = !!(!item.Mz && (item.Fz || item.Mx));
    }
    return (
      <tr key={item.id}>
        <CheckBoxCell
          value={item.selected}
          onChange={(value) => handleChange(item, "selected", value)}
        />
        <SelectorCell<string>
          items={pipes.map((p) => p.pipe)}
          selected={item.element}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChange(item, "element", value)}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <SelectorCell<LoadType>
          disabled={!item.element}
          items={loadTypes}
          selected={item.type}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChange(item, "type", value)}
        />
        <NumericCell
          min={0}
          max={maxDistance}
          isDecimal={true}
          disabled={!item.element}
          value={item.distance}
          className={"w-100"}
          onChange={(value) => handleChange(item, "distance", value)}
        />
        <NumericCell
          min={0}
          max={maxDistance - item.distance}
          isDecimal={true}
          disabled={!item.element || item.type === "Point Load"}
          value={item.lengthOfUDL}
          className={"w-100"}
          onChange={(value) => handleChange(item, "lengthOfUDL", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element || Fx}
          value={item.Fx}
          className={"w-50"}
          onChange={(value) => handleChange(item, "Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element || Fy}
          value={item.Fy}
          className={"w-50"}
          onChange={(value) => handleChange(item, "Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element || Fz}
          value={item.Fz}
          className={"w-50"}
          onChange={(value) => handleChange(item, "Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element || Mx}
          value={item.Mx}
          className={"w-50"}
          onChange={(value) => handleChange(item, "Mx", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element || My}
          value={item.My}
          className={"w-50"}
          onChange={(value) => handleChange(item, "My", value)}
        />
        <NumericCell
          isDecimal={true}
          disabled={!item.element || Mz}
          value={item.Mz}
          className={"w-50"}
          onChange={(value) => handleChange(item, "Mz", value)}
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      loads.map((load) => ({
        ...load,
        id: load.id,
        "Pipe No.": load.element ?? "",
        "Load Type": load.type,
        "Dist. From Start Node (m)": load.distance,
        "Length of UDL (m)": load.lengthOfUDL,
        Fx: load.Fx,
        Fy: load.Fy,
        Fz: load.Fz,
        Mx: load.Mx,
        My: load.My,
        Mz: load.Mz,
      })),
      `Pipes Additional loads`
    );
  }

  function handleExportNF() {
    if (!NFs) return;
    exportToCSV(NFs, "Pipe Natural Frequency");
  }

  function showImportErrorMsg(msg: string) {
    dispatch(addEventAction(`Additional Loads: ${msg}`, "danger"));
  }

  function handleImport() {
    importFromCSV((imported, isCSV) => {
      if (!isCSV || !Array.isArray(imported)) return;
      const newLoads: TPipeAdditionalLoad[] = [];
      for (const item of imported) {
        let newLoad: TPipeAdditionalLoad = { ...initLoad, id: getNextId(newLoads) };
        const itemElement = item["Pipe No."];
        const itemType = item["Load Type"];
        const itemDistance = item["Dist. From Start Node (m)"];
        const itemLength = item["Length of UDL (m)"];
        if (itemElement) {
          const pipe = pipes.find((p) => p.pipe === itemElement);
          if (pipe) {
            newLoad = { ...newLoad, element: pipe.pipe };
          } else showImportErrorMsg(`(id: ${item.id}) - a pipe "${itemElement}" not found!`);
        }
        if (itemType) {
          if (loadTypes.includes(itemType)) {
            newLoad = { ...newLoad, type: itemType };
          } else showImportErrorMsg(`(id: ${item.id}) - Incorrect load type "${itemType}"!`);
        }
        newLoad = {
          ...newLoad,
          distance: checkImportedNumber(itemDistance, false) ?? 0,
          lengthOfUDL: checkImportedNumber(itemLength, false) ?? 0,
          Fx: checkImportedNumber(item.Fx) ?? 0,
          Fy: checkImportedNumber(item.Fy) ?? 0,
          Fz: checkImportedNumber(item.Fz) ?? 0,
          Mx: checkImportedNumber(item.Mx) ?? 0,
          My: checkImportedNumber(item.My) ?? 0,
          Mz: checkImportedNumber(item.Mz) ?? 0,
        };
        newLoads.push(newLoad);
      }
      onChange(newLoads);
    });
  }

  return (
    <div className="d-flex f-grow f-column">
      <div className="label-light bg-dark">
        <Button
          small
          minimal
          icon={visible ? "caret-down" : "caret-right"}
          onClick={() => setVisible(!visible)}
        />
        {isNF ? (
          <>
            {NFs ? (
              <>
                <Button
                  small
                  minimal
                  className={"c-light"}
                  text={"Natural Freq"}
                  onClick={() => setTab("NF")}
                />
                <span>|</span>
              </>
            ) : null}
            <Button
              small
              minimal
              className={"c-light"}
              text={"Additional Loads"}
              onClick={() => setTab("AL")}
            />
          </>
        ) : (
          <span>Additional Loads</span>
        )}
        {tab === "AL" ? (
          <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        ) : null}
        <Button
          small
          icon="export"
          text="Export to CSV"
          intent="success"
          onClick={() => (tab === "AL" ? handleExport() : handleExportNF())}
        />
        {tab === "AL" ? (
          <>
            <Button
              small
              icon="import"
              text="Import from CSV"
              intent="success"
              onClick={handleImport}
            />
            <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
          </>
        ) : null}
      </div>
      {visible ? (
        <>
          <div className="hr" />
          <div className={"bg-dark p-5"}>
            <div className={"small-table-container"}>
              {tab === "AL" ? (
                <table ref={tableRef} className="table bg-gray">
                  <thead>
                    <tr>
                      <th rowSpan={2}></th>
                      <th rowSpan={2}>Pipe No.</th>
                      <th rowSpan={2}>Load Type</th>
                      <th rowSpan={2}>Dist. From Start Node (m)</th>
                      <th rowSpan={2}>Length of UDL (m)</th>
                      <th colSpan={6}>Load Values (kg & m)</th>
                    </tr>
                    <tr>
                      <th style={{ top: offsetTop }}>Fx</th>
                      <th style={{ top: offsetTop }}>Fy</th>
                      <th style={{ top: offsetTop }}>Fz</th>
                      <th style={{ top: offsetTop }}>Mx</th>
                      <th style={{ top: offsetTop }}>My</th>
                      <th style={{ top: offsetTop }}>Mz</th>
                    </tr>
                  </thead>
                  <tbody>{loads.map((item) => getRow(item))}</tbody>
                </table>
              ) : (
                <table className="table bg-gray">
                  <thead>
                    <tr>
                      <th>Line No.</th>
                      <th>Natural Freq</th>
                    </tr>
                  </thead>
                  <tbody>
                    {NFs?.map((nf, i) => (
                      <tr key={i}>
                        <td>{nf.line}</td>
                        <td>{nf.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
