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
    getViewOrFragmentPathPrompt,
    isCapProject
} from '../utils';
import type { ProjectProvider } from '../utils';
import type { Prompts, FilterBarPromptsAnswer } from '../types';
import { BuildingBlockType } from '../../types';

/**
 * Returns a list of prompts required to generate a filterbar building block.
 *
 * @param fs the memfs editor instance
 * @param basePath Path to project
 * @param projectProvider Project provider
 * @returns Prompt with questions for filterbar.
 */
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
            getViewOrFragmentPathPrompt(
                fs,
                basePath,
                t('viewOrFragmentPath.message'),
                t('viewOrFragmentPath.validate'),
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
            getEntityPrompt(t('entity'), projectProvider, ['buildingBlockData.metaPath.qualifier'], { required: true }),
            getAnnotationPathQualifierPrompt(t('qualifier'), projectProvider, [UIAnnotationTerms.SelectionFields], {
                additionalInfo: t('valuesDependentOnEntityTypeInfo'),
                required: true,
                placeholder: t('qualifierPlaceholder')
            }),
            {
                type: 'input',
                name: 'buildingBlockData.filterChanged',
                message: t('filterChanged')
            },
            {
                type: 'input',
                name: 'buildingBlockData.search',
                message: t('search')
            }
        ],
        initialAnswers: {
            buildingBlockData: {
                buildingBlockType: BuildingBlockType.FilterBar
            }
        }
    };
}
