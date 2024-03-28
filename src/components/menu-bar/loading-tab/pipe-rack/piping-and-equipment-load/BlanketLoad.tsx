import React, { FunctionComponent, useMemo } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { BlanketLoad, PipeRack } from "../../../../../store/main/types";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { NumericCell } from "../../../../common/NumericCell";
import { changeLoadings } from "../../../../../store/main/actions";
import { InputCell } from "../../../../common/InputCell";
import { CustomDlg } from "../../../../common/CustomDlg";

type Props = { onClose: () => any };

const BlanketLoads: FunctionComponent<Props> = ({ onClose }) => {
  const currentProject = useSelector((state: ApplicationState) => {
    return state.main.projects.find(
      (project) => project.name === state.main.currentProject
    );
  });

  const models = useMemo(() => {
    return currentProject
      ? (currentProject.models.filter(
          (model) => model.type === "Pipe Rack"
        ) as PipeRack[])
      : [];
  }, [currentProject]);

  const loadings = useMemo(() => currentProject?.loadings, [currentProject]);

  const dispatch = useDispatch();

  function handleAddRow() {
    loadings &&
      dispatch(
        changeLoadings({
          ...loadings,
          blanketLoads: [
            ...loadings.blanketLoads,
            {
              id:
                loadings.blanketLoads.reduce(
                  (acc, item) => Math.max(acc, item.id),
                  0
                ) + 1,
              selected: false,
              intensity: 0,
              alongPercent: 0,
              acrossPercent: 0,
            },
          ],
        })
      );
  }

  function handleDeleteRows() {
    loadings &&
      dispatch(
        changeLoadings({
          ...loadings,
          blanketLoads: loadings.blanketLoads.filter((bl) => !bl.selected),
        })
      );
  }

  function handleChangeRow(item: BlanketLoad, field: string, value: any) {
    loadings &&
      dispatch(
        changeLoadings({
          ...loadings,
          blanketLoads: loadings.blanketLoads.map((bl) =>
            bl.id === item.id ? { ...item, [field]: value } : bl
          ),
        })
      );
  }

  function getRow(item: BlanketLoad) {
    return (
      <tr key={item.id}>
        <CheckBoxCell
          value={item.selected}
          onChange={(value) => handleChangeRow(item, "selected", value)}
        />
        <InputCell
          value={item.areaNo}
          onChange={(value) => handleChangeRow(item, "areaNo", value)}
        />
        <SelectorCell<string>
          items={models.map((model) => model.name)}
          selected={item.pr}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeRow(item, "pr", value)}
          filterable={false}
        />
        <SelectorCell<string>
          items={
            models
              .find((model) => model.name === item.pr)
              ?.portals.map((portal) => portal.name) ?? []
          }
          selected={item.fromPortal}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeRow(item, "fromPortal", value)}
          filterable={false}
        />
        <SelectorCell<string>
          items={(
            models
              .find((model) => model.name === item.pr)
              ?.portals.map((portal) => portal.name) ?? []
          ).filter((portal) => portal !== item.fromPortal)}
          selected={item.toPortal}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeRow(item, "toPortal", value)}
          filterable={false}
        />
        <SelectorCell<number>
          items={getTiers(item, models)}
          selected={item.tier}
          itemKey={(item) => item}
          itemLabel={(item) => `${item + 1}`}
          onSelect={(value) => handleChangeRow(item, "tier", value)}
          filterable={false}
        />
        <NumericCell
          value={item.intensity}
          className={"w-100"}
          onChange={(value) => handleChangeRow(item, "intensity", value)}
        />
        <NumericCell
          value={item.alongPercent}
          className={"w-100"}
          onChange={(value) => handleChangeRow(item, "alongPercent", value)}
        />
        <NumericCell
          value={item.acrossPercent}
          className={"w-100"}
          onChange={(value) => handleChangeRow(item, "acrossPercent", value)}
        />
      </tr>
    );
  }

  function getTiers(item: BlanketLoad, models: PipeRack[]) {
    if (!item.pr || !item.fromPortal || !item.toPortal) return [];
    const model = models.find((model) => model.name === item.pr);
    if (!model) return [];
    const from = model.portals.find(
      (portal) => portal.name === item.fromPortal
    );
    const to = model.portals.find((portal) => portal.name === item.toPortal);
    if (!from || !to) return [];
    return (from.tiers.length < to.tiers.length ? from.tiers : to.tiers).map(
      (tier, i) => i
    );
  }

  return (
    <CustomDlg
      title={"Blanket Piping Load"}
      isMinimize={true}
      body={
        <div className="d-flex f-grow f-column">
          <div className="label-light bg-dark">
            <Button
              small
              icon="trash"
              text="Delete"
              intent="warning"
              onClick={handleDeleteRows}
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
              onClick={handleAddRow}
            />
          </div>
          <div className="hr" />
          <div className={"table-container bg-dark p-5"}>
            <table className="table bg-gray">
              <thead>
                <tr>
                  <th></th>
                  <th>Area No.</th>
                  <th>PR No.</th>
                  <th>From Portal</th>
                  <th>To Portal</th>
                  <th>Tier No.</th>
                  <th>
                    Fy Intensity (kg/<sub>m</sub>
                    <sup>2</sup>)
                  </th>
                  <th>Load % along Pipe</th>
                  <th>Load % across Pipe</th>
                </tr>
              </thead>
              <tbody>
                {loadings?.blanketLoads.map((item) => getRow(item))}
              </tbody>
            </table>
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
};

export default BlanketLoads;
