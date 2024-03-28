import React, { useEffect, useState } from "react";
import { FormGroup } from "@blueprintjs/core";
import { CustomDlg } from "../../../../common/CustomDlg";
import { TShearKeyDetails } from "../../../../../store/main/types";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";
import { SimpleInput } from "../../../../common/SimpleInput";
import { getLocalStorageImage } from "../../../../3d-models/utils";

type Props = {
  details: TShearKeyDetails;
  onChange: (details: TShearKeyDetails) => any;
  onClose: () => any;
};

const SHEAR_KEY_Url = "./basePlates/SHEAR_KEY.jpg";

export function ShearKeyDetails({ details, onChange, onClose }: Props) {
  const [SHEAR_KEY, setSHEAR_KEY] = useState("");

  useEffect(() => {
    setSHEAR_KEY(localStorage.getItem(SHEAR_KEY_Url) || "");
    getLocalStorageImage(SHEAR_KEY_Url).then(
      (data) => data && setSHEAR_KEY(data)
    );
  }, []);

  function handleChange(field: string, val: any) {
    onChange({ ...details, [field]: val });
  }

  return (
    <CustomDlg
      title={"Shear Key Details"}
      isMinimize={true}
      zIndex={2}
      body={
        <div className={"d-flex f-grow"}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 60px 30px 1fr 50px",
              alignItems: "center",
            }}
          >
            <span className={"label-light"}>Overall depth</span>
            <span className={"label-light"}>
              d<sub>sk</sub>
            </span>
            <span className={"label-light"}>=</span>
            <FormGroup className={"no-m"}>
              <SimpleNumericInput
                min={0}
                isDecimal={true}
                value={details.overalDepth}
                onChange={(val) => handleChange("overalDepth", val)}
              />
            </FormGroup>
            <span className={"label-light"}>mm</span>

            <span className={"label-light"}>Flange width</span>
            <span className={"label-light"}>
              b<sub>sk</sub>
            </span>
            <span className={"label-light"}>=</span>
            <FormGroup className={"no-m"}>
              <SimpleNumericInput
                min={0}
                isDecimal={true}
                value={details.flangeWidth}
                onChange={(val) => handleChange("flangeWidth", val)}
              />
            </FormGroup>
            <span className={"label-light"}>mm</span>

            <span className={"label-light"}>Web thickness</span>
            <span className={"label-light"}>
              t<sub>sk-w</sub>
            </span>
            <span className={"label-light"}>=</span>
            <FormGroup className={"no-m"}>
              <SimpleNumericInput
                min={0}
                isDecimal={true}
                value={details.webThick}
                onChange={(val) => handleChange("webThick", val)}
              />
            </FormGroup>
            <span className={"label-light"}>mm</span>

            <span className={"label-light"}>Flange thickness</span>
            <span className={"label-light"}>
              t<sub>sk-f</sub>
            </span>
            <span className={"label-light"}>=</span>
            <FormGroup className={"no-m"}>
              <SimpleNumericInput
                min={0}
                isDecimal={true}
                value={details.flangeThick}
                onChange={(val) => handleChange("flangeThick", val)}
              />
            </FormGroup>
            <span className={"label-light"}>mm</span>

            <span className={"label-light"}>Length of Shear Key</span>
            <span className={"label-light"}>L</span>
            <span className={"label-light"}>=</span>
            <FormGroup className={"no-m"}>
              <SimpleNumericInput
                min={0}
                isDecimal={true}
                value={details.keyLength}
                onChange={(val) => handleChange("keyLength", val)}
              />
            </FormGroup>
            <span className={"label-light"}>mm</span>

            <span className={"label-light"}>Thickness of Grout</span>
            <span />
            <span className={"label-light"}>=</span>
            <FormGroup className={"no-m"}>
              <SimpleNumericInput
                min={0}
                isDecimal={true}
                value={details.groutThickness}
                onChange={(val) => handleChange("groutThickness", val)}
              />
            </FormGroup>
            <span className={"label-light"}>mm</span>

            <span className={"label-light"}>Material of Shear Key</span>
            <span />
            <span className={"label-light"}>=</span>
            <FormGroup className={"no-m"}>
              <SimpleInput
                value={details.material}
                onChange={(val) => handleChange("material", val)}
              />
            </FormGroup>
            <span />

            <span className={"label-light"}>Material Yielding</span>
            <span className={"label-light"}>
              &#947;<sub>m0</sub>
            </span>
            <span className={"label-light"}>=</span>
            <FormGroup className={"no-m"}>
              <SimpleNumericInput
                isDecimal={true}
                value={details.materialYielding}
                onChange={(val) => handleChange("materialYielding", val)}
              />
            </FormGroup>
            <span />

            <span className={"label-light"}>Material Ultimate Stress</span>
            <span className={"label-light"}>
              &#947;<sub>m1</sub>
            </span>
            <span className={"label-light"}>=</span>
            <FormGroup className={"no-m"}>
              <SimpleNumericInput
                isDecimal={true}
                value={details.materialUltimateStress}
                onChange={(val) => handleChange("materialUltimateStress", val)}
              />
            </FormGroup>
            <span />

            <span className={"label-light"}>Anchor bolt</span>
            <span className={"label-light"}>
              &#947;<sub>mb</sub>
            </span>
            <span className={"label-light"}>=</span>
            <FormGroup className={"no-m"}>
              <SimpleNumericInput
                isDecimal={true}
                value={details.anchorBolt}
                onChange={(val) => handleChange("anchorBolt", val)}
              />
            </FormGroup>
            <span />

            <span className={"label-light"}>Weld</span>
            <span className={"label-light"}>
              &#947;<sub>mw</sub>
            </span>
            <span className={"label-light"}>=</span>
            <FormGroup className={"no-m"}>
              <SimpleNumericInput
                isDecimal={true}
                value={details.weld}
                onChange={(val) => handleChange("weld", val)}
              />
            </FormGroup>
            <span />
          </div>
          <div
            className={"d-flex f-center p-20"}
            style={{ backgroundColor: "white" }}
          >
            <img src={SHEAR_KEY} alt={"shear key"} />
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
}
