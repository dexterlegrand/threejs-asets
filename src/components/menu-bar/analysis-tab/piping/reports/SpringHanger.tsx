import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { getCSVFromBE } from "../../../../../store/main/actions";
import GenericTable, { THeader, TDataField, TField } from "../../../../common/table/GenericTable";
import {
  exportToCSV,
  getCurrentProject,
  getCurrentUI,
  getUnicuesArray,
} from "../../../../3d-models/utils";
import { Button, FormGroup } from "@blueprintjs/core";
import { SimpleSelector } from "../../../../common/SimpleSelector";

const header: THeader = {
  rows: [
    {
      columns: [
        { title: "LC" },
        { title: "Node" },
        { title: "DOF" },
        { title: "Allow. disp. (mm)" },
        { title: "F(N)" },
        { title: "K(N, mm)" },
      ],
    },
  ],
};

export default function SpringHanger() {
  const [rows, setRows] = useState<any[]>([]);
  const [line, setLine] = useState<string>();
  const [LC, setLC] = useState<string>();

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const project = useSelector((state: ApplicationState) => getCurrentProject(state));

  const dispatch = useDispatch();

  const inProgress = useMemo(() => ui?.requests?.hanger, [ui]);

  const lines: string[] = useMemo(() => {
    return getUnicuesArray(project?.freePipes?.map((fp) => `${fp.line}`) ?? []);
  }, [project]);

  const lineLC = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const line of lines) {
      const checks = ui?.analysisUI[line]?.reactionSupports;
      if (checks)
        map.set(
          line,
          checks.map((c) => c.LCNumber)
        );
    }
    return map;
  }, [lines]);

  const dataFields: TDataField[] = useMemo(() => {
    return rows.map((r) => {
      const fields: TField[] = [
        { type: "CELL", value: LC },
        { type: "CELL", value: r[" Node"] },
        { type: "CELL", value: r[" DOF"] },
        { type: "CELL", value: r[" All. disp."] },
        { type: "CELL", value: r[" F hot"] },
        { type: "CELL", value: r["K"] },
      ];

      return { id: r["ID hanger"], fields };
    });
  }, [rows, LC]);

  const availableLines = useMemo(() => {
    return [...lineLC.keys()];
  }, [lineLC]);

  const availableLCs = useMemo(() => {
    return line ? [...new Set(lineLC.get(line) ?? [])] : [];
  }, [line, lineLC]);

  function handleExport() {
    exportToCSV(
      rows.map((r) => {
        return {
          id: r["ID hanger"],
          LC: LC ?? "",
          Node: r[" Node"],
          DOF: r[" DOF"],
          "Allow. disp. (mm)": r[" All. disp."],
          "F(N)": r[" F hot"],
          "K(N, mm)": r["K"],
        };
      }),
      "Spring Hanger"
    );
  }

  // function handleImport() {
  //   importFromCSV((data) => {
  //     if (!Array.isArray(data)) return;
  //     console.log(data);
  //   });
  // }

  function handleGetData() {
    if (!project || !line || !LC) return;
    getCSVFromBE(dispatch, project, line, LC, setRows);
  }

  return (
    <div className="d-flex f-column f-grow">
      <GenericTable
        header={header}
        dataFields={dataFields}
        onExport={handleExport}
        // onImport={handleImport}
        titleElement={
          <>
            <div className="d-flex f-ai-center">
              <div className="label-light t-end w-90">Line No.</div>
              <FormGroup className="no-m w-100">
                <SimpleSelector<string>
                  items={availableLines}
                  selected={line}
                  onSelect={setLine}
                  itemLabel={(v) => v}
                  className="fill-select"
                />
              </FormGroup>
            </div>
            <div className="d-flex f-ai-center">
              <div className="label-light t-end w-90">LC No.</div>
              <FormGroup className="no-m w-100">
                <SimpleSelector<string>
                  items={availableLCs}
                  selected={LC}
                  onSelect={setLC}
                  itemLabel={(v) => v}
                  className="fill-select"
                />
              </FormGroup>
            </div>
            <Button
              small
              intent={"danger"}
              text={"Get Data"}
              disabled={!line || !LC}
              onClick={handleGetData}
            />
          </>
        }
        inProgress={inProgress}
      />
    </div>
  );
}
