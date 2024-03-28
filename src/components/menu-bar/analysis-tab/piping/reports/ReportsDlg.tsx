import React from "react";
import { ReactionSummaryPP } from "./ReactionSummary";
import { MemberEndForcesPP } from "./MemberEndForces";
import { NodalDisplacementsPP } from "./NodalDisplacements";
import { CustomDlg } from "../../../../common/CustomDlg";
import { MemberStressCheckPP } from "./MemberStressCheck";
import { PipeThicknessCheck } from "./PipeThicknessCheck";
import { FlangeCheck } from "./FlangeCheck";
import { DeflectionCheckPP } from "./DeflectionCheck";
import { NodalStressCheckPP } from "./NodalStressCheck";
import SpringHanger from "./SpringHanger";

type Props = {
  table: number;
  onClose: () => any;
};

export function ReportDlgPP(props: Props) {
  const { table, onClose } = props;

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
        return "Pipe Thickness Check";
      case 6:
        return "Flange Check";
      case 7:
        return "Deflection Check";
      case 8:
        return "Nodal Stress Check";
      case 9:
        return "Spring Hanger";
      default:
        return "";
    }
  }

  function drawTable() {
    switch (table) {
      case 1:
        return <ReactionSummaryPP />;
      case 2:
        return <MemberEndForcesPP />;
      case 3:
        return <MemberStressCheckPP />;
      case 4:
        return <NodalDisplacementsPP />;
      case 5:
        return <PipeThicknessCheck />;
      case 6:
        return <FlangeCheck />;
      case 7:
        return <DeflectionCheckPP />;
      case 8:
        return <NodalStressCheckPP />;
      case 9:
        return <SpringHanger />;
      default:
        return null;
    }
  }

  return (
    <CustomDlg title={getDialogTitle()} isMinimize={true} body={drawTable()} onClose={onClose} />
  );
}
