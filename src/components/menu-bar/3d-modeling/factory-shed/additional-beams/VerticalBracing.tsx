import React, { FunctionComponent, useMemo, useState, useEffect, useRef } from "react";
import { Button } from "@blueprintjs/core";
import { OFVerticalBracingsUI } from "../../../../../store/ui/types";
import {
  TOpenFrame,
  TVerticalBracingOF,
  TColumnOF,
  TBeamOF,
} from "../../../../../store/main/openFrameTypes";
import { BracingType, Project } from "../../../../../store/main/types";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { bracingTypes } from "../../../../../store/main/constants";
import {
  getNextId,
  getElementByName,
  convertToNamesArray,
  exportToCSV,
  importFromCSV,
  getImportProfileByDesignation,
  getProfileLibrary,
  checkImportedNumber,
  getTopOffset,
  fixNumberToStr,
  getCurrentUI,
  roundVectorM,
} from "../../../../3d-models/utils";
import { changeModel, changeProjectAction } from "../../../../../store/main/actions";
import { Vector3 } from "three";
import { updateConnections, removeConnections } from "../../../../3d-models/openFrame";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";
import { Section } from "../../../../../store/data/types";

type Props = {
  project?: Project;
  models: TOpenFrame[];
  profiles: Section[];
  libs: string[];
};

