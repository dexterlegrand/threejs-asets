import { useEffect, useMemo, useState } from "react";
import { MainState, PipeRack } from "../../../store/main/types";
import { Dispatch } from "redux";
import { addEventAction } from "../../../store/ui/actions";
import { changeIndianDCAction, changeAmericanDCAction } from "../../../store/main/actions";

type TState = {
  project: string;
  models: boolean;
  loadings: boolean;
  designCode: boolean;
};

export function usePipeRack(main: MainState, dispatch: Dispatch) {
  const [state, setState] = useState<TState>({
    project: main.currentProject,
    models: false,
    loadings: false,
    designCode: false,
  });

  const project = useMemo(() => {
    return main.projects.find((p) => p.name === main.currentProject);
  }, [main.projects]);

  const models = useMemo(() => {
    return (project?.models.filter((m) => m.type === "Pipe Rack") ?? []) as PipeRack[];
  }, [project?.models]);

  const loadings = useMemo(() => {
    return project?.loadings;
  }, [project?.loadings]);

  const dc = useMemo(() => {
    if (!project) return undefined;
    return { idc: project.indianDesignCode, udc: project.americanDesignCode };
  }, [project?.indianDesignCode, project?.americanDesignCode]);

  function removeEffectiveLengths(source: "models" | "loadings") {
    if (!dc) return;
    if (dc.idc.effectiveLengths.length) {
      dispatch(
        addEventAction(
          "Pipe Rack (IS Design Code): Effective Lengths were removed after changing " + source,
          "warning"
        )
      );
      dispatch(changeIndianDCAction({ ...dc.idc, effectiveLengths: [], deflectionLengths: [] }));
    }
    if (dc.udc.effectiveLengths.length) {
      dispatch(
        addEventAction(
          "Pipe Rack (US Design Code): Effective Lengths were removed after changing " + source,
          "warning"
        )
      );
      dispatch(changeAmericanDCAction({ ...dc.udc, effectiveLengths: [], deflectionLengths: [] }));
    }
  }

  useEffect(() => {
    setState({ project: main.currentProject, models: false, loadings: false, designCode: false });
  }, [main.currentProject]);

  useEffect(() => {
    if (state.models && project?.name === state.project) {
      removeEffectiveLengths("models");
    } else {
      setState((prev) => ({ ...prev, models: true }));
    }
  }, [models]);

  useEffect(() => {
    if (state.loadings && project?.name === state.project) {
      removeEffectiveLengths("loadings");
    } else {
      setState((prev) => ({ ...prev, loadings: true }));
    }
  }, [loadings]);

  useEffect(() => {
    if (state.designCode && project?.name === state.project) {
      // TODO
    } else {
      setState((prev) => ({ ...prev, designCode: true }));
    }
  }, [dc]);

  return state;
}
