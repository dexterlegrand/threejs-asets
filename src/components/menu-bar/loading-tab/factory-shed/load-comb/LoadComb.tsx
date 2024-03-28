import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, FormGroup } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { LC_Condition, LC_LibType } from "../../../../../store/main/types";
import { ApplicationState } from "../../../../../store";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";
import {
  LC_Conditions,
  LC_EU,
  LC_IS,
  LC_Libs,
  LC_types,
  LC_US,
} from "../../../../../store/main/constants";
import { SelectorCell } from "../../../../common/SelectorCell";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import {
  exportToCSV,
  fixValueToNumber,
  getNextId,
  getTopOffset,
  importFromCSV,
  getElementByName,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { Paginator } from "../../../../common/Paginator";
import { CustomDlg } from "../../../../common/CustomDlg";
import { LoadCombinationUI } from "../../../../../store/ui/types";
import { changeOFUIAction } from "../../../../../store/ui/actions";

type Props = { onClose: () => any };

export function LoadCombFS({ onClose }: Props) {
  const [offsetTop, setOffsetTop] = useState<number>(0);
  const [selectedRows, setSelectedRows] = useState<LoadCombinationUI[]>([]);

  const tableRef = useRef<HTMLTableElement>(null);

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return openFrameUI?.loadingsUI.loadCombinations;
  }, [openFrameUI]);

  const combinations = useMemo(() => {
    return data?.loadCombinations ?? [];
  }, [data]);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [combinations]);

  function handleChangeData(field: string, value: any) {
    if (!openFrameUI || !data) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        loadingsUI: {
          ...openFrameUI.loadingsUI,
          loadCombinations: { ...data, [field]: value },
        },
      })
    );
  }

  function handleAddRow() {
    handleChangeData("LC_lib", "CUSTOM");
    handleChangeData("loadCombinations", [
      ...combinations,
      {
        id: getNextId(combinations),
        selected: false,
        LC_No: 0,
        LC_Type: undefined,
        DL: 0,
        LL: 0,
        TL: 0,
        PE: 0,
        PT: 0,
        PO: 0,
        TA: 0,
        TF: 0,
        PS: 0,
        PI: 0,
        EE: 0,
        ET: 0,
        EO: 0,
        WLpX: 0,
        WLpXpZ: 0,
        WLpZ: 0,
        WLpZmX: 0,
        WLmX: 0,
        WLmXmZ: 0,
        WLmZ: 0,
        WLmZpX: 0,
        SX: 0,
        SZ: 0,
        SY: 0,
      },
    ]);
  }

  function handleDeleteRows() {
    handleChangeData("LC_lib", "CUSTOM");
    handleChangeData(
      "loadCombinations",
      combinations.filter((lc) => !lc.selected)
    );
  }

  function handleSelect(item: LoadCombinationUI, selected: boolean) {
    handleChangeData(
      "loadCombinations",
      combinations.map((lc) => (lc.id === item.id ? { ...item, selected } : lc))
    );
  }

  function handleChangeRow(item: LoadCombinationUI, field: string, value: any) {
    handleChangeData("LC_lib", "CUSTOM");
    handleChangeData(
      "loadCombinations",
      combinations.map((lc) => (lc.id === item.id ? { ...item, [field]: value } : lc))
    );
  }

  function getRow(item: LoadCombinationUI) {
    return (
      <tr key={item.id}>
        <CheckBoxCell value={item.selected} onChange={(value) => handleSelect(item, value)} />
        <SelectorCell<LC_Condition>
          items={LC_Conditions}
          selected={item.CONDITION}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeRow(item, "CONDITION", value)}
          filterable={false}
        />
        <NumericCell
          value={item.LC_No}
          className={"w-100"}
          onChange={(value) => handleChangeRow(item, "LC_No", value)}
        />
        <SelectorCell<string>
          items={LC_types}
          selected={item.LC_Type}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeRow(item, "LC_Type", value)}
          filterable={false}
          // TODO: user entries
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.DL, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "DL", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.LL, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "LL", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.TL, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "TL", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.PE, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "PE", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.PT, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "PT", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.PO, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "PO", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.TA, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "TA", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.TF, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "TF", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.PS, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "PS", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.PI, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "PI", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.EE, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "EE", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.ET, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "ET", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.EO, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "EO", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.WLpX, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "WLpX", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.WLmZpX, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "WLmZpX", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.WLmZ, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "WLmZ", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.WLmXmZ, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "WLmXmZ", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.WLmX, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "WLmX", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.WLpZmX, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "WLpZmX", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.WLpZ, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "WLpZ", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.WLpXpZ, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "WLpXpZ", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.SX, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "SX", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.SZ, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "SZ", value)}
        />
        <NumericCell
          isDecimal={true}
          value={fixValueToNumber(item.SY, "float")}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "SY", value)}
        />
      </tr>
    );
  }

  function handleChangeLC_Lib(LC_lib?: LC_LibType) {
    if (data?.LC_lib !== LC_lib) {
      handleChangeData("LC_lib", LC_lib);
      switch (LC_lib) {
        case "IS":
          handleChangeData("loadCombinations", LC_IS);
          break;
        case "US":
          handleChangeData("loadCombinations", LC_US);
          break;
        case "EU":
          handleChangeData("loadCombinations", LC_EU);
          break;
        case "CUSTOM":
          handleChangeData("loadCombinations", []);
      }
    }
  }

  function handleExportToCSV() {
    exportToCSV(combinations, "Load Combinations");
  }

  function handleImportFromCSVOrExcel() {
    importFromCSV((data) => {
      let index = getNextId(combinations);
      handleChangeData("LC_lib", "CUSTOM");
      handleChangeData(
        "loadCombinations",
        data.map((item) => ({ ...item, id: index++ }))
      );
    });
  }

  return (
    <CustomDlg
      title={"Load Combination"}
      isMinimize={true}
      body={
        <div className={"d-flex f-column f-grow"}>
          <div className="label-light d-flex bg-dark">
            <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
            <Button
              small
              icon="export"
              text="Export to CSV"
              intent="success"
              onClick={handleExportToCSV}
            />
            <Button
              small
              icon="import"
              text="Import from CSV"
              intent="success"
              onClick={handleImportFromCSVOrExcel}
            />
            <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
            <FormGroup className="no-m w-200">
              <SimpleSelector<LC_LibType>
                items={LC_Libs}
                selected={data?.LC_lib}
                itemLabel={(item) => item}
                onSelect={(LC_lib) => handleChangeLC_Lib(LC_lib)}
                className={"fill-select"}
              />
            </FormGroup>
          </div>
          <div className="hr" />
          <div className={"bg-dark p-5"}>
            <div className={"table-container"}>
              <table ref={tableRef} className="table bg-gray">
                <thead>
                  <tr>
                    <th rowSpan={2}></th>
                    <th rowSpan={2}>Condition</th>
                    <th rowSpan={2}>LC No.</th>
                    <th rowSpan={2}>LC Type</th>
                    <th rowSpan={2}>DL</th>
                    <th rowSpan={2}>LL</th>
                    <th rowSpan={2}>TL</th>
                    <th colSpan={7}>PIPING LOAD</th>
                    <th colSpan={3}>EQUIPMENT LOAD</th>
                    <th colSpan={8}>WIND LOAD</th>
                    <th colSpan={3}>SEISMIC LOAD</th>
                  </tr>
                  <tr>
                    <th style={{ top: offsetTop }}>PE</th>
                    <th style={{ top: offsetTop }}>PT</th>
                    <th style={{ top: offsetTop }}>PO</th>
                    <th style={{ top: offsetTop }}>TA</th>
                    <th style={{ top: offsetTop }}>TF</th>
                    <th style={{ top: offsetTop }}>PS</th>
                    <th style={{ top: offsetTop }}>PI</th>

                    <th style={{ top: offsetTop }}>EE</th>
                    <th style={{ top: offsetTop }}>ET</th>
                    <th style={{ top: offsetTop }}>EO</th>

                    <th style={{ top: offsetTop }}>
                      +X <br /> 0<sup>0</sup>
                    </th>
                    <th style={{ top: offsetTop }}>
                      +X,-Z <br /> 45<sup>0</sup>
                    </th>
                    <th style={{ top: offsetTop }}>
                      -Z <br /> 90<sup>0</sup>
                    </th>
                    <th style={{ top: offsetTop }}>
                      -Z,-X <br /> 135<sup>0</sup>
                    </th>
                    <th style={{ top: offsetTop }}>
                      -X <br /> 180<sup>0</sup>
                    </th>
                    <th style={{ top: offsetTop }}>
                      -X,+Z <br /> 225<sup>0</sup>
                    </th>
                    <th style={{ top: offsetTop }}>
                      +Z <br /> 270<sup>0</sup>
                    </th>
                    <th style={{ top: offsetTop }}>
                      +Z,+X <br /> 315<sup>0</sup>
                    </th>

                    <th style={{ top: offsetTop }}>SX</th>
                    <th style={{ top: offsetTop }}>SZ</th>
                    <th style={{ top: offsetTop }}>SY</th>
                  </tr>
                </thead>
                <tbody>{selectedRows.map((row) => getRow(row))}</tbody>
              </table>
            </div>
          </div>
          <div className="hr" />
          <Paginator items={combinations} onChange={setSelectedRows} />
        </div>
      }
      onClose={onClose}
    />
  );
}
