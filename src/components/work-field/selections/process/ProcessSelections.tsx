import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import { SelectedLine } from "./SelectedLine";
import { SelectedProcess } from "./SelectedProcess";
import { SelectedInstr } from "./SelectedInstr";
import { SelectedInstrLine } from "./SelectedInstrLine";
import { SelectedNozzle } from "./SelectedNozzle";

export default function ProcessSelections() {
  const mode = useSelector((state: ApplicationState) => state.main.workMode);
  const current = useSelector(
    (state: ApplicationState) => state.main.currentProject
  );
  const profiles = useSelector(
    (state: ApplicationState) => state.data.pipingSS
  );
  const processState = useSelector((state: ApplicationState) => state.process);

  const disabled = useMemo(() => {
    return !(mode === "PROCESS" || mode === "DESIGNER" || mode === "PRODESIGNER" || mode === "PIPDESIGNER");
  }, [mode]);

  return (
    <>
      <SelectedLine
        current={current}
        processState={processState}
        profiles={profiles}
        disabled={disabled}
      />
      <SelectedProcess
        current={current}
        processState={processState}
        profiles={profiles}
        disabled={disabled}
      />
      <SelectedNozzle
        current={current}
        processState={processState}
        profiles={profiles}
        disabled={disabled}
      />
      <SelectedInstr current={current} disabled={disabled} />
      <SelectedInstrLine
        current={current}
        processState={processState}
        disabled={disabled}
      />
    </>
  );
}
