import React, { useMemo, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { NumericCell } from "../../../../common/NumericCell";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { Button, FormGroup } from "@blueprintjs/core";
import { TOpenFrame, TBeamElement } from "../../../../../store/main/openFrameTypes";
import { MultiSelector } from "../../../../common/MultiSelector";
import { ElementsDlg } from "./ElementsDlg";
import {
  getElementByName,
  exportToCSV,
  arrayToString,
  checkRange,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { changeModel } from "../../../../../store/main/actions";
import {
  getMapOfBeamElements,
  getSeparetedElementsOfModel,
  mapToArray,
  removeConnectionsFromMap,
  updateConnectionsFromMap,
  getAdditionalElements,
} from "../../../../3d-models/openFrame";

type Props = {
  models: TOpenFrame[];
};

type Element = {
  selected: boolean;
  name: string;
};

type ElementsElevation = {
  id: number;
  model: string;
  elements: Element[];
  elevation: number;
};

export function ElementsElevations(props: Props) {
  const { models } = props;

  const [dialog, setDialog] = useState<JSX.Element>();
  const [elevations, setElevations] = useState<ElementsElevation[]>([]);

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const dispatch = useDispatch();

  const elements = useMemo(() => openFrameUI?.elementsElevations.elements ?? [], [openFrameUI]);

  useEffect(() => {
    let items: ElementsElevation[] = [];
    models.forEach((model) => {
      const map = new Map<number, string[]>();
      if (elements.includes("Beam")) {
        model.beams.forEach((item) => {
          const elevation = map.get(item.startPos.y);
          if (elevation) {
            map.set(item.startPos.y, [...elevation, item.name]);
          } else {
            map.set(item.startPos.y, [item.name]);
          }
        });
      }
      if (elements.includes("Cantilever")) {
        model.cantilevers.forEach((item) => {
          const elevation = map.get(item.startPos.y);
          if (elevation) {
            map.set(item.startPos.y, [...elevation, item.name]);
          } else {
            map.set(item.startPos.y, [item.name]);
          }
        });
      }
      map.forEach((names, elevation) => {
        items = [
          ...items,
          {
            id: items.length,
            model: model.name,
            elements: names.map((name) => ({ selected: true, name })),
            elevation,
          },
        ];
      });
    });
    setElevations(
      items.sort((a, b) => {
        const res = a.model.localeCompare(b.model);
        return !res ? a.elevation - b.elevation : res;
      })
    );
  }, [models, elements]);

  function handleChangeElementsList(row: ElementsElevation, news: Element[]) {
    setElevations(
      elevations.map((elevation) => {
        if (elevation.id === row.id) {
          return { ...elevation, elements: news };
        }
        return elevation;
      })
    );
  }

  function showWarning(msg: string) {
    dispatch(addEventAction(`Elements Elevation: ${msg}`, "warning"));
  }

  function relocateBeamElement(
    map: Map<string, TBeamElement>,
    elements: Element[],
    elevation: number
  ) {
    if (!openFrameUI) return;
    for (const element of elements) {
      const beam = map.get(element.name);
      if (!beam) continue;

      let startMax = beam.startPos.y;
      let startMin = beam.startPos.y;
      let endMax = beam.startPos.y;
      let endMin = beam.startPos.y;

      for (const connected of beam.startConnected) {
        if (!new RegExp(/^C\d+$/).test(connected)) continue;
        const column = map.get(connected);
        if (column) {
          startMax = Math.max(startMax, column.endPos.y);
          startMin = Math.min(startMin, column.startPos.y);
        }
      }

      for (const connected of beam.endConnected) {
        if (!new RegExp(/^C\d+$/).test(connected)) continue;
        const column = map.get(connected);
        if (column) {
          endMax = Math.max(endMax, column.endPos.y);
          endMin = Math.min(endMin, column.startPos.y);
        }
      }

      const max = Math.min(startMax, endMax);
      const min = Math.max(startMin, endMin);

      if (checkRange(elevation, min, max, true, true)) {
        const additionalElements = getAdditionalElements(map, beam, openFrameUI);
        if (additionalElements.length) {
          showWarning(
            `Element "${beam.name}" has additional elements like ${additionalElements.join(", ")}!`
          );
          continue;
        }
        const changed = {
          ...beam,
          startPos: beam.startPos.setY(elevation),
          endPos: beam.endPos.setY(elevation),
        };
        removeConnectionsFromMap(map, beam, false);
        updateConnectionsFromMap(map, changed, (a, b) =>
          showWarning(`Elements "${a}" and "${b}" are crossing`)
        );
      } else {
        if (elevation < min) showWarning(`Minimal elevation of "${beam.name}" is ${min}m!`);
        if (elevation > max) showWarning(`Maximal elevation of "${beam.name}" is ${max}m!`);
      }
    }
  }

  function handleChangeElevation(row: ElementsElevation, elevation: number) {
    const selected = row.elements.filter((el) => el.selected);
    if (!selected.length) return;
    const model = getElementByName(models, row.model);
    if (!model) return;
    const map = getMapOfBeamElements(model);
    relocateBeamElement(map, selected, elevation);
    const changedModel = {
      ...model,
      ...getSeparetedElementsOfModel(mapToArray(map)),
    };
    dispatch(changeModel(changedModel));
  }

  function getRow(row: ElementsElevation) {
    return (
      <tr key={`${row.id}`}>
        <td>{row.model}</td>
        <td>
          <Button
            small
            minimal
            icon={"menu"}
            intent={"primary"}
            className={"c-light"}
            onClick={() => {
              setDialog(
                <ElementsDlg
                  elements={row.elements}
                  onClose={() => setDialog(undefined)}
                  onSave={(news) => {
                    handleChangeElementsList(row, news);
                    setDialog(undefined);
                  }}
                />
              );
            }}
          />
        </td>
        <NumericCell
          isDecimal={true}
          value={row.elevation}
          onChange={(value) => handleChangeElevation(row, value)}
          style={{ width: "33%" }}
          disabled={!!dialog}
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      elevations.map((elev) => {
        return {
          id: elev.id,
          "FS No.": elev.model,
          "Elements No.": arrayToString(
            elev.elements.map((el) => {
              return el.name;
            })
          ),
          "Elevation (m)": elev.elevation,
        };
      }),
      "Elements Elevations"
    );
  }

  return (
    <>
      {dialog}
      <div className="d-flex f-column">
        <div className="hr" />
        <div className="d-flex f-ai-center label-light bg-dark">
          <span>Elements Elevations</span>
          <Button
            small
            icon="export"
            text="Export to CSV"
            intent="success"
            onClick={handleExport}
          />
          <FormGroup className="no-m" label="Elements Types" inline>
            <MultiSelector<"Beam" | "Cantilever">
              items={["Beam", "Cantilever"]}
              selected={elements}
              onSelect={(value) =>
                openFrameUI &&
                dispatch(
                  changeOFUIAction({
                    ...openFrameUI,
                    elementsElevations: {
                      elements: value,
                    },
                  })
                )
              }
              itemLabel={(item) => item}
              className="fill-select w-150"
            />
          </FormGroup>
        </div>
        <div className="hr" />
        <div className={"p-5"}>
          <div className={"table-container"}>
            <table className="table bg-gray">
              <thead>
                <tr>
                  <th>FS No.</th>
                  <th>Elements No.</th>
                  <th>Elevation (m)</th>
                </tr>
              </thead>
              <tbody>{elevations.map(getRow)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
