import React, { useState } from "react";
import { OFFromDetailsUI } from "../../../../../store/ui/types";
import { CustomDlg } from "../../../../common/CustomDlg";
import { NumericCell } from "../../../../common/NumericCell";
import { Button } from "@blueprintjs/core";
import { SelectorCell } from "../../../../common/SelectorCell";
import { SupportType } from "../../../../../store/main/types";
import { supportTypes } from "../../../../../store/main/constants";

type Props = {
  onChange: (details: OFFromDetailsUI) => any;
  onClose: () => any;
} & OFFromDetailsUI;

export function FromDetails(props: Props) {
  const { vertical, horizontal, supportType, onChange, onClose } = props;

  const [details, setDetails] = useState<OFFromDetailsUI>({
    vertical,
    horizontal,
    supportType,
  });

  return (
    <CustomDlg
      title={"Details"}
      zIndex={3}
      onClose={onClose}
      body={
        <div className="d-flex f-column">
          <div className="hr" />
          <div className="p-5 bg-dark">
            <div className={"small-table-container"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <th>Geometrical Property</th>
                    <th className={"w-200"}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Vertical Distance to be Covered (m)</td>
                    <NumericCell
                      min={0}
                      isDecimal={true}
                      value={details.vertical}
                      onChange={(vertical) =>
                        setDetails({ ...details, vertical })
                      }
                    />
                  </tr>
                  <tr>
                    <td>Horizontal Distance to be Covered (m)</td>
                    <NumericCell
                      isDecimal={true}
                      value={details.horizontal}
                      onChange={(horizontal) =>
                        setDetails({ ...details, horizontal })
                      }
                    />
                  </tr>
                  <tr>
                    <td>Support Type at end of both Stringers</td>
                    <SelectorCell<SupportType>
                      items={supportTypes}
                      selected={details.supportType}
                      onSelect={(supportType) =>
                        setDetails({ ...details, supportType })
                      }
                      itemKey={(item) => item}
                      itemLabel={(item) => item}
                      filterable={false}
                      clearable={true}
                    />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="hr" />
        </div>
      }
      actions={
        <>
          <Button text="Cancel" onClick={onClose} />
          <Button
            text="Apply"
            onClick={() => onChange(details)}
            intent={"primary"}
          />
        </>
      }
    />
  );
}
