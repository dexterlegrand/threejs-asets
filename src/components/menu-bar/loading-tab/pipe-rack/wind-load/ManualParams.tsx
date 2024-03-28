import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";
import { changeLoadings } from "../../../../../store/main/actions";
import { Button } from "@blueprintjs/core";

export function ManualParams() {
  const loadings = useSelector((state: ApplicationState) => {
    return state.main.projects.find(
      (project) => project.name === state.main.currentProject
    )?.loadings;
  });

  const dispatch = useDispatch();

  const manualWindCode = useMemo(() => loadings?.manualWindCode ?? [], [
    loadings,
  ]);

  function handleAdd() {
    loadings &&
      dispatch(
        changeLoadings({
          ...loadings,
          manualWindCode: [
            ...manualWindCode,
            {
              id:
                manualWindCode.reduce(
                  (max, item) => Math.max(max, item.id),
                  0
                ) + 1,
              selected: false,
              height: 0,
              pressure: 0,
            },
          ],
        })
      );
  }

  function handleDelete() {
    loadings &&
      dispatch(
        changeLoadings({
          ...loadings,
          manualWindCode: manualWindCode.filter((item) => !item.selected),
        })
      );
  }

  function handleChange(id: number, field: string, value: any) {
    loadings &&
      dispatch(
        changeLoadings({
          ...loadings,
          manualWindCode: manualWindCode.map((item) =>
            item.id === id ? { ...item, [field]: value } : item
          ),
        })
      );
  }

  return (
    <div className={"d-flex f-column f-grow"}>
      <div className={"label-light bg-dark"}>
        <Button
          small
          icon="trash"
          text="Delete"
          intent="warning"
          onClick={handleDelete}
        />
        <Button
          small
          icon="export"
          text="Export to CSV"
          intent="success"
          disabled={true}
        />
        <Button
          small
          icon="import"
          text="Import from CSV"
          intent="success"
          disabled={true}
        />
        <Button
          small
          icon="plus"
          text="Add Row"
          intent="primary"
          onClick={handleAdd}
        />
      </div>
      <div className={"hr"} />
      <div className={"d-flex f-grow bg-dark p-5"}>
        <div className={"d-flex f-grow small-table-container"}>
          <table className={"table bg-gray"}>
            <thead>
              <tr>
                <th>{""}</th>
                <th>Height</th>
                <th>
                  Pressure (kN/m<sup>2</sup>)
                </th>
              </tr>
            </thead>
            <tbody>
              {manualWindCode.map((item) => (
                <tr key={item.id}>
                  <CheckBoxCell
                    key={item.id}
                    value={item.selected}
                    onChange={(value) =>
                      handleChange(item.id, "selected", value)
                    }
                  />
                  <NumericCell
                    min={0}
                    isDecimal={true}
                    value={item.height}
                    onChange={(value) => handleChange(item.id, "height", value)}
                    className={"w-50p"}
                  />
                  <NumericCell
                    min={0}
                    isDecimal={true}
                    value={item.pressure}
                    onChange={(value) =>
                      handleChange(item.id, "pressure", value)
                    }
                    className={"w-50p"}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
