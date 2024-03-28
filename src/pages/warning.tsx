import { useEffect } from "react";
import axios from "axios";
import { API_ROOT } from "./utils/agent";
import { useSelector } from "react-redux";
import { ApplicationState } from "../store";


export const useBeforeUnloadWarning = (message: string) =>{
    const auth = useSelector((state: ApplicationState) => state.auth);
    useEffect(()=>{
        const handler = (event:BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = message;
            return message;
            
        };
        window.addEventListener('beforeunload', handler);
        return () => {
            window.removeEventListener('beforeunload', handler);
        };
    }, [message]);
    
}