import React, { useMemo, useState } from "react";
import { Button } from "@blueprintjs/core";
import { SupportType, Project } from "../../../../../../store/main/types";
import { CheckBoxCell } from "../../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../../common/NumericCell";
import {
  OFFramesParametersUI,
  OpenFrameUI,
} from "../../../../../../store/ui/types";
import {
  getElementByName,
  exportToCSV,
  importFromCSV,
  fixNumberToStr,
} from "../../../../../3d-models/utils";
import { SelectorCell } from "../../../../../common/SelectorCell";
import { supportTypes } from "../../../../../../store/main/constants";
import {
  getOFModels,
  changeFrameChainage,
  changeFrameNoOfColumns,
  getSeparetedElementsOfModel,
  getMapOfBeamElements,
  removeConnectionsFromMap,
  mapToArray,
  getAdditionalElements,
  updateConnectionsFromMap,
  removeOFModel,
  getFSModels,
} from "../../../../../3d-models/openFrame";
import { GeneralCheckBoxCell } from "../../../../../common/GeneralCheckBoxCell";
import {
  TOpenFrame,
  TColumnOF,
  TFrameOF,
} from "../../../../../../store/main/openFrameTypes";
import { useDispatch } from "react-redux";
import { changeProjectAction } from "../../../../../../store/main/actions";
import { addEventAction } from "../../../../../../store/ui/actions";
import { isNumber } from "util";

type Props = {
  project?: Project;
  openFrameUI?: OpenFrameUI;
  setTab: (tab: "OFP" | "CR") => any;
  onChangeUI: (ui: OpenFrameUI) => any;
  onChagneModel: (model: TOpenFrame) => any;
  onError: (msg: string) => any;
};

