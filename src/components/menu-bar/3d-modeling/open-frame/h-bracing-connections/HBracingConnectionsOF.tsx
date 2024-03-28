import { Button } from "@blueprintjs/core";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRecoilState } from "recoil";
import { beamConnections } from "../../../../../recoil/atoms/beam-connections-atom";
import { ApplicationState } from "../../../../../store";
import { changeModel } from "../../../../../store/main/actions";
import {
  TBoldedConn,
  TOpenFrame,
} from "../../../../../store/main/openFrameTypes";
import { changeOFUIAction } from "../../../../../store/ui/actions";
import {
  convertToNamesArray,
  getCurrentProject,
  getCurrentUI,
  getElementByName,
  getIndexName,
  getNextId,
  getTopOffset,
} from "../../../../3d-models/utils";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { InputCell } from "../../../../common/InputCell";
import { NumericCell } from "../../../../common/NumericCell";
import { SelectorCell } from "../../../../common/SelectorCell";

type Props = {
  models: TOpenFrame[];
};

const init: TBoldedConn = {
  id: 0,
  model: "",
  name: "",
  parent: "",
  position: "START",
  grossAreaOfMember: 7640,
  thiknessOfGusset: 15,
  thiknessOfWeb: 9,
  thiknessOfFlange: 15,
  widthOfFlange: 205,
  overalDepthOfMember: 209,
  yieldStressOfMember: 350,
  maxTension: 2941,
  lengthOfPlate: 300,
  widthOfPlate: 150,
  boltClassSize: "M20",
  boltDiameter: 20,
  noOfBoltsAlongLength: 4,
  noOfBoltsAlongWidth: 4,
  boltSpacingLengthRow: 2,
  boltSpacingRowToRow: 2,
  boltCapacityTension: 100,
  boltCapacityShear: 100,
};

