import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@blueprintjs/core";
import { TOpenFrame, TPipeOF, TBeamElement } from "../../../../../store/main/openFrameTypes";
import { OFPipeSupportUI, DirectLoadUI } from "../../../../../store/ui/types";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import {
  getNextId,
  getElementByName,
  getElementByField,
  convertToNamesArray,
  getPosByDistance,
  exportToCSV,
  importFromCSV,
  checkImportedNumber,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { useDispatch, useSelector } from "react-redux";
import { changeModel, changeProjectAction } from "../../../../../store/main/actions";
import { SelectorCell } from "../../../../common/SelectorCell";
import { PipeSupportType, Project } from "../../../../../store/main/types";
import { pipeSupportTypes } from "../../../../../store/main/constants";
import { NumericCell } from "../../../../common/NumericCell";
import { getSupportPosByBeam } from "../../../../3d-models/openFrame";
import { ApplicationState } from "../../../../../store";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { getBeamsAroundPipe } from "../../../../3d-models/pipe-importing/toOpenFrame";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";

type Props = {
  models: TOpenFrame[];
};

const initDirectLoad: DirectLoadUI = {
  id: 0,
  selected: false,
  lineNo: "",
  distance: 0,

  empty_Fy: 0,

  test_Fx: 0,
  test_Fy: 0,
  test_Fz: 0,
  test_Mx: 0,
  test_My: 0,
  test_Mz: 0,

  operating_Fx: 0,
  operating_Fy: 0,
  operating_Fz: 0,
  operating_Mx: 0,
  operating_My: 0,
  operating_Mz: 0,

  thermalAnchor_Fx: 0,
  thermalAnchor_Fy: 0,
  thermalAnchor_Fz: 0,
  thermalAnchor_Mx: 0,
  thermalAnchor_My: 0,
  thermalAnchor_Mz: 0,

  thermalFriction_Fx: 0,
  thermalFriction_Fy: 0,
  thermalFriction_Fz: 0,

  windLoadX_Fx: 0,
  windLoadX_Fy: 0,
  windLoadX_Fz: 0,

  windLoadZ_Fx: 0,
  windLoadZ_Fy: 0,
  windLoadZ_Fz: 0,

  surgeLoad_Fx: 0,
  surgeLoad_Fy: 0,
  surgeLoad_Fz: 0,

  snowLoad: 0,
};

export function SupportModelingFS(props: Props) {
  const { models } = props;

  const [supports, setSupports] = useState<OFPipeSupportUI[]>([]);

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const dispatch = useDispatch();

  const loadings = useMemo(() => {
    return openFrameUI?.loadingsUI;
  }, [openFrameUI]);

  useEffect(() => {
    const newSupports: OFPipeSupportUI[] = [];
    models.forEach((model) => {
      model.pipes.forEach((pipe) => {
        pipe.supports.forEach((supp) => {
          newSupports.push({
            id: supp.id,
            selected: false,
            model: model.name,
            pipe: pipe.name,
            KforSpring: supp.KforSpring,
            type: supp.type,
            beam: supp.beam,
            distance: supp.distance,
            position: supp.position,
          });
        });
      });
    });
    setSupports(newSupports);
  }, []);

  function handleAddRow() {
    setSupports([
      ...supports,
      {
        id: getNextId(supports),
        selected: false,
        type: "Anchor",
        KforSpring: 0,
        distance: 0,
      },
    ]);
  }

  function changeLoadingsUI(directLoads: DirectLoadUI[]) {
    if (!openFrameUI || !loadings) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        loadingsUI: {
          ...loadings,
          pipingLoadsUI: {
            ...loadings.pipingLoadsUI,
            directLoads,
          },
        },
      })
    );
  }

  function handleCreateElement(model: TOpenFrame, pipe: TPipeOF, row: OFPipeSupportUI) {
    let changedModel: TOpenFrame = { ...model };
    let changedRow: OFPipeSupportUI = { ...row };
    const beam = getElementByName(model.beams, row.beam);
    if (beam && loadings) {
      changeLoadingsUI(
        loadings.pipingLoadsUI.directLoads.filter(
          (load) => load.model === model.name && load.element === beam.name
        )
      );
    }
    changedModel = {
      ...model,
      pipes: model.pipes.map((item) =>
        item.id === pipe.id
          ? {
              ...pipe,
              supports: pipe.supports.filter((supp) => supp.id !== row.id),
            }
          : item
      ),
    };
    if (beam) {
      const position = getSupportPosByBeam(pipe.startPos, pipe.endPos, pipe.direction, beam);
      changedRow = {
        ...changedRow,
        distance: pipe.startPos.distanceTo(position),
        position,
      };
      if (loadings) {
        const loads = loadings.pipingLoadsUI.directLoads;
        changeLoadingsUI([
          ...loads,
          {
            ...initDirectLoad,
            id: getNextId(loads),
            model: model.name,
            element: beam.name,
          },
        ]);
      }
    } else {
      const position = getPosByDistance(changedRow.distance, pipe.startPos, pipe.endPos);
      changedRow = {
        ...changedRow,
        distance: pipe.startPos.distanceTo(position),
        position,
      };
    }
    changedModel = {
      ...changedModel,
      pipes: model.pipes.map((pItem) =>
        pItem.id === pipe.id
          ? {
              ...pipe,
              supports: [
                ...pipe.supports,
                {
                  id: changedRow.id,
                  beam: changedRow.beam,
                  type: changedRow.type,
                  KforSpring: changedRow.KforSpring,
                  distance: changedRow.distance,
                  position: changedRow.position!,
                },
              ],
            }
          : pItem
      ),
    };
    return { changedModel, changedRow };
  }

  function handleChangeRow(row: OFPipeSupportUI, field: string, value: any, isHard?: boolean) {
    let changed = { ...row, [field]: value };
    if (isHard) {
      const model = getElementByName(models, row.model);
      const pipe = getElementByName(model?.pipes, row.pipe);
      if (model && pipe) {
        const beam = getElementByName(model.beams, row.beam);
        if (beam && loadings) {
          changeLoadingsUI(
            loadings.pipingLoadsUI.directLoads.filter(
              (load) => load.model === model.name && load.element === beam.name
            )
          );
        }
        dispatch(
          changeModel({
            ...model,
            pipes: model.pipes.map((item) =>
              item.id === pipe.id
                ? {
                    ...pipe,
                    supports: pipe.supports.filter((supp) => supp.id !== row.id),
                  }
                : item
            ),
          } as TOpenFrame)
        );
      }
    }
    const model = getElementByName(models, changed.model);
    const pipe = getElementByName(model?.pipes, changed.pipe);
    const beam = getElementByName(model?.beams, changed.beam);
    if (beam && pipe) {
      const position = getSupportPosByBeam(pipe.startPos, pipe.endPos, pipe.direction, beam);
      changed = {
        ...changed,
        distance: pipe.startPos.distanceTo(position),
        position,
      };
      if (field === "beam" && loadings) {
        if (row.beam && model) {
          changeLoadingsUI(
            loadings.pipingLoadsUI.directLoads.map((load) => {
              if (load.model === model.name && load.element === row.beam) {
                return { ...load, element: beam.name };
              }
              return load;
            })
          );
        } else if (model) {
          const loads = loadings.pipingLoadsUI.directLoads;
          changeLoadingsUI([
            ...loads,
            {
              ...initDirectLoad,
              id: getNextId(loads),
              model: model.name,
              element: beam.name,
            },
          ]);
        }
      }
    } else if (pipe) {
      const position = getPosByDistance(changed.distance, pipe.startPos, pipe.endPos);
      changed = {
        ...changed,
        distance: pipe.startPos.distanceTo(position),
        position,
      };
    }
    setSupports(supports.map((supp) => (supp.id === changed.id ? changed : supp)));
    if (!model || !pipe) return;
    const support = getElementByField(pipe.supports, "id", changed.id);
    if (support) {
      dispatch(
        changeModel({
          ...model,
          pipes: model.pipes.map((pItem) =>
            pItem.id === pipe.id
              ? {
                  ...pipe,
                  supports: pipe.supports.map((supp) =>
                    supp.id === support.id
                      ? {
                          id: changed.id,
                          beam: changed.beam,
                          type: changed.type,
                          KforSpring: changed.KforSpring,
                          distance: changed.distance,
                          position: changed.position,
                        }
                      : supp
                  ),
                }
              : pItem
          ),
        } as TOpenFrame)
      );
    } else {
      dispatch(
        changeModel({
          ...model,
          pipes: model.pipes.map((pItem) =>
            pItem.id === pipe.id
              ? {
                  ...pipe,
                  supports: [
                    ...pipe.supports,
                    {
                      id: changed.id,
                      beam: changed.beam,
                      type: changed.type,
                      KforSpring: changed.KforSpring,
                      distance: changed.distance,
                      position: changed.position,
                    },
                  ],
                }
              : pItem
          ),
        } as TOpenFrame)
      );
    }
  }

  function handleDeleteRows() {
    handleDeleteElements(supports.filter((item) => item.selected));
    setSupports(supports.filter((item) => !item.selected));
  }

  function handleDeleteElements(elements: OFPipeSupportUI[], project?: Project) {
    const map = new Map<string, Map<string, number[]>>();
    let changedProject = project ? { ...project } : undefined;
    elements.forEach((element) => {
      if (element.model && element.pipe) {
        const pipes = map.get(element.model);
        if (pipes) {
          const ids = pipes.get(element.pipe) ?? [];
          pipes.set(element.pipe, [...ids, element.id]);
        } else {
          const pipesMap = new Map<string, number[]>();
          pipesMap.set(element.pipe, [element.id]);
          map.set(element.model, pipesMap);
        }
      }
    });
    map.forEach((pipes, key) => {
      const model = getElementByName(models, key);
      if (model) {
        let newModel = { ...model };
        pipes.forEach((ids, pipeKey) => {
          newModel = {
            ...newModel,
            pipes: newModel.pipes.map((pItem) =>
              pItem.name === pipeKey
                ? {
                    ...pItem,
                    supports: pItem.supports.filter((supp) => !ids.includes(supp.id)),
                  }
                : pItem
            ),
          };
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

  function getRow(row: OFPipeSupportUI) {
    const model = getElementByName(models, row.model);
    const pipe = getElementByName(model?.pipes, row.pipe);
    const elements = model ? [...model.beams, ...model.cantilevers] : [];
    const beams = pipe && getBeamsAroundPipe(elements, pipe.direction, pipe.startPos, pipe.endPos);
    return (
      <tr key={row.id}>
        <CheckBoxCell
          key={row.id}
          value={row.selected}
          onChange={(value) => handleChangeRow(row, "selected", value)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(models)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.model}
          onSelect={(value) => handleChangeRow(row, "model", value, true)}
          filterable={false}
        />
        <SelectorCell<string>
          items={convertToNamesArray(model?.pipes)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.pipe}
          onSelect={(value) => handleChangeRow(row, "pipe", value, true)}
          filterable={false}
        />
        <SelectorCell<PipeSupportType | "Custom">
          items={pipeSupportTypes}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.type}
          onSelect={(value) => handleChangeRow(row, "type", value)}
          filterable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <NumericCell
          isDecimal={true}
          value={row.KforSpring}
          onChange={(value) => handleChangeRow(row, "KforSpring", value)}
        />
        <NumericCell
          min={0}
          max={pipe?.startPos.distanceTo(pipe.endPos)}
          isDecimal={true}
          value={row.distance}
          disabled={!!row.beam}
          onChange={(value) => handleChangeRow(row, "distance", value)}
        />
        <td>{row.position ? `(${row.position.x}; ${row.position.y}; ${row.position.z})` : null}</td>
        <SelectorCell<string>
          items={convertToNamesArray(beams)}
          selected={row.beam}
          onSelect={(value) => handleChangeRow(row, "beam", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      supports.map((item) => ({
        id: item.id,
        model: item.model,
        pipe: item.pipe,
        type: item.type,
        beam: item.beam,
        distance: item.distance,
        position: `(${item.position?.x ?? 0}; ${item.position?.y ?? 0}; ${item.position?.z ?? 0})`,
        KforSpring: item.KforSpring,
      })),
      "FS Support Modeling"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Support Modeling (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      let changedProject = handleDeleteElements(supports, project);
      const newItems: OFPipeSupportUI[] = [];
      newData.forEach((item) => {
        let newItem: OFPipeSupportUI = {
          id: getNextId(newItems),
          selected: false,
          type: "Anchor",
          distance: 0,
          KforSpring: 0,
        };
        let model: TOpenFrame | undefined;
        let pipe: TPipeOF | undefined;
        let beam: TBeamElement | undefined;
        if (item.model) {
          model = getElementByName(
            // @ts-ignore
            changedProject.models as TOpenFrame[],
            item.model
          );
          if (model) {
            newItem = { ...newItem, model: model.name };
            if (item.pipe) {
              pipe = getElementByName(model.pipes, item.pipe);
              if (pipe) {
                newItem = { ...newItem, pipe: pipe.name };
              } else {
                showErrorMsg(`(id: ${item.id}) - a pipe "${item.pipe}" not found!`);
              }
            }
            if (item.beam) {
              beam = getElementByName([...model.beams, ...model.cantilevers], item.beam);
              if (beam) {
                newItem = { ...newItem, beam: beam.name };
              } else {
                showErrorMsg(`(id: ${item.id}) - an element "${item.beam}" not found!`);
              }
            }
          } else {
            showErrorMsg(`(id: ${item.id}) - a model "${item.model}" not found!`);
          }
        }
        if (item.type) {
          if (pipeSupportTypes.includes(item.type)) {
            newItem = { ...newItem, type: item.type };
          } else {
            showErrorMsg(`(id: ${item.id}) - Incorrect support type "${item.type}"!`);
          }
        }
        newItem = {
          ...newItem,
          distance: checkImportedNumber(item.distance) ?? 0,
          KforSpring: checkImportedNumber(item.KforSpring) ?? 0,
        };
        if (model && pipe) {
          const { changedModel, changedRow } = handleCreateElement(model!, pipe!, newItem);
          // @ts-ignore
          changedProject = {
            ...changedProject,
            models: models.map((mItem) => (mItem.name === model!.name ? changedModel : mItem)),
          };
          newItems.push(changedRow);
        } else {
          newItems.push(newItem);
        }
      });
      setSupports(newItems);
      // @ts-ignore
      dispatch(changeProjectAction(changedProject));
    });
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Support Modeling</span>
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        <Button small icon="export" text="Export to CSV" intent="success" onClick={handleExport} />
        <Button
          small
          icon="import"
          text="Import from CSV"
          intent="success"
          onClick={handleImport}
        />
        <Button small icon="plus" text="Add row" intent="primary" onClick={handleAddRow} />
      </div>
      <div className="hr" />
      <div className="d-flex p-5">
        <div className="d-flex f-grow table-container">
          <table className="table bg-gray">
            <thead>
              <tr>
                <GeneralCheckBoxCell data={supports} onChange={setSupports} />
                <th>FS No.</th>
                <th>Pipe Line No.</th>
                <th>Support Type</th>
                <th>
                  K for Spring (KN/M<sup>2</sup>/m)
                </th>
                <th>Distance from start of Pipe (m)</th>
                <th>Position</th>
                <th>Supporting Beam No.</th>
              </tr>
            </thead>
            <tbody>{supports.map((supp) => getRow(supp))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
