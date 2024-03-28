import React, { useMemo } from "react";
import { Button, FormGroup, Icon } from "@blueprintjs/core";
import { useDispatch } from "react-redux";
import {
  removeInstrLineAction,
  changeInstrLineAction,
  selectInstrLineAction,
} from "../../../../store/process/actions";
import { SimpleSelector } from "../../../common/SimpleSelector";
import {
  TInstrumentationLineType,
  TInstrumentationLine,
  TProcessState,
} from "../../../../store/process/types";
import { intstrLineTypes } from "../../../../store/process/initialState";

type Props = {
  current: string;
  processState: TProcessState;
  disabled: boolean;
};

export function SelectedInstrLine({ current, processState, disabled }: Props) {
  const dispatch = useDispatch();

  const instrs = useMemo(() => {
    return processState.processes.get(current)?.instrumentations ?? [];
  }, [current, processState]);

  const item = useMemo(() => {
    return processState.selectedInstrLine;
  }, [processState]);

  function handleChange(field: string, value: any) {
    if (!item) return;
    const changed: TInstrumentationLine = { ...item, [field]: value };
    dispatch(changeInstrLineAction(current, changed));
  }

  function handleRemove() {
    if (!item) return;
    dispatch(removeInstrLineAction(current, item));
  }

  function handleClose() {
    dispatch(selectInstrLineAction(undefined));
  }

  function getInstrName(id: number | string) {
    return typeof id === "string" ? id : instrs.find((i) => i.id === id)?.name;
  }

  return item ? (
    <div className={"model-item-drawer"}>
      <div className={"header"}>
        <div className={"d-flex f-center"}>
          <Icon icon="info-sign" className={"m-5"} />
          <h2 className={"no-m"}>
            Connection Line: {getInstrName(item.from)} - {getInstrName(item.to)}
          </h2>
        </div>
        <Button large minimal icon={"cross"} onClick={handleClose} intent={"danger"} />
      </div>
      <div
        className={"body-grid"}
        style={{
          gridTemplateColumns: "105px 1fr",
        }}
      >
        <div className="d-flex f-ai-center f-jc-end">
          <div className={"label-light t-end"}>Type: </div>
        </div>
        <div className="d-flex f-ai-center" style={{ paddingRight: 10 }}>
          <FormGroup className={"f-grow no-m"}>
            <SimpleSelector<TInstrumentationLineType>
              items={intstrLineTypes}
              itemLabel={(item) => item}
              selected={item.type}
              onSelect={(val) => handleChange("type", val)}
              className={"fill-select"}
            />
          </FormGroup>
        </div>
      </div>
      {item?.connectionType === "ItoI" ? (
        <Button
          large
          fill
          text={"Remove"}
          intent={"danger"}
          disabled={disabled}
          onClick={handleRemove}
        />
      ) : null}
    </div>
  ) : null;
}
