import React, { useState } from "react";
import { Classes, Button, FormGroup } from "@blueprintjs/core";
import { SimpleNumericInput } from "./SimpleNumericInput";
import { CustomDlg } from "./CustomDlg";

type Props = {
  title: string;
  label?: string;
  min?: number;
  max?: number;
  isDecimal?: boolean;
  defaultValue?: number;
  position?: "center" | "default";
  onClose: () => any;
  onSubmit: (value: number) => any;
};

export function NumericInputDlg(props: Props) {
  const [value, setValue] = useState<number>(props.defaultValue ?? 0);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    props.onSubmit(value);
  }

  function getFormGroup(
    value: number,
    setValue: (value: number) => any,
    min?: number,
    max?: number,
    isDecimal?: boolean
  ) {
    return (
      <FormGroup className={"no-m"}>
        <SimpleNumericInput
          min={min}
          max={max}
          isDecimal={isDecimal}
          autoFocus={true}
          value={value}
          onChange={setValue}
        />
      </FormGroup>
    );
  }

  return (
    <CustomDlg
      zIndex={3}
      title={props.title}
      position={props.position ?? "default"}
      onClose={props.onClose}
      body={
        <form onSubmit={handleSubmit} className={Classes.DIALOG_BODY}>
          {props.label ? (
            <>
              <div className="label-light d-flex bg-dark">{props.label}</div>
              <div className="hr" />
              <div className={"bg-dark p-5"} style={{ marginBottom: 10 }}>
                {getFormGroup(
                  value,
                  setValue,
                  props.min,
                  props.max,
                  props.isDecimal
                )}
              </div>
            </>
          ) : (
            getFormGroup(value, setValue, props.min, props.max, props.isDecimal)
          )}
          <div className={`${Classes.DIALOG_FOOTER} no-m`}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <Button type={"button"} text={"Cancel"} onClick={props.onClose} />
              <Button type={"submit"} text={"Ok"} intent={"primary"} />
            </div>
          </div>
        </form>
      }
    />
  );
}
