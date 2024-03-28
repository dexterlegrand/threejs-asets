import React, { useState, useRef, useEffect, useMemo } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import { Button, FormGroup } from "@blueprintjs/core";
import {
  TProcessElementPoint,
  TProcessElement,
  EProcessElementType,
  TProcess,
  TProcessSupportType,
  TProcessBasePlateType,
} from "../../../../store/process/types";
import { CheckBoxCell } from "../../../common/CheckBoxCell";
import { Vector3 } from "three";
import {
  degToRad,
  roundM,
  getTopOffset,
  roundVectorM,
  radToDeg,
  round,
  fixVectorByOrientation,
  exportToCSV,
  fixNumberToStr,
  importFromCSV,
  getNextId,
  checkImportedNumber,
  getPosByDistance,
} from "../../../3d-models/utils";
import { deg45InRad, deg90InRad } from "../../../../store/main/constants";
import { SelectorCell } from "../../../common/SelectorCell";
import { NumericCell } from "../../../common/NumericCell";
import { ConnectionPipeDataDlg } from "./ConnectionPipeDataDlg";
import { ConnectionFlangeDlg, getFlanges } from "./ConnectionFlangeDlg";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import { SimpleNumericInput } from "../../../common/SimpleNumericInput";
import { SimpleSelector } from "../../../common/SimpleSelector";

type Props = {
  item: TProcessElement;
  process?: TProcess;
  onChange: (item: TProcessElement, toRemove?: TProcessElementPoint) => any;
  onClose: () => any;
};

export function SupportDetailsDlg({ item, process, onChange, onClose }: Props) {
  const [dlg, setDlg] = useState<JSX.Element>();

  function handleDelete() {
    const changed: TProcessElement = { ...item, supportParameters: undefined };
    onChange(changed);
  }

  function handleChangeSupportParameters(field: string, value: any) {
    const changed: TProcessElement = {
      ...item,
      supportParameters: { ...(item.supportParameters ?? {}), [field]: value },
    };
    onChange(changed);
  }

  return (
    <>
      <CustomDlg
        title={"Support Elements Details"}
        isMinimize={true}
        zIndex={5}
        position={"center"}
        body={
          <div className="d-flex f-grow f-column bg-dark">
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="d-flex f-ai-center f-jc-end">
                <div className={"label-light t-end"}>Length: </div>
              </div>
              <div className="d-flex f-ai-center">
                <FormGroup className="f-grow no-m">
                  <SimpleNumericInput
                    min={0}
                    value={item.supportParameters?.length}
                    isDecimal={true}
                    onChange={(val) =>
                      handleChangeSupportParameters("length", val)
                    }
                  />
                </FormGroup>
                <div className="label-light">{"mm"}</div>
              </div>
            </div>
            <div className={"d-flex f-ai-center bg-gray p-end-10"}>
              <div className="d-flex f-ai-center f-jc-end">
                <div className={"label-light t-end"}>Upper Length: </div>
              </div>
              <div className="d-flex f-ai-center">
                <FormGroup className="f-grow no-m">
                  <SimpleNumericInput
                    min={0}
                    value={item.supportParameters?.upperLength}
                    isDecimal={true}
                    onChange={(val) =>
                      handleChangeSupportParameters("upperLength", val)
                    }
                  />
                </FormGroup>
                <div className="label-light">{"mm"}</div>
              </div>
            </div>
            {item.supportParameters?.type !== TProcessSupportType.LEG ? (
              <>
                <div className={"d-flex f-ai-center bg-gray p-end-10"}>
                  <div className="d-flex f-ai-center f-jc-end">
                    <div className={"label-light t-end"}>Diamter: </div>
                  </div>
                  <div className="d-flex f-ai-center">
                    <FormGroup className="f-grow no-m">
                      <SimpleNumericInput
                        min={0}
                        value={item.supportParameters?.diameter}
                        isDecimal={true}
                        onChange={(val) =>
                          handleChangeSupportParameters("diameter", val)
                        }
                      />
                    </FormGroup>
                    <div className="label-light">{"mm"}</div>
                  </div>
                </div>
                <div className={"d-flex f-ai-center bg-gray p-end-10"}>
                  <div className="d-flex f-ai-center f-jc-end">
                    <div className={"label-light t-end"}>Thickness: </div>
                  </div>
                  <div className="d-flex f-ai-center">
                    <FormGroup className="f-grow no-m">
                      <SimpleNumericInput
                        min={0}
                        value={item.supportParameters?.thickness}
                        isDecimal={true}
                        onChange={(val) =>
                          handleChangeSupportParameters("thickness", val)
                        }
                      />
                    </FormGroup>
                    <div className="label-light">{"mm"}</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={"d-flex f-ai-center bg-gray p-end-10"}>
                  <div className="d-flex f-ai-center f-jc-end">
                    <div className={"label-light t-end"}>Number: </div>
                  </div>
                  <div className="d-flex f-ai-center">
                    <FormGroup className="f-grow no-m">
                      <SimpleNumericInput
                        min={0}
                        value={item.supportParameters?.number}
                        isDecimal={true}
                        onChange={(val) =>
                          handleChangeSupportParameters("number", val)
                        }
                      />
                    </FormGroup>
                  </div>
                </div>
                <div className={"d-flex f-ai-center bg-gray p-end-10"}>
                  <div className="d-flex f-ai-center f-jc-end">
                    <div className={"label-light t-end"}>Base type: </div>
                  </div>
                  <div className="d-flex f-ai-center">
                    <FormGroup className="f-grow no-m">
                      <SimpleSelector<TProcessBasePlateType>
                        items={Object.values(TProcessBasePlateType)}
                        itemLabel={(val) => `${val}`}
                        selected={item.supportParameters?.basePlate}
                        onSelect={(val) =>
                          handleChangeSupportParameters("basePlate", val)
                        }
                        className={"w-150"}
                      />
                    </FormGroup>
                  </div>
                </div>
              </>
            )}
          </div>
        }
        onClose={onClose}
        actions={
          <Button
            small
            icon="trash"
            text="Delete"
            intent="warning"
            onClick={handleDelete}
          />
        }
      />
      {dlg}
    </>
  );
}

export function getTheta(row: TProcessElementPoint) {
  const dir = new Vector3(1);
  const end = row.generalPosition.clone().sub(row.startPosition);
  end.setY(0);
  end.normalize();
  const angle = end.angleTo(dir);
  return round(radToDeg(end.z > 0 ? -angle : angle));
}

export function getInclination(row: TProcessElementPoint) {
  const dir = new Vector3(0, -1);
  const end = row.generalPosition.clone().sub(row.startPosition);
  end.normalize();
  const angle = end.angleTo(dir) - deg90InRad;
  return round(radToDeg(angle));
}
