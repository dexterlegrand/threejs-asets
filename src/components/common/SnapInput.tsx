import React, { useEffect, useState } from "react";
import { Button, FormGroup } from "@blueprintjs/core";
import { SimpleNumericInput } from "./SimpleNumericInput";
import { CustomDlg } from "./CustomDlg";
import { useRecoilState } from "recoil";
import { snapPosition } from "../../recoil/atoms/snap-atom";
import { roundM } from "../3d-models/utils";

export function SnapInput() {
  const [value, setValue] = useState<number>(0);
  const [valueX, setXValue] = useState<number>(0);
  const [valueY, setYValue] = useState<number>(0);
  const [valueZ, setZValue] = useState<number>(0);

  const [snap, setSnap] = useRecoilState(snapPosition);

  useEffect(() => {
    if (!snap) return;
    setValue(roundM(snap.from.distanceTo(snap.current)));
  }, [snap]);

  useEffect(() => {
    if (!snap) return;
    setXValue(roundM(snap.current.x - snap.from.x));
    setYValue(roundM(snap.current.y - snap.from.y));
    setZValue(roundM(snap.current.z - snap.from.z));
  }, [snap]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    snap?.callback(value);
    setSnap(undefined);
  }

  function handleSubmitInVector() {
    snap?.callback(valueX, valueY, valueZ);
    setSnap(undefined);
  }
  function onClose() {
    setSnap(undefined);
  }

  return snap ? (
    <CustomDlg
      zIndex={100}
      position={snap.position}
      isMinimal={true}
      body={
        !snap?.isString ? (
          <form onSubmit={handleSubmit}>
            <FormGroup className={"no-m"}>
              <SimpleNumericInput
                isDecimal={true}
                autoFocus={true}
                value={value}
                onChange={setValue}
              />
            </FormGroup>
          </form>
        ) : (
          <>
            <div className={"d-flex f-column f-grow p-5"}>
              <FormGroup label={"X"}>
                <SimpleNumericInput
                  isDecimal={true}
                  autoFocus={true}
                  value={valueX}
                  onChange={setXValue}
                />
              </FormGroup>
              <FormGroup label={"Y"}>
                <SimpleNumericInput
                  isDecimal={true}
                  autoFocus={true}
                  value={valueY}
                  onChange={setYValue}
                />
              </FormGroup>
              <FormGroup label={"Z"}>
                <SimpleNumericInput
                  isDecimal={true}
                  autoFocus={true}
                  value={valueZ}
                  onChange={setZValue}
                />
              </FormGroup>
            </div>
          </>
        )
      }
      actions={
        snap?.isString ? (
          <>
            <Button text="Cancel" onClick={onClose} />
            <Button
              text="Apply"
              onClick={() => handleSubmitInVector()}
              intent={"primary"}
            />
          </>
        ) : (
          undefined
        )
      }
    />
  ) : null;
}
