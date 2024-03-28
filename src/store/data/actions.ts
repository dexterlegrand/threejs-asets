import { action } from "typesafe-actions";
import { Dispatch } from "redux";
import Axios, { AxiosResponse } from "axios";
import { addEventAction, changeRequestProgressAction } from "../ui/actions";
import {
  DataActionTypes,
  ProfileSection,
  PipeProfile,
  Material,
  TPipingCap,
  TPipingCollet,
  TPipingReducer,
  TPipingReturn,
  TPipingElbow,
  TPipingTee,
  DataState,
} from "./types";
import { baseUrl } from "../main/constants";
import { Font } from "three";
import { fontUrl } from "../../pages/utils/agent";
import { pipingBlindFlanges } from "./piping-blind-flanges";
import { pipingLappedFlanges } from "./piping-lapped-flanges";
import { pipingRingJointFacingFlanges } from "./piping-ringjointfacing-flanges";
import { pipingSlipOnFlanges } from "./piping-slipon-flanges";
import { pipingSocketWeldingFlanges } from "./piping-socketwelding-flanges";
import { pipingThreadedFlanges } from "./piping-threaded-flanges";
import { pipingWeldingNeckFlanges } from "./piping-weldingneck-flanges";

const restUrl = `${baseUrl}rest`;

export const setFontAction = (font: Font) =>
  action(DataActionTypes.GET_FONT, { font });

export const getFontAction = (dispatch: Dispatch) => {
  Axios.get(fontUrl, { responseType: "json" })
    .then((res) => {
      localStorage.setItem(fontUrl, JSON.stringify(res.data));
    })
    .finally(() => {
      const json = localStorage.getItem(fontUrl);
      const font = json && new Font(JSON.parse(json));
      font && dispatch(setFontAction(font));
    });
};

export const getProfileSectionDataAction = (
  data: ProfileSection[],
  libs: string[]
) => action(DataActionTypes.GET_PROFILE_SECTION_DATA, { data, libs });

export const getProfileSectionData = (dispatch: Dispatch<any>) => {
  dispatch(changeRequestProgressAction("profiles"));
  Axios.get(`${restUrl}/profilesectiondata?page=${0}`)
    .then((response) => {
      const requests: Promise<AxiosResponse>[] = [];
      for (let i = 1; i < 10/*response.data.page.totalPages*/; i++) {
        requests.push(Axios.get(`${restUrl}/profilesectiondata?page=${i}`));
      }
      Promise.all(requests)
        .then((values) => {
          let dataArr: any[] = response.data._embedded.profilesectiondata;
          values.forEach((value) => {
            dataArr = dataArr.concat(value.data._embedded.profilesectiondata);
          });
          const CS_Libraries: string[] = [];
          // let shapes: string[] = [];
          // let types: string[] = [];
          dataArr.forEach((section) => {
            const country_code = section.country_code?.trim() ?? "";
            // const shape = section.shape.trim().toUpperCase();
            // const type = section.type.trim().toUpperCase();
            if (!CS_Libraries.includes(country_code))
              CS_Libraries.push(country_code);
            // if (!shapes.includes(shape)) shapes.push(shape);
            // if (!types.includes(type)) types.push(type);
          });
          dispatch(getProfileSectionDataAction(dataArr, CS_Libraries.sort()));
          dispatch(changeRequestProgressAction("profiles", false));
        })
        .catch((err) => {
          console.error(err);
          /*dispatch(addEventAction(`Profiles: ${err.message}`, "danger"));*/
          dispatch(changeRequestProgressAction("profiles", false));
        });
    })
    .catch((err) => {
      console.error(err);
      /*dispatch(addEventAction(`Profiles: ${err.message}`, "danger"));*/
      dispatch(changeRequestProgressAction("profiles", false));
    });
};

export const getMaterialsAction = (data: Material[]) =>
  action(DataActionTypes.GET_MATERIALS, { data });

export const getMaterials = (dispatch: Dispatch<any>) => {
  dispatch(changeRequestProgressAction("material"));
  Axios.get(`${restUrl}/material`)
    .then((response) => {
      dispatch(getMaterialsAction(response.data._embedded.material));
      dispatch(changeRequestProgressAction("material", false));
    })
    .catch((err) => {
      console.error(err);
      dispatch(addEventAction(`Materials: ${err.message}`, "danger"));
      dispatch(changeRequestProgressAction("material", false));
    });
};

export const getPipeProfilesAction = (data: PipeProfile[]) =>
  action(DataActionTypes.GET_PIPE_PROFILES, { data });

