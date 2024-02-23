import { UIDefaultButton, initIcons } from '@sap-ux/ui-components';
import React, { useEffect, useState } from 'react';
import { SupportedBuildingBlocks } from './utils';
import { applyAnswers, getChoices, getCodeSnippet, getQuestions, getWebSocket } from './utils/communication';
import { IQuestion, Questions } from '../src/components';
import { useChoices, useQuestions } from './utils/hooks';
import { Answers } from 'inquirer';

export default { title: 'Building Blocks' };

initIcons();
getWebSocket();

function _updateAnswers(
    answers: Answers,
    name: string,
    answer: string | number | boolean | undefined,
    dependantPromptNames: string[] = []
) {
    let newAnswers = {
        ...answers,
        [name]: answer
    };
    dependantPromptNames.forEach((name) => {
        // Reset the values of dependant prompts
        newAnswers = _updateAnswers(newAnswers, name, '');
    });
    return newAnswers;
}

const BuildingBlockQuestions = (props: { type: SupportedBuildingBlocks; visibleQuestions?: string[] }): JSX.Element => {
    const { type, visibleQuestions } = props;
    const [answers, setAnswers] = useState<Answers>({});
    const choices = useChoices();
    const questions = useQuestions(type, visibleQuestions);
    console.log(Object.keys(choices));

    function updateAnswers(
        name: string,
        answer: string | number | boolean | undefined,
        dependantPromptNames: string[] = []
    ) {
        const newAnswers = _updateAnswers(answers, name, answer, dependantPromptNames);
        dependantPromptNames.forEach((name) => {
            // refresh the choices in dependant prompts
            getChoices(name, type, newAnswers);
        });
        setAnswers(newAnswers);
    }

    function handleApply() {
        // Call API to apply changes
        console.log('Applying changes... FPM Writer');
        applyAnswers(type, answers).then(({ buildingBlockType }) => {});
    }

    useEffect(() => {
        getCodeSnippet(type, answers);
    }, [answers]);

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'stretch',
                flexDirection: 'column',
                gap: '20px',
                padding: '20px 10px',
                minWidth: '500px'
            }}>
            <Questions
                questions={questions}
                onChoiceRequest={(name: string) => {
                    getChoices(name, type, answers);
                }}
                onChange={updateAnswers}
                answers={answers || {}}
                choices={choices}
            />
            {/* Disable the button if there is no answers for the 'required' question */}
            <div className="cta">
                <UIDefaultButton primary={true} onClick={handleApply}>
                    Apply
                </UIDefaultButton>
            </div>
        </div>
    );
};

export const table = (): JSX.Element => {
    return <BuildingBlockQuestions type={SupportedBuildingBlocks.Table} />;
};

export const chart = (): JSX.Element => {
    return <BuildingBlockQuestions type={SupportedBuildingBlocks.Chart} />;
};

export const filterBar = (): JSX.Element => {
    return <BuildingBlockQuestions type={SupportedBuildingBlocks.FilterBar} />;
};

export const customChart = (): JSX.Element => {
    return (
        <BuildingBlockQuestions
            type={SupportedBuildingBlocks.Chart}
            visibleQuestions={[
                'id',
                'entity',
                'qualifier',
                'filterBar',
                'selectionMode',
                'selectionChange',
                'bindingContextType'
            ]}
        />
    );
};
