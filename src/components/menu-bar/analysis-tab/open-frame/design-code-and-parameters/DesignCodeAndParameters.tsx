import React, { useMemo } from "react";
import { FormGroup } from "@blueprintjs/core";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { DesignCodeISParams } from "./DesignCodeISParams";
import DesignCodeUSParams from "./DesignCodeUSParams";
import { DesignCode } from "../../../../../store/main/types";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { CustomDlg } from "../../../../common/CustomDlg";
import { changeUIAction } from "../../../../../store/ui/actions";
import { getCurrentUI } from "../../../../3d-models/utils";

type Props = {
  onClose: () => any;
};

export function DesignCodeAndParametersOF({ onClose }: Props) {
  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const dispatch = useDispatch();

  const DC = useMemo(() => ui?.designCodeAndParametersUI, [ui]);

  function handleChangeDesignCode(designCode?: DesignCode) {
    if (!ui) return;
    dispatch(
      changeUIAction({
        ...ui,
        designCodeAndParametersUI: {
          ...ui.designCodeAndParametersUI,
          designCode: designCode ?? "IS 800 : 2007 LSD",
        },
      })
    );
  }

  return (
    <CustomDlg
      title={"Design Code & Parameters"}
      isMinimize={true}
      body={
        <div className="d-flex f-grow f-column">
          <div className="d-flex f-ai-center bg-dark always" style={{ paddingRight: 10 }}>
            <div className="label-light t-end w-120">Design Code</div>
            <FormGroup className="no-m w-160">
              <SimpleSelector<DesignCode>
                items={["IS 800 : 2007 LSD", "AISC LRFD", "Eurocode 3 [EN 1993-1-1:2005]"]}
                selected={DC?.designCode}
                onSelect={handleChangeDesignCode}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>
          </div>
          <div className={"hr"} />
          {DC?.designCode === "IS 800 : 2007 LSD" && <DesignCodeISParams />}
          {DC?.designCode === "AISC LRFD" && <DesignCodeUSParams />}
          {DC?.designCode === "Eurocode 3 [EN 1993-1-1:2005]" && <></>}
        </div>
      }
      onClose={onClose}
    />
  );
}
