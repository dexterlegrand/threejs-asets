import React, { useRef, useMemo, useState, useEffect } from "react";
import { Button } from "@blueprintjs/core";
import { Direction3, Project } from "../../../../../store/main/types";
import {
  TOpenFrame,
  TPipeOF,
  TBeamOF,
} from "../../../../../store/main/openFrameTypes";
import { useSelector, useDispatch } from "react-redux";
import { ApplicationState } from "../../../../../store";
import {
  getTopOffset,
  getNextId,
  getIndexName,
  getElementByName,
  convertToNamesArray,
  getElementByField,
  checkFileType,
  exportToCSV,
  importFromCSV,
  getImportMaterialByMaterialName,
  checkImportedNumber,
  getUnicuesArray,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { fixVector } from "../../../../3d-models/openFrame";
import { OFPipeUI } from "../../../../../store/ui/types";
import {
  changeOFUIAction,
  addEventAction,
} from "../../../../../store/ui/actions";
import {
  changeModel,
  changeProjectAction,
} from "../../../../../store/main/actions";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { NumericCell } from "../../../../common/NumericCell";
import { Vector3 } from "three";
import { directions3 } from "../../../../../store/main/constants";
import { importPipesToModels } from "../../../../3d-models/pipe-importing/toOpenFrame";
import { NumericInputDlg } from "../../../../common/NumericInputDlg";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { Material, PipeProfile } from "../../../../../store/data/types";

type Props = {
  models: TOpenFrame[];
};

export function PipeModelingOF(props: Props) {
  const { models } = props;

  const [dialog, setDialog] = useState<JSX.Element>();
  const [offsetTop, setOffsetTop] = useState<number>(0);

  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const resoures = useSelector((state: ApplicationState) => state.data);

  const openFrameUI = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.openFrameUI
  );

  const dispatch = useDispatch();

  const pipeLibs = useMemo(() => {
    return getUnicuesArray(
      resoures.pipingSS.map((profile) => profile.country_code?.trim() ?? "")
    );
  }, [resoures]);

  const data = useMemo(() => {
    return openFrameUI?.pipes.items ?? [];
  }, [openFrameUI]);

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, []);

  function handleChangeData(items: OFPipeUI[]) {
    if (!openFrameUI) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        pipes: {
          ...openFrameUI.pipes,
          items,
        },
      })
    );
  }

  function handleAddRow() {
    const intex = getIndexName(data, "PP");
    handleChangeData([
      ...data,
      {
        id: getNextId(data),
        selected: false,
        name: `PP${intex}`,
        direction: "+X",
        elevationB1: 0,
        distanceFromB1: 0,
        distanceFromLeftB1: 0,
        elevationB2: 0,
        distanceFromB2: 0,
        distanceFromLeftB2: 0,
        diameter: 0,
        thickness: 0,
        succeeding: "END",
      },
    ]);
  }

  function handleChangeRow(row: OFPipeUI, field: string, value: any) {
    handleChangeData(
      data.map((item) => {
        if (item.id === row.id) {
          return {
            ...item,
            [field]: value,
          };
        }
        return item;
      })
    );
  }

  function handleDeleteRows() {
    handleDeleteElements(data.filter((item) => item.selected));
    handleChangeData(data.filter((item) => !item.selected));
  }

  function handleHardChange(row: OFPipeUI, field: string, value: any) {
    let changed = { ...row, [field]: value };
    if (field === "model") {
      const name = `${value}-PP`;
      const index = getIndexName(data, name);
      changed = {
        ...changed,
        name: `${name}${index}`,
        B1: undefined,
        B2: undefined,
        succeeding: "END",
      };
    } else if (field === "direction") {
      changed = {
        ...changed,
        B1: undefined,
        succeeding: "END",
      };
    }
    handleChangeData(
      data.map((item) => (item.id === changed.id ? changed : item))
    );
    let model = getElementByName(models, row.model);
    const pipe = getElementByField(model?.pipes, "id", changed.id);
    if (!model || !pipe) return;
    model = handleDeleteElement(model, pipe.id);
    dispatch(changeModel(model));
  }

  function handleSoftChange(row: OFPipeUI, field: string, value: any) {
    const changed = { ...row, [field]: value };
    handleChangeData(
      data.map((item) => (item.id === changed.id ? changed : item))
    );
    const model = getElementByName(models, row.model);
    if (!model) return;
    const pipe = getElementByField(model.pipes, "id", changed.id);
    if (pipe) {
      dispatch(
        changeModel({
          ...model,
          pipes: model.pipes.map((item) => {
            if (item.id === changed.id) {
              let changedItem: TPipeOF = { ...item };
              switch (field) {
                case "B1":
                case "elevationB1":
                case "distanceFromB1":
                case "distanceFromLeftB1":
                  changedItem = {
                    ...changedItem,
                    B1: changed.B1!,
                    elevationB1: changed.elevationB1,
                    distanceFromB1: changed.distanceFromB1,
                    distanceFromLeftB1: changed.distanceFromLeftB1,
                    startPos: getPipeVector(model.beams, changed, true),
                  };
                  break;
                case "B2":
                case "elevationB2":
                case "distanceFromB2":
                case "distanceFromLeftB2":
                  changedItem = {
                    ...changedItem,
                    B2: changed.B2!,
                    elevationB2: changed.elevationB2,
                    distanceFromB2: changed.distanceFromB2,
                    distanceFromLeftB2: changed.distanceFromLeftB2,
                    endPos: getPipeVector(model.beams, changed, false),
                  };
                  break;
                case "diameter":
                case "thickness":
                case "profile":
                  changedItem = {
                    ...changedItem,
                    diameter:
                      changed.profile?.outside_diameter_global ??
                      changed.diameter,
                    thickness:
                      changed.profile?.wall_thickness_global ??
                      changed.thickness,
                    profile: changed.profile!,
                    succeeding: "END",
                  };
                  break;
                case "succeeding":
                  if (value === "END") {
                    changedItem = {
                      ...changedItem,
                      succeeding: value,
                    };
                  } else {
                    const next = getElementByName(model.pipes, value);
                    if (next) {
                      changedItem = {
                        ...changedItem,
                        B2: next.B1,
                        distanceFromB2: next.distanceFromB1,
                        distanceFromLeftB2: next.distanceFromLeftB1,
                        endPos: next.startPos.clone(),
                        succeeding: value,
                      };
                    }
                  }
                  break;
                default:
                  changedItem = {
                    ...changedItem,
                    [field]: value,
                  };
              }
              return changedItem;
            }
            return item;
          }),
        } as TOpenFrame)
      );
    } else if (
      changed.B1 &&
      changed.B2 &&
      (changed.profile || (changed.thickness && changed.diameter)) &&
      changed.material
    ) {
      dispatch(
        changeModel({
          ...model,
          pipes: [
            ...model.pipes,
            {
              id: changed.id,
              name: changed.name,
              direction: changed.direction,
              B1: changed.B1,
              elevationB1: changed.elevationB1,
              distanceFromB1: changed.distanceFromB1,
              distanceFromLeftB1: changed.distanceFromLeftB1,
              B2: changed.B2,
              elevationB2: changed.elevationB2,
              distanceFromB2: changed.distanceFromB2,
              distanceFromLeftB2: changed.distanceFromLeftB2,
              startPos: getPipeVector(model.beams, changed, true),
              endPos: getPipeVector(model.beams, changed, false),
              diameter: changed.profile?.outside_diameter ?? changed.diameter,
              thickness:
                changed.profile?.wall_thickness_global ?? changed.thickness,
              profile: changed.profile,
              material: changed.material,
              succeeding: changed.succeeding,
              supports: [],
            },
          ],
        } as TOpenFrame)
      );
    }
  }

  function getPipeVector(beams: TBeamOF[], ui: OFPipeUI, isStart: boolean) {
    if (isStart) {
      const beam = getElementByName(beams, ui.B1);
      if (!beam) return new Vector3();
      return fixVector(
        beam,
        fixVector(beam, beam.startPos, ui.distanceFromB1, true),
        ui.distanceFromLeftB1
      ).setY(ui.elevationB1);
    } else {
      const beam = getElementByName(beams, ui.B2);
      if (!beam) return new Vector3();
      return fixVector(
        beam,
        fixVector(beam, beam.startPos, ui.distanceFromB2, true),
        ui.distanceFromLeftB2
      ).setY(ui.elevationB2);
    }
  }

  function getBeams(pipe: OFPipeUI, beams: TBeamOF[], beam?: TBeamOF) {
    switch (pipe.direction) {
      case "+X":
      case "-X":
        return beams.filter(
          (item) =>
            item.startPos.x === item.endPos.x &&
            (beam
              ? pipe.direction === "+X"
                ? item.startPos.x > beam.startPos.x
                : item.startPos.x < beam.startPos.x
              : true)
        );
      case "+Z":
      case "-Z":
        return beams.filter(
          (item) =>
            item.startPos.z === item.endPos.z &&
            (beam
              ? pipe.direction === "+Z"
                ? item.startPos.z > beam.startPos.z
                : item.startPos.z < beam.startPos.z
              : true)
        );
      default:
        return beams.filter((item) =>
          beam
            ? pipe.direction === "+Y"
              ? item.startPos.y > beam.startPos.y
              : item.startPos.y < beam.startPos.y
            : true
        );
    }
  }

  function getRow(row: OFPipeUI, arr: OFPipeUI[]) {
    const model = getElementByName(models, row.model);
    const beams = model?.beams ?? [];
    const isPrev = row.succeeding !== "END";
    const isNext = data.some((item) => item.succeeding === row.name);
    const from = getElementByName(beams, row.B1);
    return (
      <tr key={row.id}>
        <CheckBoxCell
          key={row.id}
          value={row.selected}
          disabled={isNext || isPrev}
          onChange={(value) => handleChangeRow(row, "selected", value)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(models)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.model}
          disabled={isNext || isPrev}
          onSelect={(value) => handleHardChange(row, "model", value)}
          filterable={false}
        />
        <td>{row.name}</td>
        <SelectorCell<Direction3>
          items={directions3}
          selected={row.direction}
          disabled={isNext || isPrev}
          onSelect={(value) => handleHardChange(row, "direction", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <SelectorCell<string>
          items={convertToNamesArray(getBeams(row, beams))}
          selected={row.B1}
          disabled={isNext}
          onSelect={(value) => handleSoftChange(row, "B1", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={true}
          filter={(query, item) =>
            query ? item.includes(query.toUpperCase()) : true
          }
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={row.elevationB1}
          disabled={isNext}
          onChange={(value) => handleSoftChange(row, "elevationB1", value)}
        />
        <NumericCell
          isDecimal={true}
          value={row.distanceFromB1}
          disabled={isNext}
          onChange={(value) => handleSoftChange(row, "distanceFromB1", value)}
        />
        <NumericCell
          isDecimal={true}
          value={row.distanceFromLeftB1}
          disabled={isNext}
          onChange={(value) =>
            handleSoftChange(row, "distanceFromLeftB1", value)
          }
        />
        <SelectorCell<string>
          items={convertToNamesArray(getBeams(row, beams, from))}
          selected={row.B2}
          disabled={isPrev}
          onSelect={(value) => handleSoftChange(row, "B2", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={true}
          filter={(query, item) =>
            query ? item.includes(query.toUpperCase()) : true
          }
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={row.elevationB2}
          disabled={isPrev}
          onChange={(value) => handleSoftChange(row, "elevationB2", value)}
        />
        <NumericCell
          isDecimal={true}
          value={row.distanceFromB2}
          disabled={isPrev}
          onChange={(value) => handleSoftChange(row, "distanceFromB2", value)}
        />
        <NumericCell
          isDecimal={true}
          value={row.distanceFromLeftB2}
          disabled={isPrev}
          onChange={(value) =>
            handleSoftChange(row, "distanceFromLeftB2", value)
          }
        />
        <NumericCell
          isDecimal={true}
          value={row.profile?.outside_diameter_global ?? row.diameter}
          disabled={!!row.profile}
          onChange={(value) => handleSoftChange(row, "diameter", value)}
        />
        <NumericCell
          isDecimal={true}
          value={row.profile?.wall_thickness_global ?? row.thickness}
          disabled={!!row.profile}
          onChange={(value) => handleSoftChange(row, "thickness", value)}
        />
        <SelectorCell<string>
          items={pipeLibs}
          selected={row.lib}
          onSelect={(value) => handleChangeRow(row, "lib", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <SelectorCell<PipeProfile>
          items={resoures.pipingSS}
          selected={row.profile}
          onSelect={(value) => handleSoftChange(row, "profile", value)}
          itemKey={(item) => item.piping_details_id}
          itemLabel={(item) =>
            `${item.nominal_pipe_size_inch} - ${item.schedule}`
          }
          filterable={true}
          filter={(query, item) =>
            query
              ? `${item.nominal_pipe_size_inch} - ${item.schedule}`
                  .toLocaleLowerCase()
                  .includes(query.toLocaleLowerCase())
              : true
          }
          clearable={true}
        />
        <SelectorCell<Material>
          items={resoures.materials}
          selected={row.material}
          onSelect={(value) => handleSoftChange(row, "material", value)}
          itemKey={(item) => item.material_id}
          itemLabel={(item) => item.material_name}
          filterable={false}
        />
        <SelectorCell<string>
          items={getPipes(row, arr)}
          selected={row.succeeding}
          onSelect={(value) => handleSoftChange(row, "succeeding", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
      </tr>
    );
  }

  function getPipes(pipe: OFPipeUI, arr: OFPipeUI[]) {
    let pipes: string[] = ["END"];
    arr.forEach((item) => {
      if (
        item.model &&
        item.model === pipe.model &&
        item.name !== pipe.name &&
        item.diameter === pipe.diameter
      ) {
        pipes = [...pipes, item.name];
      }
    });
    return pipes;
  }

  function handleDeleteElements(elements: OFPipeUI[], project?: Project) {
    const map = new Map<string, number[]>();
    let changedProject = project ? { ...project } : undefined;
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
        const newModel = {
          ...model,
          pipes: model.pipes.filter(
            (item) => !ids.some((id) => id === item.id)
          ),
        };
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

  function handleDeleteElement(model: TOpenFrame, id: number) {
    return {
      ...model,
      pipes: model.pipes.filter((item) => item.id !== id),
    };
  }

  function handleImportPipes() {
    if (!project || !openFrameUI) return;
    setDialog(
      <NumericInputDlg
        title={"Distance around models"}
        label={"Margin in meters around structure for importing pipe"}
        isDecimal={true}
        defaultValue={2}
        onClose={() => setDialog(undefined)}
        onSubmit={(value) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".xch, .pps";
          input.onchange = (event: any) => {
            const file = (event.target.files as FileList)[0];
            if (!file) return;
            file.text().then((text) => {
              const json = JSON.parse(text);
              const extension = checkFileType(file.name);
              if (extension === "xch" || extension === "pps") {
                importPipesToModels(
                  dispatch,
                  openFrameUI,
                  project,
                  resoures,
                  extension,
                  json,
                  value
                );
              }
            });
          };
          input.click();
          input.remove();
          setDialog(undefined);
        }}
      />
    );
  }

  function handleExport() {
    exportToCSV(
      data.map((item) => ({
        id: item.id,
        model: item.model ?? "",
        direction: item.direction ? `'${item.direction}` : "",
        beam1: item.B1 ?? "",
        elevation1: item.elevationB1,
        distanceFromBeam1: item.distanceFromB1,
        distanceFromLeftSideOfBeam1: item.distanceFromLeftB1,
        beam2: item.B2 ?? "",
        elevation2: item.elevationB2,
        distanceFromBeam2: item.distanceFromB2,
        distanceFromLeftSideOfBeam2: item.distanceFromLeftB2,
        diameter: item.diameter,
        thickness: item.thickness,
        "C/S Library": item.profile?.country_code?.trim() ?? "",
        Profile: item.profile
          ? `${item.profile.nominal_pipe_size_inch} - ${item.profile.schedule}`
          : "",
        material: item.material?.material_name ?? "",
      })),
      "Pipe Modeling"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Pipe Modeling (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((imported, isCSV) => {
      if (!isCSV || !Array.isArray(imported)) return;
      let changedProject = handleDeleteElements(data, project);
      const newData: OFPipeUI[] = [];
      for (const item of imported) {
        let index = getIndexName(newData, "PP");
        let newItem: OFPipeUI = {
          id: getNextId(newData),
          selected: false,
          direction: "+X",
          elevationB1: 0,
          distanceFromB1: 0,
          distanceFromLeftB1: 0,
          elevationB2: 0,
          distanceFromB2: 0,
          distanceFromLeftB2: 0,
          name: `PP${index}`,
          diameter: 0,
          thickness: 0,
          succeeding: "END",
        };
        if (item.direction) {
          const direction = item.direction?.replace("'", "") as Direction3;
          if (directions3.includes(direction)) {
            newItem = { ...newItem, direction };
          } else {
            showErrorMsg(
              `(id: ${item.id}) - Incorrect direction (${direction})!`
            );
          }
        }
        let model: TOpenFrame | undefined;
        if (item.model) {
          model = getElementByName(
            // @ts-ignore
            changedProject.models as TOpenFrame[],
            item.model
          );
          if (model) {
            index = getIndexName(newData, `${model.name}-PP`);
            newItem = {
              ...newItem,
              model: model.name,
              name: `${model.name}-PP${index}`,
            };
            if (item.beam1) {
              const B1 = getElementByName(model.beams, item.beam1);
              if (B1) {
                newItem = { ...newItem, B1: B1.name };
              } else {
                showErrorMsg(
                  `(id: ${item.id}) - an element "${item.beam1}" not found!`
                );
              }
            }
            if (item.beam2) {
              const B2 = getElementByName(model.beams, item.beam2);
              if (B2) {
                newItem = { ...newItem, B2: B2.name };
              } else {
                showErrorMsg(
                  `(id: ${item.id}) - an element "${item.beam2}" not found!`
                );
              }
            }
          } else {
            showErrorMsg(
              `(id: ${item.id}) - a model "${item.model}" not found!`
            );
          }
        }
        let lib: any;
        const libData = item["C/S Library"];
        if (libData) {
          if (pipeLibs.includes(libData)) {
            lib = libData;
          } else
            showErrorMsg(
              `(id: ${item.id}) - a C/S Library "${libData}" not found!`
            );
        }
        let profile;
        if (lib && item.Profile) {
          const profileData = (item.Profile as string).split(" - ");
          profile = resoures.pipingSS.find(
            (profile) =>
              profile.country_code?.trim() === lib &&
              profile.nominal_pipe_size_inch === profileData[0] &&
              profile.schedule === profileData[1]
          );
          if (!profile)
            showErrorMsg(
              `(id: ${item.id}) - a profile "${item.Profile}" not found!`
            );
        }
        const material = getImportMaterialByMaterialName(
          resoures.materials,
          item.material,
          () =>
            showErrorMsg(
              `(id: ${item.id}) - a material "${item.material}" not found!`
            )
        );
        newItem = {
          ...newItem,
          elevationB1: checkImportedNumber(item.elevation1, false) ?? 0,
          distanceFromB1: checkImportedNumber(item.distanceFromBeam1) ?? 0,
          distanceFromLeftB1:
            checkImportedNumber(item.distanceFromLeftSideOfBeam1) ?? 0,
          elevationB2: checkImportedNumber(item.elevation2, false) ?? 0,
          distanceFromB2: checkImportedNumber(item.distanceFromBeam2) ?? 0,
          distanceFromLeftB2:
            checkImportedNumber(item.distanceFromLeftSideOfBeam2) ?? 0,
          diameter: checkImportedNumber(item.diameter, false) ?? 0,
          thickness: checkImportedNumber(item.thickness, false) ?? 0,
          profile: profile,
          lib: lib,
          material: material,
        };
        newData.push(newItem);
        if (model && newItem.material) {
          // @ts-ignore
          changedProject = {
            ...changedProject,
            models: models.map((mItem) =>
              mItem.name === model!.name
                ? {
                    ...model!,
                    pipes: [
                      ...model!.pipes,
                      {
                        id: newItem.id,
                        name: newItem.name,
                        direction: newItem.direction,
                        B1: newItem.B1,
                        elevationB1: newItem.elevationB1,
                        distanceFromB1: newItem.distanceFromB1,
                        distanceFromLeftB1: newItem.distanceFromLeftB1,
                        B2: newItem.B2,
                        elevationB2: newItem.elevationB2,
                        distanceFromB2: newItem.distanceFromB2,
                        distanceFromLeftB2: newItem.distanceFromLeftB2,
                        startPos: getPipeVector(model!.beams, newItem, true),
                        endPos: getPipeVector(model!.beams, newItem, false),
                        diameter:
                          newItem.profile?.outside_diameter_global ??
                          newItem.diameter,
                        thickness:
                          newItem.profile?.wall_thickness_global ??
                          newItem.thickness,
                        profile: newItem.profile,
                        material: newItem.material,
                        succeeding: newItem.succeeding,
                        supports: [],
                      } as TPipeOF,
                    ],
                  }
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
          <span>Pipe Modeling</span>
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
            text="Add row"
            intent="primary"
            onClick={handleAddRow}
          />
          <Button
            small
            text="Import 3D Piping"
            intent="primary"
            onClick={handleImportPipes}
          />
        </div>
        <div className="hr" />
        <div className="d-flex p-5">
          <div className="d-flex f-grow table-container">
            <table ref={tableRef} className="table bg-gray">
              <thead>
                <tr>
                  <GeneralCheckBoxCell
                    rowSpan={2}
                    data={data}
                    onChange={handleChangeData}
                  />
                  <th rowSpan={2}>OF No.</th>
                  <th rowSpan={2}>Line No.</th>
                  <th rowSpan={2}>Direction</th>
                  <th colSpan={4}>Start Point</th>
                  <th colSpan={4}>End Point</th>
                  <th colSpan={5}>Pipe Data</th>
                  <th rowSpan={2}>Succeeding Pipe</th>
                </tr>
                <tr>
                  <th style={{ top: offsetTop }}>From Beam No.</th>
                  <th style={{ top: offsetTop }}>Elevation (m)</th>
                  <th style={{ top: offsetTop }}>
                    Dist. From Beam along Pipe (m)
                  </th>
                  <th style={{ top: offsetTop }}>
                    Dist. From Beam along Beam (m)
                  </th>

                  <th style={{ top: offsetTop }}>To Beam No.</th>
                  <th style={{ top: offsetTop }}>Elevation (m)</th>
                  <th style={{ top: offsetTop }}>
                    Dist. From Beam along Pipe (m)
                  </th>
                  <th style={{ top: offsetTop }}>
                    Dist. From Beam along Beam (m)
                  </th>

                  <th style={{ top: offsetTop }}>Outer Diameter (mm)</th>
                  <th style={{ top: offsetTop }}>Thickness (mm)</th>
                  <th style={{ top: offsetTop }}>C/S Library</th>
                  <th style={{ top: offsetTop }}>Profile</th>
                  <th style={{ top: offsetTop }}>Material</th>
                </tr>
              </thead>
              <tbody>{data.map((row, index, arr) => getRow(row, arr))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