const VerticalBracing: FunctionComponent<Props> = (props) => {
  const { project, models, profiles, libs } = props;

  const [offsetTop, setOffsetTop] = useState<number>(0);

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const dispatch = useDispatch();

  const tableRef = useRef<HTMLTableElement>(null);

  const data = useMemo(() => {
    return openFrameUI?.additionalBeams.verticalBracings ?? [];
  }, [openFrameUI]);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [data]);

  function handleChangeModel(model: TOpenFrame) {
    dispatch(changeModel(model));
  }

  function handleCreateElement(model: TOpenFrame, item: OFVerticalBracingsUI) {
    if (!openFrameUI) return model;
    const from = getElementByName(model.columns, item.fromColumn);
    const to = getElementByName(model.columns, item.toColumn);
    const fromBeam = getElementByName(model.beams, item.fromBeam);
    const toBeam = getElementByName(model.beams, item.toBeam);
    let fromElevation = fromBeam?.startPos.y;
    let toElevation = toBeam?.startPos.y;
    if (fromElevation === undefined) {
      if (item.type !== "Triangular Down") {
        fromElevation = item.fromElevation;
        if (fromElevation === undefined && from && to) {
          fromElevation = Math.max(from.startPos.y, to.startPos.y);
        }
      }
    }
    if (toElevation === undefined) {
      if (item.type !== "Triangular Up") {
        toElevation = item.toElevation;
        if (toElevation === undefined && from && to) {
          toElevation = Math.min(from.endPos.y, to.endPos.y);
        }
      }
    }

    if (from && to && fromElevation !== undefined && toElevation !== undefined) {
      const id = getNextId(model.verticalBracings);
      let newModel = { ...model };
      if (item.type === "Diagonal Up" || item.type === "Diagonal Down") {
        const isUp = item.type === "Diagonal Up";
        newModel = updateConnections(
          model,
          createVBracing(id, from, to, fromElevation, toElevation, item, isUp),
          () => {}
        );
      } else {
        newModel = updateConnections(
          updateConnections(
            model,
            createVBracing(id, from, to, fromElevation, toElevation, item, true),
            () => {}
          ),
          createVBracing(id + 1, from, to, fromElevation, toElevation, item, false),
          () => {}
        );
      }
      return newModel;
    }
    return model;
  }

  function handleChangeElement(model: TOpenFrame, item: OFVerticalBracingsUI) {
    const changed: TOpenFrame = {
      ...model,
      verticalBracings: model.verticalBracings.map((element) =>
        element.uiId === item.id ? { ...element, profile: item.profile! } : element
      ),
    };
    dispatch(changeModel(changed));
  }

  function handleDeleteModels(elements: OFVerticalBracingsUI[], project?: Project) {
    if (!openFrameUI) return;
    let changedProject = project ? { ...project } : undefined;
    const map = new Map<string, number[]>();
    elements.forEach((element) => {
      if (element.model) {
        const ids = map.get(element.model);
        if (ids) {
          map.set(element.model, [...ids, element.id]);
        } else {
          map.set(element.model, [element.id]);
        }
      }
    });
    map.forEach((ids, key) => {
      const model = getElementByName(models, key);
      if (model) {
        let newModel = { ...model };
        ids.forEach((id) => {
          const elements = newModel.verticalBracings.filter((element) => element.uiId === id);
          elements.forEach((element) => {
            newModel = removeConnections(newModel, element);
          });
        });
        if (changedProject) {
          changedProject = {
            ...changedProject,
            models: changedProject.models.map((mItem) =>
              mItem.name === newModel.name ? newModel : mItem
            ),
          };
        } else dispatch(changeModel(newModel));
      }
    });
    return changedProject;
  }

  function createVBracing(
    id: number,
    from: TColumnOF,
    to: TColumnOF,
    fromElevation: number,
    toElevation: number,
    data: OFVerticalBracingsUI,
    isUp: boolean
  ): TVerticalBracingOF {
    const startPos = new Vector3(from.startPos.x, fromElevation, from.startPos.z);
    const endPos = new Vector3(to.startPos.x, toElevation, to.startPos.z);

    const dir = startPos.x === endPos.x ? "Z" : "X";

    const length = (dir === "X" ? endPos.x - startPos.x : startPos.z - endPos.z) / 2;

    switch (data.type) {
      case "Diagonal Down":
        startPos.setY(toElevation);
        endPos.setY(fromElevation);
        break;
      case "X Bracing":
        if (!isUp) {
          startPos.setY(toElevation);
          endPos.setY(fromElevation);
        }
        break;
      case "Triangular Up":
        if (isUp) {
          endPos.set(
            dir === "X" ? endPos.x - length : endPos.x,
            toElevation,
            dir === "X" ? endPos.z : endPos.z + length
          );
        } else {
          startPos.set(
            dir === "X" ? startPos.x + length : startPos.x,
            toElevation,
            dir === "X" ? startPos.z : startPos.z - length
          );
          endPos.setY(fromElevation);
        }
        break;
      case "Triangular Down":
        if (isUp) {
          startPos.set(
            dir === "X" ? startPos.x + length : startPos.x,
            fromElevation,
            dir === "X" ? startPos.z : startPos.z - length
          );
        } else {
          startPos.setY(toElevation);
          endPos.set(
            dir === "X" ? endPos.x - length : endPos.x,
            fromElevation,
            dir === "X" ? endPos.z : endPos.z + length
          );
        }
    }

    return {
      id,
      uiId: data.id,
      type: "VERTICAL-BRACING",
      secondType: data.type!,
      name: `VB${id}`,
      frame: from.frame,
      startPos: roundVectorM(startPos),
      endPos: roundVectorM(endPos),
      profile: data.profile!,
      orientation: 0,
      isUp,
      startConnected: [],
      connected: [],
      endConnected: [],
      releases: {
        my1: true,
        mz1: true,
        my2: true,
        mz2: true,
      },
    };
  }

  function handleChangeData(verticalBracings: OFVerticalBracingsUI[]) {
    if (!openFrameUI) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        additionalBeams: { ...openFrameUI.additionalBeams, verticalBracings },
      })
    );
  }

  function handleAddRow() {
    handleChangeData([
      ...data,
      {
        id: getNextId(data),
        selected: false,
      },
    ]);
  }

  function handleDeleteRows() {
    handleChangeData(data.filter((item) => !item.selected));
    handleDeleteModels(data.filter((item) => item.selected));
  }

  function handleChangeRow(row: OFVerticalBracingsUI, field: string, value: any) {
    handleChangeData(
      data.map((cnt) => {
        if (cnt.id === row.id) {
          return { ...cnt, [field]: value };
        } else return cnt;
      })
    );
  }

  function handleSoftChange(row: OFVerticalBracingsUI, field: string, value: any) {
    if (!openFrameUI) return;
    handleChangeRow(row, field, value);
    const changedUI = { ...row, [field]: value };
    const model = getElementByName(models, changedUI.model);
    if (!model || !changedUI.profile) return;
    if (model.verticalBracings.some((element) => element.uiId === changedUI.id))
      handleChangeElement(model, changedUI);
    else handleChangeModel(handleCreateElement(model, changedUI));
  }

  function handleHardChange(row: OFVerticalBracingsUI, field: string, value: any) {
    if (!openFrameUI) return;
    handleChangeRow(row, field, value);
    const changedUI = { ...row, [field]: value };
    let model = getElementByName(models, changedUI.model);
    if (!model || !changedUI.profile) return;
    const elements = model.verticalBracings.filter((element) => element.uiId === changedUI.id);
    elements.forEach((element) => {
      model = removeConnections(model!, element);
    });
    handleChangeModel(handleCreateElement(model, changedUI));
  }

  function filterColumns(columns: TColumnOF[], column?: TColumnOF) {
    if (!column) return [];
    const filteredPlusX: TColumnOF[] = [];
    const filteredMinusX: TColumnOF[] = [];
    const filteredPlusZ: TColumnOF[] = [];
    const filteredMinusZ: TColumnOF[] = [];
    let px: any, mx: any, pz: any, mz: any;
    columns.forEach((item) => {
      if (
        item.name !== column.name &&
        ((item.startPos.y >= column.startPos.y && item.startPos.y < column.endPos.y) ||
          (column.startPos.y >= item.startPos.y && column.startPos.y < item.endPos.y))
      ) {
        if (item.startPos.z === column.startPos.z) {
          if (item.startPos.x > column.startPos.x) {
            px = px !== undefined ? Math.min(item.startPos.x, px) : item.startPos.x;
            filteredPlusX.push(item);
          } else if (item.startPos.x < column.startPos.x) {
            mx = mx !== undefined ? Math.max(item.startPos.x, mx) : item.startPos.x;
            filteredMinusX.push(item);
          }
        } else if (item.startPos.x === column.startPos.x) {
          if (item.startPos.z > column.startPos.z) {
            pz = pz !== undefined ? Math.min(item.startPos.z, pz) : item.startPos.z;
            filteredPlusZ.push(item);
          } else if (item.startPos.z < column.startPos.z) {
            mz = mz !== undefined ? Math.max(item.startPos.z, mz) : item.startPos.z;
            filteredMinusZ.push(item);
          }
        }
      }
    });
    return [
      ...filteredPlusX.filter((item) => item.startPos.x === px),
      ...filteredMinusX.filter((item) => item.startPos.x === mx),
      ...filteredPlusZ.filter((item) => item.startPos.z === pz),
      ...filteredMinusZ.filter((item) => item.startPos.z === mz),
    ].sort((a, b) => a.id - b.id);
  }

  function getBeams(beams?: TBeamOF[], fromColumn?: TColumnOF, toColumn?: TColumnOF) {
    const minElevation = Math.max(fromColumn?.startPos.y ?? 0, toColumn?.startPos.y ?? 0);
    const maxElevation = Math.min(fromColumn?.endPos.y ?? 0, toColumn?.endPos.y ?? 0);
    const fromBeams: TBeamOF[] = [];
    if (fromColumn && toColumn) {
      const fromConnections = [
        ...fromColumn.startConnected,
        ...fromColumn.connected,
        ...fromColumn.endConnected,
      ];
      const toConnections = [
        ...toColumn.startConnected,
        ...toColumn.connected,
        ...toColumn.endConnected,
      ];
      for (const conn of fromConnections) {
        if (toConnections.includes(conn)) {
          const beam = getElementByName(beams, conn);
          if (!beam) continue;
          fromBeams.push(beam);
        }
      }
    }
    return { minElevation, maxElevation, beams: fromBeams };
  }

  function getRow(item: OFVerticalBracingsUI) {
    const model = getElementByName(models, item.model);
    const columns = model?.columns ?? [];
    const fromColumn = getElementByName(columns, item.fromColumn);
    const toColumns = filterColumns(columns, fromColumn);
    const toColumn = getElementByName(columns, item.toColumn);
    const { minElevation, maxElevation, beams } = getBeams(model?.beams, fromColumn, toColumn);
    const isTriangularUP = item.type === "Triangular Up";
    const isTriangularDOWN = item.type === "Triangular Down";
    const isDiagonal =
      item.type === "Diagonal Up" || item.type === "Diagonal Down" || item.type === "X Bracing";
    const width = `${Math.round(100 / 11)}%`;
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.selected}
          onChange={(value) => handleChangeRow(item, "selected", value)}
        />
        <SelectorCell<string>
          items={models.map((model) => model.name)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.model}
          onSelect={(value) => handleHardChange(item, "model", value)}
          filterable={false}
        />
        <SelectorCell<string>
          items={convertToNamesArray(columns)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.fromColumn}
          onSelect={(value) => handleHardChange(item, "fromColumn", value)}
          filterable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(toColumns)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.toColumn}
          onSelect={(value) => handleHardChange(item, "toColumn", value)}
          filterable={false}
        />
        <SelectorCell<BracingType>
          items={bracingTypes}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.type}
          onSelect={(value) => handleHardChange(item, "type", value)}
          filterable={false}
        />
        <SelectorCell<string>
          items={convertToNamesArray(beams)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.fromBeam}
          onSelect={(value) => handleHardChange(item, "fromBeam", value)}
          filterable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
          clearable={true}
        />
        {isTriangularUP || isDiagonal ? (
          <NumericCell
            min={minElevation}
            max={item.toElevation}
            isDecimal={true}
            value={item.fromElevation}
            onChange={(value) => handleHardChange(item, "fromElevation", value)}
            style={{ width }}
          />
        ) : (
          <td></td>
        )}
        <SelectorCell<string>
          items={convertToNamesArray(beams)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.toBeam}
          onSelect={(value) => handleHardChange(item, "toBeam", value)}
          filterable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
          clearable={true}
        />
        {isTriangularDOWN || isDiagonal ? (
          <NumericCell
            min={item.fromElevation}
            max={maxElevation}
            isDecimal={true}
            value={item.toElevation}
            onChange={(value) => handleHardChange(item, "toElevation", value)}
            style={{ width }}
          />
        ) : (
          <td></td>
        )}
        <SelectorCell<string>
          items={libs}
          selected={item.library}
          onSelect={(value) => handleChangeRow(item, "library", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <SelectorCell<Section>
          items={profiles.filter((profile) => profile.country_code === item.library)}
          selected={item.profile}
          onSelect={(value) => handleSoftChange(item, "profile", value)}
          itemKey={(item) => item.profile_section_id}
          itemLabel={(item) => item.designation}
          filterable={true}
          filter={(query, item) =>
            query ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase()) : true
          }
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      data.map((item) => ({
        id: item.id,
        "FS No.": item.model ?? "",
        "From Column": item.fromColumn ?? "",
        "To Column": item.toColumn ?? "",
        Type: item.type ?? "",
        "From Beam": item.fromBeam ?? "",
        "From Elevation (m)": fixNumberToStr(item.fromElevation ?? 0),
        "To Beam": item.toBeam ?? "",
        "To Elevation (m)": fixNumberToStr(item.toElevation ?? 0),
        "C/S Library": item.library ?? "",
        Profile: item.profile?.designation ?? "",
      })),
      "Vertical Bracings"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Vertical Bracings (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      let changedProject = handleDeleteModels(data, project);
      if (!changedProject) return;
      const newItems: OFVerticalBracingsUI[] = [];
      newData.forEach((item: any) => {
        let newItem: OFVerticalBracingsUI = {
          id: getNextId(newItems),
          selected: false,
        };
        let model: TOpenFrame | undefined;
        const itemModel = item["FS No."];
        const itemFromC = item["From Column"];
        const itemToC = item["To Column"];
        const itemFromB = item["From Beam"];
        const itemToB = item["To Beam"];
        const itemFE = item["From Elevation (m)"];
        const itemTE = item["To Elevation (m)"];
        const itemType = item["Type"];
        const itemLib = item["C/S Library"];
        const itemProfile = item["Profile"];
        if (itemModel) {
          model = getElementByName(
            // @ts-ignore
            changedProject.models as TOpenFrame[],
            itemModel
          );
          if (model) {
            newItem = { ...newItem, model: model.name };
            if (itemFromC) {
              const fromColumn = getElementByName(model.columns, itemFromC);
              if (fromColumn) {
                newItem = { ...newItem, fromColumn: fromColumn.name };
              } else {
                showErrorMsg(`(id: ${item.id}) - an element "${itemFromC}" not found!`);
              }
            }
            if (itemToC) {
              const toColumn = getElementByName(model.columns, itemToC);
              if (toColumn) {
                newItem = { ...newItem, toColumn: toColumn.name };
              } else {
                showErrorMsg(`(id: ${item.id}) - an element "${itemToC}" not found!`);
              }
            }
            if (itemFromB) {
              const fromBeam = getElementByName(model.beams, itemFromB);
              if (fromBeam) {
                newItem = { ...newItem, fromBeam: fromBeam.name };
              } else {
                showErrorMsg(`(id: ${item.id}) - an element "${itemFromB}" not found!`);
              }
            }
            if (itemToB) {
              const toBeam = getElementByName(model.beams, itemToB);
              if (toBeam) {
                newItem = { ...newItem, toBeam: toBeam.name };
              } else {
                showErrorMsg(`(id: ${item.id}) - an element "${itemToB}" not found!`);
              }
            }
          } else {
            showErrorMsg(`(id: ${item.id}) - a model "${itemModel}" not found!`);
          }
        }
        if (itemType) {
          if (bracingTypes.includes(itemType)) {
            newItem = { ...newItem, type: itemType };
          } else {
            showErrorMsg(`(id: ${item.id}) - Incorrect bracing type (${itemType})!`);
          }
        }
        const profile = getImportProfileByDesignation(profiles, itemProfile, () =>
          showErrorMsg(`(id: ${item.id}) - a profile "${itemProfile}" not found!`)
        );
        newItem = {
          ...newItem,
          fromElevation: checkImportedNumber(itemFE),
          toElevation: checkImportedNumber(itemTE),
          profile: profile,
          library: getProfileLibrary(profile),
        };
        if (!profile) {
          if (itemLib) {
            if (libs.includes(itemLib)) {
              newItem = { ...newItem, library: itemLib };
            } else {
              showErrorMsg(`(id: ${item.id}) - Incorrect C/S library "${itemLib}"!`);
            }
          }
        }
        newItems.push(newItem);
        if (model && newItem.profile) {
          //@ts-ignore
          changedProject = {
            ...changedProject,
            models: models.map((mItem) =>
              mItem.name === model!.name ? handleCreateElement(model!, newItem) : mItem
            ),
          };
        }
      });
      handleChangeData(newItems);
      dispatch(changeProjectAction(changedProject));
    });
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Vertical Bracing</span>
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        <Button small icon="export" text="Export to CSV" intent="success" onClick={handleExport} />
        <Button
          small
          icon="import"
          text="Import from CSV"
          intent="success"
          onClick={handleImport}
        />
        <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
      </div>
      <div className="hr" />
      <div className={"p-5"}>
        <div className={"table-container"}>
          <table ref={tableRef} className="table bg-gray">
            <thead>
              <tr>
                <GeneralCheckBoxCell rowSpan={2} data={data} onChange={handleChangeData} />
                <th rowSpan={2}>FS No.</th>
                <th rowSpan={2}>From Column</th>
                <th rowSpan={2}>To Column</th>
                <th rowSpan={2}>Type</th>
                <th colSpan={2}>From</th>
                <th colSpan={2}>To</th>
                <th rowSpan={2}>C/S Library</th>
                <th rowSpan={2}>Profile</th>
              </tr>
              <tr>
                <th style={{ top: offsetTop }}>Beam</th>
                <th style={{ top: offsetTop }}>Elevation (m)</th>
                <th style={{ top: offsetTop }}>Beam</th>
                <th style={{ top: offsetTop }}>Elevation (m)</th>
              </tr>
            </thead>
            <tbody>{data.map((item) => getRow(item))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VerticalBracing;
