import { Button, FormGroup, ProgressBar } from "@blueprintjs/core";
import Axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import { jsonOptions } from "../../../store/main/actions";
import { changeProjectRequestProgressAction } from "../../../store/ui/actions";
import { getCurrentProject, getCurrentUI } from "../../3d-models/utils";
import { CustomDlg } from "../../common/CustomDlg";
import saveAs from "file-saver";
import { GeneralCheckBoxCell } from "../../common/GeneralCheckBoxCell";
import { CheckBoxCell } from "../../common/CheckBoxCell";
import { MultiSelectorCell } from "../../common/MultiSelectorCell";
import { secondServerAPI } from "../../../pages/utils/agent";
import { SimpleSelector } from "../../common/SimpleSelector";

type Props = {
  onClose: () => any;
};

const STAAD_Lengths = {
  METER: "METER",
  MilliMETER: "MMS",
  CentiMETER: "CM",
  DecaMETER: "DME",
  KiloMETER: "KM",
  INCHES: "INCHES",
  FEET: "FEET",
};

const STAAD_Force = {
  NEWTON: "NEWTON",
  KiloNEWTON: "KNS",
  MegaNEWTON: "MNS",
  DecaNEWTON: "DNS",
  "Metric Ton Force": "MTON",
  "Kilogram Force": "KG",
  POUND: "POUND",
  KiloPOUND: "KIP",
};

