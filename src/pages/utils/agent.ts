// @ts-ignore
import superAgentPromise from "superagent-promise";
import _superAgent from "superagent";

const superAgent = superAgentPromise(_superAgent, global.Promise);

export const isProd = false;

export const flareAPI = "http://fdsprod.asetslux.com"; // production
export const towerAPI = "http://demo.asetslux.com"; // test

export const piperackAPI = isProd
  ? "http://pdsprod.asetslux.com" // production
  : "http://fds.asetslux.com"; // test

export const openframeAPI = isProd
  ? "http://odsprod.asetslux.com" // production
  : "http://openframe.asetslux.com"; // test

export const pipingAPI = isProd
  ? "http://pipeprod.asetslux.com" // production
  : "http://piping.asetslux.com"; // test

export const fontUrl = "./old/fonts/helvetiker_bold.typeface.json";

// export const API_ROOT = piperackAPI;
// export const API_ROOT = openframeAPI;
// export const API_ROOT = pipingAPI;

export const APIS = {
  DESIGNER: "http://fds.asetslux.com",
  DESIGNER_PIPING: "http://pdsprod.asetslux.com",
  PIPING: "http://pipeprod.asetslux.com",
  DESIGNER_PIPING_PR: "http://pdsprod.asetslux.com",
  OF: "http://odsprod.asetslux.com",
  STACK: "http://demo.asetslux.com",
  STACK_PROD: "http://fdsprod.asetslux.com",
  VIEWER: "http://idsviewer.asetslux.com",
  PROCESS: "http://18.141.117.230",
  HYDRAULIC: "http://15.207.123.68",
  Learner: "http://learning.asets-ca.com",
  Test: "http://testing.asets-ca.com",
  PdsProd: "https://idsprod.asets.io",
  LoadBalancer: "https://loadbalancer.asets.io",
  Test1: "http://13.232.34.209",
  PdsProdSuper: "https://idssuperprod.asets.io"
};

export const API_ROOT = APIS.Test;
//export const secondServerAPI = "https://idsprod.asets.io"
//export const secondServerAPILearning = "https://idsprod.asets.io/rest"
export const secondServerAPI = "http://testing.asets-ca.com";
export const secondServerAPILearning = "http://testing.asets-ca.com/rest";
//export const secondServerAPI = "https://idssuperprod.asets.io";
//export const secondServerAPILearning = "https://idssuperprod.asets.io/rest";
export const lsaServerAPI = "http://18.143.0.36:8000";

const responseBody = (res: any) => res.body;

let token: any = null;
const tokenPlugin = (req: any) => {     
  token && req.set("Authorization", `Bearer ${token}`);
};

const requests = {
  del: (url: string) =>
    superAgent
      .del(`${API_ROOT}${url}`)
      .use(tokenPlugin)
      .then(responseBody),
  get: (url: string) =>
    superAgent
      .get(`${API_ROOT}${url}`)
      .use(tokenPlugin)
      .then(responseBody),
  put: (url: string, body: any) =>
    superAgent
      .put(`${API_ROOT}${url}`, body)
      .use(tokenPlugin)
      .then(responseBody),
  post: (url: string, body: any) =>
    superAgent
      .post(`${API_ROOT}${url}`, body)
      .use(tokenPlugin)
      .then(responseBody),
};

const Auth = {
  current: (userId: string | number) => requests.get(`/rest/user/${userId}`),
  login: (email: string, password: string) =>
    superAgent
      .post(`${API_ROOT}/oauth/token`)
      .send({ password: password })
      .send({ username: email })
      .send({ scope: "role_webclient" })
      .send({ grant_type: "password" })
      .type("form")
      .auth("adminapp", "password")
      .then(responseBody),
  register: (username: string, email: string, password: string) =>
    requests.post("/users", { user: { username, email, password } }),
  save: (user: any) => requests.put("/user", { user }),
};

export default {
  Auth,
  setToken: (_token: any) => {
    token = _token;
  },
};