export function FrameParameters(props: Props) {
  const {
    project,
    openFrameUI,
    setTab,
    onChangeUI,
    onChagneModel,
    onError,
  } = props;

  const [display, setDisplay] = useState<boolean>(true);

  const dispatch = useDispatch();

  const models = useMemo(() => getFSModels(project), [project]);

  const parameters = useMemo(() => {
    return (openFrameUI?.frames.parameters ?? []).filter((el) =>
      models.some((m) => m.name === el.model)
    );
  }, [models, openFrameUI]);

  function handleChangeRow(
    row: OFFramesParametersUI,
    field: string,
    value: any
  ) {
    if (!openFrameUI || !parameters) return;
    onChangeUI({
      ...openFrameUI,
      frames: {
        ...openFrameUI.frames,
        parameters: parameters.map((item) =>
          item.model === row.model && item.id == row.id
            ? { ...item, [field]: value }
            : item
        ),
      },
    });
  }

  function handleChangeChainage(row: OFFramesParametersUI, value: number) {
    handleChangeRow(row, "chainage", value);
    const model = getElementByName(models, row.model);
    if (!model) return;
    onChagneModel(changeFrameChainage(model, row.frame, value));
  }

  function handleChangeWidth(row: OFFramesParametersUI, value: number) {
    handleChangeRow(row, "width", value);
    const model = getElementByName(models, row.model);
    const frame = getElementByName(model?.frames, row.frame);
    if (!model || !frame) return;
    const map = getMapOfBeamElements(model);
    const changedFrame: TFrameOF = { ...frame, width: value };
    const columnDistance = changedFrame.width / (changedFrame.columns - 1);
    const leftZ = changedFrame.width / -2;
    const columns = model.columns
      .filter(
        (column) =>
          column.frame === row.frame && column.secondType === "GENERAL"
      )
      .sort((a, b) => a.pos.z - b.pos.z);
    const beams = model.beams
      .filter(
        (beam) =>
          beam.frame === row.frame &&
          beam.secondType === "GENERAL" &&
          beam.direction === "Z"
      )
      .sort((a, b) => a.startPos.z - b.startPos.z);
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const z = leftZ + columnDistance * i;
      const pos = column.pos.clone().setZ(z);
      const changed: TColumnOF = {
        ...column,
        pos,
        startPos: pos.clone(),
        endPos: pos.clone().setY(column.endPos.y),
        startConnected: [],
        connected: [],
        endConnected: [],
      };
      removeConnectionsFromMap(map, column, true, true);
      updateConnectionsFromMap(map, changed);
    }
    let currentZ;
    let i = 0;
    let j = 0;
    while (i < beams.length) {
      const beam = beams[i];
      if (currentZ !== undefined) {
        if (beam.startPos.z > currentZ) {
          currentZ = beam.startPos.z;
          j++;
        }
      } else {
        currentZ = beam.startPos.z;
      }
      const sz = leftZ + columnDistance * j;
      const ez = leftZ + columnDistance * (j + 1);
      const changed = {
        ...beam,
        startPos: beam.startPos.clone().setZ(sz),
        endPos: beam.endPos.clone().setZ(ez),
        startConnected: [],
        connected: [],
        endConnected: [],
      };
      removeConnectionsFromMap(map, beam, true, true);
      updateConnectionsFromMap(map, changed);
      i++;
    }
    onChagneModel({
      ...model,
      ...getSeparetedElementsOfModel(mapToArray(map)),
      frames: model.frames.map((frame) => {
        if (frame.name === row.frame) {
          return changedFrame;
        }
        return frame;
      }),
    });
  }

  function handleChangeNoOfColumns(row: OFFramesParametersUI, value: number) {
    handleChangeRow(row, "noOfColumns", value);
    const model = getElementByName(models, row.model);
    if (!model) return;
    onChagneModel(changeFrameNoOfColumns(model, row.frame, value));
  }

  function handleChangeTotalHeight(row: OFFramesParametersUI, value: number) {
    handleChangeRow(row, "totalHeight", value);
    const model = getElementByName(models, row.model);
    if (!model) return;
    const map = getMapOfBeamElements(model);
    for (const column of model.columns) {
      if (column.frame === row.frame && column.secondType === "GENERAL") {
        const changed: TColumnOF = {
          ...column,
          endPos: column.endPos.clone().setY(value),
          startConnected: [],
          connected: [],
          endConnected: [],
        };
        removeConnectionsFromMap(map, column, true, true);
        updateConnectionsFromMap(map, changed);
      }
    }
    for (const beam of model.beams) {
      if (
        beam.frame === row.frame &&
        beam.secondType === "GENERAL" &&
        beam.direction === "Z"
      ) {
        const delta = row.totalHeight / beam.startPos.y;
        const elevation = value / delta;
        const changed = {
          ...beam,
          startPos: beam.startPos.clone().setY(elevation),
          endPos: beam.endPos.clone().setY(elevation),
          startConnected: [],
          connected: [],
          endConnected: [],
        };
        removeConnectionsFromMap(map, beam, true, true);
        updateConnectionsFromMap(map, changed);
      }
    }
    onChagneModel({
      ...model,
      ...getSeparetedElementsOfModel(mapToArray(map)),
      frames: model.frames.map((frame) => {
        if (frame.name === row.frame) {
          return { ...frame, height: value };
        }
        return frame;
      }),
    });
  }

  function handleChangeSupportType(
    row: OFFramesParametersUI,
    value?: SupportType
  ) {
    handleChangeRow(row, "supportType", value);
    const model = getElementByName(models, row.model);
    if (!model) return;
    onChagneModel({
      ...model,
      frames: model.frames.map((frame) => {
        if (frame.name === row.frame) {
          return { ...frame, supportType: value ?? "Fix" };
        } else return frame;
      }),
    });
  }

  function handleDeleteRows() {
    if (!project || !openFrameUI) return;
    let deleting = parameters.filter((item) => item.selected);
    const notDeleting = parameters.filter((item) => !item.selected);
    let changedProject = { ...project };
    let changedOFUI = { ...openFrameUI };
    for (const model of changedProject.models as TOpenFrame[]) {
      if (!notDeleting.some((parameter) => parameter.model === model.name)) {
        deleting = deleting.filter((item) => item.model !== model.name);
        const { newProject, newUI } = removeOFModel(
          project,
          changedOFUI,
          model.name
        );
        changedProject = newProject;
        changedOFUI = newUI;
      }
    }
    for (const parameter of deleting.sort((a, b) => a.id - b.id)) {
      const model = getElementByName(
        changedProject.models as TOpenFrame[],
        parameter.model
      );
      if (!model) continue;
      const frameIndex = model.frames.findIndex(
        (frame) => frame.name === parameter.frame
      );
      if (frameIndex === -1) continue;
      const map = getMapOfBeamElements(model);
      let isAdditional = false;
      for (const element of mapToArray(map).filter(
        (element) => element.frame === parameter.frame
      )) {
        const additional = getAdditionalElements(map, element, openFrameUI);
        if (additional.length) {
          isAdditional = true;
          break;
        }
      }
      if (isAdditional) {
        dispatch(
          addEventAction(
            `Deleting Frames: Frame "${parameter.frame}" has additional elements!`,
            "danger"
          )
        );
        deleting = deleting.filter((item) => item.id !== parameter.id);
        continue;
      }
      model.columns
        .filter(
          (column) =>
            column.secondType === "GENERAL" && column.frame === parameter.frame
        )
        .forEach((column) => removeConnectionsFromMap(map, column));
      model.beams
        .filter(
          (beam) =>
            beam.secondType === "GENERAL" &&
            beam.direction === "Z" &&
            beam.frame === parameter.frame
        )
        .forEach((beam) => removeConnectionsFromMap(map, beam));
      if (frameIndex === 0) {
        model.beams
          .filter(
            (beam) =>
              beam.secondType === "GENERAL" &&
              beam.direction === "X" &&
              beam.frame === parameter.frame
          )
          .forEach((beam) => removeConnectionsFromMap(map, beam));
      } else if (frameIndex === model.frames.length - 1) {
        const prevFrame = model.frames[frameIndex - 1];
        model.beams
          .filter(
            (beam) =>
              beam.secondType === "GENERAL" &&
              beam.direction === "X" &&
              beam.frame === prevFrame.name
          )
          .forEach((beam) => removeConnectionsFromMap(map, beam));
      } else {
        const prevFrame = model.frames[frameIndex - 1];
        for (const item of mapToArray(map)) {
          if (item.frame === parameter.frame) {
            map.set(item.name, { ...item, frame: prevFrame.name });
          }
        }
      }
      const changedModels = changedProject.models.map((mItem) => {
        if (mItem.name === model.name) {
          return {
            ...model,
            ...getSeparetedElementsOfModel(mapToArray(map)),
            frames: model.frames.filter(
              (frame) => frame.name !== parameter.frame
            ),
          };
        }
        return mItem;
      });
      changedOFUI = {
        ...changedOFUI,
        frames: {
          ...changedOFUI.frames,
          parameters: changedOFUI.frames.parameters.filter(
            (item) => !(item.model === model.name && item.id === parameter.id)
          ),
        },
      };
      changedProject = { ...changedProject, models: changedModels };
    }
    onChangeUI(changedOFUI);
    dispatch(changeProjectAction(changedProject));
  }

  function getRowOFP(item: OFFramesParametersUI) {
    const wPercent = `${100 / 8}%`;
    return (
      <tr key={`${item.model}-${item.frame}`}>
        <CheckBoxCell
          key={`${item.model}-${item.frame}`}
          value={item.selected}
          onChange={(value) => handleChangeRow(item, "selected", value)}
        />
        <td>{item.model}</td>
        <td>{item.frame}</td>
        <NumericCell
          isDecimal={true}
          value={item.chainage}
          onChange={(value) => handleChangeChainage(item, value)}
          style={{ width: wPercent }}
        />
        <NumericCell
          isDecimal={true}
          value={item.width}
          onChange={(value) => handleChangeWidth(item, value)}
          style={{ width: wPercent }}
        />
        <NumericCell
          min={2}
          value={item.noOfColumns}
          onChange={(value) => handleChangeNoOfColumns(item, value)}
          style={{ width: wPercent }}
        />
        <NumericCell
          isDecimal={true}
          value={item.totalHeight}
          onChange={(value) => handleChangeTotalHeight(item, value)}
          style={{ width: wPercent }}
        />
        <SelectorCell<SupportType>
          items={supportTypes}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.supportType}
          onSelect={(value) => handleChangeSupportType(item, value)}
          filterable={false}
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      parameters.map((item) => ({
        "OF No.": item.model,
        "Frame No.": item.frame,
        "Chainage (m)": fixNumberToStr(item.chainage),
        "Width (m)": fixNumberToStr(item.width),
        "No. of Columns": item.noOfColumns,
        "Total Height (m)": fixNumberToStr(item.totalHeight),
        "Support Type": item.supportType,
      })),
      "Frames Parameters"
    );
  }

  /*function handleImport() {
    if (!openFrameUI) return;
    importFromCSV((arr, isCSV) => {
      if (!isCSV || !Array.isArray(arr)) return;
      let _parameters = [...parameters];
      arr.forEach((item) => {
        const itemModel = item["OF No."];
        const itemFrame = item["Frame No."];
        const itemChainage = item["Chainage (m)"];
        const itemWidth = item["Width (m)"];
        const itemNOC = item["No. of Columns"];
        const itemTH = item["Total Height (m)"];
        const itemST = item["Support Type"];
        const startMSG = "Open Frame Parameters (Import):";
        try {
          if (!parameters.some((param) => param.model === itemModel))
            throw new Error(`${startMSG} Model "${itemModel}" not found`);
          if (!parameters.some((param) => param.frame === itemFrame))
            throw new Error(`${startMSG} Frame "${itemFrame}" not found`);
          try {
            _parameters = parameters.map((param) => {
              if (param.model === itemModel && param.frame === itemFrame) {
                let newParam = { ...param };
                if (itemChainage) {
                  if (isNumber(itemChainage)) {
                    newParam = {
                      ...newParam,
                      chainage: Math.abs(itemChainage),
                    };
                  } else {
                    onError(
                      `${startMSG} (id: ${item.id}) - a value of "Chainage (m)" "${itemChainage}" is not a number!`
                    );
                  }
                }
                if (itemWidth) {
                  if (isNumber(itemWidth)) {
                    newParam = {
                      ...newParam,
                      width: Math.abs(itemWidth),
                    };
                  } else {
                    onError(
                      `${startMSG} (id: ${item.id}) - a value of "Width (m)" "${itemWidth}" is not a number!`
                    );
                  }
                }
                if (itemNOC) {
                  console.log("itemnoc",itemNOC);
                  
                  if (isNumber(itemNOC)) {
                    newParam = {
                      ...newParam,
                      noOfColumns: Math.round(Math.abs(itemNOC)),
                    };
                  } else {
                    onError(
                      `${startMSG} (id: ${item.id}) - a value of "No. of Columns" "${itemNOC}" is not a number!`
                    );
                  }
                }
                if (itemTH) {
                  if (isNumber(itemTH)) {
                    newParam = {
                      ...newParam,
                      /*noOfColumns: Math.abs(itemTH),*/
                      /*totalHeight: Math.abs(itemTH),
                    };
                  } else {
                    onError(
                      `${startMSG} (id: ${item.id}) - a value of "Total Height (m)" "${itemTH}" is not a number!`
                    );
                  }
                }
                if (itemST) {
                  if (supportTypes.includes(itemST)) {
                    newParam = { ...newParam, supportType: itemST };
                  } else {
                    onError(
                      `${startMSG} (id: ${item.id}) - Incorrect support type "${itemST}"!`
                    );
                  }
                }
                return newParam;
              } else return param;
            });
          } catch (pE) {
            throw new Error(`Open Frame Parameters (Import): Parse Error`);
          }
        } catch (e) {
          onError(e.message);
        }
      });
      onChangeUI({
        ...openFrameUI,
        frames: { ...openFrameUI.frames, parameters: _parameters },
      });
    });
  }*/

  function handleImport2() {
    if (!openFrameUI) return;
    importFromCSV((arr, isCSV) => {
      if (!isCSV || !Array.isArray(arr)){
        console.log("issue is nhere");
         return;
      }
      const updatedParameters = [...parameters]; 
      console.log(updatedParameters);
      
      arr.forEach((item) => {
        const { "OF No.": itemModel, "Frame No.": itemFrame, "Chainage (m)": itemChainage, "Width (m)": itemWidth, "No. of Columns": itemNOC, "Total Height (m)": itemTH, "Support Type": itemST } = item;
        const parameterIndex = updatedParameters.findIndex(param => param.model === itemModel && param.frame === itemFrame);
  
        if (parameterIndex === -1) {
          onError(`Open Frame Parameters (Import): Model "${itemModel}" or Frame "${itemFrame}" not found`);
          return;
        }
        const paramToUpdate = { ...updatedParameters[parameterIndex] };
        if (itemChainage && isNumber(itemChainage)) {
          paramToUpdate.chainage = Math.abs(itemChainage);
          console.log(paramToUpdate.chainage);
        }
        if (itemWidth && isNumber(itemWidth)) {
          paramToUpdate.width = Math.abs(itemWidth);
        }
        if (itemNOC && isNumber(itemNOC)) {
          paramToUpdate.noOfColumns = Math.round(Math.abs(itemNOC));
        }
        if (itemTH && isNumber(itemTH)) {
          paramToUpdate.totalHeight = Math.abs(itemTH);
        }
        if (itemST && supportTypes.includes(itemST)) {
          paramToUpdate.supportType = itemST;
        }
        updatedParameters[parameterIndex] = paramToUpdate;
      });
      onChangeUI({
        ...openFrameUI,
        frames: { ...openFrameUI.frames, parameters: updatedParameters },
      });
    });
  }

  function isNumber(value:any) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  

  return (
    <>
      <div className="hr" />
      <div className="label-light bg-dark">
        <Button
          icon={display ? "caret-down" : "caret-right"}
          onClick={() => setDisplay(!display)}
          minimal
          small
        />
        <Button
          small
          minimal
          className={"c-light"}
          text={"Factory Shed Parameters"}
          onClick={() => setTab("OFP")}
        />
        <span>|</span>
        <Button
          small
          minimal
          className={"c-light"}
          text={"Column Relocation"}
          onClick={() => setTab("CR")}
        />
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
          onClick={handleImport2}
        />
      </div>
      <div className="hr" />
      <div className={"p-5"} style={{ display: display ? "block" : "none" }}>
        <div className={"small-table-container"}>
          <table className="table bg-gray">
            <thead>
              <tr>
                <GeneralCheckBoxCell
                  data={parameters}
                  onChange={(data) => {
                    if (!openFrameUI) return;
                    onChangeUI({
                      ...openFrameUI,
                      frames: { ...openFrameUI.frames, parameters: data },
                    });
                  }}
                />
                <th>OF No.</th>
                <th>Frame No.</th>
                <th>Chainage (m)</th>
                <th>Width (m)</th>
                <th>No. of Columns</th>
                <th>Total Height (m)</th>
                <th>Support Type</th>
              </tr>
            </thead>
            <tbody>{parameters?.map((item) => getRowOFP(item))}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}
