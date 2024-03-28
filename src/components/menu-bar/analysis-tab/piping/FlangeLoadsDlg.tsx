import React, { useState } from "react";
import { Button, FormGroup } from "@blueprintjs/core";
import { FreePipe, TNozzleLoadCode, TFlangeLoads } from "../../../../store/main/types";
import { CustomDlg } from "../../../common/CustomDlg";
import { NumericCell } from "../../../common/NumericCell";
import { SimpleSelector } from "../../../common/SimpleSelector";
import { roundM } from "../../../3d-models/utils";

type Props = {
  pipe: FreePipe;
  isStart?: boolean;
  onClose: () => any;
  onSave: (pipe: FreePipe) => any;
};

export function FlangeLoadsDlg(props: Props) {
  const { pipe, isStart, onClose, onSave } = props;

  const [changed, setChanged] = useState<FreePipe>();

  function handleChange(item: FreePipe, field: string, value: any) {
    const loads = item.params[isStart ? "startFlangeLoads" : "endFlangeLoads"];
    if (field === "code") {
      switch (value as TNozzleLoadCode) {
        case "API 517":
          setChanged({
            ...item,
            params: {
              ...item.params,
              [isStart ? "startFlangeLoads" : "endFlangeLoads"]: {
                ...loads,
                code: value,
                "3F+M": undefined,
              },
            },
          });
          break;
        case "API 617":
          setChanged({
            ...item,
            params: {
              ...item.params,
              [isStart ? "startFlangeLoads" : "endFlangeLoads"]: {
                ...loads,
                code: value,
                "3F+M": roundM(Number(item.params.nps) * 500 * 1.85),
              } as TFlangeLoads,
            },
          });
          break;
        case "NEMA/SM23":
          setChanged({
            ...item,
            params: {
              ...item.params,
              [isStart ? "startFlangeLoads" : "endFlangeLoads"]: {
                ...loads,
                code: value,
                "3F+M": roundM(Number(item.params.nps) * 500),
              },
            },
          });
      }
    } else {
      setChanged({
        ...item,
        params: {
          ...item.params,
          [isStart ? "startFlangeLoads" : "endFlangeLoads"]: { ...loads, [field]: value },
        },
      });
    }
  }

  return (
    <CustomDlg
      title={`Maximal allowable Load`}
      zIndex={11}
      onClose={onClose}
      body={
        <div className="d-flex f-column">
          <div className="label-light d-flex bg-dark f-ai-center">
            <div className="label-light t-end w-50">Code: </div>
            <FormGroup className="no-m w-200">
              <SimpleSelector<TNozzleLoadCode>
                items={["API 517", "API 617", "NEMA/SM23"]}
                selected={
                  (changed ?? pipe).params[isStart ? "startFlangeLoads" : "endFlangeLoads"]?.code
                }
                itemLabel={(item) => item}
                onSelect={(val) => handleChange(changed ?? pipe, "code", val)}
                className={"fill-select"}
              />
            </FormGroup>
          </div>
          <div className="hr" />
          <div className="p-5 bg-dark">
            <div className={"small-table-container"}>
              {(changed ?? pipe).params[isStart ? "startFlangeLoads" : "endFlangeLoads"]?.code ===
              "API 517" ? (
                <table className="table bg-gray">
                  <thead>
                    <tr>
                      <th>Nozzle Size</th>
                      <th>
                        F<sub>x</sub>
                      </th>
                      <th>
                        F<sub>y</sub>
                      </th>
                      <th>
                        F<sub>z</sub>
                      </th>
                      <th>
                        M<sub>x</sub>
                      </th>
                      <th>
                        M<sub>y</sub>
                      </th>
                      <th>
                        M<sub>z</sub>
                      </th>
                    </tr>
                    <tr>
                      <th style={{ borderLeft: "1px solid black" }}>DN</th>
                      <th>N</th>
                      <th>N</th>
                      <th>N</th>
                      <th>N-m</th>
                      <th>N-m</th>
                      <th>N-m</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{pipe.params.od ?? 0}</td>
                      <NumericCell
                        isDecimal={true}
                        value={
                          (changed ?? pipe).params[isStart ? "startFlangeLoads" : "endFlangeLoads"]
                            ?.fx
                        }
                        onChange={(value) => handleChange(changed ?? pipe, "fx", value)}
                        className={"w-100"}
                      />
                      <NumericCell
                        isDecimal={true}
                        value={
                          (changed ?? pipe).params[isStart ? "startFlangeLoads" : "endFlangeLoads"]
                            ?.fy
                        }
                        onChange={(value) => handleChange(changed ?? pipe, "fy", value)}
                        className={"w-100"}
                      />
                      <NumericCell
                        isDecimal={true}
                        value={
                          (changed ?? pipe).params[isStart ? "startFlangeLoads" : "endFlangeLoads"]
                            ?.fz
                        }
                        onChange={(value) => handleChange(changed ?? pipe, "fz", value)}
                        className={"w-100"}
                      />
                      <NumericCell
                        isDecimal={true}
                        value={
                          (changed ?? pipe).params[isStart ? "startFlangeLoads" : "endFlangeLoads"]
                            ?.mx
                        }
                        onChange={(value) => handleChange(changed ?? pipe, "mx", value)}
                        className={"w-100"}
                      />
                      <NumericCell
                        isDecimal={true}
                        value={
                          (changed ?? pipe).params[isStart ? "startFlangeLoads" : "endFlangeLoads"]
                            ?.my
                        }
                        onChange={(value) => handleChange(changed ?? pipe, "my", value)}
                        className={"w-100"}
                      />
                      <NumericCell
                        isDecimal={true}
                        value={
                          (changed ?? pipe).params[isStart ? "startFlangeLoads" : "endFlangeLoads"]
                            ?.mz
                        }
                        onChange={(value) => handleChange(changed ?? pipe, "mz", value)}
                        className={"w-100"}
                      />
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className="table bg-gray">
                  <thead>
                    <tr>
                      <th>
                        Nozzle Size<sup>*</sup>
                      </th>
                      <th>Limiting Resultant Force</th>
                    </tr>
                    <tr>
                      <th>DN (in)</th>
                      <th>3F + M in lb and ft-lb</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{pipe.params.nps}</td>
                      <NumericCell
                        isDecimal={true}
                        value={
                          (changed ?? pipe).params[
                            isStart ? "startFlangeLoads" : "endFlangeLoads"
                          ]?.["3F+M"]
                        }
                        onChange={(value) => handleChange(changed ?? pipe, "3F+M", value)}
                        className={"w-200"}
                      />
                    </tr>
                  </tbody>
                </table>
              )}
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
