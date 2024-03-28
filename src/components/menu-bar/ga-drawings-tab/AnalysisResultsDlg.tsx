import { Button, FormGroup, ProgressBar } from "@blueprintjs/core";
import Axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import { jsonOptions } from "../../../store/main/actions";
import { changeProjectRequestProgressAction } from "../../../store/ui/actions";
import {
  getCurrentProject,
  getCurrentUI,
  getUnicuesArray,
} from "../../3d-models/utils";
import { CustomDlg } from "../../common/CustomDlg";
import { SimpleSelector } from "../../common/SimpleSelector";
import saveAs from "file-saver";
import { GeneralCheckBoxCell } from "../../common/GeneralCheckBoxCell";
import { CheckBoxCell } from "../../common/CheckBoxCell";
import { MultiSelectorCell } from "../../common/MultiSelectorCell";
import { secondServerAPI } from "../../../pages/utils/agent";
import { Line } from "three";

type Props = {
  onSelect: (key: string, model: string | undefined, LC: string) => any;
  onClose: () => any;
};

export function AnalysisResultsDlg({ onSelect, onClose }: Props) {
  const [items, setItems] = useState<string[]>([]);
  const [params, setParams] = useState<any[]>([]);
  const [model, setModel] = useState<string>();
  const [LC, setLC] = useState<string>();
  const [chLC, setchLC] = useState<string>();

  const dispatch = useDispatch();

  const mode = useSelector((state: ApplicationState) => state.main.workMode);
  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const inProgress = useMemo(() => ui?.requests?.CII, [ui]);

  const lines: string[] = useMemo(() => {
    return getUnicuesArray(project?.freePipes?.map((fp) => `${fp.line}`) ?? []);
  }, [project?.freePipes]);

  /*useEffect(() => {
    setParams(
      lines.map((l, id) => ({ id, selected: false, line: l, LCs: lineLC.get(l)?.[0] ? [`lineLC.get(1)`[0]] : [] }))
    );
  }, [lines]);*/

  useEffect(() => {
    setParams(
      lines.map((l, id) => {
        const loadCombinations = lineLC.get(l) || [];
        const defaultLC = loadCombinations.length > 0 ? [loadCombinations[0]] : [];
  
        return {
          id,
          selected: false,
          line:l,
          LCs: defaultLC
        };
      })
    );
  }, [lines]);

  

  const models: string[] = useMemo(() => {
    return project?.models.map((m) => m.name) ?? [];
  }, [project?.models]);

  const lineLC = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const line of lines) {
      const checks = ui?.analysisUI[line]?.reactionSupports;
      if (!checks) continue;
      map.set(
        line,
        checks.map((c) => c.LCNumber)
      );
    }
    return map;
  }, [lines]);

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

  const availableModels = useMemo(() => {
    return [...modelLC.keys()];
  }, [modelLC]);

  const availableLCs = useMemo(() => {
    return model ? [...new Set(modelLC.get(model) ?? [])] : [];
  }, [model, lineLC, modelLC]);

  useEffect(()=> {
    if(model){
      const lcOptions = modelLC.get(model) ?? [];
      if (lcOptions.length > 0) {
        setLC(lcOptions[0]);
      }else{
        setLC(undefined);
      }
    }
  },[model,modelLC]);

  useEffect(() => {
    const storage = localStorage.getItem("analysis");
    if (!storage) return;
    const map = JSON.parse(storage);
    setItems(Object.keys(map));
  }, []);

  /*function handleGet() {
    console.log("Project Object:", project);
    if (!project || !Object.keys(params).length) return;
    dispatch(changeProjectRequestProgressAction(project.name, "CII"));
    getMechanics()
      .then((mechanics) => {
        return Axios.post(
          `${secondServerAPI}/api/v1/generate/caesarII`,
          JSON.stringify({
            id: `admin${project.name.replace(new RegExp(/\s/gm), "")}`,
            lines: params
              .filter((el) => el.selected)
              .reduce((acc, el) => {
                return { ...acc, [el.line]: el.LCs };
              }, {}),
            mechanics,
          }),
          { ...jsonOptions, responseType: "blob" }
        );
      })
      .then((responce) => saveAs(responce.data, `${project.name}`))
      .catch()
      .finally(() => {
        dispatch(
          changeProjectRequestProgressAction(project.name, "CII", false)
        );
      });
  }*/

  
  async function handleGet() {
    console.log("Project Object:", project);
    if (!project || !Object.keys(params).length) return;
  
    dispatch(changeProjectRequestProgressAction(project.name, "CII"));
  
    try {
      const response = await Axios.post(
        `${secondServerAPI}/api/v1/generate/caesarII`,
        JSON.stringify({
          id: `admin${project.name.replace(new RegExp(/\s/gm), "")}`,
          lines: params.filter((el) => el.selected).reduce((acc, el) => {
            return { ...acc, [el.line]: el.LCs };
          }, {}),
        }),
        { ...jsonOptions, responseType: "blob" }
      );
  
      saveAs(response.data, `${project.name}.cii`);
    } catch (error) {
      console.error(error);
    } finally {
      dispatch(changeProjectRequestProgressAction(project.name, "CII", false));
    }
  }
  

  async function getMechanics() {
    let mechanics: any = {};
    
    if (!project) return mechanics;
    for (const el of params) {
      if (!el.selected) continue;
      for (const LC of el.LCs) {
        try {
          const response = await fetch(
            `/csv_out/admin${project.name.replace(
              new RegExp(/\s/gm),
              ""
            )}/Line${el.line}/${LC}/LinearStaticAnalysis${LC}.Mechanics`
          );
          const json = await response.json();
          const line = mechanics[el.line] ?? {};
          mechanics = {
            ...mechanics,
            [el.line]: { ...line, [`${LC}`]: json },
          };
        } catch (error) {
          console.error(error);
        }
      }
    }
    return mechanics;
  }

  return (
    <CustomDlg
      zIndex={10}
      title={"Analysis Results"}
      position={"center"}
      onClose={onClose}
      body={
        <div className={"d-flex f-column f-grow bg-dark"}>
          <div className="d-flex label-light bg-dark f-ai-center"
          style={{minWidth:"20vw"}}>
            {mode === "PIPING" ? (
              <Button
                small
                text={"Get CII"}
                intent="success"
                disabled={!Object.keys(params).length}
                onClick={handleGet}
              />
            ) : null}

            {mode === "DESIGNER" || mode === "STRUCTURE" ? (
              <>
                <div className="d-flex f-ai-center">
                  <div className="label-light t-end w-90">Model</div>
                  <FormGroup className="no-m w-100">
                    <SimpleSelector<string>
                      items={availableModels}
                      selected={model}
                      onSelect={setModel}
                      itemLabel={(v) => v}
                      className="fill-select"
                    />
                  </FormGroup>
                </div>
                <div className="d-flex f-ai-center">
                  <div className="label-light t-end w-90">LC No.</div>
                  <FormGroup className="no-m w-100">
                    <SimpleSelector<string>
                      items={availableLCs}
                      selected={LC}
                      onSelect={setLC}
                      itemLabel={(v) => v}
                      className="fill-select"
                    />
                  
                  </FormGroup>
                </div>
                
              </>
            ) : null}
            
          </div>
          {mode !== "PIPING" ? (
            <>
              <div className="hr" />
              <div
                className={"p-5"}
                style={{ maxHeight: "50vh", overflowY: "auto" }}
              >
                <div className="d-flex f-grow f-column bg-gray">
                  {items.length
                    ? items.map((item, i) => (
                        <Button
                          fill
                          key={i}
                          text={item}
                          alignText={"left"}
                          disabled={!model || !LC}
                          onDoubleClick={() => onSelect(item, model, LC!)}
                          style={{ marginBottom: 10 }}
                        />
                      ))
                    : "No Data"}
                </div>
              </div>
            </>
          ) : (
            <>
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
                        <GeneralCheckBoxCell
                          data={params}
                          onChange={setParams}
                        />
                        <th>Line No.</th>
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
                            <td>{l.line}</td>
                            {<MultiSelectorCell
                              items={[...new Set(lineLC.get(l.line) ?? [])]}
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
                            />}
                            <td>{chLC}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
