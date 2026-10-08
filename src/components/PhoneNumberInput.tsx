import { useEffect, useState } from "react";
import { CountryCodeSelect } from "@/components/CountryCodeSelect";
import { countryCodes } from "@/constants/countryCodes";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PhoneNumberInputProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string | number;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const getCountryCode = (value: string) =>
  countryCodes
    .filter((country) => value.startsWith(country.code))
    .sort((first, second) => second.code.length - first.code.length)[0]?.code ?? "+225";

const getLocalNumber = (value: string, countryCode: string) =>
  value.startsWith(countryCode) ? value.slice(countryCode.length).trimStart() : value;

export const PhoneNumberInput = ({
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  onBlur,
  placeholder = "XX XX XX XX XX",
  required,
  disabled,
  className,
}: PhoneNumberInputProps) => {
  const initialValue = value ?? String(defaultValue ?? "");
  const [countryCode, setCountryCode] = useState(() => getCountryCode(initialValue));
  const [internalValue, setInternalValue] = useState(String(defaultValue ?? ""));
  const currentValue = value ?? internalValue;

  useEffect(() => {
    if (value) setCountryCode(getCountryCode(value));
  }, [value]);

  const updateValue = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  const localNumber = getLocalNumber(currentValue, countryCode);

  return (
    <div className={cn("flex min-w-0 gap-2", className)}>
      <CountryCodeSelect
        value={countryCode}
        onValueChange={(nextCountryCode) => {
          const nextLocalNumber = localNumber;
          setCountryCode(nextCountryCode);
          updateValue(nextLocalNumber ? `${nextCountryCode} ${nextLocalNumber}` : "");
        }}
      />
      <Input
        id={id}
        type="tel"
        value={localNumber}
        onChange={(event) => {
          const nextLocalNumber = event.target.value;
          updateValue(nextLocalNumber ? `${countryCode} ${nextLocalNumber}` : "");
        }}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="h-12 min-w-0 flex-1"
        autoComplete="tel-national"
      />
      {name && <input type="hidden" name={name} value={currentValue} />}
    </div>
  );
};
