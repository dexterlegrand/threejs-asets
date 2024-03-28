import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Icon, Button, FormGroup } from "@blueprintjs/core";

import { ApplicationState } from "../../../../store";
import {
  removeInstrElementAction,
  selectInstrElementAction,
  changeInstrElementAction,
} from "../../../../store/process/actions";
import { SimpleNumericInput } from "../../../common/SimpleNumericInput";
import { TInstrumentationElement } from "../../../../store/process/types";

type Props = {
  current: string;
  disabled: boolean;
};

export function SelectedInstr({ current, disabled }: Props) {
  const item = useSelector((state: ApplicationState) => state.process.selectedInstr);

  const dispatch = useDispatch();

  function handleClose() {
    dispatch(selectInstrElementAction(undefined));
  }

  function handleChange(field: string, value: any) {
    if (!item) return;
    let changed: TInstrumentationElement = { ...item };
    changed = { ...changed, [field]: value };
    dispatch(changeInstrElementAction(current, changed));
  }

  function handleRemove() {
    if (!item) return;
    dispatch(removeInstrElementAction(current, item));
  }

  return item ? (
    <div className={"model-item-drawer"}>
      <div className={"header"}>
        <div className={"d-flex f-center"}>
          <Icon icon="info-sign" className={"m-5"} />
          <h2 className={"no-m"}>Element name: {item.name}</h2>
        </div>
        <Button large minimal icon={"cross"} onClick={handleClose} intent={"danger"} />
      </div>
      <div className={"body-grid"} style={{ gridTemplateColumns: "110px 1fr" }}>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc">Type:</div>
        </div>
        <div className="d-flex f-ai-center">
          <div className={"label-light"}>{item.type}</div>
        </div>
        {item.combinedType ? (
          <>
            <div className="d-flex f-ai-center f-jc-end">
              <div className="label-light w-mc t-end">Second Type:</div>
            </div>
            <div className="d-flex f-ai-center">
              <div className={"label-light"}>{item.combinedType}</div>
            </div>
          </>
        ) : null}
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc">Position X: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              isDecimal={true}
              value={item.x}
              disabled={disabled}
              onChange={(val) => handleChange("x", val)}
            />
          </FormGroup>
          <div className="label-light">m</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc">Position Y: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              isDecimal={true}
              value={item.y}
              disabled={disabled}
              onChange={(val) => handleChange("y", val)}
            />
          </FormGroup>
          <div className="label-light">m</div>
        </div>
        <div className="d-flex f-ai-center f-jc-end">
          <div className="label-light w-mc">Position Z: </div>
        </div>
        <div className="d-flex f-ai-center">
          <FormGroup className="f-grow no-m">
            <SimpleNumericInput
              isDecimal={true}
              value={item.z}
              disabled={disabled}
              onChange={(val) => handleChange("z", val)}
            />
          </FormGroup>
          <div className="label-light">m</div>
        </div>
      </div>
      <Button
        large
        fill
        text={"Remove"}
        intent={"danger"}
        disabled={disabled}
        onClick={handleRemove}
      />
    </div>
  ) : null;
}
