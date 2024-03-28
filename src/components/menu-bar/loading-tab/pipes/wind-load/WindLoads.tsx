import React, { useMemo, useEffect } from "react";
import { FormGroup, ProgressBar, Popover, Menu, MenuItem, Button } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { LoadingAsPerCode } from "../../../../../store/main/types";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { loadingAsPerCodes } from "../../../../../store/main/constants";
import { changeProjectAction, getAndMapPipeNF } from "../../../../../store/main/actions";
import { CustomDlg } from "../../../../common/CustomDlg";
import { getCurrentProject, getCurrentUI, getUnicuesArray } from "../../../../3d-models/utils";
import { ISParamsPP } from "./ISParams";
import { USParamsPP } from "./USParams";
import { ManualParamsPP } from "./ManualParams";
import { AdditionalLoadsPP } from "../AdditionalLoads";
import { isArray } from "util";

type Props = {
  onClose: () => any;
};

export function WindLoadPP({ onClose }: Props) {
  const project = useSelector((state: ApplicationState) => getCurrentProject(state));
  const scene = useSelector((state: ApplicationState) => state.main.scene);
  const natFreqProgress = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.requests?.natfreq
  );

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return project?.pipeLoadings?.windLoad;
  }, [project]);

  const pipes = useMemo(() => {
    return project?.freePipes ?? [];
  }, [project]);

  const lines = useMemo(() => {
    return getUnicuesArray(pipes.map((p) => p.line))
      .sort((a, b) => a - b)
      .map((l) => `${l}`);
  }, [pipes]);

  const NFs = useMemo(() => {
    if (!project?.pipeLoadings?.NFs) return [];
    return isArray(project.pipeLoadings.NFs)
      ? project.pipeLoadings.NFs
      : Object.entries(project.pipeLoadings.NFs).map(([line, value]) => ({ line, value }));
  }, [project]);

  useEffect(() => {
    if (!project) return;
    getAndMapPipeNF(dispatch, project, scene);
  }, []);

  function handleChangeData(field: string, value: any) {
    if (!project || !data) return;
    dispatch(
      changeProjectAction({
        ...project,
        pipeLoadings: {
          ...project.pipeLoadings!,
          windLoad: { ...data, [field]: value },
        },
      })
    );
  }

  return (
    <CustomDlg
      title={"Wind Load"}
      isMinimize={true}
      body={
        <div className="d-flex f-grow f-column">
          <div className="d-flex f-ai-center bg-dark always">
            <div className="label-light t-end w-160">Wind Loading as per</div>
            <FormGroup className="no-m w-160">
              <SimpleSelector<LoadingAsPerCode | "Manual">
                items={[...loadingAsPerCodes, "Manual"]}
                selected={data?.windLoadingAsPerCode}
                onSelect={(value) => handleChangeData("windLoadingAsPerCode", value)}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>
            <FormGroup className="no-m w-150" style={{ padding: "0 20px" }}>
              <Popover
                content={
                  <Menu style={{ maxHeight: "60vh", overflowY: "auto" }}>
                    <MenuItem
                      key={"NF-ALL"}
                      text={`Get for All`}
                      onClick={() => {
                        if (!project) return;
                        getAndMapPipeNF(dispatch, project, scene);
                      }}
                    />
                    {lines.map((l) => (
                      <MenuItem
                        key={`NF-JSON-${l}`}
                        text={`Get for ${l}`}
                        onClick={() => {
                          if (!project) return;
                          getAndMapPipeNF(dispatch, project, scene, +l);
                        }}
                      />
                    ))}
                  </Menu>
                }
                target={<Button small text={"Natural Freq"} intent={"danger"} />}
              />
            </FormGroup>
          </div>
          <div className={"hr"} />
          {data?.windLoadingAsPerCode === "IS Code" && (
            <ISParamsPP data={data} onChange={handleChangeData} />
          )}
          {data?.windLoadingAsPerCode === "US Code" && (
            <USParamsPP data={data} onChange={handleChangeData} />
          )}
          {data?.windLoadingAsPerCode === "EU Code" && <></>}
          {data?.windLoadingAsPerCode === "Manual" && (
            <ManualParamsPP data={data} onChange={handleChangeData} />
          )}
          <div className={"hr"} />
          {natFreqProgress ? (
            <>
              <ProgressBar />
              <div className={"hr"} />
            </>
          ) : null}
          <AdditionalLoadsPP
            type={"WL"}
            NFs={NFs}
            pipes={pipes}
            loads={data?.loads ?? []}
            onChange={(loads) => handleChangeData("loads", loads)}
          />
        </div>
      }
      onClose={onClose}
    />
  );
}
