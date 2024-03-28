import React, { FunctionComponent, useEffect,useState, useCallback } from "react";
import { ConnectedRouter, push } from "connected-react-router";
import { Route, Switch, Redirect } from "react-router-dom";
import { ApplicationState, history } from "../store";
import { Login } from "./login/Login";
import agent, { APIS, API_ROOT, isProd, secondServerAPI } from "./utils/agent";
import jwt from "jsonwebtoken";
import jwtDecode from "jwt-decode";
import {
  appLoadAction,
  asyncStartAction,
  logInAction,
  setUserIdAction,
} from "../store/auth/actions";
import { useDispatch, useSelector } from "react-redux";
import { ModeSwitcher } from "./mode-switcher/ModeSwitcher";
import { Editor } from "./Editor";
import { useBeforeUnloadWarning } from "./warning";
import {
  getProfileSectionData,
  getPipeProfiles,
  getMaterials,
  getPipingCaps,
  getPipingCollets,
  getPipingReducers,
  getPipingReturns,
  getPipingElbows,
  getPipingTees,
  getFlanges,
  getFontAction,
} from "../store/data/actions";
import Axios from "axios";
import { jsonOptions, setProductsAction } from "../store/main/actions";
import { Learnings } from "./education/Learnings";
import { Viewer } from "./Viewer";
import Dashboard from "./dashboard/Dashboard";
import Chatbot from "../components/chatBot/chatbot";
import axios from "axios";
import { Button, Card, Elevation, H2, Callout,Divider } from "@blueprintjs/core";




import { TourProvider, useTour } from '@reactour/tour';
import { checkAndPerformCustomActions } from "../components/tour-data-provider/CustomTourAction";