export default function HBracingConnectionsOF(props: Props) {
  const { models } = props;

  const [offsetTop, setOffsetTop] = useState<number>(0);
  const [dlg, setDlg] = useState<JSX.Element>();

  const openFrameUI = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.openFrameUI
  );

  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const dispatch = useDispatch();

  const [BCS, setBCS] = useRecoilState(beamConnections);

  const data = useMemo(() => {
    return openFrameUI?.hBracingConnections ?? [];
  }, [openFrameUI]);

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [data]);

  useEffect(() => {
    if (BCS.type !== "ODSM" || BCS.anchor !== "HB" || !BCS.item) return;
    const model = models.find((m) => m.name === BCS.item!.model);
    if (!model) return;
    const id = getNextId(data);
    const conn: TBoldedConn = {
      ...init,
      id,
      model: BCS.item.model,
      parent: BCS.item.element,
      position: BCS.item.position!,
    };
    handleChangeData(conn);
    handleChangeModel(conn);
    setBCS((prev) => ({ ...prev, item: undefined }));
  }, [models, BCS, data]);

  function handleChangeData(changed?: TBoldedConn, isDelete?: boolean) {
    if (!openFrameUI || !data) return;
    if (!isDelete && !changed) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        hBracingConnections: !isDelete
          ? openFrameUI.hBracingConnections?.some(
              (hbc) => hbc.id === changed!.id
            )
            ? openFrameUI.hBracingConnections.map((hbc) =>
                hbc.id === changed!.id ? changed! : hbc
              )
            : [...(openFrameUI.hBracingConnections ?? []), changed!]
          : openFrameUI.hBracingConnections?.filter((hbc) => !hbc.selected) ??
            [],
      })
    );
  }

  function handleChangeModel(item: TBoldedConn) {
    const model = getElementByName(models, item.model);
    const parent = getElementByName(model?.horizontalBracings, item.parent);
    if (!(model && parent)) return;
    const changed: TBoldedConn = {
      ...item,
      name: `HBC${getIndexName(model.hBracingConnections ?? [], "HBC")}`,
      parent: item.parent!,
    };
    dispatch(
      changeModel({
        ...model,
        hBracingConnections: model.hBracingConnections?.some(
          (hbc) => hbc.id === changed.id
        )
          ? model.hBracingConnections.map((hbc) =>
              hbc.id === item.id ? changed : hbc
            )
          : [...(model.hBracingConnections ?? []), changed],
      } as TOpenFrame)
    );
  }

  function handleAdd() {
    handleChangeData({ ...init, id: getNextId(data) });
  }

  function handleChange(item: TBoldedConn, field: string, value: any) {
    const changed = { ...item, [field]: value };
    handleChangeData(changed);
    handleChangeModel(changed);
  }

  function handleDelete() {
    handleDeleteModels(data.filter((item) => item.selected));
    handleChangeData(undefined, true);
  }

  function handleDeleteModels(hbcs: TBoldedConn[]) {
    const map = new Map<string, number[]>();
    hbcs.forEach((hbc) => {
      if (hbc.model) {
        const ids = map.get(hbc.model);
        if (ids) {
          map.set(hbc.model, [...ids, hbc.id]);
        } else {
          map.set(hbc.model, [hbc.id]);
        }
      }
    });
    map.forEach((ids, key) => {
      const model = getElementByName(models, key);
      if (model) {
        dispatch(
          changeModel({
            ...model,
            hBracingConnections:
              model.hBracingConnections?.filter(
                (item) => !ids.some((id) => id === item.id)
              ) ?? [],
          } as TOpenFrame)
        );
      }
    });
  }

  function getRow(item: TBoldedConn) {
    const model = getElementByName(models, item.model);
    const beams = model?.horizontalBracings ?? [];
    const beam = getElementByName(beams, item.parent);
    const positions: string[] = [];
    if (
      model &&
      beam &&
      model.beams.some((b) => beam.startConnected.includes(b.name)) &&
      !model.hBracingConnections?.some(
        (hbc) => hbc.parent === item.name && hbc.position === "START"
      )
    )
      positions.push("START");
    if (
      model &&
      beam &&
      model.beams.some((b) => beam.endConnected.includes(b.name)) &&
      !model.hBracingConnections?.some(
        (hbc) => hbc.parent === item.name && hbc.position === "END"
      )
    )
      positions.push("END");
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.selected}
          onChange={(value) => handleChange(item, "selected", value)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(models)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.model}
          onSelect={(value) => handleChange(item, "model", value)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(beams)}
          selected={item.parent}
          onSelect={(value) => handleChange(item, "parent", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filter={(query, item) =>
            query ? item.includes(query.toUpperCase()) : true
          }
        />
        <td>{beam?.profile?.designation}</td>
        <SelectorCell<string>
          items={positions}
          selected={item.position}
          onSelect={(value) => handleChange(item, "position", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
        />
        <NumericCell
          className="w-80"
          value={item.grossAreaOfMember}
          onChange={(value) => handleChange(item, "grossAreaOfMember", value)}
        />
        <NumericCell
          className="w-60"
          value={item.thiknessOfGusset}
          onChange={(value) => handleChange(item, "thiknessOfGusset", value)}
        />
        <NumericCell
          className="w-60"
          value={item.thiknessOfWeb}
          onChange={(value) => handleChange(item, "thiknessOfWeb", value)}
        />
        <NumericCell
          className="w-60"
          value={item.thiknessOfFlange}
          onChange={(value) => handleChange(item, "thiknessOfFlange", value)}
        />
        <NumericCell
          className="w-60"
          value={item.widthOfFlange}
          onChange={(value) => handleChange(item, "widthOfFlange", value)}
        />
        <NumericCell
          className="w-60"
          value={item.overalDepthOfMember}
          onChange={(value) => handleChange(item, "overalDepthOfMember", value)}
        />
        <NumericCell
          className="w-60"
          value={item.yieldStressOfMember}
          onChange={(value) => handleChange(item, "yieldStressOfMember", value)}
        />
        <NumericCell
          className="w-60"
          value={item.maxTension}
          onChange={(value) => handleChange(item, "maxTension", value)}
        />
        <NumericCell
          className="w-60"
          value={item.lengthOfPlate}
          onChange={(value) => handleChange(item, "lengthOfPlate", value)}
        />
        <NumericCell
          className="w-60"
          value={item.widthOfPlate}
          onChange={(value) => handleChange(item, "widthOfPlate", value)}
        />
        <InputCell
          className="w-60"
          value={item.boltClassSize}
          onChange={(value) => handleChange(item, "boltClassSize", value)}
        />
        <NumericCell
          className="w-50"
          value={item.boltDiameter}
          onChange={(value) => handleChange(item, "boltDiameter", value)}
        />
        <NumericCell
          className="w-50"
          value={item.noOfBoltsAlongLength}
          onChange={(value) =>
            handleChange(item, "noOfBoltsAlongLength", value)
          }
        />
        <NumericCell
          className="w-50"
          value={item.noOfBoltsAlongWidth}
          onChange={(value) => handleChange(item, "noOfBoltsAlongWidth", value)}
        />
        <NumericCell
          className="w-50"
          value={item.boltSpacingLengthRow}
          onChange={(value) =>
            handleChange(item, "boltSpacingLengthRow", value)
          }
        />
        <NumericCell
          className="w-50"
          value={item.boltSpacingRowToRow}
          onChange={(value) => handleChange(item, "boltSpacingRowToRow", value)}
        />
        <NumericCell
          className="w-50"
          value={item.boltCapacityTension}
          onChange={(value) => handleChange(item, "boltCapacityTension", value)}
        />
        <NumericCell
          className="w-50"
          value={item.boltCapacityShear}
          onChange={(value) => handleChange(item, "boltCapacityShear", value)}
        />
        <td>{item.maxAxialCapacity}</td>
        <td>{item.maxShearCapacity}</td>
        <td>{item.maxBendCapacity}</td>
      </tr>
    );
  }

  return (
    <>
      <div className="d-flex f-column">
        <div className="hr" />
        <div className="d-flex f-ai-center label-light bg-dark">
          <span>Horizontal Bracing Connections</span>
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
        <div className="hr" />
        <div className="p-5">
          <div className="table-container">
            <table ref={tableRef} className="table bg-gray">
              <thead>
                <tr>
                  <GeneralCheckBoxCell
                    data={data}
                    onChange={(data) =>
                      openFrameUI &&
                      dispatch(
                        changeOFUIAction({
                          ...openFrameUI,
                          hBracingConnections: data,
                        })
                      )
                    }
                  />
                  <th>OF No.</th>
                  <th>Element No.</th>
                  <th>Profile</th>
                  <th>Position</th>
                  <th>Gross area of Member</th>
                  <th>Thk. of Gusset</th>
                  <th>Thk. of Web</th>
                  <th>Thk. of Flange</th>
                  <th>Width of Flange</th>
                  <th>Overall depth of Member</th>
                  <th>Yield stress for Member (E350)</th>
                  <th>Max. Tension per IS 800-Section-12</th>
                  <th>Length of Plate</th>
                  <th>Width of Plate</th>
                  <th>Bolt class size</th>
                  <th>Bolt dia</th>
                  <th>No. of Bolts along length</th>
                  <th>No. of Bolts along width</th>
                  <th>Bolt spacing, length row</th>
                  <th>Bolt spacing, row to row</th>
                  <th>Bolt capacity, Tension (kN)</th>
                  <th>Bolt capacity, Shear (kN)</th>
                  <th>Max axial capacity</th>
                  <th>Max shear capacity</th>
                  <th>Max bend capacity</th>
                </tr>
              </thead>
              <tbody>{data.map(getRow)}</tbody>
            </table>
          </div>
        </div>
      </div>
      {dlg}
    </>
  );
}
