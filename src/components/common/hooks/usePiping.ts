import { useEffect, useMemo, useState } from "react";
import { Dispatch } from "redux";
import { MainState } from "../../../store/main/types";
import { UIState } from "../../../store/ui/types";

type TState = {
  project: string;
  pipes: boolean;
  loadings: boolean;
  designCode: boolean;
};

export function usePiping(main: MainState, ui: UIState, dispatch: Dispatch) {
  const [state, setState] = useState<TState>({
    project: main.currentProject,
    pipes: false,
    loadings: false,
    designCode: false,
  });

  const project = useMemo(() => {
    return main.projects.find((p) => p.name === main.currentProject);
  }, [main.projects]);

  const currentUI = useMemo(() => {
    return ui.projectUIs.find((u) => u.project === ui.project);
  }, [ui]);

  const pipes = useMemo(() => {
    return project?.freePipes ?? [];
  }, [project?.freePipes]);

  const loadings = useMemo(() => {
    return project?.pipeLoadings;
  }, [project?.pipeLoadings]);

  const dc = useMemo(() => {
    return project?.pipeDesignCode;
  }, [project?.pipeDesignCode]);

  useEffect(() => {
    setState({ project: main.currentProject, pipes: false, loadings: false, designCode: false });
  }, [main.currentProject]);

  useEffect(() => {
    if (state.pipes && project?.name === state.project) {
      // TODO
    } else {
      setState((prev) => ({ ...prev, models: true }));
    }
  }, [pipes]);

  useEffect(() => {
    if (state.loadings && project?.name === state.project) {
      // TODO
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
