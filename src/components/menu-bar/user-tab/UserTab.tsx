import React, { FunctionComponent } from "react";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import MenuButton from "../MenuButton";
import { logOutAction } from "../../../store/auth/actions";
import { useDispatch, useSelector } from "react-redux";
import { push } from "connected-react-router";
import axios from "axios";
import { API_ROOT} from "../../../pages/utils/agent";
import { ApplicationState } from "../../../store";

type Props = {};

const UserTab: FunctionComponent<Props> = () => {

  const dispatch = useDispatch();
  const auth = useSelector((state: ApplicationState) => state.auth);

  function handleLogOut() {
    window.localStorage.setItem("jwt", "")
    dispatch(logOutAction())
    dispatch(push("/"))
    axios.get(`${API_ROOT}/rest/api/v1/deleteUser`, {
      headers: { 'user-id': auth.User_id }
    })
    .then(response => {
      console.log("Updated");
    })
  }

  return (
    <div className="d-flex">
      <MenuButton text="Log Out" icon={faSignOutAlt} onClick={handleLogOut}/>
    </div>
  );
};

export default UserTab;
