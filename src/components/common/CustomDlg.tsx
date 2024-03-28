import React, { useRef, useState } from "react";
import { Classes } from "@blueprintjs/core";
import { DialogHeader } from "./DialogHeader";
import { Vector2 } from "three";

type Props = {
  title?: string;
  position?: "center" | "default" | Vector2;
  isMinimize?: boolean;
  isMinimal?: boolean;
  zIndex?: number;
  onClose?: () => any;
  body: any;
  actions?: any;
  className?:string;
  isFullScreen?: boolean;
  idText?: string;
};

export function CustomDlg(props: Props) {
  const {
    title,
    position,
    isMinimize,
    isMinimal,
    onClose,
    body,
    actions,
    zIndex,
    idText
  } = props;

  const [minimized, setMinimized] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const dialog = useRef<HTMLDivElement>(null);

  function toggleFullScreen() {
    setIsFullScreen(!isFullScreen);
  }

  function getStyles(isMinimized: boolean): React.CSSProperties {
    const styles: React.CSSProperties = {
      overflowY: "auto",
      padding: isMinimal ? 0 : 10,
      margin: 0,
      width: isFullScreen ? '100vw' : 'auto',
      height: isFullScreen ? '100vh' : 'auto',
    };
    return isMinimized ? { ...styles, display: "none" } : styles;
  }

  return (
    <div
      ref={dialog}
      id = {idText}
      className={`${Classes.DIALOG} grabbing-dialog no-m no-p`}
      style={{ zIndex }}
    >
      <DialogHeader
        title={title}
        isMinimize={isMinimize}
        minimized={minimized}
        onMinimaze={() => setMinimized(!minimized)}
        position={position}
        onClose={onClose}
        parent={dialog}
        onToggleFullScreen={toggleFullScreen}
      />
      <div style={getStyles(minimized)} className={Classes.DIALOG_BODY}>
        {body}
        {actions ? (
          <div className={`${Classes.DIALOG_FOOTER} no-m`}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>{actions}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
