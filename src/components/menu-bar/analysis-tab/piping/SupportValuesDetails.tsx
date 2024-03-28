import React, { useState, useEffect, useMemo } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import { TSupportDetail } from "../../../../store/main/types";
import { Button } from "@blueprintjs/core";
import { SelectorCell } from "../../../common/SelectorCell";
import { roundM, strFilter } from "../../../3d-models/utils";

type Props = {
  supp: TSupportDetail;
  onClose: () => any;
  onSave: (supp: TSupportDetail) => any;
};

export function SupportValuesDetails(props: Props) {
  const { supp, onSave, onClose } = props;

  const [x, setX] = useState<string>();
  const [y, setY] = useState<string>();
  const [z, setZ] = useState<string>();
  const [Rx, setRx] = useState<string>();
  const [Ry, setRy] = useState<string>();
  const [Rz, setRz] = useState<string>();

  useEffect(() => {
    setX(supp.x);
    setY(supp.y);
    setZ(supp.z);
    setRx(supp.Rx);
    setRy(supp.Ry);
    setRz(supp.Rz);
  }, [supp]);

  const isSlave = useMemo(() => {
    return supp.type === "Slave Node";
  }, [supp]);

  const enabled = useMemo(() => {
    const isCustom = supp.type.includes("Custom");
    // const isPM = supp.type === "Custom+" || supp.type === "Custom-";
    // const isK = supp.valueType === "K";
    // return isPM ? !isK : isCustom;
    return isCustom;
  }, [supp]);

  function getTitle() {
    switch (supp.valueType) {
      case "K":
        return "Stiffness values in N, m & Deg. Units";
      case "δ allow.":
        return "Gap along translation in mm and rotation in rad.";
      case "δ appl.":
        return "Displacement along translation in mm and rotation in rad.";
      default:
        return "";
    }
  }

  return (
    <CustomDlg
      title={getTitle()}
      zIndex={12}
      onClose={onClose}
      body={
        <div className="d-flex f-column">
          <div className="p-5 bg-dark">
            <div className={"small-table-container"}>
              <table className="table bg-gray">
                <thead>
                  <th>{supp.valueType}x</th>
                  <th>{supp.valueType}y</th>
                  <th>{supp.valueType}z</th>
                  <th>{supp.valueType}Rx</th>
                  <th>{supp.valueType}Ry</th>
                  <th>{supp.valueType}Rz</th>
                </thead>
                <tbody>
                  <SelectorCell<string>
                    items={isSlave ? ["Released"] : []}
                    itemKey={(val) => val}
                    itemLabel={(val) => val}
                    selected={x}
                    onSelect={setX}
                    disabled={!((enabled && supp.direction === "X") || isSlave)}
                    onCreate={(val) => `${roundM(Math.abs(Number(val) || 0))}`}
                    filter={strFilter}
                    className={"w-100"}
                    clearable={true}
                  />
                  <SelectorCell<string>
                    items={isSlave ? ["Released"] : []}
                    itemKey={(val) => val}
                    itemLabel={(val) => val}
                    selected={y}
                    onSelect={setY}
                    disabled={!((enabled && supp.direction === "Y") || isSlave)}
                    onCreate={(val) => `${roundM(Math.abs(Number(val) || 0))}`}
                    filter={strFilter}
                    className={"w-100"}
                    clearable={true}
                  />
                  <SelectorCell<string>
                    items={isSlave ? ["Released"] : []}
                    itemKey={(val) => val}
                    itemLabel={(val) => val}
                    selected={z}
                    onSelect={setZ}
                    disabled={!((enabled && supp.direction === "Z") || isSlave)}
                    onCreate={(val) => `${roundM(Math.abs(Number(val) || 0))}`}
                    filter={strFilter}
                    className={"w-100"}
                    clearable={true}
                  />
                  <SelectorCell<string>
                    items={isSlave ? ["Released"] : []}
                    itemKey={(val) => val}
                    itemLabel={(val) => val}
                    selected={Rx}
                    onSelect={setRx}
                    disabled={!((enabled && supp.direction === "RX") || isSlave)}
                    onCreate={(val) => `${roundM(Math.abs(Number(val) || 0))}`}
                    filter={strFilter}
                    className={"w-100"}
                    clearable={true}
                  />
                  <SelectorCell<string>
                    items={isSlave ? ["Released"] : []}
                    itemKey={(val) => val}
                    itemLabel={(val) => val}
                    selected={Ry}
                    onSelect={setRy}
                    disabled={!((enabled && supp.direction === "RY") || isSlave)}
                    onCreate={(val) => `${roundM(Math.abs(Number(val) || 0))}`}
                    filter={strFilter}
                    className={"w-100"}
                    clearable={true}
                  />
                  <SelectorCell<string>
                    items={isSlave ? ["Released"] : []}
                    itemKey={(val) => val}
                    itemLabel={(val) => val}
                    selected={Rz}
                    onSelect={setRz}
                    disabled={!((enabled && supp.direction === "RZ") || isSlave)}
                    onCreate={(val) => `${roundM(Math.abs(Number(val) || 0))}`}
                    filter={strFilter}
                    className={"w-100"}
                    clearable={true}
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
      actions={
        <>
          <Button text="Cancel" onClick={onClose} />
          <Button
            text="Save"
            onClick={() => onSave({ ...supp, x, y, z, Rx, Ry, Rz })}
            intent={"primary"}
          />
        </>
      }
    />
  );
}
