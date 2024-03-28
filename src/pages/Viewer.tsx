import { Button, FormGroup } from "@blueprintjs/core";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  AmbientLight,
  BoxBufferGeometry,
  Camera,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  PCFSoftShadowMap,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { getAxisHelper } from "../components/3d-models/axisHelper";
import { getMiddleVector3, localToGlobal } from "../components/3d-models/utils";
import { loadGLTF } from "../components/menu-bar/ga-drawings-tab/exchangeUtils";
import { getCamera } from "../components/work-field/workFieldUtils/cameraUtils";
import {
  updateAxesHelperParams,
  resizeScene,
  getObjectOnScreen,
  changeTargetOfRotation,
} from "../components/work-field/workFieldUtils/sceneUtils";
import { viewerSelectedElement } from "../recoil/atoms/viewer-atom";
import { viewerComments } from "../recoil/atoms/viewer-comments-atom";
import { getFontAction } from "../store/data/actions";
import ViewerComments from "./viewer-comments/ViewerComments";
import ViewerTooltip from "./viewer-tooltip/ViewerTooltip";

let animationFrame: number | undefined = undefined;

export function Viewer() {
  const [scene, setScene] = useState<Scene>(new Scene());
  const [controls, setControls] = useState<OrbitControls>();
  const [renderer, setRenderer] = useState<WebGLRenderer>();
  const [camera, setCamera] = useState<Camera>();
  const [file, setFile] = useState<File | null>();
  const [isComments, setIsComments] = useState(false);

  const viewerRef = useRef<HTMLCanvasElement>(null);

  const [element, setElement] = useRecoilState(viewerSelectedElement);
  const setComments = useSetRecoilState(viewerComments);

  const dispatch = useDispatch();

  useEffect(() => {
    getFontAction(dispatch);
    setComments({ common: "" });
  }, []);

  useEffect(() => {
    file && loadGLTF(file, (data) => scene.add(data));
  }, [file]);

  useEffect(() => {
    if (!file || !viewerRef.current) return;
    setCamera(getCamera());
    setRenderer(
      new WebGLRenderer({
        canvas: viewerRef.current,
        antialias: true,
        preserveDrawingBuffer: true,
      })
    );
  }, [file, viewerRef]);

  useEffect(() => {
    if (!scene) return;

    const light = new DirectionalLight(0xffffff);
    light.position.set(0, 500, 0);
    light.name = "Light";
    light.castShadow = true;
    light.intensity = 0.6;

    const light2 = new AmbientLight(0xffffff);
    light2.name = "Light2";
    light2.intensity = 0.4;

    scene.add(light, light2);

    const size = 0.1;
    const axesBox = new Mesh(
      new BoxBufferGeometry(size, size, size, 1, 1, 1),
      new MeshBasicMaterial({ color: 0x4b4b4b })
    );
    getAxisHelper(0.15, axesBox, size);
    axesBox.name = "AxesBoxHelper";
    const axesBoxArea = new Group();
    axesBoxArea.add(axesBox);

    scene.add(axesBoxArea);
    scene.background = new Color(0xc8c8c8);

    return () => {
      scene.remove(...scene.children);
    };
  }, [scene]);

  useEffect(() => {
    if (!renderer) return;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
  }, [renderer]);

  useEffect(() => {
    if (!camera || !renderer) return;
    const oc = new OrbitControls(camera, renderer.domElement);
    oc.rotateSpeed = 0.3;
    oc.panSpeed = 0.3;
    oc.zoomSpeed = 0.3;
    setControls(oc);
  }, [camera, renderer]);

  useEffect(() => {
    if (!renderer || !controls) return;
    animate(scene, controls);
    return () => {
      animationFrame && cancelAnimationFrame(animationFrame);
    };
  }, [renderer, controls]);

  function animate(scene: Scene, controls: OrbitControls) {
    if (!renderer) return;
    controls.update();

    updateAxesHelperParams(scene, controls);
    resizeScene(renderer, controls);

    renderer.render(scene, controls.object);
    animationFrame = requestAnimationFrame(() => animate(scene, controls));
  }

  function handleOpenFile(event: React.ChangeEvent<HTMLInputElement>) {
    event.currentTarget.files && setFile(event.currentTarget.files[0]);
  }

  function handleDropFile(event: React.DragEvent<HTMLDivElement>) {
    event.stopPropagation();
    event.preventDefault();
    if (event.dataTransfer.items) {
      const item = event.dataTransfer.items[0];
      if (item && item.kind === "file") setFile(item.getAsFile());
    } else {
      const file = event.dataTransfer.files[0];
      if (file) setFile(file);
    }
  }

  function handleDragOverFile(event: React.DragEvent<HTMLDivElement>) {
    event.stopPropagation();
    event.preventDefault();
  }

  useEffect(() => {
    if (!scene || !camera) return;

    const selectElementFn = (event: any) => {
      event.preventDefault();
      selectElement(event, camera, scene, viewerRef.current, controls);
    };
    viewerRef.current?.addEventListener("dblclick", selectElementFn, false);

    return () => {
      viewerRef.current?.removeEventListener(
        "dblclick",
        selectElementFn,
        false
      );
    };
  }, [process, scene, camera, controls]);

  function selectElement(
    event: React.MouseEvent,
    camera: Camera,
    scene: Scene,
    canvas?: HTMLCanvasElement | null,
    controls?: OrbitControls | null
  ) {
    if (!canvas) return;
    const isCtrl = event.ctrlKey;
    const items = getObjectOnScreen(event, camera, scene, canvas);
    const item = items[0];
    if (item?.isAxisCube && controls) {
      const distance = controls.target.distanceTo(camera.position);
      camera.position
        .copy(controls.target)
        .add(item.rotation.clone().multiplyScalar(distance));
      camera.lookAt(controls.target);
    } else if (item?.isPipeConnector) {
      setElement(item);
    } else if (item?.isProcessLine && item.line?.type === "PIPE") {
      setElement({ ...item.line, isProcessLine: true });
    } else if (item?.isProcessItem) {
      const mid = new Vector3(
        item.position.x,
        item.position.y,
        item.position.z
      );
      isCtrl && changeTargetOfRotation(controls, camera, mid);
      setElement(item);
    } else if (item?.isFreePipe) {
      const mid = getMiddleVector3(
        new Vector3(item.start.x, item.start.y, item.start.z),
        new Vector3(item.end.x, item.end.y, item.end.z)
      );
      isCtrl && changeTargetOfRotation(controls, camera, mid);
      setElement(item);
    } else if (item?.isFreePipeSupport) {
      setElement(item);
    } else if (item?.isModelItem) {
      const mid = getMiddleVector3(
        localToGlobal(item.modelStart, item.start, item.modelDir),
        localToGlobal(item.modelStart, item.end, item.modelDir)
      );
      isCtrl && changeTargetOfRotation(controls, camera, mid);
      setElement(item);
    } else if (isCtrl && controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }

  return (
    <>
      <ViewerTooltip />
      {file ? (
        <>
          <Button
            style={{ position: "fixed", top: 25, left: 25, zIndex: 1 }}
            large
            intent={"primary"}
            text={"Comments"}
            onClick={() => setIsComments(true)}
          />
          {isComments ? (
            <ViewerComments
              title={file?.name.replace(".idsv", "")}
              onClose={() => setIsComments(false)}
            />
          ) : null}
          <canvas id={"viewer"} ref={viewerRef} className={"scene"} />
        </>
      ) : (
        <div
          className={"d-flex f-grow f-column f-center"}
          style={{ height: "100vh", backgroundColor: "#dddddd" }}
        >
          <div
            className={"d-flex f-center"}
            onDrop={handleDropFile}
            onDragOver={handleDragOverFile}
            style={{
              padding: "10vh 10vw",
              marginBottom: "5vh",
              backgroundColor: "#c8c8c8",
              borderRadius: 3,
              border: "1px dashed #2d2d2d",
            }}
          >
            <h1>Drag IDSV file here</h1>
          </div>
          <div style={{ marginBottom: "10vh" }}>
            <FormGroup>
              <input type="file" accept={".idsv"} onChange={handleOpenFile} />
            </FormGroup>
          </div>
        </div>
      )}
    </>
  );
}
