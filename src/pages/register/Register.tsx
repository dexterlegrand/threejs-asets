import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { Button, FormGroup, InputGroup } from "@blueprintjs/core";

type Props = {
  errors: any;
  inProgress?: boolean;
  onUnload: () => any;
  onSubmit: (username: string, email: string, password: string) => any;
};

export function Register({ errors, inProgress, onSubmit, onUnload }: Props) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    return () => onUnload();
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(username, email, password);
  }

  return (
    <div className="auth-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Sign Up</h1>
            <p className="text-xs-center">
              <Link to="/login">Have an account?</Link>
            </p>
            <form onSubmit={handleSubmit}>
              <FormGroup label={"Username"}>
                <InputGroup
                  fill
                  value={username}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setUsername(event.target.value)
                  }
                />
              </FormGroup>

              <FormGroup label={"Email"}>
                <InputGroup
                  fill
                  type="email"
                  value={email}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(event.target.value)
                  }
                />
              </FormGroup>

              <FormGroup label={"Password"}>
                <InputGroup
                  type="password"
                  value={password}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(event.target.value)
                  }
                />
              </FormGroup>

              <Button type="submit" intent={"primary"} loading={inProgress}>
                Sign up
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
