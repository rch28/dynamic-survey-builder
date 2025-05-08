import { Control, FieldValues, Path, Controller } from "react-hook-form";
import { Input } from "../ui/input";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type TextFieldProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
};

const TextField = <T extends FieldValues>({
  name,
  control,
  placeholder,
  type,
  disabled,
  className,
  autoComplete = "off",
}: TextFieldProps<T>) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { onChange, value, onBlur },
        fieldState: { error },
      }) => (
        <>
          <div className="relative">
            <Input
              id={name}
              type={
                type === "password"
                  ? !showPassword
                    ? "password"
                    : "text"
                  : type
              }
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              disabled={disabled}
              autoComplete={autoComplete}
              className={`mt-1 ${className} ${
                error ? "border-red-500" : "border-gray-300"
              }`}
              aria-invalid={error ? "true" : "false"}
              aria-errormessage={error ? `${name}-error` : undefined}
              aria-describedby={error ? `${name}-error` : undefined}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error.message}</p>
            )}
            {type === "password" && (
              <button
                type="button"
                className="absolute right-3 top-3 transform "
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 cursor-pointer" />
                ) : (
                  <Eye className="w-4 h-4 cursor-pointer" />
                )}
              </button>
            )}
          </div>
        </>
      )}
    />
  );
};

export default TextField;
