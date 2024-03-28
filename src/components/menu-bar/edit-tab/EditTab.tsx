import React, { FunctionComponent, useState } from "react";
import MenuButton from "../MenuButton";
import Moving from "./moving/Moving";
import Rotating from "./rotating/Rotating";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import PipeDirection from "./pipe-direction/PipeDirection";
import { getCurrentProject } from "../../3d-models/utils";
import Connecting from "./connecting/Connecting";

type Props = {};

const EditTab: FunctionComponent<Props> = () => {
  const [dlg, setDlg] = useState<JSX.Element>();

  const mode = useSelector((state: ApplicationState) => state.main.workMode);

  const isOFs = useSelector((state: ApplicationState) =>
    getCurrentProject(state)?.models.some((m) => m.type === "Open Frame")
  );

  return (
    <>
      {dlg}
      <div className="d-flex">
        <MenuButton
          id="edit-move-clone-button"
          text="Move / Clone"
          onClick={() => setDlg(<Moving onClose={() => setDlg(undefined)} />)}
        />
        <MenuButton
          text="Rotate"
          onClick={() => setDlg(<Rotating onClose={() => setDlg(undefined)} />)}
        />
        {mode === "PIPING" ? (
          <MenuButton
            text="Pipe Edit"
            onClick={() =>
              setDlg(<PipeDirection onClose={() => setDlg(undefined)} />)
            }
          />
        ) : null}
        {isOFs ? (
          <MenuButton
            text={"Connecting"}
            onClick={() =>
              setDlg(<Connecting onClose={() => setDlg(undefined)} />)
            }
          />
        ) : null}
      </div>
    </>
  );
};

export default EditTab;
