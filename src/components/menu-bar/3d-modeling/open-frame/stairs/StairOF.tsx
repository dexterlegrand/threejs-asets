import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Project,
  Orientation,
  SimpleDirection,
} from "../../../../../store/main/types";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import {
  getOFModels,
  removeConnections,
  updateConnections,
} from "../../../../3d-models/openFrame";
import {
  addEventAction,
  changeOFUIAction,
} from "../../../../../store/ui/actions";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { Button, Tooltip } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { OFStaircaseUI } from "../../../../../store/ui/types";
import { SelectorCell } from "../../../../common/SelectorCell";
import {
  convertToNamesArray,
  getElementByName,
  getNextId,
  getIndexName,
  getTopOffset,
  exportToCSV,
  importFromCSV,
  getImportProfileByDesignation,
  getProfileLibrary,
  checkImportedNumber,
  getPosByDistance,
  getCurrentUI,
  getSimpleDirection,
} from "../../../../3d-models/utils";
import {
  orientations,
  supportTypes,
} from "../../../../../store/main/constants";
import { NumericCell } from "../../../../common/NumericCell";
import { FromDetails } from "./FromDetails";
import {
  changeModel,
  changeProjectAction,
} from "../../../../../store/main/actions";
import {
  TOpenFrame,
  TStaircaseOF,
  TBeamOF,
  TCantileverOF,
} from "../../../../../store/main/openFrameTypes";
import { Vector3 } from "three";
import { Section } from "../../../../../store/data/types";

type Props = {
  project?: Project;
  profiles: Section[];
  libs: string[];
};