const App: FunctionComponent = () => {
  const { isOpen, currentStep,setCurrentStep, steps, setIsOpen, setSteps, setMeta, meta} = useTour();
  const [loginError,setLoginError] = useState('');
  
  useBeforeUnloadWarning("Are you Sure you want top leave? Changes might not be saved.")
  const auth = useSelector((state: ApplicationState) => state.auth);
  const data = JSON.stringify({
    userId: auth.User_id, 
  });
  
  useEffect(() => {
    const handleBeforeUnload = () => {
      const url = `${API_ROOT}/rest/api/v1/deleteUser`;
      const data = JSON.stringify({
        userId: auth.User_id,
      });
      fetch(url, {
        method: 'get',  
        headers: {
          'user-id': String(auth.User_id)
        },
        keepalive: true, 
      }).then(response => {
        console.log('Request made successfully', response);
      }).catch(error => {
        console.error('Request failed', error);
      });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [auth.User_id]);

  const appLoaded = useSelector(
    (state: ApplicationState) => state.auth.appLoaded
  );
  const inProgress = useSelector(
    (state: ApplicationState) => state.auth.inProgress
  );
  const dispatch = useDispatch();

  function onLoad(payload: any) {
    dispatch(appLoadAction(payload));
  }

  function onPush(url: string) {
    dispatch(push(url));
  }

  function checkToken() {
    const token = window.localStorage.getItem("jwt");
    if (token) {
      const decoded = jwtDecode(token);
      const current_time = Date.now() / 1000;
      // @ts-ignore
      if (decoded.exp < current_time) {
        window.localStorage.setItem("jwt", "");
        agent.setToken(null);
        onLoad(null);
      } else {
        onPush("/editor");
        agent.setToken(token);

        // verify a token asymmetric
        const cert =
          "-----BEGIN PUBLIC KEY-----" +
          "\n" +
          "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxhNcg/WvhZS2lFQO3bHr" +
          "\n" +
          "EoNNgb1YJ2ySQZGRKNrRqYtuFRN8T6qoxKNb2i1/xc4EP6WvaEPX0ykMEYZvmBYZ" +
          "\n" +
          "Ox6gDy+OWipbjvFbqWxXqT6xsu4g/Fr+Oc5QIBrZHO1V2Xskd5X1cCuGC8Rk5EFp" +
          "\n" +
          "WtszSQl6+bUGrEBiZ/PM2xT41blmSeUVr2NPuAaAidacgYuI66+HdVN9xIUVP+rm" +
          "\n" +
          "mmp6o6Sm2ZMqFXLIuSEW+UBy/tN6T9hGjzrYBzhaDEjh/QbM0BTt2YiraKPh8bLy" +
          "\n" +
          "bGTC37g4ZtUZu1zMlTzg63lwNB/0s0zxSNdfk2CN4ncuGky4yd5C/97mGY1+j0vc" +
          "\n" +
          "NwIDAQAB" +
          "\n" +
          "-----END PUBLIC KEY-----";
        const verified = jwt.verify(token, cert);

        // @ts-ignore
        if (verified.exp < current_time) {
          window.localStorage.setItem("jwt", "");
          agent.setToken(null);
        }
        // @ts-ignore
        agent.Auth.current(verified.user_id).then((res) => onLoad(res));
      }
    } else {
      onPush("/");
      onLoad(null);
    }
  }

  function checkAccess(email: string) {
    Axios.post(
      `${API_ROOT}/rest/material/productaccess/email`,
      JSON.stringify({ email }),
      jsonOptions
    ).then((res) => {
      if (typeof res.data.product === "string") {
        const products = res.data.product.split(",");
        dispatch(setProductsAction(products));
      }
    });
    /*Axios.post(
      `${secondServerAPI}/userAccess/getUserAccess`,
      JSON.stringify({ email }),
      jsonOptions
    ).then((res) => {
    });*/
  }

  function TermsAndConditions (){
    const auth = useSelector((state: ApplicationState) => state.auth);
  
    const handleAccept = () => {
      axios.post(`${API_ROOT}/rest/api/v1/datasheets/updateTnCFlag`, {}, {
        headers: { 
          'user-id': auth.User_id ? String(auth.User_id) : '',
          'accepted': true  
        }
      })
      .then(() => {
        history.push('/modes');
      })
      .catch(error => {
        console.error("Error updating TnC acceptance", error);
      });
    };
  
    return (
      <div style={{ padding: '20px', maxWidth: '1000px', minHeight: '1000px', margin: '0 auto' }}>
            <Card elevation={Elevation.TWO} style={{ padding: '20px' }}>
                <H2>Terms and Conditions</H2>
                <div style={{ maxHeight: '500px', overflow: 'auto' }}>
                <p>Please read these terms and conditions carefully before using Our Service. By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you do not have permission to access the Service.</p>
                
                <Divider />

                <Callout title="AUTHORIZED USER TERMS OF USE">
                    <p>These Terms of Use (&ldquo;Terms of Use&raquo;)&sbquo; together with any documents they expressly incorporate by reference&sbquo govern your use of the ASETS&ndash;CA Inc. (we&sbquo; us or our) software&sbquo sometimes referred to as the IDS platform (the Software)&sbquo; and access and use of [insert applicable details] (the Website)&sbquo; whether as a guest or a registered user...</p>
                    <p>BY ACCESSING OR USING THE SOFTWARE OR BY CLICKING TO ACCEPT OR AGREE TO THE TERMS OF USE WHEN THIS OPTION IS MADE AVAILABLE TO YOU&sbquo </p>
                    <div style={{fontWeight: 'bold'}}><p>YOU: (i) REPRESENT THAT YOU ARE DULY AUTHORIZED BY LICENSEE TO ACCESS AND USE THE SOFTWARE&sbquo AND (ii) ACCEPT THESE TERMS OF USE AND AGREE THAT YOU ARE LEGALLY BOUND BY THEM. IF YOU DO NOT AGREE TO THESE TERMS OF USE&sbquo DO NOT USE OR ACCESS THE SOFTWARE OR CLICK ACCEPT OR AGREE TO THE TERMS OF USE WHEN THIS OPTION IS MADE AVAILABLE TO YOU.</p> </div>
                    <ol>
                      <li>Changes to the Terms of Use. We may revise and update these Terms of Use from time to time in our sole discretion. All changes are effective immediately when we post them to our Website and apply to all access to and use of the Software thereafter. However&sbquo; any changes to the dispute resolution provisions set forth in the Governing Law and Jurisdiction provisions below will not apply to any disputes for which the parties have actual notice on or prior to the date the change is posted on the Website. Your continued use of the Software following the posting of revised Terms of Use means that you accept and agree to the changes. We may send you an email reminder of our notices and material changes&sbquo; but you should check our Website frequently to see the current Terms of Use are in effect and any changes that may have been made to them&sbquo; as they are binding on you.</li>
                      <li>Licence Grant and Termination. Subject to your strict compliance with these Terms of Use&sbquo; Licensor by these Terms of Use grants you a non&ndash;exclusive&sbquo; non&ndash;transferable&sbquo; non&ndash;sublicensable&sbquo; limited licence to use the Software solely in accordance with the Documentation&sbquo; as installed on the equipment provided by Licensee and for Licensee&apos;s internal business purposes or otherwise made available for your access. The foregoing licence will terminate immediately on the earlier to occur of: 
                        <ul><li>the expiration or earlier termination of the Licence Agreement between Licensor and Licensee; or </li>
                        <li>your ceasing to be authorized by Licensor to use the Software for any or no reason.</li></ul>
                        Notwithstanding the foregoing&sbquo; the Licensor has the right to take appropriate legal action&sbquo; including without limitation&sbquo; referral to law enforcement&sbquo; for any illegal or unauthorized use of the Software and terminate or suspend your access to all or part of the Website or Software for any or no reason&sbquo; including without limitation&sbquo; any violation of these Terms of Use. 

                        YOU WAIVE AND HOLD HARMLESS THE LICENSOR FROM ANY CLAIMS RESULTING FROM ANY ACTION TAKEN BY THE LICENSOR DURING OR AS A RESULT OF ITS INVESTIGATIONS AND FROM ANY ACTIONS TAKEN AS A CONSEQUENCE OF INVESTIGATIONS BY EITHER THE LICENSOR OR LAW ENFORCEMENT AUTHORITIES.  
                      </li>
                      <li>Accessing the Software and Account Security. We reserve the right to withdraw or amend the Website&sbquo; and any Software or material we provide on the Website&sbquo; in our sole discretion without notice. We will not be liable if for any reason all or any part of the Website is unavailable at any time or for any period. From time to time&sbquo; we may restrict access to some parts of the Website&sbquo; or the entire Website&sbquo; to users&sbquo; including registered users. 

                        You are responsible for both: 
                      <ul>
                        <li>Making all arrangements necessary for you to have access to the Website.</li>
                        <li>Ensuring that all persons who access the Website through your internet connection are aware of these Terms of Use and comply with them.</li>
                      </ul>
                      You represent that you are of the age of majority in your jurisdiction of residence &sbquo and acknowledge you are responsible for that account and ensuring it is used in compliance with these Terms of Use. To access the Website or some of the resources it offers&sbquo; you may be asked to provide certain registration details or other information. It is a condition of your use of the Website that all the information you provide on the Website is correct&sbquo; current and complete. You agree that all information you provide to register with this Website or otherwise, including, but not limited to, through the use of any interactive features on the Website, is governed by ou Privacy Policy, and you consent to all actions we take with respect to your information consistent with our Privacy Policy. 
                      If you choose &sbquo or are provided with &sbquo; a username&sbquo; password or any other piece of information as part of our security procedures&sbquo; you must treat such information as confidential&sbquo; and you must not disclose it to any other person or entity. You also acknowledge that your account is personal to you and agree not to provide any other person with access to this Website or portions of it using your username&sbquo; password or other security information. You agree to notify us immediately of any unauthorized access to or use of your username or password or any other breach of security. You also agree to ensure that you exit from your account at the end of each session. You should use particular caution when accessing your account from a public or shared computer so that others are not able to view or record your password or other personal information. 
                      We have the right to disable any username&sbquo; password or other identifier &sbquo whether chosen by you or provided by us&sbquo; at any time in our sole discretion for any or no reason&sbquo; including if&sbquo; in our opinion&sbquo; you have violated any provision of these Terms of Use. 
                    </li>
                    <li>
                      Intellectual Property Rights and Ownership. The Website&sbquo; Software and its entire contents&sbquo; features and functionality (including but not limited to all training materials&sbquo; information&sbquo; software&sbquo; code&sbquo; data text&sbquo; displays&sbquo; photographs&sbquo; images&sbquo; video and audio&sbquo; and the design&sbquo; selection and arrangement thereof)&sbquo; are owned by the Licensor&sbquo; its licensors or other providers of such material and are protected in all forms by intellectual property laws including&sbquo; without limitation&sbquo; copyright&sbquo; trademark&sbquo; patent&sbquo; trade secret and any other proprietary rights. You acknowledge that the Software is provided under licence&sbquo; and not sold&sbquo; to you. You do not acquire any ownership interest in the Software under this Agreement&sbquo; or any other rights to the Software other than to use the Software in accordance with the licence granted under this Agreement&sbquo; subject to all terms&sbquo; conditions and restrictions. Licensor reserves and shall retain its entire right&sbquo; title and interest in and to the Software and all intellectual property rights arising out of or relating to the Software&sbquo; subject to the licence expressly granted to the Licensee in this Agreement. You shall safeguard all Software (including all copies thereof) from infringement&sbquo; misappropriation&sbquo; theft&sbquo; misuse or unauthorized access. 
                      These Terms of Use permit you to use the Website for your personal&sbquo; non&ndash;commercial use only. You must not directly or indirectly reproduce&sbquo; distribute&sbquo; modify&sbquo; create derivative works of&sbquo; publicly display&sbquo; publicly perform&sbquo; republish&sbquo; download&sbquo; store or transmit any of the material on our Website&sbquo; except as follows: 
                      <ul>
                        <li>Your computer may temporarily store copies of such materials in RAM incidental to your accessing and viewing those materials. </li>
                        <li>You may store files that are automatically cached by your Web browser for display enhancement purposes. </li>
                        <li>You may print or download one copy of a reasonable number of pages of the Website for your own personal&sbquo; no&ndash;commercial use and not for further reproduction&sbquo; publication or distribution. </li>
                        <li>If we provide desktop&sbquo; mobile or other applications for download&sbquo; you may download a single copy to your computer or mobile device solely for your own personal&sbquo; non-commercial use&sbquo; provided you agree to be bound by our end user license agreement for such applications. </li>
                    
                      </ul>
                      <p>You must not: </p>
                      <ul>
                        <li>Modify copies of any materials from the Website. </li>
                        <li>Use any illustrations&sbquo; photographs&sbquo; video or audio sequences or any graphics separately from the accompanying text. </li>
                        <li>Delete or alter any copyright&sbquo; trademark or other proprietary rights notices from copies of materials from this Website. </li>
                        <li>Access or use for any commercial purposes any part of the Website or any services or materials available through the Website of Software. </li>
                      </ul>
                      <p>If you print&sbquo; copy&sbquo; modify&sbquo; download or otherwise use or provide any other person with access to any part of the Website or Software in breach of the Terms of Use&sbquo; your right to use the Website or Software will cease immediately and you must&sbquo; at our option&sbquo; return or destroy any copies of the materials you have made. No right&sbquo; title or interest in or to the Software or any content on the Website is transferred to you&sbquo; and all rights not expressly granted are reserved by the Licensor. Any use of the Website or Software not expressly permitted by these Terms of Use is a breach of these Terms of Use and may violate copyright&sbquo; trademark and other laws. </p>
                    </li>
                    <li>
                      <p>Use Restrictions. You shall not&sbquo; directly or indirectly: </p>
                      <ul>
                        <li>use the Software or Documentation except as set forth in Schedule A</li>
                        <li>copy the Software or Documentation&sbquo; in whole or in part</li>
                        <li>modify&sbquo; translate&sbquo; adapt or otherwise create derivative works or improvements&sbquo; whether or not patentable&sbquo; of the Software or any part thereof</li>
                        <li>combine the Software or any part thereof with&sbquo; or incorporate the Software or any part thereof in&sbquo; any other programs</li>
                        <li>reverse engineer&sbquo; disassemble&sbquo; decompile&sbquo; decode or otherwise attempt to derive or gain access to the source code of the Software or any part thereof</li>
                        <li>remove&sbquo; delete&sbquo; alter or obscure any trademarks or any copyright&sbquo; trademark&sbquo; patent or other intellectual property or proprietary rights notices included on or in the Software or Documentation&sbquo; including any copy thereof</li>
                        <li>rent&sbquo; lease&sbquo; lend&sbquo; sell&sbquo; sublicense&sbquo; assign&sbquo; distribute&sbquo; publish&sbquo; transfer or otherwise provide any access to or use of the Software or any features or functionality of the Software&sbquo; for any reason&sbquo; to any other person or entity&sbquo; including any subcontractor&sbquo; independent contractor&sbquo; affiliate or service provider of Licensee&sbquo; whether or not over a network and whether or not on a hosted basis&sbquo; including in connection with the internet&sbquo; web hosting&sbquo; wide area network (WAN)&sbquo; virtual private network (VPN)&sbquo; virtualization&sbquo; time-sharing&sbquo; service bureau&sbquo; software as a service&sbquo; cloud or other technology or service</li>
                        <li>
                        use the Software or Documentation in&sbquo; or in association with&sbquo; the design&sbquo; construction&sbquo; maintenance or operation of any hazardous environments or systems&sbquo; including
                        <ul>
                          <li>power generation systems</li>
                          <li>aircraft navigation or communications systems&sbquo; air traffic control systems or any other transport management systems</li>
                          <li>safety&ndash;critical applications&sbquo; including medical or life-support systems&sbquo; vehicle operation applications or any police&sbquo; fire or other safety response systems and </li>
                          <li>military or aerospace applications, weapons systems or environments</li>
                        </ul>
                        </li>
                        <li>use the Software or Documentation in any way that violates any applicable federal&sbquo; provincial&sbquo; local or international law or regulation (including&sbquo; without limitation&sbquo; any laws regarding the export of data or software&sbquo; patent&sbquo; trademark&sbquo; trade secret&sbquo; copyright&sbquo; or other intellectual property&sbquo; legal rights or contain any material that could give rise to any civil or criminal liability under applicable laws or regulations or that otherwise may be in conflict with these Terms of Use and our Privacy Policy)</li>
                        <li>use the Software or Documentation for purposes of competitive analysis of the Software&sbquo; the development of a competing software product or service or any other purpose that is to the Licensor&apos;s commercial disadvantage</li>
                        <li>use the Software for the purpose of stalking, exploiting, harming or attempting to exploit or harm individuals (including minors) in any way by exposing them to inappropriate content, asking for personally identifiable information or otherwise as prohibited under applicable laws, regulations, or code</li>
                        <li>impersonate or attempt to impersonate the Licensor&sbquo; a the Licensor employee&sbquo; another user or any other person or entity (including&sbquo; without limitation&sbquo; by using email addresses or screen names associated with any of the foregoing) or </li>
                        <li>engage in any other conduct that restricts or inhibits anyone&apos;s use or enjoyment of the Website or Software&sbquo; or which&sbquo; as determined by us&sbquo; may harm the Licensor or users of the Website or Software&sbquo; or expose them to liability</li>
                        <p>Additionally&sbquo; you agree not to: </p>
                        <li>Use the Website in any manner that could disable&sbquo; overburden&sbquo; damage&sbquo; or impair the site or interfere with any other party&apos;s use of the Website&sbquo; including their ability to engage in real time activities through the Website</li>
                        <li>Use any robot&sbquo; spider or other automatic device&sbquo; process or means to access the Website for any purpose&sbquo; including monitoring or copying any of the material on the Website</li>
                        <li>Use any manual process to monitor or copy any of the material on the Website&sbquo; or for any other purpose not expressly authorized in these Terms of Use, without our prior written consent</li>
                        <li>Use any device&sbquo; software or routine that interferes with the proper working of the Website;</li>
                        <li>Introduce any viruses&sbquo; trojan horses&sbquo; worms&sbquo; logic bombs or other material which is malicious or technologically harmful</li>
                        <li>Attempt to gain unauthorized access to&sbquo; interfere with&sbquo; damage or disrupt any parts of the Website&sbquo; the server on which the Website is stored&sbquo; or any server&sbquo; computer or database connected to the Website</li>
                        <li>Attack the Website via a denial&ndash;of&ndash;service attack or a distributed denial&ndash;of&ndash;service attack or</li>
                        <li>Otherwise attempt to interfere with the proper working of the Website</li>
                      </ul>
                    </li>
                    <li>
                    Compliance Measures. The Software may contain technological copy protection or other security features designed to prevent unauthorized use of the Software&ndash; including features to protect against use of the Software:
                    <ul>
                      <li>
                      beyond the scope of the licence granted under the Licence Agreement
                      </li>
                      <li>
                      prohibited under the Licence Agreement.
                      </li>
                      <p>
                      You shall not&sbquo; and shall not attempt to&sbquo; remove&sbquo; disable&sbquo; circumvent or otherwise create or implement any workaround to&sbquo; any such copy protection or security features. 
                      </p>
                    </ul>
                    </li>
                    <li>
                    Collection and Use of Information.
                    <ul>
                      <li>Licensor may&sbquo; directly or indirectly through the services of others&sbquo; collect and store information regarding use of the Software and about equipment on which the Software is installed or through which it otherwise is accessed and used&sbquo; by means of (i) providing maintenance and support services and (ii) security measures included in the Software.</li>
                      <li>You agree that the Licensor may use such information for any purpose related to any use of the Software by you&sbquo; including but not limited to: (i) improving the performance of the Software or developing updates and (ii) verifying compliance with these Terms of Use or the terms of the Licence Agreement and enforcing Licensor&apos;s rights&sbquo;  including all intellectual property rights in and to the Software.</li>

                    </ul>
                    </li>
                    <li>Reliance on Information Posted. The information presented on or through the Website is made available solely for general information purposes only. We do not warrant the accuracy&sbquo; completeness or usefulness of this information in all circumstances&sbquo; and it is not intended to amount to specific advice which you should rely on. Any reliance you place on such information is strictly at your own risk. We disclaim all liability and responsibility arising from any reliance placed on such materials by you or any other visitor to the Website&ndash; or by anyone who may be informed of any of its contents. </li>
                    <li>Third&sbquo;Party Links from the Website. If the Website contains links to other sites and resources provided by third parties&ndash; these links are provided for your convenience only. This includes links contained in advertisements&sbquo; including banner advertisements and sponsored links. We make no representations about any other websites that may be accessed from this Website. We have no control over the contents of those sites or resources&ndash; and accept no responsibility for them or for any loss or damage that may arise from your use of them. If you decide to access any of the third party websites linked to this Website&ndash; you do so entirely at your own risk and subject to the terms and conditions of use for such websites.</li>
                    <li>Disclaimer of Warranties. You understand that we cannot and do not guarantee or warrant that files available for downloading from the internet or the Website will be free of viruses or other destructive code. You are responsible for implementing sufficient procedures and checkpoints to satisfy your particular requirements for anti-virus protection and accuracy of data input and output&sbquo;  and for maintaining a means external to our Website for any reconstruction of any lost data. WE WILL NOT BE LIABLE FOR ANY LOSS OR DAMAGE CAUSED BY A DISTRIBUTED DENIAL-OF-SERVICE ATTACK&ndash; VIRUSES OR OTHER TECHNOLOGICALLY HARMFUL MATERIAL THAT MAY INFECT YOUR COMPUTER EQUIPMENT&ndash; COMPUTER PROGRAMS&ndash; DATA OR OTHER PROPRIETARY MATERIAL DUE TO YOUR USE OF THE WEBSITE OR ANY SOFTWARE OR ITEMS OBTAINED THROUGH THE WEBSITE OR TO YOUR DOWNLOADING OF ANY MATERIAL POSTED ON IT&ndash; OR ON ANY WEBSITE LINKED TO IT. 
                      YOUR USE OF THE WEBSITE&sbquo; ITS CONTENT AND ANY SOFTWARE OR ITEMS OBTAINED THROUGH THE WEBSITE IS AT YOUR OWN RISK AND YOU ARE RESPONSIBLE FOR COMPLIANCE WITH LOCAL LAWS IN YOUR JURISDICTION. THE WEBSITE&sbquo;  ITS CONTENT AND ANY SOFTWARE OR ITEMS OBTAINED THROUGH THE WEBSITE ARE PROVIDED ON AN AS IS AND AS AVAILABLE BASIS&sbquo;  WITHOUT ANY WARRANTIES OF ANY KIND&sbquo;  EITHER EXPRESS OR IMPLIED. NEITHER ASETS&ndash;CA INC. NOR ANY PERSON ASSOCIATED WITH ASETS&ndash;CA INC. MAKES ANY WARRANTY OR REPRESENTATION WITH RESPECT TO THE COMPLETENESS&sbquo;  SECURITY&sbquo;  RELIABILITY&sbquo;  QUALITY&sbquo;  ACCURACY OR AVAILABILITY OF THE WEBSITE&sbquo;  OR ITS APPLICABILITY TO A PARTICULAR CLIENT SITUATION. WITHOUT LIMITING THE FOREGOING&sbquo;  NEITHER ASETS&ndash;CA INC. NOR ANYONE ASSOCIATED WITH ASETS&ndash;CA INC. REPRESENTS OR WARRANTS THAT THE WEBSITE&sbquo;  ITS CONTENT OR ANY SOFTWARE OR ITEMS OBTAINED THROUGH THE WEBSITE WILL BE ACCURATE&sbquo;  RELIABLE, ERROR-FREE OR UNINTERRUPTED&sbquo; THAT DEFECTS WILL BE CORRECTED&sbquo; THAT OUR WEBSITE OR THE SERVER THAT MAKES IT AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS OR THAT THE WEBSITE OR ANY SOFTWARE OR ITEMS OBTAINED THROUGH THE WEBSITE WILL OTHERWISE MEET YOUR NEEDS OR EXPECTATIONS. THE CONTENT PROVIDED OR OBTAINED THROUGH THE WEBSITE IS FOR INFORMATIONAL PURPOSES ONLY AND SHOULD NOT BE CONSTRUED AS PROFESSIONAL ADVICE OR OPINION AND IS NOT INTENDED TO REPLACE CONSULTATION WITH QUALIFIED PROFESSIONALS. USE OF THE WEBSITE IS NOT A SUBSTITUTE FOR ORIGINAL RESEARCH&sbquo;  ANALYSIS&sbquo; AND DESIGN BY PROFESSIONALS. 
                      THE LICENSOR HEREBY DISCLAIMS ALL WARRANTIES OF ANY KIND&sbquo;  WHETHER EXPRESS OR IMPLIED&sbquo;  STATUTORY OR OTHERWISE&sbquo;  INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY&sbquo;  NON-INFRINGEMENT AND FITNESS FOR PARTICULAR PURPOSE. 
                      THE FOREGOING DOES NOT AFFECT ANY WARRANTIES WHICH CANNOT BE EXCLUDED OR LIMITED UNDER APPLICABLE LAW.</li>
                    <li>Limitation of Liability. EXCEPT WHERE SUCH EXCLUSIONS ARE PROHIBITED BY LAW&sbquo; IN NO EVENT WILL LICENSOR OR ITS PARENT&sbquo; SUBSIDIARIES&sbquo; AFFILIATES&sbquo; OR ANY OF ITS OR THEIR RESPECTIVE DIRECTORS&sbquo; OFFICERS&sbquo; EMPLOYEES&sbquo; AGENTS&sbquo; CONTRACTORS&sbquo; SUPPLIERS&sbquo; LICENSORS OR SERVICE PROVIDERS&sbquo; BE LIABLE TO YOU FOR ANY NEGLIGENCE&sbquo; GROSS NEGLIGENCE&sbquo; NEGLIGENT MISREPRESENTATION&sbquo; FUNDAMENTAL BREACH&sbquo; DAMAGES OF ANY KIND&sbquo; UNDER ANY LEGAL THEORY&sbquo; INCLUDING ANY DIRECT&sbquo; INDIRECT&sbquo; SPECIAL&sbquo; INCIDENTAL&sbquo; CONSEQUENTIAL&sbquo; OR PUNITIVE DAMAGES&sbquo; INCLUDING&sbquo; BUT NOT LIMITED TO&sbquo; PERSONAL INJURY&sbquo; PAIN AND SUFFERING&sbquo; EMOTIONAL DISTRESS&sbquo; LOSS OF REVENUE&sbquo; LOSS OF PROFITS&sbquo; LOSS OF BUSINESS OR ANTICIPATED SAVINGS&sbquo; LOSS OF USE&sbquo; LOSS OF GOODWILL&sbquo; LOSS OF DATA&sbquo; AND WHETHER CAUSED BY TORT&sbquo; BREACH OF CONTRACT&sbquo; BREACH OF PRIVACY&sbquo; OR OTHERWISE&sbquo; EVEN IF THE PARTY WAS ALLEGEDLY ADVISED OR HAD REASON TO KNOW&sbquo; ARISING OUT OF OR IN CONNECTION WITH YOUR USE&sbquo; OR INABILITY TO USE&sbquo; OR RELIANCE ON&sbquo; THE WEBSITE&sbquo; ANY LINKED WEBSITES OR SUCH OTHER THIRD&NDASH;PARTY WEBSITES&sbquo; NOR ANY WEBSITE CONTENT&sbquo; MATERIALS&sbquo; POSTING&sbquo; OR INFORMATION THEREON. YOU ARE PROVIDED THE SOFTWARE UNDER THE SOFTWARE LICENCE AGREEMENT BETWEEN LICENSOR AND LICENSEE&sbquo; SOLELY FOR THE BENEFIT OF LICENSEE AND AT LICENSEES DISCRETION. YOU ACKNOWLEDGE THAT YOU HAVE NO RIGHTS UNDER THAT AGREEMENT INCLUDING ANY RIGHTS TO ENFORCE ANY OF ITS TERMS. ANY OBLIGATION OR LIABILITY LICENSOR OR ITS AFFILIATES&sbquo; OR ANY OF ITS OR THEIR LICENSORS OR SERVICE PROVIDERS&sbquo; MAY HAVE WITH RESPECT TO YOUR USE OR INABILITY TO USE THE SOFTWARE SHALL BE SOLELY TO LICENSEE UNDER THAT AGREEMENT AND SUBJECT TO ALL LIMITATIONS OF LIABILITY SET FORTH THEREIN.</li>
                    <li>Export Regulation. The Software may be subject to Canadian export control laws. You shall not&sbquo; directly or indirectly&sbquo; export&sbquo; re&andash;export or release the Software to, or make the Software or Documentation accessible from&sbquo; any jurisdiction or country to which export&sbquo; re-export&sbquo; or release is prohibited by law, rule or regulation. You shall comply with all applicable federal laws&sbquo; regulations and rules&sbquo; and complete all required undertakings (including obtaining any necessary export licence or other governmental approval)&sbquo; before exporting&sbquo; re-exporting&sbquo; releasing or otherwise making the Software available outside Canada.</li>
                    <li>Indemnification. To the maximum extent permitted by applicable law&sbquo; you agree to defend&sbquo; indemnify and hold harmless the Licensor&sbquo; its affiliates&sbquo; licensors and service providers&sbquo; and its and their respective officers&sbquo; directors&sbquo; employees&sbquo; contractors&sbquo; agents&sbquo; licensors&sbquo; suppliers&sbquo; successors and assigns from and against any claims&sbquo; liabilities&sbquo; damages&sbquo; judgments&sbquo; awards&sbquo; losses&sbquo; costs&sbquo; expenses or fees (including reasonable attorneys fees) arising out of or relating to your violation of these Terms of Use&sbquo; including&sbquo; but not limited to&sbquo; any use of the Websites content&sbquo; the Software and products other than as expressly authorized in these Terms of Use&sbquo; or your use of any information obtained from the Website or Software.</li>
                    <li>Arbitration. At the Licensors sole discretion, unless and to the extent prohibited by applicable law&sbquo; it may require you to submit any disputes arising from these Terms of Use or use of the Website&sbquo; including disputes arising from or concerning their interpretation&sbquo; violation&sbquo; invalidity&sbquo; non-performance&sbquo; or termination&sbquo; to final and binding arbitration under the Rules of Arbitration applicable in New Brunswick. </li>
                    <li>Limitation on Time to File Claims. ANY CAUSE OF ACTION OR CLAIM YOU MAY HAVE ARISING OUT OF OR RELATING TO THESE TERMS OF USE OR THE WEBSITE MUST BE COMMENCED WITHIN TWO (2) YEARS AFTER THE CAUSE OF ACTION ACCRUES OTHERWISE&sbquo; SUCH CAUSE OF ACTION OR CLAIM IS PERMANENTLY BARRED</li>
                    <li>Waiver and Severability. No waiver by the Licensor of any term or condition set forth in these Terms of Use shall be deemed a further or continuing waiver of such term or condition or a waiver of any other term or condition&sbquo; and any failure of the Licensor to assert a right or provision under these Terms of Use shall not constitute a waiver of such right or provision. 
                        If any provision of these Terms of Use is held by a court or other tribunal of competent jurisdiction to be invalid&sbquo; illegal or unenforceable for any reason&sbquo; such provision shall be eliminated or limited to the minimum extent such that the remaining provisions of the Terms of Use will continue in full force and effect. </li>
                    <li>Entire Agreement. These Terms of Use and our Privacy Policy constitute the sole and entire agreement between you and ASETS&ndash;CA Inc. with respect to the Website and Software and supersede all prior and contemporaneous understandings&sbquo; agreements&sbquo; representations and warranties&sbquo; both written and oral&sbquo; with respect to the Website and Software.</li>
                    <li>Your Comments and Concerns. The Website is operated by ASETS-CA Inc.&sbquo; 50 Crowther Lane&sbquo; Suite 140&sbquo; Fredericton&sbquo; NB E3C 0J1. 
                        All notices of copyright infringement claims&sbquo; and any other feedback&sbquo; comments&sbquo; requests for technical support and other communications relating to the Website should be directed to</li>
                    </ol>
                    <p>#43117712.4</p>
                </Callout>

                <Button intent="primary" large={true} style={{ marginTop: '20px' }} onClick={handleAccept}>Accept</Button>
                </div>
            </Card>
        </div>
    );
  }

  useEffect(() => {
    checkToken();
  }, []);

  useEffect(() => {
    if (!isProd) return;
    document.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener(
      "keydown",
      function(e) {
        if (e.ctrlKey && e.shiftKey && e.keyCode == 73) disabledEvent(e);
        // "I" key
        else if (e.ctrlKey && e.shiftKey && e.keyCode == 74) disabledEvent(e);
        // "J" key
        // else if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey))
        // disabledEvent(e);
        // "S" key + macOS
        else if (e.ctrlKey && e.keyCode == 85) disabledEvent(e);
        // "U" key
        else if (e.keyCode == 123) disabledEvent(e); // "F12" key
      },
      false
    );
  }, []);

  /*useEffect(() => {
    appLoaded && history.push("/modes");
    console.log("being pushed from the use effect")
  }, [appLoaded]);*/

  function disabledEvent(e: Event) {
    if (e.stopPropagation) {
      e.stopPropagation();
    } else if (window.event) {
      window.event.cancelBubble = true;
    }
    e.preventDefault();
    return false;
  }

  function getLoginPage() {
    return (
      <Login
        onUnload={() => {}}
        onSubmit={handleLogin}
        inProgress={inProgress}
        loginError={loginError}
        setLoginError={setLoginError}
      />
    );
  }

  function getBeamData() {
    getProfileSectionData(dispatch);
    getMaterials(dispatch);
  }

  function getPipingData() {
    getPipeProfiles(dispatch);
    getPipingCaps(dispatch);
    getPipingCollets(dispatch);
    getPipingReducers(dispatch);
    getPipingReturns(dispatch);
    getPipingElbows(dispatch);
    getPipingTees(dispatch);
    getFlanges(dispatch);
  }

  function handleLogin(email: string, password: string) {
    if (process.env.NODE_ENV !== "production") {
      dispatch(logInAction({ error: false }));
      checkAccess("admin@asetslux.com");
      getBeamData();
      getPipingData();
      getFontAction(dispatch);
    } else {
      dispatch(asyncStartAction());
      agent.Auth.login(email, password).then(
        (res: any) => {
          dispatch(logInAction(res));
          window.localStorage.setItem("jwt", res.access_token);
          const User_id = res.user_id;
          dispatch(setUserIdAction(User_id));
          checkToken();
          checkAccess(email);
          getBeamData();
          getPipingData();
          getFontAction(dispatch);     
        (error: any) => {
          console.error(error);
          dispatch(logInAction({ error: true, payload: error.message }));
          setLoginError("Login Failed. Please provide correct credentials"); 
        }
        if(loginError == ""){
          validateUser(res.user_id);
          checkTnCAcceptance(res.user_id);
        }
        
    });
    }
  }

  function validateUser(id: string) {
    const token = window.localStorage.getItem('jwt'); 
    if (token) {
      axios.get(`${API_ROOT}/rest/api/v1/validateUser`, {
        headers: { 'user-id': id }
      })
      .then(response => {
        //console.log("Updated");
      })
      .catch(error => {
        console.error("Error", error);
      });
    }
  }

  function checkTnCAcceptance(id: string) {
    return axios.get(`${API_ROOT}/rest/api/v1/datasheets/getTnCFlag`, {
      headers: { 'user-id': id }
    })
    .then(response => {
      if(response.data === false){
        console.log("response is false")
        history.push("/terms");
      }
    }) 
    .catch(error => {
      console.error("Error checking TnC acceptance", error);
      throw error; 
    });
    
  }
  /*const PrivateRoute: React.FC<{
    component: React.FC;
    path: string;
    exact?: boolean;
  }> = (props) => {
    return appLoaded ? (
      <Route
        path={props.path}
        exact={props.exact}
        component={props.component}
      />
    ) : (
      <Redirect to="/" />
    );
  };*/

  interface PrivateRouteProps {
    component: React.ComponentType<any>; 
    path: string;
    exact?: boolean;
  }
  
  const PrivateRoute: React.FC<PrivateRouteProps & any> = ({ component: Component, ...rest }) => {
    const appLoaded = useSelector((state: ApplicationState) => state.auth.appLoaded);
    return (
      <Route
        {...rest}
        render={(props) =>
          appLoaded ? (
            <Component {...props} {...rest} />
          ) : (
            <Redirect to="/" />
          )
        }
      />
    );
  };
  

  const PublicRoute: React.FC<{
    component: React.FC;
    path: string;
    exact?: boolean;
  }> = (props) => {
    if (appLoaded && props.path === "/") {
      return <Redirect to="/modes" />;   
    }
    return (
      <Route
        path={props.path}
        exact={props.exact}
        component={props.component}
      />
    );
  };

  return API_ROOT !== APIS.VIEWER ? (
    <TourProvider 
    steps={[]}
    disableInteraction
    onClickMask={(event) =>{}}
    nextButton={(event) =>{}}
    showDots={false}
    onClickHighlighted={(e, clickProps) => {
      e.preventDefault();
      e.stopPropagation();
      checkAndPerformCustomActions(clickProps.meta, clickProps.currentStep);
      clickProps.setCurrentStep(
        Math.min(clickProps.currentStep + 1, clickProps.steps?.length ?? - 1)
      )
      console.log(clickProps.meta)

    }}
    >
    <ConnectedRouter history={history}>
      <Chatbot />
      <Switch>
        <PublicRoute exact={true} path="/" component={getLoginPage} />
        <PublicRoute path="/viewer" component={Viewer} />
        {/*<Route path="/register" component={getRegisterPage} />*/}
        <PrivateRoute path="/terms" component={TermsAndConditions} />
        <PrivateRoute path="/modes" component={ModeSwitcher} />
        <PrivateRoute path="/editor" component={Editor} />
        <PrivateRoute path="/learnings" component={Learnings} />
        <PrivateRoute path="/dashboard" component={Dashboard} />
        {/* <PrivateRoute path="/about" component={About} /> */}
        
      </Switch>
    </ConnectedRouter>
    </TourProvider>
  ) : (
    <ConnectedRouter history={history}>
      <Switch>
        <PublicRoute exact={true} path="/" component={Viewer} />
      </Switch>
    </ConnectedRouter>
  );
};

export default App;
