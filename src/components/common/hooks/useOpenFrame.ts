import { useEffect, useMemo, useState } from "react";
import { Dispatch } from "redux";
import { MainState } from "../../../store/main/types";
import { UIState } from "../../../store/ui/types";
import { addEventAction, changeUIAction } from "../../../store/ui/actions";
import { TOpenFrame } from "../../../store/main/openFrameTypes";

type TState = {
  project: string;
  models: boolean;
  loadings: boolean;
  designCode: boolean;
};

export function useOpenFrame(main: MainState, ui: UIState, dispatch: Dispatch) {
  const [state, setState] = useState<TState>({
    project: main.currentProject,
    models: false,
    loadings: false,
    designCode: false,
  });

  const project = useMemo(() => {
    return main.projects.find((p) => p.name === main.currentProject);
  }, [main.projects]);

  const currentUI = useMemo(() => {
    return ui.projectUIs.find((u) => u.project === ui.project);
  }, [ui]);

  const models = useMemo(() => {
    return (project?.models.filter((m) => m.type === "Open Frame") ?? []) as TOpenFrame[];
  }, [project?.models]);

  const loadings = useMemo(() => {
    return currentUI?.openFrameUI.loadingsUI;
  }, [currentUI?.openFrameUI.loadingsUI]);

  const dc = useMemo(() => {
    return currentUI?.designCodeAndParametersUI;
  }, [currentUI?.designCodeAndParametersUI]);

  function removeEffectiveLengths(source: "models" | "loadings") {
    if (!dc || !currentUI) return;
    if (dc.indianDesignCode.effectiveLengths.length) {
      dispatch(
        changeUIAction({
          ...currentUI,
          designCodeAndParametersUI: {
            ...currentUI.designCodeAndParametersUI,
            indianDesignCode: {
              ...currentUI.designCodeAndParametersUI.indianDesignCode,
              effectiveLengths: [],
              deflectionLengths: [],
            },
          },
        })
      );
      dispatch(
        addEventAction(
          "Open Frame (IS Design Code): Effective Lengths were removed after changing " + source,
          "warning"
        )
      );
    }
    if (dc.americanDesignCode.effectiveLengths.length) {
      dispatch(
        changeUIAction({
          ...currentUI,
          designCodeAndParametersUI: {
            ...currentUI.designCodeAndParametersUI,
            americanDesignCode: {
              ...currentUI.designCodeAndParametersUI.americanDesignCode,
              effectiveLengths: [],
              deflectionLengths: [],
            },
          },
        })
      );
      dispatch(
        addEventAction(
          "Open Frame (US Design Code): Effective Lengths were removed after changing " + source,
          "warning"
        )
      );
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
