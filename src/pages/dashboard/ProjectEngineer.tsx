import React, { useState } from "react";
import {
  EDashboardCheckType,
  TDashboardEngineerGroup,
  TDashboardEngineer,
} from "../../store/main/types";
import { Button, Popover } from "@blueprintjs/core";
import { getNextId } from "../../components/3d-models/utils";
import { InputCell } from "../../components/common/InputCell";

import "./dashboard_css/ProjectCheckItem.css";
import { InputDlg } from "../../components/common/InputDlg";

type Props = {
  item: TDashboardEngineerGroup;
  onChange: (item: TDashboardEngineerGroup, field: string, val: any) => any;
  onDelete: (item: TDashboardEngineerGroup) => any;
};

export default function ProjectEngineer({ item, onChange, onDelete }: Props) {
  const [dlg, setDlg] = useState<JSX.Element>();

  const handleAdd = () => {
    const id = getNextId(item.engineers);
    onChange(item, "engineers", [
      ...item.engineers,
      {
        id,
        name: `New Engineer ${id}`,
        attending: EDashboardCheckType.NONE,
        invitation: EDashboardCheckType.NONE,
        thanks: EDashboardCheckType.NONE,
      },
    ]);
  };

  const handleChange = (task: TDashboardEngineer, field: string, val: any) => {
    onChange(
      item,
      "engineers",
      item.engineers.map((item) =>
        item.id === task.id ? { ...task, [field]: val } : item
      )
    );
  };

  const handleDelete = (task: TDashboardEngineer) => {
    onChange(
      item,
      "engineers",
      item.engineers.filter((item) => item.id !== task.id)
    );
  };

  return (
    <div className={"dashboard-checklist-item-project"}>
      {dlg}
      <div className={"dashboard-checklist-item-header"}>
        <h3
          className={"no-m d-flex f-grow h-100p"}
          onClick={() =>
            setDlg(
              <InputDlg
                title="Change header"
                onClose={(val) => {
                  onChange(item, "header", val);
                  setDlg(undefined);
                }}
              />
            )
          }
        >
          {item.header}
        </h3>
        <Button
          className="white-icon"
          icon={"cross"}
          minimal
          onClick={() => onDelete(item)}
        />
      </div>
      <table className={"dashboard-table-project-check-item"}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Engineer</th>
            <th>Reviewer</th>
            <th>Approver</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {item.engineers.map((engineer) => {
            return (
              <tr key={engineer.id}>
                <InputCell
                  value={engineer.name}
                  className={"w-100p"}
                  onChange={(val) => handleChange(engineer, "name", val)}
                />
                <td>
                  <Popover
                    fill={true}
                    minimal={true}
                    position={"bottom"}
                    boundary={"viewport"}
                    popoverClassName={"p-5 bg-gray"}
                    targetClassName={"h-100p d-flex f-center"}
                    className={"h-100p"}
                    content={
                      <>
                        <Button
                          minimal
                          className="white-icon"
                          icon={"circle"}
                          onClick={() =>
                            handleChange(
                              engineer,
                              "invitation",
                              EDashboardCheckType.NONE
                            )
                          }
                        />
                        <Button
                          minimal
                          className="white-icon"
                          icon={"confirm"}
                          onClick={() =>
                            handleChange(
                              engineer,
                              "invitation",
                              EDashboardCheckType.FINISHED
                            )
                          }
                        />
                        <Button
                          minimal
                          className="white-icon"
                          icon={"delete"}
                          onClick={() =>
                            handleChange(
                              engineer,
                              "invitation",
                              EDashboardCheckType.UNFINISHED
                            )
                          }
                        />
                      </>
                    }
                    target={
                      <Button
                        className="white-icon"
                        minimal
                        icon={getButtonIcon(engineer.invitation)}
                      />
                    }
                  />
                </td>
                <td>
                  <Popover
                    fill={true}
                    minimal={true}
                    position={"bottom"}
                    boundary={"viewport"}
                    popoverClassName={"p-5 bg-gray"}
                    targetClassName={"h-100p d-flex f-center"}
                    className={"h-100p"}
                    content={
                      <>
                        <Button
                          minimal
                          className="white-icon"
                          icon={"circle"}
                          onClick={() =>
                            handleChange(
                              engineer,
                              "attending",
                              EDashboardCheckType.NONE
                            )
                          }
                        />
                        <Button
                          minimal
                          className="white-icon"
                          icon={"confirm"}
                          onClick={() =>
                            handleChange(
                              engineer,
                              "attending",
                              EDashboardCheckType.FINISHED
                            )
                          }
                        />
                        <Button
                          minimal
                          className="white-icon"
                          icon={"delete"}
                          onClick={() =>
                            handleChange(
                              engineer,
                              "attending",
                              EDashboardCheckType.UNFINISHED
                            )
                          }
                        />
                      </>
                    }
                    target={
                      <Button
                        className="white-icon"
                        minimal
                        icon={getButtonIcon(engineer.attending)}
                      />
                    }
                  />
                </td>
                <td>
                  <Popover
                    fill={true}
                    minimal={true}
                    position={"bottom"}
                    boundary={"viewport"}
                    popoverClassName={"p-5 bg-gray"}
                    targetClassName={"h-100p d-flex f-center"}
                    className={"h-100p"}
                    content={
                      <>
                        <Button
                          minimal
                          className="white-icon"
                          icon={"circle"}
                          onClick={() =>
                            handleChange(
                              engineer,
                              "thanks",
                              EDashboardCheckType.NONE
                            )
                          }
                        />
                        <Button
                          minimal
                          className="white-icon"
                          icon={"confirm"}
                          onClick={() =>
                            handleChange(
                              engineer,
                              "thanks",
                              EDashboardCheckType.FINISHED
                            )
                          }
                        />
                        <Button
                          minimal
                          className="white-icon"
                          icon={"delete"}
                          onClick={() =>
                            handleChange(
                              engineer,
                              "thanks",
                              EDashboardCheckType.UNFINISHED
                            )
                          }
                        />
                      </>
                    }
                    target={
                      <Button
                        className="white-icon"
                        minimal
                        icon={getButtonIcon(engineer.thanks)}
                      />
                    }
                  />
                </td>
                
                  <Button
                    minimal
                    className="white-icon"
                    icon={"delete"}
                    intent={"danger"}
                    onClick={() => handleDelete(engineer)}
                  />
                
              </tr>
            );
          })}
        </tbody>
      </table>
      <Button
        minimal
        className="button-primary-b1l"
        icon={"plus"}
        onClick={() => handleAdd()}
      />
    </div>
  );
}

function getButtonIcon(type: EDashboardCheckType) {
  switch (type) {
    case EDashboardCheckType.FINISHED:
      return "confirm";
    case EDashboardCheckType.UNFINISHED:
      return "delete";
    case EDashboardCheckType.NONE:
      return "circle";
  }
}
