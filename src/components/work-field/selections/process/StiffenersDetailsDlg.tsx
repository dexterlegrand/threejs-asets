import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import { TProcessElement } from "../../../../store/process/types";
import { CustomDlg } from "../../../common/CustomDlg";

type Props = { onClose: () => any };

export function StiffenersDetailsDlg({ onClose }: Props) {
  const dispatch = useDispatch();

  const item = useSelector((state: ApplicationState) => state.process.selected);

  useEffect(() => {
    !item && onClose();
  }, [item]);

  return (
    <CustomDlg
      title={`Stiffeners of ${item?.name}`}
      isMinimize={true}
      zIndex={5}
      position={"center"}
      body={<></>}
      onClose={onClose}
    />
  );
}
