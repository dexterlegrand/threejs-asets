import React, { useState } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import { CustomTabsDlg } from "../../../common/CustomTabsDlg";
import { TDropDownItem } from "../../../../store/ui/types";
import { SettingsContent } from "./SettingsContent";
import CustomGrid from "./grid-settings/CustomGrid";

type Props = {
  onClose: () => any;
};

const tabs: TDropDownItem[] = [
  { id: 4, name: "Display" },
  { id: 0, name: "Modeling" },
  { id: 1, name: "Camera" },
  { id: 2, name: "Grid" },
  { id: 3, name: "Analysis" },
];

export function SettingsDlg(props: Props) {
  const { onClose } = props;

  const [dlg, setDlg] = useState<JSX.Element>();
  const [selected, setSelected] = useState<number>(0);

  function handleSetDlg() {
    setDlg(<CustomGrid onClose={() => setDlg(undefined)} />);
  }

  return (
    <>
      {dlg}
      <CustomDlg
        title={"Settings"}
        isMinimize={true}
        idText="settings-dialog"
        body={
          <div className={"d-flex f-column f-grow bg-dark"}>
            <CustomTabsDlg tabs={tabs} selected={selected} onSelect={setSelected} />
            <SettingsContent selected={selected} openCustomGrids={handleSetDlg} />
          </div>
        }
        onClose={onClose}
      />
    </>
  );
}
