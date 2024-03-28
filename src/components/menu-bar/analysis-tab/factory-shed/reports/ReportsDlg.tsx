import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { ReactionSummaryFS } from "./tables/ReactionSummary";
import { MemberEndForcesFS } from "./tables/MemberEndForces";
import { MemberStressCheckFS } from "./tables/MemberStressCheck";
import { NodalDisplacementsFS } from "./tables/NodalDisplacements";
import { CustomDlg } from "../../../../common/CustomDlg";
import { getElementByName, convertToNamesArray } from "../../../../3d-models/utils";
import { getFSModels } from "../../../../3d-models/openFrame";

type Props = {
  table: number;
  onClose: () => any;
};

export function ReportDlgFS(props: Props) {
  const { table, onClose } = props;

  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const models = useMemo(() => {
    return convertToNamesArray(getFSModels(project));
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
      default:
        return "";
    }
  }

  function drawTable() {
    switch (table) {
      case 1:
        return <ReactionSummaryFS models={models} />;
      case 2:
        return <MemberEndForcesFS models={models} />;
      case 3:
        return <MemberStressCheckFS models={models} />;
      case 4:
        return <NodalDisplacementsFS models={models} />;
      default:
        return null;
    }
  }

  return (
    <CustomDlg title={getDialogTitle()} isMinimize={true} body={drawTable()} onClose={onClose} />
  );
}
