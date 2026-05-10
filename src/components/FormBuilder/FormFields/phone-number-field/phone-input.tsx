import * as React from "react";

import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { useLocale } from "next-intl";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "value" | "ref"
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
    onChange?: (value: RPNInput.Value) => void;
  };

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> =
  React.forwardRef<React.ElementRef<typeof RPNInput.default>, PhoneInputProps>(
    ({ className, onChange, value, ...props }, ref) => {
      const handleCountryChange = (country: RPNInput.Country) => {
        if (country && value) {
          const callingCode = `+${RPNInput.getCountryCallingCode(country)}`;
          if (!value.startsWith(callingCode)) {
            onChange?.(`${callingCode}` as RPNInput.Value);
          }
        }
      };

      return (
        <RPNInput.default
          ref={ref}
          className={cn("flex", className)}
          flagComponent={FlagComponent}
          countrySelectComponent={(countrySelectProps) => (
            <CountrySelect
              {...countrySelectProps}
              onChange={(country) => {
                countrySelectProps.onChange(country);
                handleCountryChange(country);
              }}
            />
          )}
          inputComponent={InputComponent}
          smartCaret={false}
          onChange={(value) => onChange?.(value || ("" as RPNInput.Value))}
          value={value}
          international
          countrySelectProps={{ unicodeFlags: true }}
          {...props}
        />
      );
    }
  );
PhoneInput.displayName = "PhoneInput";

const InputComponent = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
  const locale = useLocale();

  return (
    <input
      dir={"ltr"}
      className={cn(
        "w-full bg-transparent outline-none focus:outline-none",
        locale === "ar" ? "placeholder:text-right" : "placeholder:text-left",
        className
      )}
      {...props}
      ref={ref}
    />
  );
});
InputComponent.displayName = "InputComponent";

type CountryEntry = { label: string; value: RPNInput.Country | undefined };

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  options: CountryEntry[];
  onChange: (country: RPNInput.Country) => void;
};

const CountrySelect = ({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange,
}: CountrySelectProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [country, setCountry] = React.useState("SA");

  const handleCountrySelect = (country: RPNInput.Country) => {
    onChange(country);
    setCountry(country);
  };

  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="link"
          className="flex gap-1 px-3 focus:z-10"
          disabled={disabled}
        >
          <FlagComponent
            country={selectedCountry}
            countryName={selectedCountry}
          />
          <ChevronsUpDown
            className={cn(
              "mr-2 size-4 opacity-50",
              disabled ? "hidden" : "opacity-100"
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <ScrollArea className="h-72">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countryList.map(({ value, label }) =>
                  value ? (
                    <CountrySelectOption
                      key={value}
                      country={value}
                      countryName={label}
                      selectedCountry={selectedCountry}
                      onChange={handleCountrySelect}
                    />
                  ) : null
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface CountrySelectOptionProps extends RPNInput.FlagProps {
  selectedCountry: RPNInput.Country;
  onChange: (country: RPNInput.Country) => void;
}

const CountrySelectOption = ({
  country,
  countryName,
  selectedCountry,
  onChange,
}: CountrySelectOptionProps) => {
  return (
    <CommandItem className="gap-2" onSelect={() => onChange(country)}>
      <FlagComponent country={country} countryName={countryName} />
      <span className="flex-1 text-sm">{countryName}</span>
      <span className="text-foreground/50 text-sm">{`+${RPNInput.getCountryCallingCode(country)}`}</span>
      <CheckIcon
        className={`ml-auto size-4 ${country === selectedCountry ? "opacity-100" : "opacity-0"}`}
      />
    </CommandItem>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="bg-foreground/20 flex h-5 w-8 overflow-hidden rounded-[8px] [&_svg]:size-full!">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};

export { PhoneInput };
