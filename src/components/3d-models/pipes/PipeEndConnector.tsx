import { useEffect, useMemo, useState } from "react";
import { TSelectedPipeConnector, FreePipe } from "../../../store/main/types";
import { createEndConnector } from "./pipeCreationUtils";
import { Group, Mesh, Vector3 } from "three";
import { getSimpleAxisHelper } from "../axisHelper";
import { setEndConnectorRotation, getRotationAngle } from "./pipesUtils";
import { useSetRecoilState } from "recoil";
import { lsaAtom } from "../../../recoil/atoms/lsa-atoms";
import { createLSAAnchor } from "../../../services/pipe-services/pipe-service";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import { getCurrentProject } from "../utils";

type Props = {
  pipe: FreePipe;
  pipes: FreePipe[];
  start: Vector3;
  end: Vector3;
  container: Group | undefined;
  selectedPipeConnector: TSelectedPipeConnector | undefined;
  axesHelper: string | undefined;
  length: number;
  opacity: number;
};

export default function PipeEndConnector(props: Props) {
  const [connector, setConnector] = useState<Group | Mesh>();

  const mode = useSelector(
    (state: ApplicationState) => getCurrentProject(state)?.mode
  );

  const setLSAElement = useSetRecoilState(lsaAtom);

  const isAxesHelper = useMemo(() => {
    return props.axesHelper === "ALL";
  }, [props.axesHelper]);

  const isSelected = useMemo(() => {
    return !!(
      props.selectedPipeConnector &&
      props.pipe.params.endConnector &&
      props.selectedPipeConnector.id === props.pipe.params.endConnector.id &&
      props.selectedPipeConnector.prev === props.pipe.pipe
    );
  }, [props.selectedPipeConnector, props.pipe.params.endConnector]);

  const nexts = useMemo(() => {
    return props.pipes.filter((p) => p.preceding === props.pipe.pipe);
  }, [props.pipe, props.pipes]);

  /**
   * Creation of connector
   */
  useEffect(() => {
    if (!props.pipe.params.endConnector) return;
    const filteredNexts = nexts.filter((next) => next.line === props.pipe.line);
    const endConnector = createEndConnector(
      props.pipe,
      nexts,
      /*filteredNexts,*/
      props.length,
      isSelected,
      props.opacity
    );
    if (!endConnector) return;
    endConnector.userData = {
      id: props.pipe.params.endConnector.id,
      isPipeConnector: true,
      lineNo: props.pipe.line,
      prev: props.pipe.pipe,
      nexts: nexts.map((p) => p.pipe),
      /*nexts: filteredNexts.map((p) => p.pipe),*/
      type: props.pipe.params.endConnectorType!,
      connector: props.pipe.params.endConnector!,
    } as TSelectedPipeConnector;
    setConnector(endConnector);
    return () => {
      setConnector(undefined);
    };
  }, [
    props.opacity,
    props.pipe.params.od,
    props.pipe.params.endConnector,
    props.pipe.params.endConnectorType,
    props.pipe.params.endConnectorDetails,
    props.pipe.params.reducerType,
    nexts,
    isSelected,
    props.length,
  ]);

  /**
   * Rotation of connector
   */
  useEffect(() => {
    if (!connector) return;
    const prevRotation = connector.rotation.clone();
    switch (props.pipe.params.endConnectorType) {
      case "Elbow": {
        setEndConnectorRotation(connector, props.pipe, nexts[0]);
        break;
      }
      case "Return": {
        const next = nexts[0];
        setEndConnectorRotation(connector, props.pipe, next);
        next && connector.rotateX(getRotationAngle(next.hDir, -next.vDir));
        break;
      }
      case "Tee": {
        const nextsF = nexts.filter(
          (p) => Math.abs(p.vDir) === 90 || Math.abs(p.hDir) === 90
        );
        if (nextsF.length !== 2) {
          const next = nexts.find(
            (p) => Math.abs(p.vDir) === 90 || Math.abs(p.hDir) === 90
          );
          setEndConnectorRotation(connector, props.pipe, next);
        }
        break;
      }
    }
    return () => {
      connector.setRotationFromEuler(prevRotation);
    };
  }, [
    connector,
    nexts,
    props.pipe.params.endConnectorType,
    props.start,
    props.end,
    props.pipe.hNextDir,
    props.pipe.vNextDir,
  ]);

  /**
   * Axes Helper for connector
   */
  useEffect(() => {
    if (!isAxesHelper || !connector) return;
    const helper = getSimpleAxisHelper();
    connector.add(helper);
    return () => {
      connector.remove(helper);
    };
  }, [isAxesHelper, connector]);

  /**
   * Update line number of pipe
   */
  useEffect(() => {
    if (!connector) return;
    connector.userData.lineNo = props.pipe.line;
  }, [connector, props.pipe.line]);

  /**
   * Add connector to pipe
   */
  useEffect(() => {
    if (!connector || !props.container) return;
    props.container.add(connector);
    return () => {
      props.container?.remove(connector);
    };
  }, [props.container, connector]);

  useEffect(() => {
    if (mode !== "LSA" || !connector || !props.pipe.params.endConnector) return;
    const anchor = createLSAAnchor(props.pipe, "connector", setLSAElement);
    connector.add(anchor);
    return () => {
      connector.remove(anchor);
    };
  }, [mode, props.pipe.params.endConnector, props.pipe, connector]);

  return null;
}