export const getPipeProfiles = (dispatch: Dispatch<any>) => {
  dispatch(changeRequestProgressAction("pipes"));
  Axios.get(`${restUrl}/pipingdetails`)
    .then((response) => {
      dispatch(getPipeProfilesAction(response.data._embedded.pipingdetails));
      dispatch(changeRequestProgressAction("pipes", false));
    })
    .catch((err) => {
      console.error(err);
      dispatch(addEventAction(`Pipe Profiles: ${err.message}`, "danger"));
      dispatch(changeRequestProgressAction("pipes", false));
    });
};

export const getPipingCapsAction = (data: TPipingCap[]) =>
  action(DataActionTypes.GET_PIPING_CAPS, { data });

export const getPipingCaps = (dispatch: Dispatch<any>) => {
  dispatch(changeRequestProgressAction("pipingCaps"));
  Axios.get(`${restUrl}/material/pipingcaps/all`)
    .then((response) => {
      const data = (response.data._embedded.pipingcaps.map(
        (item: TPipingCap) => ({
          ...item,
          id: item.piping_caps_id,
        })
      ) ?? []) as TPipingCap[];
      dispatch(getPipingCapsAction(data));
      dispatch(changeRequestProgressAction("pipingCaps", false));
    })
    .catch((err) => {
      console.error(err);
      dispatch(addEventAction(`Piping Caps: ${err.message}`, "danger"));
      dispatch(changeRequestProgressAction("pipingCaps", false));
    });
};

export const getPipingColletsAction = (data: TPipingCollet[]) =>
  action(DataActionTypes.GET_PIPING_COLLETS, { data });

export const getPipingCollets = (dispatch: Dispatch<any>) => {
  dispatch(changeRequestProgressAction("pipingCollets"));
  Axios.get(`${restUrl}/material/pipingcollets/all`)
    .then((response) => {
      const data = (response.data._embedded.pipingcollets.map(
        (item: TPipingCollet) => ({
          ...item,
          id: item.piping_collets_id,
        })
      ) ?? []) as TPipingCollet[];
      dispatch(getPipingColletsAction(data));
      dispatch(changeRequestProgressAction("pipingCollets", false));
    })
    .catch((err) => {
      console.error(err);
      dispatch(addEventAction(`Piping Collets: ${err.message}`, "danger"));
      dispatch(changeRequestProgressAction("pipingCollets", false));
    });
};

export const getPipingReducersAction = (data: TPipingReducer[]) =>
  action(DataActionTypes.GET_PIPING_REDUCERS, { data });

export const getPipingReducers = (dispatch: Dispatch<any>) => {
  dispatch(changeRequestProgressAction("pipingReducers"));
  Axios.get(`${restUrl}/material/piping-reducers/all`)
    .then((response) => {
      const data = (response.data._embedded["piping-reducers"]?.map(
        (item: TPipingReducer) => ({
          ...item,
          id: item.piping_reducers_id,
        })
      ) ?? []) as TPipingReducer[];
      dispatch(getPipingReducersAction(data));
      dispatch(changeRequestProgressAction("pipingReducers", false));
    })
    .catch((err) => {
      console.error(err);
      dispatch(addEventAction(`Piping Reducers: ${err.message}`, "danger"));
      dispatch(changeRequestProgressAction("pipingReducers", false));
    });
};

export const getPipingReturnsAction = (data: TPipingReturn[]) =>
  action(DataActionTypes.GET_PIPING_RETURNS, { data });

export const getPipingReturns = (dispatch: Dispatch<any>) => {
  dispatch(changeRequestProgressAction("pipingReturns"));
  Axios.get(`${restUrl}/material/piping-returns/all`)
    .then((response) => {
      const data = (response.data._embedded["piping-returns"]?.map(
        (item: TPipingReturn) => ({
          ...item,
          id: item.piping_returns_id,
        })
      ) ?? []) as TPipingReturn[];
      dispatch(getPipingReturnsAction(data));
      dispatch(changeRequestProgressAction("pipingReturns", false));
    })
    .catch((err) => {
      console.error(err);
      dispatch(addEventAction(`Piping Returns: ${err.message}`, "danger"));
      dispatch(changeRequestProgressAction("pipingReturns", false));
    });
};

export const getPipingElbowsAction = (data: TPipingElbow[]) =>
  action(DataActionTypes.GET_PIPING_ELBOWS, { data });

export const getPipingElbows = (dispatch: Dispatch<any>) => {
  dispatch(changeRequestProgressAction("pipingElbows"));
  Axios.get(`${restUrl}/material/piping-elbows/all`)
    .then((response) => {
      const data = (response.data._embedded["piping-elbows"]?.map(
        (item: TPipingElbow) => ({
          ...item,
          id: item.piping_elbows_id,
        })
      ) ?? []) as TPipingElbow[];
      dispatch(getPipingElbowsAction(data));
      dispatch(changeRequestProgressAction("pipingElbows", false));
    })
    .catch((err) => {
      console.error(err);
      dispatch(addEventAction(`Piping Elbows: ${err.message}`, "danger"));
      dispatch(changeRequestProgressAction("pipingElbows", false));
    });
};