export function StairOF(props: Props) {
  const { project, profiles, libs } = props;

  const [dialog, setDialog] = useState<JSX.Element>();
  const [offsetTop, setOffsetTop] = useState<number>(0);

  const openFrameUI = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.openFrameUI
  );

  const dispatch = useDispatch();

  const tableRef = useRef<HTMLTableElement>(null);

  const data = useMemo(() => {
    return openFrameUI?.additionalBeams.staircases ?? [];
  }, [openFrameUI]);

  console.log("stairs", data);

  const models = useMemo(() => {
    return getOFModels(project);
  }, [project]);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [data]);

  function handleChangeModel(model: TOpenFrame) {
    dispatch(changeModel(model));
  }

  function handleChangeData(staircases: OFStaircaseUI[]) {
    if (!openFrameUI) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        additionalBeams: { ...openFrameUI.additionalBeams, staircases },
      })
    );
  }

  function handleAddRow() {
    handleChangeData([
      ...data,
      {
        id: getNextId(data),
        selected: false,
        name: `FL${getIndexName(data, "FL")}`,
        fromDetails: {
          vertical: 0,
          horizontal: 0,
          supportType: "Fix",
        },
        distance: 0,
        width: 1,
        rugs: 0,
        rugWidth: 0.5,
        rugThickness: 0.1,
        orientation: 0,
      },
    ]);
  }

  function handleCreateElements(
    row: OFStaircaseUI,
    model: TOpenFrame,
    from: "Ground" | TBeamOF | TCantileverOF,
    to: TBeamOF | TCantileverOF
  ) {
    const startPos = new Vector3();
    const endPos = getPosByDistance(row.distance, to.startPos, to.endPos);
    const isToX =
      (getSimpleDirection(to.startPos, to.endPos) as SimpleDirection) === "X";
    if (from !== "Ground") {
      startPos.setY(from.startPos.y);
      if (isToX) {
        startPos.setX(endPos.x);
        startPos.setZ(from.startPos.z);
      } else {
        startPos.setX(from.startPos.x);
        startPos.setZ(endPos.z);
      }
    } else {
      if (!row.fromDetails.vertical || !row.fromDetails.horizontal)
        return model;
      startPos.setY(endPos.y - row.fromDetails.vertical);
      if (isToX) {
        startPos.setX(endPos.x);
        startPos.setZ(endPos.z + row.fromDetails.horizontal);
      } else {
        startPos.setX(endPos.x + row.fromDetails.horizontal);
        startPos.setZ(endPos.z);
      }
    }
    const id = getNextId(model.staircases);
    const width = row.width / 2;
    const direction = row.fromDetails.horizontal >= 0;
    const el1: TStaircaseOF = {
      id,
      uiId: row.id,
      type: "STAIRCASE",
      name: `STR${getIndexName(model.staircases, "STR")}`,
      flight: row.name,
      frame: to.frame,
      startPos: isToX
        ? startPos.clone().setX(startPos.x - width)
        : startPos.clone().setZ(startPos.z - width),
      endPos: isToX
        ? endPos.clone().setX(endPos.x - width)
        : endPos.clone().setZ(endPos.z - width),
      profile: row.profile!,
      orientation: row.orientation,
      position: "L",
      direction,
      toX: isToX,
      supportType:
        row.from === "Ground" ? row.fromDetails.supportType : undefined,
      startConnected: [],
      connected: [],
      endConnected: [],
    };
    const el2: TStaircaseOF = {
      ...el1,
      id: id + 1,
      name: `STR${getIndexName([...model.staircases, el1], "STR")}`,
      startPos: isToX
        ? startPos.clone().setX(startPos.x + width)
        : startPos.clone().setZ(startPos.z + width),
      endPos: isToX
        ? endPos.clone().setX(endPos.x + width)
        : endPos.clone().setZ(endPos.z + width),
      position: "R",
      direction,
      toX: isToX,
    };
    let changedModel = updateConnections(model, el1, () => {});
    changedModel = updateConnections(changedModel, el2, () => {});
    return changedModel;
  }

  function handleChangeRow(
    row: OFStaircaseUI,
    field: string,
    value: any,
    isHard?: boolean
  ) {
    const changedRow = { ...row, [field]: value };
    handleChangeData(
      data.map((element) => {
        if (element.id === changedRow.id) {
          return changedRow;
        } else return element;
      })
    );
    if (field === "selected" || field === "library") return;
    let model = getElementByName(models, row.model);
    if (isHard && model) {
      model.staircases
        .filter((item) => item.uiId === row.id)
        .forEach((item) => {
          model = removeConnections(model!, item);
        });
      handleChangeModel(model);
    }
    if (
      !changedRow.model ||
      !changedRow.from ||
      !changedRow.to ||
      !changedRow.profile
    )
      return;
    if (row.model !== changedRow.model) {
      model = getElementByName(models, changedRow.model);
    }
    if (!model) return;
    const from =
      changedRow.from !== "Ground"
        ? getElementByName(
            [...model.beams, ...model.cantilevers],
            changedRow.from
          )
        : "Ground";
    const to = getElementByName(
      [...model.beams, ...model.cantilevers],
      changedRow.to
    );
    if (!from || !to) return;
    if (isHard) {
      handleChangeModel(handleCreateElements(changedRow, model, from, to));
    } else if (model.staircases.some((item) => item.uiId === changedRow.id)) {
      const changedModel: TOpenFrame = {
        ...model,
        staircases: model.staircases.map((item) => {
          if (item.uiId === row.id) {
            return {
              ...item,
              profile: changedRow.profile!,
              orientation: changedRow.orientation,
            };
          }
          return item;
        }),
      };
      handleChangeModel(changedModel);
    } else {
      handleChangeModel(handleCreateElements(changedRow, model, from, to));
    }
  }

  function handleDeleteRows() {
    handleChangeData(data.filter((item) => !item.selected));
    handleDeleteModels(data.filter((item) => item.selected));
  }

  function handleDeleteModels(elements: OFStaircaseUI[], project?: Project) {
    const map = new Map<string, number[]>();
    let changedProject = project ? { ...project } : undefined;
    for (const element of elements) {
      if (!element.model) continue;
      const ids = map.get(element.model);
      map.set(element.model, ids ? [...ids, element.id] : [element.id]);
    }
    for (const [key, ids] of Array.from(map.entries())) {
      const model = getElementByName(models, key);
      if (!model) continue;
      let newModel = { ...model };
      for (const id of ids) {
        model.staircases
          .filter((item) => item.uiId === id)
          .forEach((item) => {
            newModel = removeConnections(newModel, item);
          });
      }
      if (changedProject) {
        changedProject = {
          ...changedProject,
          models: changedProject.models.map((mItem) =>
            mItem.name === newModel.name ? newModel : mItem
          ),
        };
      } else handleChangeModel(newModel);
    }
    return changedProject;
  }

  function getRow(row: OFStaircaseUI) {
    const model = getElementByName(models, row.model);
    const beams = model ? [...model.beams, ...model.cantilevers] : [];
    const from =
      row.from !== "Ground" ? getElementByName(beams, row.from) : row.from;
    const toBeams =
      from !== undefined
        ? from !== "Ground"
          ? beams.filter(
              (beam) =>
                from.direction === beam.direction &&
                beam.startPos.y > from.startPos.y
            )
          : beams
        : [];
    const to = getElementByName(toBeams, row.to);

    const width = `${100 / 11}%`;
    const elWidth = row.width / 2;
    const beamDistance = to ? to.startPos.distanceTo(to.endPos) : 0;
    const equiDistance = row.rugs > 0 ? beamDistance / row.rugs : 0;
    return (
      <tr key={row.id}>
        <CheckBoxCell
          key={row.id}
          value={row.selected}
          onChange={(value) => handleChangeRow(row, "selected", value)}
        />
        <td>{row.name}</td>
        <SelectorCell<string>
          items={convertToNamesArray(models)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.model}
          onSelect={(value) => handleChangeRow(row, "model", value, true)}
          filterable={false}
        />
        <SelectorCell<"Ground" | string>
          items={["Ground", ...convertToNamesArray(beams)]}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.from}
          onSelect={(value) => handleChangeRow(row, "from", value, true)}
          filterable={true}
          filter={(query, item) =>
            query ? item.includes(query.toUpperCase()) : true
          }
        />
        {row.from === "Ground" ? (
          <td>
            <Tooltip
              position={"right"}
              content={
                <div>
                  <p>
                    Vertical Distance to be Covered:{" "}
                    <strong>{row.fromDetails.vertical}m</strong>
                  </p>
                  <p>
                    Horizontal Distance to be Covered:{" "}
                    <strong>{row.fromDetails.horizontal}m</strong>
                  </p>
                  <p>
                    Support Type at end of both Stringers:{" "}
                    <strong>{row.fromDetails.supportType}</strong>
                  </p>
                </div>
              }
            >
              <Button
                small
                minimal
                icon={"menu"}
                intent={"primary"}
                className={"c-light"}
                onClick={() => {
                  setDialog(
                    <FromDetails
                      {...row.fromDetails}
                      onChange={(details) => {
                        handleChangeRow(row, "fromDetails", details, true);
                        setDialog(undefined);
                      }}
                      onClose={() => setDialog(undefined)}
                    />
                  );
                }}
              />
            </Tooltip>
          </td>
        ) : (
          <td></td>
        )}
        <SelectorCell<string>
          items={convertToNamesArray(toBeams)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.to}
          onSelect={(value) => handleChangeRow(row, "to", value, true)}
          filterable={true}
          filter={(query, item) =>
            query ? item.includes(query.toUpperCase()) : true
          }
        />
        <NumericCell
          min={elWidth}
          max={to ? beamDistance - elWidth : 0}
          isDecimal={true}
          value={row.distance}
          onChange={(value) => handleChangeRow(row, "distance", value, true)}
          style={{ width }}
        />
        <NumericCell
          min={0}
          max={beamDistance}
          isDecimal={true}
          value={row.width}
          onChange={(value) => handleChangeRow(row, "width", value, true)}
          style={{ width }}
        />
        <SelectorCell<string>
          items={libs}
          selected={row.library}
          onSelect={(value) => handleChangeRow(row, "library", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <SelectorCell<Section>
          items={profiles.filter(
            (profile) => profile.country_code === row.library
          )}
          selected={row.profile}
          onSelect={(value) => handleChangeRow(row, "profile", value)}
          itemKey={(item) => item.profile_section_id}
          itemLabel={(item) => item.designation}
          filterable={true}
          filter={(query, item) =>
            query
              ? item.designation
                  .toLocaleLowerCase()
                  .includes(query.toLocaleLowerCase())
              : true
          }
        />
        <SelectorCell<Orientation>
          items={[0, 90, 180, 270]}
          selected={row.orientation}
          onSelect={(value) => handleChangeRow(row, "orientation", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          filterable={false}
        />
        <NumericCell
          min={0}
          max={100}
          isDecimal={true}
          value={row.rugs ?? 0}
          onChange={(value) => handleChangeRow(row, "rugs", value, true)}
          style={{ width }}
        />

        <td>{equiDistance}</td>

        <NumericCell
          min={0}
          isDecimal={false}
          value={row.rugWidth ?? 0.5}
          onChange={(value) => handleChangeRow(row, "rugWidth", value, true)}
          style={{ width }}
        />

        <NumericCell
          min={0}
          isDecimal={false}
          value={row.rugThickness ?? 0.1}
          onChange={(value) =>
            handleChangeRow(row, "rugThickness", value, true)
          }
          style={{ width }}
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      data.map((item) => {
        return {
          id: item.id,
          flight: item.name,
          model: item.model,
          from: item.from,
          vertical: item.fromDetails.vertical,
          horizontal: item.fromDetails.horizontal,
          supportType: item.fromDetails.supportType,
          to: item.to,
          distance: item.distance,
          width: item.width,
          orientation: item.orientation,
          profile: item.profile?.designation,
        };
      }),
      "OF Staircases"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Staircases (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((imported, isCSV) => {
      if (!isCSV || !Array.isArray(imported)) return;
      let changedProject = handleDeleteModels(data, project);
      const newData: OFStaircaseUI[] = [];
      for (const item of imported) {
        const id = getNextId(newData);
        let newItem: OFStaircaseUI = {
          id,
          selected: false,
          name: `FL${getIndexName(newData, "FL")}`,
          fromDetails: {
            vertical: 0,
            horizontal: 0,
            supportType: "Fix",
          },
          distance: 0,
          width: 1,
          rugs: 0,
          rugWidth: 0.5,
          rugThickness: 0.1,
          orientation: 0,
        };
        let model: TOpenFrame | undefined;
        let from: "Ground" | TBeamOF | TCantileverOF | undefined;
        let to: TBeamOF | TCantileverOF | undefined;
        if (item.model) {
          model = getElementByName(
            // @ts-ignore
            changedProject.models as TOpenFrame[],
            item.model
          );
          if (model) {
            newItem = { ...newItem, model: model.name };
            from =
              item.from !== "Ground"
                ? getElementByName(
                    [...model.beams, ...model.cantilevers],
                    item.from
                  )
                : "Ground";
            if (from) {
              newItem = {
                ...newItem,
                from: from === "Ground" ? "Ground" : from.name,
              };
            } else {
              showErrorMsg(
                `(id: ${item.id}) - an element "${item.from}" not found!`
              );
            }
            to = getElementByName(
              [...model.beams, ...model.cantilevers],
              item.to
            );
            if (to) {
              newItem = { ...newItem, to: to.name };
            } else {
              showErrorMsg(
                `(id: ${item.id}) - an element "${item.to}" not found!`
              );
            }
          } else {
            showErrorMsg(
              `(id: ${item.id}) - a model "${item.model}" not found!`
            );
          }
        }
        const profile = getImportProfileByDesignation(
          profiles,
          item.profile,
          () =>
            showErrorMsg(
              `(id: ${item.id}) - a profile "${item.profile}" not found!`
            )
        );
        newItem = {
          ...newItem,
          fromDetails: {
            vertical: checkImportedNumber(item.vertical) ?? 0,
            horizontal: checkImportedNumber(item.horizontal) ?? 0,
          },
          distance: checkImportedNumber(item.distance) ?? 0,
          width: checkImportedNumber(item.width) ?? 0,
          profile,
          library: getProfileLibrary(profile),
        };
        if (item.orientation) {
          if (orientations.includes(item.orientation)) {
            newItem = { ...newItem, orientation: item.orientation };
          } else {
            showErrorMsg(
              `(id: ${item.id}) - Incorrect orientation value (${item.orientation})!`
            );
          }
        }
        if (item.supportType) {
          if (supportTypes.includes(item.supportType)) {
            newItem = {
              ...newItem,
              fromDetails: {
                ...newItem.fromDetails,
                supportType: item.supportType,
              },
            };
          } else {
            showErrorMsg(
              `(id: ${item.id}) - Incorrect support type (${item.supportType})!`
            );
          }
        }
        newData.push(newItem);
        if (model && from && to && newItem.profile) {
          // @ts-ignore
          changedProject = {
            ...changedProject,
            models: models.map((mItem) =>
              mItem.name === model!.name
                ? handleCreateElements(newItem, model!, from!, to!)
                : mItem
            ),
          };
        }
      }
      handleChangeData(newData);
      // @ts-ignore
      dispatch(changeProjectAction(changedProject));
    });
  }

  return (
    <>
      {dialog}
      <div className="d-flex f-column">
        <div className="hr" />
        <div className="label-light bg-dark">
          <span>Staircase</span>
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
            onClick={handleExport}
          />
          <Button
            small
            icon="import"
            text="Import from CSV"
            intent="success"
            onClick={handleImport}
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
        <div className={"p-5"}>
          <div className={"table-container"}>
            <table ref={tableRef} className="table bg-gray">
              <thead>
                <tr>
                  <GeneralCheckBoxCell
                    rowSpan={2}
                    data={data}
                    onChange={handleChangeData}
                  />
                  <th rowSpan={2}>Flight No.</th>
                  <th rowSpan={2}>OF No.</th>
                  <th colSpan={2}>From</th>
                  <th>To</th>
                  <th>Mid point Loc.</th>
                  <th rowSpan={2}>Clear Width (m)</th>
                  <th rowSpan={2}>C/S Library</th>
                  <th rowSpan={2}>Profile</th>
                  <th rowSpan={2}>Orientation</th>
                  <th rowSpan={2}>N rungs</th>
                  <th rowSpan={2}>Equi distance</th>
                  <th rowSpan={2}>width</th>
                  <th rowSpan={2}>thickness</th>
                </tr>
                <tr>
                  <th style={{ top: offsetTop }}>Beam / Ground</th>
                  <th style={{ top: offsetTop }}>Details</th>
                  <th style={{ top: offsetTop }}>Beam</th>
                  <th style={{ top: offsetTop }}>From Beam Start (m)</th>
                </tr>
              </thead>
              <tbody>{data.map((item) => getRow(item))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
