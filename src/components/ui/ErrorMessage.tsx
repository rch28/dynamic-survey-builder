import React from "react";
import { Alert, AlertDescription } from "./alert";

const AlertError = ({ error }: { error: string | undefined }) => {
  return (
    error && (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  );
};

export default AlertError;
