import { Button, FormGroup } from "@blueprintjs/core";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRecoilState } from "recoil";
import { flareGeometryUI } from "../../../../../recoil/atoms/flare-atoms";
import { ApplicationState } from "../../../../../store";
import { Material } from "../../../../../store/data/types";
import { createFlareAction } from "../../../../../store/main/actions";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";
import { SimpleSelector } from "../../../../common/SimpleSelector";

export default function SegmentsGeometry() {
  const [display, setDisplay] = useState<boolean>(true);

  const [data, setData] = useRecoilState(flareGeometryUI);

  const project = useSelector(
    (state: ApplicationState) => state.main.currentProject
  );
  const materials = useSelector(
    (state: ApplicationState) => state.data.materials
  );
  const materialProgress = useSelector(
    (state: ApplicationState) => state.ui.requests?.material
  );

  const dispatch = useDispatch();

  function handleAddGeometry() {
    dispatch(createFlareAction({ ...data, project }));
  }

  return (
    <>
      <div className="hr" />
      <div className="label-light bg-dark">
        <Button
          icon={display ? "caret-down" : "caret-right"}
          onClick={() => setDisplay(!display)}
          minimal
          small
        />
        Geometry
      </div>
      <div className="hr" />
      <div className={"p-5"} style={{ display: display ? "flex" : "none" }}>
        <div className="d-flex f-grow f-column bg-gray">
          <div
            className="d-flex f-grow f-jc-between"
            style={{ paddingRight: 10 }}
          >
            <div className="d-flex f-column">
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-130">No of Segments</div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    min={1}
                    value={data.numberOfSegments}
                    onChange={(numberOfSegments) =>
                      setData((prev) => ({ ...prev, numberOfSegments }))
                    }
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-130">Height, m</div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    isDecimal={true}
                    min={data.numberOfSegments * 0.001}
                    value={data.height_M}
                    onChange={(height_M) =>
                      setData((prev) => ({ ...prev, height_M }))
                    }
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-130">Diameter, m</div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    isDecimal={true}
                    min={0.002}
                    value={data.diameter_M}
                    onChange={(diameter_M) =>
                      setData((prev) => ({ ...prev, diameter_M }))
                    }
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-130">Thickness, mm</div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    min={1}
                    value={data.thickness_MM}
                    onChange={(thickness_MM) =>
                      setData((prev) => ({ ...prev, thickness_MM }))
                    }
                  />
                </FormGroup>
              </div>
            </div>
            <div className="d-flex f-column">
              <div className="d-flex f-ai-center">
                <div className="label-light t-end" style={{ width: 300 }}>
                  Corrosion Allow., mm
                </div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    min={0}
                    value={data.corrosionAllowance_MM}
                    onChange={(corrosionAllowance_MM) =>
                      setData((prev) => ({ ...prev, corrosionAllowance_MM }))
                    }
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end" style={{ width: 300 }}>
                  Minimum Design Temperature, °C
                </div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    max={data.maxDesignTemperature}
                    value={data.minDesignTemperature}
                    onChange={(minDesignTemperature) =>
                      setData((prev) => ({ ...prev, minDesignTemperature }))
                    }
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end" style={{ width: 300 }}>
                  Maximum Design Temperature, °C
                </div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    min={data.minDesignTemperature}
                    value={data.maxDesignTemperature}
                    onChange={(maxDesignTemperature) =>
                      setData((prev) => ({ ...prev, maxDesignTemperature }))
                    }
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end" style={{ width: 300 }}>
                  Material
                </div>
                <FormGroup className="no-m">
                  <SimpleSelector<Material>
                    items={materials}
                    itemLabel={(item) => item.material_name}
                    selected={data.material}
                    onSelect={(material) =>
                      setData((prev) => ({ ...prev, material }))
                    }
                    className="fill-select w-155"
                    loading={materialProgress}
                  />
                </FormGroup>
              </div>
            </div>
            <div className="d-flex f-column">
              <div className="d-flex f-ai-center">
                <div className="label-light t-end" style={{ width: 300 }}>
                  Refractory thickness, mm
                </div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    min={0}
                    value={data.refractoryThickness_MM}
                    onChange={(refractoryThickness_MM) =>
                      setData((prev) => ({ ...prev, refractoryThickness_MM }))
                    }
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end" style={{ width: 300 }}>
                  Refractory density, kg/m3
                </div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    min={0}
                    isDecimal={true}
                    value={data.refractoryDensity}
                    onChange={(refractoryDensity) =>
                      setData((prev) => ({ ...prev, refractoryDensity }))
                    }
                  />
                </FormGroup>
              </div>
            </div>
          </div>
          <div
            className="d-flex f-grow f-ai-center bg-gray"
            style={{ padding: "0 10px" }}
          >
            <Button
              text="Add Geometry"
              intent="danger"
              onClick={handleAddGeometry}
            />
            <div className="d-flex f-ai-center">
              <div className="label-light">Position X(m):</div>
              <FormGroup className="no-m">
                <SimpleNumericInput
                  isDecimal={true}
                  value={data.position.x}
                  onChange={(x) =>
                    setData((prev) => ({
                      ...prev,
                      position: { ...prev.position, x },
                    }))
                  }
                  className={"w-80"}
                />
              </FormGroup>
              <div className="label-light">Y(m):</div>
              <FormGroup className="no-m">
                <SimpleNumericInput
                  isDecimal={true}
                  value={data.position.y}
                  onChange={(y) =>
                    setData((prev) => ({
                      ...prev,
                      position: { ...prev.position, y },
                    }))
                  }
                  className={"w-80"}
                />
              </FormGroup>
              <div className="label-light">Z(m):</div>
              <FormGroup className="no-m">
                <SimpleNumericInput
                  isDecimal={true}
                  value={data.position.z}
                  onChange={(z) =>
                    setData((prev) => ({
                      ...prev,
                      position: { ...prev.position, z },
                    }))
                  }
                  className={"w-80"}
                />
              </FormGroup>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
