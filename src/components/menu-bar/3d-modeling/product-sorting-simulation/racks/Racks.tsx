import React from "react";
import { FormGroup } from "@blueprintjs/core";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";
import { useDispatch, useSelector } from "react-redux";
import { changePSSAction } from "../../../../../store/pss/actions";
import { ApplicationState } from "../../../../../store";
import { getCurrentPSS } from "../../../../3d-models/utils";

type Props = {};

export function Racks(props: Props) {
  const pss = useSelector((state: ApplicationState) => getCurrentPSS(state));

  const dispatch = useDispatch();

  function handleChange(value: number) {
    if (!pss) return;
    dispatch(changePSSAction(pss.project, "racks", value));
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className={"d-flex f-grow bg-dark p-5"}>
        <div className="d-flex f-grow f-ai-center bg-gray">
          <div className="label-light">No. of Racks to be sorted in one lot</div>
          <FormGroup className="no-m">
            <SimpleNumericInput
              min={0}
              value={pss?.racks}
              onChange={(value) => handleChange(value)}
            />
          </FormGroup>
        </div>
      </div>
    </div>
  );
}
