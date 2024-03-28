import { useEffect, useMemo, useState } from "react";
import { TProjectMode, FreePipe } from "../../../store/main/types";
import { TFlangeCheck, TPipeAnalysis } from "../../../store/main/pipeTypes";
import { AnalysisUI } from "../../../store/ui/types";
import { Group, Mesh } from "three";
import { getStressColor } from "./pipesUtils";
import { getCurrentProject, getRGB, MMtoM } from "../utils";
import { createFlange } from "./pipeCreationUtils";
import { deg180InRad } from "../../../store/main/constants";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import { useSetRecoilState } from "recoil";
import { lsaAtom } from "../../../recoil/atoms/lsa-atoms";
import { createLSAAnchor } from "../../../services/pipe-services/pipe-service";

type Props = {
  pipe: FreePipe;
  length: number;
  mode: TProjectMode | undefined;
  container: Group | undefined;
  analysisUI: AnalysisUI | undefined;
  pipeAnalysis: TPipeAnalysis | undefined;
  isPrevConnector: boolean;
  isNextConnector: boolean;
  opacity: number;
};

export default function PipeFlanges(props: Props) {
  const [startFlange, setStartFlange] = useState<Mesh | Group>();
  const [endFlange, setEndFlange] = useState<Mesh | Group>();

  const mode = useSelector(
    (state: ApplicationState) => getCurrentProject(state)?.mode
  );

  const setLSAElement = useSetRecoilState(lsaAtom);

  const isFlangeCheck = useMemo(() => {
    return props.mode === "flangeCheck";
  }, [props.mode]);

  const flangesColoredParams = useMemo(() => {
    return isFlangeCheck ? props.pipeAnalysis?.flangeCheckParams : undefined;
  }, [isFlangeCheck, props.pipeAnalysis?.flangeCheckParams]);

  const checks: TFlangeCheck[] = useMemo(() => {
    if (!flangesColoredParams?.lines) return [];
    const checks = props.analysisUI
      ? props.analysisUI[`${props.pipe.line}`]?.flangeChecks ?? []
      : [];
    return checks.filter((val) =>
      flangesColoredParams.lines!.some((l) => `${val.line}` === `${l}`)
    );
  }, [isFlangeCheck, props.analysisUI, props.pipe.line, flangesColoredParams]);

  const startFlangeColor = useMemo(() => {
    const check =
      props.pipe.params.startFlange &&
      checks?.find(
        (c) =>
          c.flangeAt === "START" &&
          c.pipe === props.pipe.pipe &&
          props.pipe.params.startFlangeType === c.type &&
          props.pipe.params.startFlange!.nps === c.nps &&
          props.pipe.params.startFlange!.class === c.class &&
          props.pipe.params.startFlange!.material === c.material
      );
    return isFlangeCheck
      ? getRGB(getStressColor(check, flangesColoredParams, "flangeCheck"))
      : undefined;
  }, [
    isFlangeCheck,
    checks,
    flangesColoredParams,
    props.pipe.params.startFlangeType,
    props.pipe.params.startFlange,
  ]);

  const endFlangeColor = useMemo(() => {
    const check =
      props.pipe.params.endFlange &&
      checks?.find(
        (c) =>
          c.flangeAt === "END" &&
          c.pipe === props.pipe.pipe &&
          props.pipe.params.endFlangeType === c.type &&
          props.pipe.params.endFlange!.nps === c.nps &&
          props.pipe.params.endFlange!.class === c.class &&
          props.pipe.params.endFlange!.material === c.material
      );
    return isFlangeCheck
      ? getRGB(getStressColor(check, flangesColoredParams, "flangeCheck"))
      : undefined;
  }, [
    isFlangeCheck,
    checks,
    flangesColoredParams,
    props.pipe.params.endFlangeType,
    props.pipe.params.endFlange,
  ]);

  /**
   * Creating of Start Flange
   */
  useEffect(() => {
    if (!props.pipe.params.startFlangeType || !props.pipe.params.startFlange)
      return;
    const startFlange = createFlange(
      props.pipe.params.startFlangeType,
      props.pipe.params.startFlange,
      props.pipe.params.od,
      props.opacity,
      startFlangeColor
    );
    if (props.pipe.params.startFlangeType !== "Blind") {
      startFlange.rotateY(deg180InRad);
      startFlange.position.setX(MMtoM(props.pipe.params.startFlange.y ?? 0));
    } else {
      startFlange.position.setX(
        -MMtoM(props.pipe.params.startFlange.y ?? 0) / 2
      );
    }
    setStartFlange(startFlange);
    return () => {
      setStartFlange(undefined);
    };
  }, [
    props.opacity,
    props.pipe.params.od,
    props.pipe.params.startFlangeType,
    props.pipe.params.startFlange,
    startFlangeColor,
  ]);

  /**
   * Creating of End Flange
   */
  useEffect(() => {
    if (!props.pipe.params.endFlangeType || !props.pipe.params.endFlange)
      return;
    const endFlange = createFlange(
      props.pipe.params.endFlangeType,
      props.pipe.params.endFlange,
      props.pipe.params.od,
      props.opacity,
      endFlangeColor
    );
    if (props.pipe.params.endFlangeType === "Blind") {
      endFlange.rotateY(deg180InRad);
      endFlange.position.setX(
        props.length + MMtoM(props.pipe.params.endFlange.y ?? 0) / 2
      );
    } else {
      endFlange.position.setX(
        props.length - MMtoM(props.pipe.params.endFlange.y ?? 0)
      );
    }
    setEndFlange(endFlange);
    return () => {
      setEndFlange(undefined);
    };
  }, [
    props.opacity,
    props.pipe.params.od,
    props.pipe.params.endFlangeType,
    props.pipe.params.endFlange,
    endFlangeColor,
  ]);

  /**
   * Add Start Flange to pipe
   */
  useEffect(() => {
    if (!props.container || !startFlange) return;
    props.container.add(startFlange);
    let prevFlange: Mesh | Group | undefined;
    if (props.isPrevConnector) {
      prevFlange = startFlange.clone();
      prevFlange.rotateY(deg180InRad);
      prevFlange.position.setX(-MMtoM(props.pipe.params.startFlange?.y ?? 0));
      props.container.add(prevFlange);
    }
    return () => {
      props.container?.remove(startFlange);
      prevFlange && props.container?.remove(prevFlange);
    };
  }, [props.container, startFlange, props.isPrevConnector]);

  /**
   * Add End Flange to pipe
   */
  useEffect(() => {
    if (!props.container || !endFlange) return;
    props.container.add(endFlange);
    let nextFlange: Mesh | Group | undefined;
    if (props.isNextConnector) {
      nextFlange = endFlange.clone();
      nextFlange.rotateY(deg180InRad);
      nextFlange.position.setX(
        endFlange.position.x + MMtoM(props.pipe.params.endFlange?.y ?? 0) * 2
      );
      props.container.add(nextFlange);
    }
    return () => {
      props.container?.remove(endFlange);
      nextFlange && props.container?.remove(nextFlange);
    };
  }, [props.container, endFlange, props.isNextConnector]);

  useEffect(() => {
    if (mode !== "LSA" || !startFlange || !props.pipe.params.startFlange)
      return;
    const anchor = createLSAAnchor(props.pipe, "start-flange", setLSAElement);
    startFlange.add(anchor);
    return () => {
      startFlange.remove(anchor);
    };
  }, [mode, props.pipe.params.startFlange, props.pipe, startFlange]);

  useEffect(() => {
    if (mode !== "LSA" || !endFlange || !props.pipe.params.endFlange) return;
    const anchor = createLSAAnchor(props.pipe, "end-flange", setLSAElement);
    endFlange.add(anchor);
    return () => {
      endFlange.remove(anchor);
    };
  }, [mode, props.pipe.params.endFlange, props.pipe, endFlange]);

  return null;
}