export function StaadDlg({ onClose }: Props) {
  const [params, setParams] = useState<any[]>([]);
  const [items, setItems] = useState<string[]>([]);
  const [length, setLength] = useState(STAAD_Lengths.METER);
  const [force, setForce] = useState(STAAD_Force.NEWTON);

  const dispatch = useDispatch();

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const inProgress = useMemo(() => ui?.requests?.Staad, [ui]);

  const models: string[] = useMemo(() => {
    return project?.models.map((m) => m.name) ?? [];
  }, [project?.models]);

  useEffect(() => {
    setParams(
      models.map((m, id) => ({ id, selected: false, model: m, LCs: [] }))
    );
  }, [models]);

  const modelLC = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const model of models) {
      const checks = ui?.analysisUI[model]?.reactionSupports;
      if (!checks) continue;
      map.set(
        model,
        checks.map((c) => c.LCNumber)
      );
    }
    return map;
  }, [models]);

  useEffect(() => {
    const storage = localStorage.getItem("analysis");
    if (!storage) return;
    const map = JSON.parse(storage);
    setItems(Object.keys(map));
  }, []);

  /*function handleGet() {
    if (!project || !Object.keys(params).length) return;
    dispatch(changeProjectRequestProgressAction(project.name, "Staad"));
    getMechanics()
      .then((mechanics) => {
        return Axios.post(
          `${secondServerAPI}/api/v1/generate/staadfile`,
          JSON.stringify({
            id: `admin${project.name.replace(new RegExp(/\s/gm), "")}`,
            units: {
              // @ts-ignore
              length: STAAD_Lengths[length],
              // @ts-ignore
              force: STAAD_Force[force],
            },
            models: params
              .filter((el) => el.selected)
              .reduce((acc, el) => {
                return {
                  ...acc,
                  [el.model]: el.LCs.includes("All")
                    ? [...new Set(modelLC.get(el.model) ?? [])]
                    : el.LCs,
                };
              }, {}),
            mechanics,
          }),
          { ...jsonOptions, responseType: "blob" }
        );
      })
      .then((responce) => saveAs(responce.data, `${project.name}.std`))
      .catch()
      .finally(() => {
        dispatch(
          changeProjectRequestProgressAction(project.name, "Staad", false)
        );
      });
  }*/

  function handleGet(){
    if(!project || !Object.keys(params).length) return;
    dispatch(changeProjectRequestProgressAction(project.name, "Staad"));
    const postData = JSON.stringify({
      id: `admin${project.name.replace(new RegExp(/\s/gm), "")}`,
      units: {
        // @ts-ignore
        length: STAAD_Lengths[length],
        // @ts-ignore
        force: STAAD_Force[force],
      },
      models: params
        .filter((el) => el.selected)
        .reduce((acc, el) => {
          return {
            ...acc,
            [el.model]: el.LCs.includes("All")
              ? [...new Set(modelLC.get(el.model) ?? [])]
              : el.LCs,
          };
        }, {})
    });
    Axios.post(`${secondServerAPI}/api/v1/generate/staadfile`, postData, { ...jsonOptions, responseType: "blob" })
      .then((response) => saveAs(response.data, `${project.name}.std`))
      .catch((error) => console.error(error))
      .finally(() => {
        dispatch(changeProjectRequestProgressAction(project.name, "Staad", false));
      });
  }
  

  async function getMechanics() {
    let mechanics: any = {};
    if (!project) return mechanics;
    for (const el of params) {
      if (!el.selected) continue;
      const LCs = el.LCs.includes("All")
        ? [...new Set(modelLC.get(el.model) ?? [])]
        : el.LCs;
      for (const LC of LCs) {
        try {
          const response = await fetch(
            `/csv_out/admin${project.name.replace(new RegExp(/\s/gm), "")}/${
              el.model
            }/${LC}/LinearStaticAnalysis${LC}.Mechanics`
          );
          const json = await response.json();
          const model = mechanics[el.model] ?? {};
          mechanics = {
            ...mechanics,
            [el.model]: { ...model, [`${LC}`]: json },
          };
        } catch (error) {
          console.error(error);
        }
      }
    }
    return mechanics;
  }

  function handleSelectAllLCs() {
    setParams((prev) => {
      return prev.map((el) => ({ ...el, LCs: ["All"] }));
    });
  }

  return (
    <CustomDlg
      zIndex={10}
      title={"Staad"}
      position={"center"}
      onClose={onClose}
      body={
        <div className={"d-flex f-column f-grow bg-dark"}>
          <div className="d-flex label-light bg-dark f-ai-center">
            <Button
              small
              text={"export/std"}
              intent="success"
              disabled={!Object.keys(params).length}
              onClick={handleGet}
            />
            <Button
              small
              text={"Select All LCs"}
              intent="primary"
              onClick={handleSelectAllLCs}
            />
            <div className="d-flex f-ai-center">
              <div className="label-light t-end w-120">STAAD length</div>
              <FormGroup className="no-m w-100">
                <SimpleSelector<string>
                  items={Object.keys(STAAD_Lengths)}
                  selected={length}
                  onSelect={(val) => val && setLength(val)}
                  itemLabel={(v) => v}
                  className="fill-select"
                />
              </FormGroup>
            </div>
            <div className="d-flex f-ai-center">
              <div className="label-light t-end w-120">STAAD Force</div>
              <FormGroup className="no-m w-100">
                <SimpleSelector<string>
                  items={Object.keys(STAAD_Force)}
                  selected={force}
                  onSelect={(val) => val && setForce(val)}
                  itemLabel={(v) => v}
                  className="fill-select"
                />
              </FormGroup>
            </div>
          </div>
          <div className="hr" />
          {inProgress ? (
            <>
              <ProgressBar />
              <div className={"hr"} />
            </>
          ) : null}
          <div className={"p-5 bg-dark"}>
            <div className={"small-table-container"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <GeneralCheckBoxCell data={params} onChange={setParams} />
                    <th>Model</th>
                    <th>L/C</th>
                  </tr>
                </thead>
                <tbody>
                  {params.map((l) => {
                    return (
                      <tr key={l.id}>
                        <CheckBoxCell
                          value={l.selected}
                          onChange={(selected) =>
                            setParams((prev) =>
                              prev.map((el) =>
                                el.id === l.id ? { ...el, selected } : el
                              )
                            )
                          }
                        />
                        <td>{l.model}</td>
                        <MultiSelectorCell
                          items={[
                            "All",
                            ...new Set(modelLC.get(l.model) ?? []),
                          ]}
                          itemKey={(item) => item}
                          itemLabel={(item) => item}
                          selected={l.LCs}
                          onSelect={(LCs) =>
                            setParams((prev) =>
                              prev.map((el) =>
                                el.id === l.id ? { ...el, LCs } : el
                              )
                            )
                          }
                        />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    />
  );
}
