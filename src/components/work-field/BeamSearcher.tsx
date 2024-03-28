import React, { useState, useMemo } from "react";
import { Button, FormGroup, InputGroup, Checkbox } from "@blueprintjs/core";
import { CustomDlg } from "../common/CustomDlg";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../store";
import { getCurrentProject, strFilter, getCurrentUI } from "../3d-models/utils";
import { SimpleSelector } from "../common/SimpleSelector";
import { Releases } from "../../store/main/types";

type Props = {
  onClose: () => any;
  onSubmit: (params: Result) => any;
};

type Result = {
  name: string;
  model: string;
  designation: string;
  releases?: Releases;
};

export function BeamSearcher(props: Props) {
  const { onClose, onSubmit } = props;
  const [value, setValue] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [lib, setLib] = useState<string>("");
  const [designation, setDesignation] = useState<string>("");
  const [isR, setR] = useState<boolean>(false);
  const [releases, setReleases] = useState<Releases>();

  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );
  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const asl = useMemo(() => {
    return ui?.availableData?.profileSectionData ?? [];
  }, [ui?.availableData?.profileSectionData]);

  const models = useMemo(() => {
    if (!project) return [];
    return project.models.map((m) => m.name);
  }, [project]);

  return (
    <CustomDlg
      isMinimize={true}
      title={"Search"}
      position={"center"}
      onClose={onClose}
      zIndex={5}
      body={
        <div className={"d-flex f-column"}>
          <FormGroup>
            <InputGroup
              autoFocus
              leftIcon={"search"}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setValue(event.currentTarget.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  onSubmit({
                    name: value.trim(),
                    model,
                    designation,
                    releases,
                  });
              }}
            />
          </FormGroup>

          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-70">Model: </div>
            <FormGroup className="no-m f-grow">
              <SimpleSelector<string>
                items={models}
                itemLabel={(val) => val}
                selected={model}
                onSelect={(val) => setModel(val ?? "")}
                className={"fill-select"}
                filter={strFilter}
              />
            </FormGroup>
          </div>

          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-100">C/S Library: </div>
            <FormGroup className="no-m f-grow">
              <SimpleSelector<string>
                items={asl.map((el) => el.country_code)}
                itemLabel={(val) => val}
                selected={lib}
                onSelect={(val) => setLib(val ?? "")}
                className={"fill-select"}
                filter={strFilter}
              />
            </FormGroup>
          </div>

          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-70">Size: </div>
            <FormGroup className="no-m f-grow">
              <SimpleSelector<string>
                items={asl
                  .filter((el) => el.country_code === lib)
                  .map((el) => el.designation)}
                itemLabel={(val) => val}
                selected={designation}
                onSelect={(val) => setDesignation(val ?? "")}
                className={"fill-select"}
                filter={strFilter}
              />
            </FormGroup>
          </div>

          <div className="d-flex f-ai-center">
            <div className="label-light t-end w-70">Releases: </div>
            <FormGroup className="no-m ">
              <Checkbox
                key={"r"}
                checked={isR}
                onChange={(e) => {
                  setR(e.currentTarget.checked);
                  setReleases(e.currentTarget.checked ? {} : undefined);
                }}
              />
            </FormGroup>
          </div>

          {releases ? (
            <>
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-70">Fx1: </div>
                <FormGroup className="no-m ">
                  <Checkbox
                    key={"fx1"}
                    checked={releases?.fx1}
                    onChange={(e) =>
                      setReleases({ ...releases, fx1: e.currentTarget.checked })
                    }
                  />
                </FormGroup>

                <div className="label-light t-end w-70">Fx2: </div>
                <FormGroup className="no-m ">
                  <Checkbox
                    key={"fx2"}
                    checked={releases?.fx2}
                    onChange={(e) =>
                      setReleases({ ...releases, fx2: e.currentTarget.checked })
                    }
                  />
                </FormGroup>
              </div>

              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-70">Fy1: </div>
                <FormGroup className="no-m ">
                  <Checkbox
                    key={"fy1"}
                    checked={releases?.fy1}
                    onChange={(e) =>
                      setReleases({ ...releases, fy1: e.currentTarget.checked })
                    }
                  />
                </FormGroup>

                <div className="label-light t-end w-70">Fy2: </div>
                <FormGroup className="no-m ">
                  <Checkbox
                    key={"fy2"}
                    checked={releases?.fy2}
                    onChange={(e) =>
                      setReleases({ ...releases, fy2: e.currentTarget.checked })
                    }
                  />
                </FormGroup>
              </div>

              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-70">Fz1: </div>
                <FormGroup className="no-m ">
                  <Checkbox
                    key={"fz1"}
                    checked={releases?.fz1}
                    onChange={(e) =>
                      setReleases({ ...releases, fz1: e.currentTarget.checked })
                    }
                  />
                </FormGroup>

                <div className="label-light t-end w-70">Fz2: </div>
                <FormGroup className="no-m ">
                  <Checkbox
                    key={"fz2"}
                    checked={releases?.fz2}
                    onChange={(e) =>
                      setReleases({ ...releases, fz2: e.currentTarget.checked })
                    }
                  />
                </FormGroup>
              </div>

              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-70">Mx1: </div>
                <FormGroup className="no-m ">
                  <Checkbox
                    key={"mx1"}
                    checked={releases?.mx1}
                    onChange={(e) =>
                      setReleases({ ...releases, mx1: e.currentTarget.checked })
                    }
                  />
                </FormGroup>

                <div className="label-light t-end w-70">Mx2: </div>
                <FormGroup className="no-m ">
                  <Checkbox
                    key={"mx2"}
                    checked={releases?.mx2}
                    onChange={(e) =>
                      setReleases({ ...releases, mx2: e.currentTarget.checked })
                    }
                  />
                </FormGroup>
              </div>

              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-70">My1: </div>
                <FormGroup className="no-m ">
                  <Checkbox
                    key={"my1"}
                    checked={releases?.my1}
                    onChange={(e) =>
                      setReleases({ ...releases, my1: e.currentTarget.checked })
                    }
                  />
                </FormGroup>

                <div className="label-light t-end w-70">My2: </div>
                <FormGroup className="no-m ">
                  <Checkbox
                    key={"my2"}
                    checked={releases?.my2}
                    onChange={(e) =>
                      setReleases({ ...releases, my2: e.currentTarget.checked })
                    }
                  />
                </FormGroup>
              </div>

              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-70">Mz1: </div>
                <FormGroup className="no-m ">
                  <Checkbox
                    key={"mz1"}
                    checked={releases?.mz1}
                    onChange={(e) =>
                      setReleases({ ...releases, mz1: e.currentTarget.checked })
                    }
                  />
                </FormGroup>

                <div className="label-light t-end w-70">Mz2: </div>
                <FormGroup className="no-m ">
                  <Checkbox
                    key={"mz2"}
                    checked={releases?.mz2}
                    onChange={(e) =>
                      setReleases({ ...releases, mz2: e.currentTarget.checked })
                    }
                  />
                </FormGroup>
              </div>
            </>
          ) : null}
        </div>
      }
      actions={
        <>
          <Button text={"Cancel"} onClick={() => onClose()} />
          <Button
            text={"Ok"}
            onClick={() =>
              onSubmit({ name: value.trim(), model, designation, releases })
            }
            intent={"primary"}
          />
        </>
      }
    />
  );
}
