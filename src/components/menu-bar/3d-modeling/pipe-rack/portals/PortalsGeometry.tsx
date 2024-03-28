import React, { FunctionComponent, useState, useMemo, useEffect } from "react";
import { FormGroup, Button } from "@blueprintjs/core";
import { Direction2, SupportType } from "../../../../../store/main/types";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { directions2, supportTypes } from "../../../../../store/main/constants";
import { SimpleNumericInput } from "../../../../common/SimpleNumericInput";
import { useSelector, useDispatch } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { changePRUIAction } from "../../../../../store/ui/actions";
import { Section, Material } from "../../../../../store/data/types";
import { getCurrentUI } from "../../../../3d-models/utils";

type Props = {
  libs: string[];
  profiles: Section[];
  material: Material | undefined;
  materials: Material[];
  addGeometry: () => any;
};

const PortalsGeometry: FunctionComponent<Props> = (props) => {
  const { profiles, materials, libs, addGeometry } = props;

  const [display, setDisplay] = useState<boolean>(true);

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const materialProgress = useSelector((state: ApplicationState) => state.ui.requests?.material);

  const profilesProgress = useSelector((state: ApplicationState) => state.ui.requests?.profiles);

  const dispatch = useDispatch();

  const data = useMemo(() => ui?.pipeRackUI, [ui]);

  const geometry = useMemo(() => data?.portals.geometry, [data]);

  const filteredProfileSectionData = useMemo(
    () => profiles.filter((section) => section.country_code === geometry?.library),
    [profiles, geometry]
  );

  useEffect(() => {
    if (geometry && props.material && geometry.material !== props.material) {
      handleChangeGeometry("material", props.material);
    }
  }, [props.material]);

  function handleChangeGeometry(field: string, value: any) {
    if (!data || !geometry) return;
    dispatch(
      changePRUIAction({
        ...data,
        portals: {
          ...data.portals,
          geometry: {
            ...geometry,
            [field]: value,
          },
        },
      })
    );
  }

  function handleAddGeometry() {
    if (!geometry) return;
    geometry.noOfBays && geometry.noOfTiers && addGeometry();
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
          <div className="d-flex f-grow f-jc-between">
            <div className="d-flex f-column">
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-120">No of Tiers</div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    min={1}
                    value={geometry?.noOfTiers}
                    onChange={(value) => handleChangeGeometry("noOfTiers", value)}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-120">No of Bays</div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    min={1}
                    value={geometry?.noOfBays}
                    onChange={(value) => handleChangeGeometry("noOfBays", value)}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-120">Base Elevation</div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    value={geometry?.baseElevation}
                    onChange={(value) => handleChangeGeometry("baseElevation", value)}
                    isDecimal={true}
                  />
                </FormGroup>
                <div className="label-light">m</div>
              </div>
            </div>
            <div className="d-flex f-column">
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-150">Pipe Rack Length</div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    min={0}
                    value={geometry?.length}
                    onChange={(value) => handleChangeGeometry("length", value)}
                    isDecimal={true}
                  />
                </FormGroup>
                <div className="label-light">m</div>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-150">Top Tier Elevation</div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    min={0}
                    value={geometry?.topTierElevation}
                    onChange={(value) => handleChangeGeometry("topTierElevation", value)}
                    isDecimal={true}
                  />
                </FormGroup>
                <div className="label-light">m</div>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-150">Portal Width</div>
                <FormGroup className="no-m">
                  <SimpleNumericInput
                    min={0}
                    value={geometry?.width}
                    onChange={(value) => handleChangeGeometry("width", value)}
                    isDecimal={true}
                  />
                </FormGroup>
                <div className="label-light">m</div>
              </div>
            </div>
            <div className="d-flex f-column">
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-150">Pipe Rack Direction</div>
                <FormGroup className="no-m w-170">
                  <SimpleSelector<Direction2>
                    items={directions2}
                    selected={geometry?.direction}
                    onSelect={(value) => handleChangeGeometry("direction", value)}
                    itemLabel={(item) => item}
                    className="fill-select"
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-150">Material</div>
                <FormGroup className="no-m w-170">
                  <SimpleSelector<Material>
                    disabled={props.material !== undefined}
                    items={materials}
                    selected={geometry?.material}
                    onSelect={(value) => handleChangeGeometry("material", value)}
                    itemLabel={(item) => item.material_name}
                    className="fill-select"
                    loading={materialProgress}
                  />
                </FormGroup>
              </div>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-150">Support Type</div>
                <FormGroup className="no-m w-170">
                  <SimpleSelector<SupportType>
                    items={supportTypes}
                    selected={geometry?.supportType}
                    onSelect={(value) => handleChangeGeometry("supportType", value)}
                    itemLabel={(item) => item}
                    className="fill-select"
                  />
                </FormGroup>
              </div>
            </div>
          </div>
          <div className="d-flex f-grow f-ai-center bg-gray" style={{ paddingLeft: 5 }}>
            <Button text="Add Geometry" intent="danger" onClick={handleAddGeometry} />
            <div className="d-flex f-ai-center">
              <div className="label-light">1st Portal Position X(m):</div>
              <FormGroup className="no-m w-80">
                <SimpleNumericInput
                  isDecimal={true}
                  value={geometry?.x}
                  onChange={(value) => handleChangeGeometry("x", value)}
                  className="w-80"
                />
              </FormGroup>
              <div className="label-light">Y(m):</div>
              <FormGroup className="no-m w-80">
                <SimpleNumericInput
                  isDecimal={true}
                  value={geometry?.y}
                  onChange={(value) => handleChangeGeometry("y", value)}
                  className="w-80"
                />
              </FormGroup>
              <div className="label-light">Z(m):</div>
              <FormGroup className="no-m w-80">
                <SimpleNumericInput
                  isDecimal={true}
                  value={geometry?.z}
                  onChange={(value) => handleChangeGeometry("z", value)}
                  className="w-80"
                />
              </FormGroup>
            </div>
          </div>
        </div>
        <div className="d-flex f-grow f-column f-ai-end bg-gray" style={{ paddingRight: 5 }}>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-150">C/S Library</div>
            <FormGroup className="no-m w-170">
              <SimpleSelector<string>
                items={libs}
                selected={geometry?.library}
                onSelect={(value) => handleChangeGeometry("library", value)}
                itemLabel={(item) => item}
                className="fill-select"
                loading={profilesProgress}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-150">Portal Col. Profile</div>
            <FormGroup className="no-m w-170">
              <SimpleSelector<Section>
                items={filteredProfileSectionData}
                selected={geometry?.colProfile}
                onSelect={(value) => handleChangeGeometry("colProfile", value)}
                itemLabel={(item) => item.designation}
                className="fill-select"
                filter={(query, item) =>
                  query
                    ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase())
                    : true
                }
                loading={profilesProgress}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-150">Portal Beam Profile</div>
            <FormGroup className="no-m w-170">
              <SimpleSelector<Section>
                items={filteredProfileSectionData}
                selected={geometry?.beamProfile}
                onSelect={(value) => handleChangeGeometry("beamProfile", value)}
                itemLabel={(item) => item.designation}
                className="fill-select"
                filter={(query, item) =>
                  query
                    ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase())
                    : true
                }
                loading={profilesProgress}
              />
            </FormGroup>
          </div>
          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-150">Portal Tie Profile</div>
            <FormGroup className="no-m w-170">
              <SimpleSelector<Section>
                items={filteredProfileSectionData}
                selected={geometry?.tieProfile}
                onSelect={(value) => handleChangeGeometry("tieProfile", value)}
                itemLabel={(item) => item.designation}
                className="fill-select"
                filter={(query, item) =>
                  query
                    ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase())
                    : true
                }
                loading={profilesProgress}
              />
            </FormGroup>
          </div>
        </div>
      </div>
    </>
  );
};

export default PortalsGeometry;
