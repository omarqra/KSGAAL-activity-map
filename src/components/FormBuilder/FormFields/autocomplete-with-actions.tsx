import React, { useCallback, useEffect, useState } from "react";

import { useWatch } from "react-hook-form";

import { useDebounce } from "../utils/use-debounce";
import AutocompleteField, {
  AutocompleteFieldProps,
  AutocompleteOption,
} from "./autocomplete-field";

/**
 * @description This is a server side autocomplete field that takes a server action and a function to get the options from the result of the server action.
 */

export type AutocompleteFieldWithActionsProps = Omit<
  AutocompleteFieldProps,
  "options"
> & {
  multiple?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CreateUpdateComponent?: React.ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ViewComponent?: React.ComponentType<any>;
  propName: string;
  /**
   * The server action to fetch data and get the result.
   * @param value - The value to search for.
   * @returns The result of the server action.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serverAction: (value: string) => Promise<any>;
  /**
   * The function to get the options from the result of the server action.
   * @param result - The result of the server action.
   * @returns The options as an array of objects with label and value properties.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOptions: (result: any) => AutocompleteOption[];
  refetchOnOpen?: boolean;
};

const AutocompleteFieldWithActions = (
  props: AutocompleteFieldWithActionsProps
) => {
  const {
    CreateUpdateComponent,
    ViewComponent,
    propName,
    serverAction,
    getOptions,
    onChange,
    containerClassName,
    refetchOnOpen = true,
    ...rest
  } = props;
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const debouncedValue = useDebounce(searchValue, 500);
  const [loading, setLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<AutocompleteOption[]>(
    []
  );
  const [error, setError] = useState(false);
  const [openTrigger, setOpenTrigger] = useState(0);

  const serverSearch = useCallback(
    async (value: string) => {
      try {
        setLoading(true);
        const response = await serverAction(value);
        setError(false);
        return getOptions(response);
      } catch (error) {
        console.error(error);
        setError(true);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [serverAction, getOptions]
  );

  const currentFieldValue = useWatch({
    control: rest.control,
    name: rest.name,
    disabled: !rest.control,
  });

  // Add this useEffect to sync selectedOptions with the field's current value
  useEffect(() => {
    if (currentFieldValue && currentFieldValue.value !== undefined) {
      // Find the matching option in the options array
      const matchingOption = options.find(
        (option) => option.value === currentFieldValue.value
      );
      if (matchingOption) {
        setSelectedOptions([matchingOption]);
      }
    } else {
      setSelectedOptions([]);
    }
  }, [currentFieldValue, options]);

  useEffect(() => {
    serverSearch(debouncedValue).then((options) => {
      if (selectedOptions.length > 0) {
        const selectedOptionsValues = selectedOptions.map(
          (option) => option.value
        );
        const optionsExcludingSelected = options.filter(
          (option) => !selectedOptionsValues.includes(option.value)
        );
        setOptions([...selectedOptions, ...optionsExcludingSelected]);
      } else {
        setOptions(options);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue, openTrigger]);

  const handleOneTimeFetch = useCallback(() => {
    if (refetchOnOpen) {
      setOpenTrigger((prev) => prev + 1);
    }
  }, [refetchOnOpen]);

  return (
    <div className={`flex items-end gap-2 ${containerClassName}`}>
      <AutocompleteField
        {...rest}
        containerClassName="flex-1"
        serverSearch={(e) => setSearchValue(e)}
        onChange={(e) => {
          if (!e || (!Array.isArray(e) && e.value === undefined)) {
            setSelectedOptions([]);
          } else {
            setSelectedOptions(
              options.filter((option) => {
                if (Array.isArray(e)) {
                  return e.some(
                    (selected_option) => selected_option.value === option.value
                  );
                } else {
                  return e.value === option.value;
                }
              })
            );
          }
          onChange?.(e);
        }}
        loading={loading}
        getOptionsError={error}
        options={options}
        multiple={false}
        onOpen={handleOneTimeFetch}
      />
      {((selectedOptions.length > 0 && ViewComponent) ||
        CreateUpdateComponent) && (
        <div className="bg-accent mb-1 flex items-center gap-2 rounded-3xl p-2">
          {selectedOptions.length ? (
            <>
              {ViewComponent && (
                <ViewComponent
                  {...{
                    [propName]: selectedOptions.length
                      ? selectedOptions[0].value
                      : null,
                  }}
                />
              )}
            </>
          ) : null}
          {CreateUpdateComponent && (
            <CreateUpdateComponent
              {...{
                [propName]:
                  selectedOptions.length > 0 ? selectedOptions[0].value : null,
                icon: true,
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AutocompleteFieldWithActions;
