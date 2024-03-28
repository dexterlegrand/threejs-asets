import React, { FunctionComponent, useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { CustomDlg } from "../../../common/CustomDlg";
import { Button, ProgressBar, FormGroup, InputGroup } from "@blueprintjs/core";
import { ApplicationState } from "../../../../store";
import { CheckBoxCell } from "../../../common/CheckBoxCell";
import { InputCell } from "../../../common/InputCell";
import {
  arrayToString,
  exportToCSV,
  getCurrentProject,
  roundVectorM,
  getCurrentProcess,
  convertToVector3,
} from "../../../3d-models/utils";
import { TClash } from "../../../../store/data/types";
import { focusTarget } from "../../../../store/scene/actions";
import {
  changeProjectModeAction,
  setClashesAction,
} from "../../../../store/main/actions";

type Props = { onClose: () => any };

const ClashCheck: FunctionComponent<Props> = (props) => {
  const [selected, setSelected] = useState<TClash>();
  const [inProgress, setInProgress] = useState(false);
  const [query, setQuery] = useState<string>("");

  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );
  const process = useSelector((state: ApplicationState) =>
    getCurrentProcess(state)
  );
  const clashes = useSelector(
    (state: ApplicationState) => state.main.clashes ?? []
  );

  const dispatch = useDispatch();

  const filtered = useMemo(() => {
    return clashes.filter((c) =>
      c.elements.some((el) => el.name.includes(query))
    );
  }, [clashes, query]);

  useEffect(() => {
    if (!project) return;
    dispatch(changeProjectModeAction(project.name, "clashes"));
    return () => {
      dispatch(changeProjectModeAction(project.name, "standard"));
    };
  }, []);

  useEffect(() => {
    if (!inProgress || !project) return;
    const worker: Worker = new Worker("./workers/clash-check-worker.js");
    worker.onmessage = (e) => {
      dispatch(setClashesAction(e.data));
      setInProgress(false);
    };
    worker.onerror = (e) => {
      console.error(e);
      setInProgress(false);
    };
    worker.postMessage({ project, process });
    return () => {
      worker.terminate();
    };
  }, [inProgress]);

  function handleChange(row: TClash, field: string, value: any) {
    dispatch(
      setClashesAction(
        clashes.map((c) => (c.id === row.id ? { ...c, [field]: value } : c))
      )
    );
    setSelected(undefined);
  }

  function handleSelect(row: TClash, value: boolean) {
    setSelected(value ? row : undefined);
  }

  function handleZoomTo() {
    if (!selected) return;
    dispatch(focusTarget(convertToVector3(selected.pos)));
  }

  interface Element {
    name: string,
  }
  
  function serializeElements(elements:Element[]): string {
    return elements.map(el => el.name).join("/ ");
  }

  interface Position {
    x: number;
    y: number;
    z: number;
  }

  function serializePosition(pos:Position): string  {
    return roundVectorM(convertToVector3(pos)).toArray().join(";");
  }

  function handleExport() {
    exportToCSV(
      clashes.map((c) => ({ 
        ...c, 
        elements: serializeElements(c.elements), 
        pos: serializePosition(c.pos) })),
      "Clash Checks"
    );
  }

  function handleCalculate() {
    setInProgress(true);
  }

  function getRow(row: TClash) {
    return (
      <tr key={row.id}>
        <CheckBoxCell
          value={row.id === selected?.id}
          onChange={(value) => handleSelect(row, value)}
        />
        <td>{row.id}</td>
        <td className="w-220">
          {row.elements.map((el) => el.name).join(", ")}
        </td>
        <td>
          (
          {roundVectorM(convertToVector3(row.pos))
            .toArray()
            .join("; ")}
          )
        </td>
        <CheckBoxCell
          value={row.ignore}
          onChange={(value) => handleChange(row, "ignore", value)}
        />
        <InputCell
          className="w-220"
          value={row.remark}
          onChange={(value) => handleChange(row, "remark", value)}
        />
      </tr>
    );
  }

  return (
    <CustomDlg
      title={"Clash Checks"}
      isMinimize={true}
      body={
        <div className={`d-flex f-column f-grow bg-dark`}>
          <div className="hr" />
          <div className="d-flex label-light bg-dark">
            <Button
              small
              icon="export"
              text="Download CSV"
              intent="success"
              onClick={handleExport}
            />
            <FormGroup className={"no-m f-grow"}>
              <InputGroup
                leftIcon={"search"}
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                rightElement={
                  query ? (
                    <Button
                      minimal
                      small
                      icon={"cross"}
                      onClick={() => setQuery("")}
                    />
                  ) : (
                    undefined
                  )
                }
              />
            </FormGroup>
            <div />
            <Button
              small
              icon="zoom-in"
              text="Zoom To"
              intent="warning"
              onClick={handleZoomTo}
            />
            <Button
              small
              text="Calculate"
              intent="danger"
              onClick={handleCalculate}
            />
          </div>
          <div className="hr" />
          {inProgress ? (
            <>
              <ProgressBar />
              <div className={"hr"} />
            </>
          ) : null}
          <div className="p-5">
            <div className="table-container">
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <th />
                    <th>Clash No.</th>
                    <th>List of Clashing Elements</th>
                    <th>Position</th>
                    <th>Ignore</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length ? filtered.map(getRow) : clashes.map(getRow)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
      onClose={props.onClose}
    />
  );
};

export default ClashCheck;