export const getPipingTeesAction = (data: TPipingTee[]) =>
  action(DataActionTypes.GET_PIPING_TEES, { data });

export const getPipingTees = (dispatch: Dispatch<any>) => {
  dispatch(changeRequestProgressAction("pipingTees"));
  Axios.get(`${restUrl}/material/piping-tees/all`)
    .then((response) => {
      const data = (response.data._embedded["piping-tees"]?.map(
        (item: TPipingTee) => ({
          ...item,
          id: item.piping_tees_id,
        })
      ) ?? []) as TPipingTee[];
      dispatch(getPipingTeesAction(data));
      dispatch(changeRequestProgressAction("pipingTees", false));
    })
    .catch((err) => {
      console.error(err);
      dispatch(addEventAction(`Piping Tees: ${err.message}`, "danger"));
      dispatch(changeRequestProgressAction("pipingTees", false));
    });
};

export const getFlangesAction = (data: any) =>
  action(DataActionTypes.GET_FLANGES, { data });

export const getFlanges = (dispatch: Dispatch<any>) => {
  dispatch(changeRequestProgressAction("pipingFlanges"));
  Promise.all([
    Axios.get(`${restUrl}/material/pipingflange-blind/all`),
    Axios.get(`${restUrl}/material/pipingflange-lapped/all`),
    Axios.get(`${restUrl}/material/pipingflange-ring-joint-facing/all`),
    Axios.get(`${restUrl}/material/pipingflange-slipon/all`),
    Axios.get(`${restUrl}/material/pipingflange-socket-welding/all`),
    Axios.get(`${restUrl}/material/pipingflange-threaded/all`),
    Axios.get(`${restUrl}/material/pipingflange-weldingneck/all`),
    Axios.get(`${restUrl}/material/pipingflange-all-pres-rating/all`),
  ])
    .then((responses) => {
      let result = {};
      for (const response of responses) {
        switch (response.config.url) {
          case `${restUrl}/material/pipingflange-blind/all`:
            result = {
              ...result,
              pipingFlangesBlind:
                response.data._embedded["pipingflange-blind"] ??
                pipingBlindFlanges,
            };
            break;
          case `${restUrl}/material/pipingflange-lapped/all`:
            result = {
              ...result,
              pipingFlangesLapped:
                response.data._embedded["pipingflange-lapped"] ??
                pipingLappedFlanges,
            };
            break;
          case `${restUrl}/material/pipingflange-ring-joint-facing/all`:
            result = {
              ...result,
              pipingFlangesRingJointFacing:
                response.data._embedded["pipingflange-ring-joint-facing"] ??
                pipingRingJointFacingFlanges,
            };
            break;
          case `${restUrl}/material/pipingflange-slipon/all`:
            result = {
              ...result,
              pipingFlangesSlipon:
                response.data._embedded["pipingflange-slipon"] ??
                pipingSlipOnFlanges,
            };
            break;
          case `${restUrl}/material/pipingflange-socket-welding/all`:
            result = {
              ...result,
              pipingFlangesSocketWelding:
                response.data._embedded["pipingflange-socket-welding"] ??
                pipingSocketWeldingFlanges,
            };
            break;
          case `${restUrl}/material/pipingflange-threaded/all`:
            result = {
              ...result,
              pipingFlangesThreaded:
                response.data._embedded["pipingflange-threaded"] ??
                pipingThreadedFlanges,
            };
            break;
          case `${restUrl}/material/pipingflange-weldingneck/all`:
            result = {
              ...result,
              pipingFlangesWeldingneck:
                response.data._embedded["pipingflange-weldingneck"] ??
                pipingWeldingNeckFlanges,
            };
            break;
          case `${restUrl}/material/pipingflange-all-pres-rating/all`:
            result = {
              ...result,
              pipingFlangesAllPresRating:
                response.data._embedded["pipingflange-all-pres-rating"] ?? [],
            };
        }
      }
      dispatch(getFlangesAction(result));
      dispatch(changeRequestProgressAction("pipingFlanges"));
    })
    .catch((err) => {
      console.error(err);
      dispatch(addEventAction(`Piping Flanges: ${err.message}`, "danger"));
      dispatch(changeRequestProgressAction("pipingFlanges"));
    });
};

export const changeDataAction = (data: DataState) =>
  action(DataActionTypes.CHANGE_DATA, { data });
