import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { ReactionSummaryOF } from "./tables/ReactionSummary";
import { MemberEndForcesOF } from "./tables/MemberEndForces";
import { MemberStressCheckOF } from "./tables/MemberStressCheck";
import { NodalDisplacementsOF } from "./tables/NodalDisplacements";
import { CustomDlg } from "../../../../common/CustomDlg";
import { getElementByName, convertToNamesArray } from "../../../../3d-models/utils";
import { getOFModels } from "../../../../3d-models/openFrame";
import { DeflectionCheckOF } from "./tables/DeflectionCheck";

type Props = {
  table: number;
  onClose: () => any;
};

export function ReportDlgOF(props: Props) {
  const { table, onClose } = props;

  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const models = useMemo(() => {
    return convertToNamesArray(getOFModels(project));
  }, [project]);

  function getDialogTitle() {
    switch (table) {
      case 1:
        return "Support Reactions";
      case 2:
        return "Member End Forces";
      case 3:
        return "Member Stress Check";
      case 4:
        return "Nodal Displacements";
      case 5:
        return "Deflection Check";
      default:
        return "";
    }
  }

  function drawTable() {
    switch (table) {
      case 1:
        return <ReactionSummaryOF models={models} />;
      case 2:
        return <MemberEndForcesOF models={models} />;
      case 3:
        return <MemberStressCheckOF models={models} />;
      case 4:
        return <NodalDisplacementsOF models={models} />;
      case 5:
        return <DeflectionCheckOF models={models} />;
      default:
        return null;
    }
  }

  return (
    <CustomDlg title={getDialogTitle()} isMinimize={true} body={drawTable()} onClose={onClose} />
  );
}
