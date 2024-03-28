import React, { useState } from "react";
import { Button } from "@blueprintjs/core";
import { FreePipe } from "../../../../store/main/types";
import { CustomDlg } from "../../../common/CustomDlg";
import { NumericCell } from "../../../common/NumericCell";
import {
  importFromCSV,
  exportToCSV,
  fixNumberToStr,
  checkImportedNumber,
} from "../../../3d-models/utils";

type Props = {
  pipe: FreePipe;
  onClose: () => any;
  onSave: (pipe: FreePipe) => any;
};

export function TemperatureDlg(props: Props) {
  const { pipe, onClose, onSave } = props;

  const [changed, setChanged] = useState<FreePipe>();

  function handleChange(item: FreePipe, field: string, value: any) {
    setChanged({ ...item, params: { ...item.params, [field]: value } });
  }

  function handleExport() {
    const item = changed ?? pipe;
    exportToCSV(
      [
        {
          "T1 (deg)": fixNumberToStr(item.params.T1),
          "T2 (deg)": fixNumberToStr(item.params.T2),
          "T3 (deg)": fixNumberToStr(item.params.T3),
          "T4 (deg)": fixNumberToStr(item.params.T4),
          "T5 (deg)": fixNumberToStr(item.params.T5),
          "P1 (bar)": fixNumberToStr(item.params.P1),
          "HP (bar)": fixNumberToStr(item.params.HP),
        },
      ],
      "Pipe Temperature Design Parameters"
    );
  }

  function handleImport() {
    importFromCSV((imported, isCSV) => {
      if (!isCSV || !Array.isArray(imported)) return;
      const item = changed ?? pipe;
      const row = imported[0];
      setChanged({
        ...item,
        params: {
          ...item.params,
          T1: checkImportedNumber(row["T1 (deg)"]),
          T2: checkImportedNumber(row["T2 (deg)"]),
          T3: checkImportedNumber(row["T3 (deg)"]),
          T4: checkImportedNumber(row["T4 (deg)"]),
          T5: checkImportedNumber(row["T5 (deg)"]),
          P1: checkImportedNumber(row["P1 (bar)"]),
          HP: checkImportedNumber(row["HP (bar)"]),
        },
      });
    });
  }

  return (
    <CustomDlg
      title={`Temperature Design Parameters of Pipe "${pipe.pipe}"`}
      zIndex={11}
      onClose={onClose}
      body={
        <div className="d-flex f-column">
          <div className="hr" />
          <div className="label-light bg-dark" style={{ paddingRight: 10 }}>
            <Button
              small
              icon="export"
              text="Export to CSV"
              intent="success"
              onClick={handleExport}
            />
            <Button
              small
              icon="import"
              text="Import from CSV"
              intent="success"
              onClick={handleImport}
            />
          </div>
          <div className="hr" />
          <div className="p-5 bg-dark">
            <div className={"small-table-container"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Value</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>T1 (deg)</td>
                    <NumericCell
                      isDecimal={true}
                      value={(changed ?? pipe).params.T1}
                      onChange={(value) => handleChange(changed ?? pipe, "T1", value)}
                      className={"w-100"}
                    />
                    <td>Maximum Design temperature</td>
                  </tr>
                  <tr>
                    <td>T2 (deg)</td>
                    <NumericCell
                      isDecimal={true}
                      value={(changed ?? pipe).params.T2}
                      onChange={(value) => handleChange(changed ?? pipe, "T2", value)}
                      className={"w-100"}
                    />
                    <td>Maximum Operating Temperature</td>
                  </tr>
                  <tr>
                    <td>T3 (deg)</td>
                    <NumericCell
                      isDecimal={true}
                      value={(changed ?? pipe).params.T3}
                      onChange={(value) => handleChange(changed ?? pipe, "T3", value)}
                      className={"w-100"}
                    />
                    <td>Minimum Design temperature</td>
                  </tr>
                  <tr>
                    <td>T4 (deg)</td>
                    <NumericCell
                      isDecimal={true}
                      value={(changed ?? pipe).params.T4}
                      onChange={(value) => handleChange(changed ?? pipe, "T4", value)}
                      className={"w-100"}
                    />
                    <td>Maximum Temperature Ambient</td>
                  </tr>
                  <tr>
                    <td>T5 (deg)</td>
                    <NumericCell
                      isDecimal={true}
                      value={(changed ?? pipe).params.T5}
                      onChange={(value) => handleChange(changed ?? pipe, "T5", value)}
                      className={"w-100"}
                    />
                    <td>Minimum Temperature Ambient</td>
                  </tr>
                  {/* <tr>
                    <td>T6 (deg)</td>
                    <NumericCell
                      isDecimal={true}
                      value={(changed ?? pipe).params.T6}
                      disabled={true}
                      onChange={(value) => handleChange(changed ?? pipe, "T6", value)}
                      className={"w-100"}
                    />
                    <td></td>
                    <td>Minimum Temperature (flow induced) (optional)</td>
                  </tr> */}
                  {/* <tr>
                    <td>T7 (deg)</td>
                    <NumericCell
                      isDecimal={true}
                      value={(changed ?? pipe).params.T7}
                      disabled={true}
                      onChange={(value) => handleChange(changed ?? pipe, "T7", value)}
                      className={"w-100"}
                    />
                    <td></td>
                  </tr> */}
                  {/* <tr>
                    <td>T8 (deg)</td>
                    <NumericCell
                      isDecimal={true}
                      value={(changed ?? pipe).params.T8}
                      disabled={true}
                      onChange={(value) => handleChange(changed ?? pipe, "T8", value)}
                      className={"w-100"}
                    />
                    <td></td>
                  </tr> */}
                  {/* <tr>
                    <td>T9 (deg)</td>
                    <NumericCell
                      isDecimal={true}
                      value={(changed ?? pipe).params.T9}
                      disabled={true}
                      onChange={(value) => handleChange(changed ?? pipe, "T9", value)}
                      className={"w-100"}
                    />
                    <td></td>
                  </tr> */}
                  <tr>
                    <td>P1 (bar)</td>
                    <NumericCell
                      isDecimal={true}
                      value={(changed ?? pipe).params.P1}
                      onChange={(value) => handleChange(changed ?? pipe, "P1", value)}
                      className={"w-100"}
                    />
                    <td>Internal Design Pressure</td>
                  </tr>
                  {/* <tr>
                    <td>P2 (bar)</td>
                    <NumericCell
                      isDecimal={true}
                      value={(changed ?? pipe).params.P2}
                      disabled={true}
                      onChange={(value) => handleChange(changed ?? pipe, "P2", value)}
                      className={"w-100"}
                    />
                    <td>Maximum Operating Pressure</td>
                  </tr> */}
                  {/* <tr>
                    <td>P3 (bar)</td>
                    <NumericCell
                      isDecimal={true}
                      value={(changed ?? pipe).params.P3}
                      disabled={true}
                      onChange={(value) => handleChange(changed ?? pipe, "P3", value)}
                      className={"w-100"}
                    />
                    <td>Compressor Operation</td>
                  </tr> */}
                  {/* <tr>
                    <td>P4 (bar)</td>
                    <NumericCell
                      isDecimal={true}
                      value={(changed ?? pipe).params.P4}
                      disabled={true}
                      onChange={(value) => handleChange(changed ?? pipe, "P4", value)}
                      className={"w-100"}
                    />
                    <td>Demand Pressure</td>
                  </tr> */}
                  <tr>
                    <td>HP (bar)</td>
                    <NumericCell
                      isDecimal={true}
                      value={(changed ?? pipe).params.HP}
                      onChange={(value) => handleChange(changed ?? pipe, "HP", value)}
                      className={"w-100"}
                    />
                    <td>Hydrotest Pressure</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="hr" />
        </div>
      }
      actions={
        <>
          <Button text="Cancel" onClick={onClose} />
          <Button
            text="Save"
            disabled={!changed}
            onClick={() => onSave(changed!)}
            intent={"primary"}
          />
        </>
      }
    />
  );
}
