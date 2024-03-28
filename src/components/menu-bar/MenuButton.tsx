import React, { FunctionComponent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { Spinner, Classes, Icon } from "@blueprintjs/core";

type Props = {
  text: string;
  id?: string;
  icon?: IconProp;
  bpIcon?: JSX.Element;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => any;
};

const MenuButton: FunctionComponent<Props> = (props) => {
  const { text, id, disabled, icon, bpIcon, loading, onClick } = props;
  return (
    <div
      className={`menu-tab-button ${disabled || loading ? "disabled" : ""}`}
      onClick={() => !(disabled || loading) && onClick && onClick()}
      id={id}
    >
      {icon && <FontAwesomeIcon icon={icon} size="lg" />}
      {bpIcon && <Icon icon={bpIcon} />}
      <div>{text}</div>
      {loading && (
        <div className={"loading-box"}>
          <Spinner
            key="loading"
            className={Classes.BUTTON_SPINNER}
            size={Icon.SIZE_LARGE}
          />
        </div>
      )}
    </div>
  );
};

export default MenuButton;
