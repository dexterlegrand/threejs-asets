import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { FreePipe } from "../../../../../store/main/types";
import { Button } from "@blueprintjs/core";
import { getElementByName } from "../../../../3d-models/utils";

export function FEED() {
  const [opened, setOpen] = useState<number>();

  const neProjects = useSelector(
    (state: ApplicationState) =>
      getElementByName(state.main.projects, state.main.currentProject)?.notEditableProjects ?? []
  );

  const pipes = useMemo(() => {
    if (!neProjects) return [];
    let pipes: FreePipe[] = [];
    neProjects.forEach((project) => {
      pipes = [...pipes, ...(project.freePipes ?? [])];
    });
    return pipes;
  }, [neProjects]);

  function getRow(row: FreePipe, i: number) {
    return (
      <tr key={i}>
        <td>{row.line}</td>
        <td>{row.pipe}</td>
        <td>
          ({row.x1}; {row.y1}; {row.z1})
        </td>
        <td>
          ({row.x2}; {row.y2}; {row.z2})
        </td>
        <td>{row.params.lib}</td>
        <td>
          {row.params.profile
            ? `${row.params.profile.nominal_pipe_size_inch} - ${row.params.profile.schedule}`
            : ""}
        </td>
        <td>{row.params.material?.material_name}</td>
        <td>{row.params.od}</td>
        <td>{row.params.thickness}</td>
        <td>{row.params.endConnectorType}</td>
        <td>{row.params.numberOfSupports}</td>
        <td>
          <div className={"d-flex f-column"}>
            <Button
              small
              minimal
              icon={"menu"}
              className="c-light"
              onClick={() => setOpen(opened !== i ? i : undefined)}
            />
            {opened === i && row.params.supportDetails?.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Distance</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {row.params.supportDetails.map((supp, j) => (
                    <tr key={`${i}-${j}`}>
                      <td>{supp.distance}</td>
                      <td>{supp.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">Pipes</div>
      <div className="hr" />
      <div className="p-5 bg-dark">
        <div className={"small-table-container"}>
          <table className="table bg-gray">
            <thead>
              <tr>
                <th>Line No.</th>
                <th>Pipe No.</th>
                <th>Start Pos.</th>
                <th>End Pos.</th>
                <th>C/S Library</th>
                <th>Profile</th>
                <th>Material</th>
                <th>Outer Diameter (mm)</th>
                <th>Wall Thickness (mm)</th>
                <th>End Connector Type</th>
                <th>No. of Supports</th>
                <th>Supports Details</th>
              </tr>
            </thead>
            <tbody>{pipes.map((item, i) => getRow(item, i))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
