import type { UIComboBoxOption } from '@sap-ux/ui-components';
import { UIComboBox, UIComboBoxLoaderType } from '@sap-ux/ui-components';
import type { CheckboxQuestion } from 'inquirer';
import React from 'react';
import { useValue, getLabelRenderer } from '../../../utilities';

export interface MultiSelectProps extends CheckboxQuestion {
    value?: string | number | boolean;
    selectType: 'static' | 'dynamic';
    onChange: (name: string, value: string | number | undefined, dependantPromptNames?: string[]) => void;
    dependantPromptNames?: string[];
    required?: boolean;
    type: 'checkbox';
    options: UIComboBoxOption[];
    pending?: boolean;
    additionalInfo?: string;
    errorMessage?: string;
}

export const MultiSelect = (props: MultiSelectProps) => {
    const {
        name = '',
        message,
        onChange,
        dependantPromptNames,
        required,
        options,
        pending,
        additionalInfo,
        errorMessage
    } = props;
    const [value, setValue] = useValue('', props.value?.toString());

    return (
        <UIComboBox
            label={typeof message === 'string' ? message : name}
            options={options}
            highlight={true}
            allowFreeform={true}
            useComboBoxAsMenuMinWidth={true}
            autoComplete="on"
            required={required}
            isLoading={pending ? [UIComboBoxLoaderType.Input, UIComboBoxLoaderType.List] : undefined}
            selectedKey={value?.split(',').map((v) => v.trim())}
            multiSelect
            disabled={false}
            onChange={(_, changedOption) => {
                let updatedValue: string | undefined = '';
                if (changedOption?.selected) {
                    updatedValue = [...(value.split(',').filter((option) => option) ?? []), changedOption.key].join();
                } else {
                    updatedValue = (value.split(',') ?? [])
                        .filter((option) => option && option !== changedOption?.key)
                        .join();
                }
                setValue(updatedValue);
                onChange(name, updatedValue, dependantPromptNames);
            }}
            onRenderLabel={getLabelRenderer(additionalInfo)}
            errorMessage={errorMessage}
        />
    );
};