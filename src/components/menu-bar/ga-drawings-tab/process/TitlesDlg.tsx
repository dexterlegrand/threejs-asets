import React, { useState } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import { useDispatch, useSelector } from "react-redux";
import { FormGroup, TextArea, Button } from "@blueprintjs/core";
import { SimpleInput } from "../../../common/SimpleInput";
import { TProcessRevision } from "../../../../store/process/types";
import {
  changeProcessTitlesAction,
  changeProcessRevisionsAction,
} from "../../../../store/process/actions";
import { InputCell } from "../../../common/InputCell";
import { getNextId } from "../../../3d-models/utils";
import { CheckBoxCell } from "../../../common/CheckBoxCell";
import { ApplicationState } from "../../../../store";

type Props = {
  current: string;
  onClose: () => any;
};

export function TitlesDlg({ current, onClose }: Props) {
  const [selected, setSelected] = useState<number[]>([]);

  const processes = useSelector((state: ApplicationState) => state.process);

  const dispatch = useDispatch();

  function handleChange(field: string, value: any) {
    dispatch(changeProcessTitlesAction(current, field, value));
  }

  function handleAdd() {
    const process = processes.processes.get(current);
    if (!process) return;
    dispatch(
      changeProcessRevisionsAction(current, [
        ...(process.revisions ?? []),
        { id: getNextId(process.revisions) },
      ])
    );
  }

  function handleRemove() {
    const process = processes.processes.get(current);
    if (!process) return;
    dispatch(
      changeProcessRevisionsAction(
        current,
        process.revisions?.filter((r) => !selected.includes(r.id)) ?? []
      )
    );
    setSelected([]);
  }

  function handleChangeRevision(
    changedR: TProcessRevision,
    field: string,
    value: any
  ) {
    const process = processes.processes.get(current);
    if (!process) return;
    dispatch(
      changeProcessRevisionsAction(
        current,
        process.revisions?.map((r) =>
          r.id !== changedR.id ? r : { ...r, [field]: value }
        ) ?? []
      )
    );
  }

  return (
    <CustomDlg
      title={"Title Block with logos & revision history"}
      isMinimize={true}
      zIndex={2}
      onClose={onClose}
      body={
        <div className={"d-flex f-column f-grow"}>
          <div className={"d-flex f-grow bg-dark p-5"}>
            <div
              className="d-flex f-grow f-column bg-gray"
              style={{ paddingRight: 10 }}
            >
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-120">Project name:</div>
                <FormGroup className="no-m f-grow">
                  <SimpleInput
                    value={processes.processes.get(current)?.titles?.project}
                    onChange={(value) => handleChange("project", value)}
                  />
                </FormGroup>
              </div>

              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-120">
                  Project created by:
                </div>
                <FormGroup className="no-m f-grow">
                  <SimpleInput
                    value={processes.processes.get(current)?.titles?.createdBy}
                    onChange={(value) => handleChange("createdBy", value)}
                  />
                </FormGroup>
              </div>

              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-120">Customer:</div>
                <FormGroup className="no-m f-grow">
                  <SimpleInput
                    value={processes.processes.get(current)?.titles?.customer}
                    onChange={(value) => handleChange("customer", value)}
                  />
                </FormGroup>
              </div>

              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-120">Title:</div>
                <FormGroup className="no-m f-grow">
                  <SimpleInput
                    value={processes.processes.get(current)?.titles?.title}
                    onChange={(value) => handleChange("title", value)}
                  />
                </FormGroup>
              </div>

              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-120">Drawn:</div>
                <FormGroup className="no-m f-grow">
                  <SimpleInput
                    value={processes.processes.get(current)?.titles?.drawn}
                    onChange={(value) => handleChange("drawn", value)}
                  />
                </FormGroup>
              </div>

              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-120">Scale:</div>
                <FormGroup className="no-m f-grow">
                  <SimpleInput
                    value={processes.processes.get(current)?.titles?.scale}
                    onChange={(value) => handleChange("scale", value)}
                  />
                </FormGroup>
              </div>

              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-120">Specific Notes:</div>
                <FormGroup className="no-m f-grow">
                  <TextArea
                    fill={true}
                    small={true}
                    growVertically={true}
                    value={
                      processes.processes.get(current)?.titles?.specificNotes
                    }
                    onChange={(value) =>
                      handleChange("specificNotes", value.currentTarget.value)
                    }
                    maxLength={255}
                  />
                </FormGroup>
              </div>
            </div>
          </div>
          <div className="hr" />
          <div className="d-flex f-grow f-column">
            <div className="label-light bg-dark">
              <span>Revisions</span>
              <Button
                small
                icon="trash"
                text="Delete"
                intent="warning"
                onClick={handleRemove}
              />
              <Button
                small
                icon="plus"
                text="Add Row"
                intent="primary"
                onClick={handleAdd}
              />
            </div>
            <div className="hr" />
            <div className={"small-table-container bg-dark p-5"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <th></th>
                    <th>No.</th>
                    <th>Date</th>
                    <th>Modification</th>
                    <th>Reviewed by</th>
                    <th>Checked by</th>
                    <th>Approved by</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.processes.get(current)?.revisions?.map((r) => (
                    <tr key={r.id}>
                      <CheckBoxCell
                        key={r.id}
                        value={selected.includes(r.id)}
                        onChange={(val) =>
                          val
                            ? setSelected([...selected, r.id])
                            : setSelected(selected.filter((s) => s !== r.id))
                        }
                      />
                      <td>{r.id}</td>
                      <InputCell
                        value={r.date}
                        onChange={(val) => handleChangeRevision(r, "date", val)}
                        className={"w-100"}
                      />
                      <InputCell
                        value={r.modification}
                        onChange={(val) =>
                          handleChangeRevision(r, "modification", val)
                        }
                        className={"w-100"}
                      />
                      <InputCell
                        value={r.reviewedBy}
                        onChange={(val) =>
                          handleChangeRevision(r, "reviewedBy", val)
                        }
                        className={"w-100"}
                      />
                      <InputCell
                        value={r.checkedBy}
                        onChange={(val) =>
                          handleChangeRevision(r, "checkedBy", val)
                        }
                        className={"w-100"}
                      />
                      <InputCell
                        value={r.approvedBy}
                        onChange={(val) =>
                          handleChangeRevision(r, "approvedBy", val)
                        }
                        className={"w-100"}
                      />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    />
  );
}
