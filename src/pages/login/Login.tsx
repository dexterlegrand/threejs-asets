import React, { useEffect, useState } from "react"; 
import { Button, FormGroup, InputGroup, Icon } from "@blueprintjs/core"; 
import { IconNames } from "@blueprintjs/icons"; 
import { Logo } from "../../components/logo/Logo"; 
import "./Login.css"; 

type Props = { 
    inProgress?: boolean; 
    onUnload: () => any; 
    onSubmit: (email: string, password: string) => any; 
    loginError: string; 
    setLoginError: (error: string) => void; 
}; 
export function Login({ onUnload, onSubmit, inProgress, loginError, setLoginError }: Props) { 
const [email, setEmail] = useState<string>(""); 
const [password, setPassword] = useState<string>(""); 
const [showPassword, setShowPassword] = useState(false); 

useEffect(() => { 
    return () => onUnload(); 
}, []); 

function handleSubmit(event: React.FormEvent<HTMLFormElement>) { 
    event.preventDefault(); 
    onSubmit(email, password); 
} 

const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => { 
    if (loginError) { 
        setLoginError(''); 
    } 
    setter(event.target.value); 
}; 

const togglePasswordVisibility = () => { 
    setShowPassword(!showPassword); 
}; 

return ( 
    <div className="auth-page"> 
        <div className="container"> 
            <div className="card card-container"> 
                <div className={"t-center"}> 
                    <Logo /> 
                </div> 
                <h1 className="t-center login-header">Login</h1> 
                <form onSubmit={handleSubmit}> 
                    <FormGroup> 
                        <InputGroup 
                            large 
                            type="email" 
                            placeholder={"Email"} 
                            value={email} 
                            autoFocus={true} 
                            onChange={(e) => handleInputChange(e, setEmail)} 
                        /> 
                    </FormGroup> 
                    <FormGroup style={{ position: 'relative' }}> 
                        <InputGroup 
                            large 
                            type={showPassword ? "text" : "password"} 
                            placeholder={"Password"} 
                            value={password} 
                            onChange={(e) => handleInputChange(e, setPassword)} 
                        /> 
                        <span  
                            style={{ position: 'absolute', top: '50%', right: '10px', cursor: 'pointer', transform: 'translateY(-50%)' }} 
                            onClick={togglePasswordVisibility} 
                        > 
                        <Icon icon={showPassword ? IconNames.EYE_OFF : IconNames.EYE_OPEN} /> 
                        </span> 
                    </FormGroup> 
                    {loginError && <div className="error-message">{loginError}</div>} 
                    <FormGroup className={"t-center"}> 
                        <Button 
                            large 
                            type="submit" 
                            intent={"primary"} 
                            loading={inProgress} 
                            > 
                            Login 
                        </Button> 
                    </FormGroup> 
                </form> 
            </div> 
        </div> 
    </div> 
    ); 
} 

 