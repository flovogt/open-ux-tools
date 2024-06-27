import { UIAnnotationTerms } from '@sap-ux/vocabularies-types/vocabularies/UI';
import type { Answers } from 'inquirer';
import type { Editor } from 'mem-fs-editor';
import { i18nNamespaces, translate } from '../../../i18n';
import {
    getAggregationPathPrompt,
    getAnnotationPathQualifierPrompt,
    getBuildingBlockIdPrompt,
    getCAPServicePrompt,
    getEntityPrompt,
    getViewOrFragmentFilePrompt,
    isCapProject
} from '../utils';
import type { ProjectProvider } from '../utils';
import type { Prompts, FilterBarPromptsAnswer } from '../types';

export async function getFilterBarBuildingBlockPrompts(
    fs: Editor,
    basePath: string,
    projectProvider: ProjectProvider
): Promise<Prompts<FilterBarPromptsAnswer>> {
    const t = translate(i18nNamespaces.buildingBlock, 'prompts.filterBar.');

    const defaultAnswers: Answers = {
        id: 'FilterBar'
    };
    return {
        questions: [
            getViewOrFragmentFilePrompt(
                fs,
                basePath,
                t('viewOrFragmentFile.message'),
                t('viewOrFragmentFile.validate'),
                ['aggregationPath'],
                { required: true }
            ),
            getBuildingBlockIdPrompt(fs, t('id.message'), t('id.validation'), basePath, defaultAnswers.id, {
                required: true
            }),
            ...((await isCapProject(projectProvider))
                ? [await getCAPServicePrompt(t('service'), projectProvider, [], { required: true })]
                : []),
            getAggregationPathPrompt(t('aggregation'), fs, basePath, { required: true }),
            getEntityPrompt(t('entity'), projectProvider, ['qualifier'], { required: true }),
            getAnnotationPathQualifierPrompt(
                'qualifier',
                t('qualifier'),
                projectProvider,
                [UIAnnotationTerms.SelectionFields],
                {
                    additionalInfo: t('valuesDependentOnEntityTypeInfo'),
                    required: true,
                    placeholder: t('qualifierPlaceholder')
                }
            ),
            {
                type: 'input',
                name: 'filterChanged',
                message: t('filterChanged')
            },
            {
                type: 'input',
                name: 'search',
                message: t('search')
            }
        ]
    };
}