import React, { useState, useMemo, useRef, useEffect } from "react";
import { CustomDlg } from "../../../../common/CustomDlg";
import { Button, FormGroup, InputGroup,Tooltip } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import {
  getCurrentProject,
  getNextId,
  getTopOffset,
  exportToCSV,
  importFromCSV,
  getUnicuesArray,
  getIndexName,
} from "../../../../3d-models/utils";
import { changeProjectAction } from "../../../../../store/main/actions";
import { TCustomGrid } from "../../../../../store/main/types";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";


type Props = {
  onClose: () => any;
};

const initGrid: TCustomGrid = {
  id: 0,
  name: "",
  positionsX: "",
  namesX: "",
  positionsZ: "",
  namesZ: "",
  x: 0,
  y: 0,
  z: 0,
  display: true,
};

export default function CustomGrid(props: Props) {
  const [selected, setSelected] = useState<TCustomGrid>(initGrid);
  const [offsetTop, setOffsetTop] = useState<number>(0);

  const table = useRef<HTMLTableElement>(null);

  const project = useSelector((state: ApplicationState) => getCurrentProject(state));

  const dispatch = useDispatch();

  const customs = useMemo(() => {
    return project?.settings.grid.customs ?? [];
  }, [project]);

  useEffect(() => {
    setOffsetTop(getTopOffset(table.current, 1));
  }, [customs]);

  function handleChangeSettings(customs: TCustomGrid[]) {
    if (!project) return;
    dispatch(
      changeProjectAction({
        ...project,
        settings: {
          ...project.settings,
          grid: { ...project.settings.grid, customs },
        },
      })
    );
  }

  function handleSelect(item: TCustomGrid, value: boolean) {
    setSelected(value ? item : initGrid);
  }

  function handleAdd() {
    const id = getNextId(customs);
    let name = selected.name || `G${id}`;
    if (customs.some((c) => c.name === name)) name += getIndexName(customs, name);
    const changed: TCustomGrid[] = [...customs, { ...selected, id, name }];
    handleChangeSettings(changed);
    setSelected(initGrid);
  }

  function handleDelete() {
    const changed = customs.filter((c) => c.id !== selected?.id);
    handleChangeSettings(changed);
    setSelected(initGrid);
  }

  function handleChange(item: TCustomGrid, field: string, value: any) {
    const changed = customs.map((c) => (c.id === item.id ? { ...c, [field]: value } : c));
    handleChangeSettings(changed);
  }

  function handleChangeSelected(field: string, value: any) {
    if (!selected) return;
    setSelected({ ...selected, [field]: value });
  }

  function handleCancel() {
    setSelected(initGrid);
  }

  function handleSave() {
    let name = selected.name || `G${selected.id}`;
    if (customs.some((c) => c.id !== selected.id && c.name === name))
      name += getIndexName(customs, name);
    const changed = customs.map((c) => (c.id === selected?.id ? { ...selected, name } : c));
    handleChangeSettings(changed);
    setSelected(initGrid);
  }

  function handleExport() {
    exportToCSV(
      customs.map((c) => {
        return {
          id: c.id,
          Name: c.name,
          "Positions X": c.positionsX,
          "Names X": c.namesX,
          "Positions Z": c.positionsZ,
          "Names Z": c.namesZ,
          X: c.x,
          Y: c.y,
          Z: c.z,
          Display: c.display ? "On" : "Off",
        };
      }),
      "User Defined Grids"
    );
  }

  function handleImport() {
    setSelected(initGrid);
    importFromCSV((imported, isCSV) => {
      if (!isCSV || !Array.isArray(imported)) return;
      const grids: TCustomGrid[] = [];
      for (const item of imported) {
        const grid: TCustomGrid = {
          ...initGrid,
          id: grids.length + 1,
          name: item.Name,
          positionsX: fixPositions(`${item["Positions X"]}`),
          namesX: item["Names X"],
          positionsZ: fixPositions(`${item["Positions Z"]}`),
          namesZ: item["Names Z"],
          x: Math.round(Number(item.X) || 0),
          y: Math.round(Number(item.Y) || 0),
          z: Math.round(Number(item.Z) || 0),
          display: item.Display === "On",
        };
        grids.push(grid);
      }
      handleChangeSettings(grids);
    });
  }

  function fixPositions(positions: string) {
    const strPositions = positions.split(" ").filter((val) => val);
    const intPostions = strPositions.map((val) => Math.round(Number(val) || 0));
    return getUnicuesArray(intPostions).join(" ");
  }

  function fixNames(names: string) {
    const strNames = names.split(" ").filter((val) => val);
    return getUnicuesArray(strNames).join(" ");
  }

  function drawRows() {
    return customs.map((item) => (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.id === selected?.id}
          onChange={(value) => handleSelect(item, value)}
        />
        <td>{item.name}</td>
        <td>{item.x}</td>
        <td>{item.y}</td>
        <td>{item.z}</td>
        <SelectorCell<"On" | "Off">
          items={["On", "Off"]}
          itemKey={(val) => val}
          itemLabel={(val) => val}
          selected={item.display ? "On" : "Off"}
          onSelect={(val) => handleChange(item, "display", val === "On")}
        />
      </tr>
    ));
  }

  return (
    <CustomDlg
      zIndex={3}
      isMinimize={true}
      idText="user-defined-grids-setting-dialog"
      onClose={props.onClose}
      title={"User defined Grids"}
      body={
        <div className="d-flex f-column f-grow">
          <div className="bg-dark p-5">
            <div id="grid-input-area" className={"d-flex f-column bg-gray"}>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-130">Grid Set Name</div>
                <FormGroup className="no-m f-grow">
                  <InputGroup
                    value={selected.name}
                    id="input-grid-name"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      handleChangeSelected("name", event.target.value)
                    }
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-130">Grid positions X</div>
                <FormGroup className="no-m f-grow">
                  <InputGroup
                    id="input-grid-positionX"
                    value={selected.positionsX}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      handleChangeSelected("positionsX", event.target.value)
                    }
                    onBlur={(event) => {
                      handleChangeSelected("positionsX", fixPositions(event.target.value));
                    }}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-130">Grid names X</div>
                <FormGroup className="no-m f-grow">
                  <InputGroup
                    id="input-grid-NameX"
                    value={selected.namesX}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      handleChangeSelected("namesX", event.target.value)
                    }
                    onBlur={(event: React.ChangeEvent<HTMLInputElement>) => {
                      handleChangeSelected("namesX", fixNames(event.target.value));
                    }}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-130">Grid positions Z</div>
                <FormGroup className="no-m f-grow">
                  <InputGroup
                    id="input-grid-positionZ"
                    value={selected.positionsZ}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      handleChangeSelected("positionsZ", event.target.value)
                    }
                    onBlur={(event) => {
                      handleChangeSelected("positionsZ", fixPositions(event.target.value));
                    }}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-130">Grid names Z</div>
                <FormGroup className="no-m f-grow">
                  <InputGroup
                   id="input-grid-NameZ"
                    value={selected.namesZ}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      handleChangeSelected("namesZ", event.target.value)
                    }
                    onBlur={(event: React.ChangeEvent<HTMLInputElement>) => {
                      handleChangeSelected("namesZ", fixNames(event.target.value));
                    }}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-130">Grid position in mm</div>
                <div className="d-flex f-ai-center">
                  <div className="label-light t-end w-50">X:</div>
                  <FormGroup className="no-m">
                    <SimpleNumericInput
                      value={selected?.x}
                      disabled={!selected}
                      onChange={(value) => handleChangeSelected("x", value)}
                    />
                  </FormGroup>
                </div>
                <div className="d-flex f-ai-center">
                  <div className="label-light t-end w-50">Y:</div>
                  <Tooltip
                  content = "Enter Grade Level of Plotplan">
                  <FormGroup className="no-m">
                    
                    <SimpleNumericInput
                      value={selected?.y}
                      disabled={!selected}
                      onChange={(value) => handleChangeSelected("y", value)}
                    />
                    
                  </FormGroup>
                  </Tooltip>
                </div>
                <div className="d-flex f-ai-center">
                  <div className="label-light t-end w-50">Z:</div>
                  <FormGroup className="no-m">
                    <SimpleNumericInput
                      value={selected?.z}
                      disabled={!selected}
                      onChange={(value) => handleChangeSelected("z", value)}
                    />
                  </FormGroup>
                </div>
              </div>
            </div>
          </div>
          <div className="hr" />
          <div className="label-light d-flex bg-dark">
            <Button
              small
              icon="trash"
              text="Delete"
              intent="warning"
              disabled={!selected.id}
              onClick={handleDelete}
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
            {selected.id ? (
              <>
                <Button small text="Cancel" onClick={handleCancel} />
                <Button small text="Save" intent="primary" onClick={handleSave} />
              </>
            ) : (
              <Button id="generate-grid" small icon="plus" text="Generate" intent="danger" onClick={handleAdd} />
            )}
          </div>
          <div className="hr" />
          <div className={"bg-dark p-5"}>
            <div className={"small-table-container"}>
              <table ref={table} className="table bg-gray">
                <thead>
                  <tr>
                    <th rowSpan={2}/>
                    <th rowSpan={2}>Name</th>
                    <th colSpan={3}>Position</th>
                    <th rowSpan={2}>Display</th>
                  </tr>
                  <tr>
                    <th style={{ top: offsetTop }}>X</th>
                    <th style={{ top: offsetTop }}>Y</th>
                    <th style={{ top: offsetTop }}>Z</th>
                  </tr>
                </thead>
                <tbody>{drawRows()}</tbody>
              </table>
            </div>
          </div>
        </div>
      }
    />
  );
}
