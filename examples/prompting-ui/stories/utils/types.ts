import type { FilterBarPromptsAnswer, ChartPromptsAnswer, TablePromptsAnswer } from '@sap-ux/fe-fpm-writer';
import type { Question, Answers } from 'inquirer';
import { AddonActions } from '../../.storybook/addons/types';
import type { DynamicChoices } from '../../src/components';

export type Actions =
    | GetQuestions
    | SetTableQuestions
    | SetChartQuestions
    | SetFilterBarQuestions
    | GetChoices
    | SetChoices
    | ApplyAnswers
    | ResetAnswers
    | AddonActions
    | GetCodeSnippet
    | UpdateCodeSnippet;

export const GET_QUESTIONS = 'GET_QUESTIONS';
export const SET_TABLE_QUESTIONS = 'SET_TABLE_QUESTIONS';
export const SET_CHART_QUESTIONS = 'SET_CHART_QUESTIONS';
export const SET_FILTERBAR_QUESTIONS = 'SET_FILTERBAR_QUESTIONS';
export const GET_CHOICES = 'GET_CHOICES';
export const SET_CHOICES = 'SET_CHOICES';
export const APPLY_ANSWERS = 'APPLY_ANSWERS';
export const RESET_ANSWERS = 'RESET_ANSWERS';
export const SET_VALIDATION_RESULTS = 'SET_VALIDATION_RESULTS';

/**
 * Building block type.
 *
 * @enum {string}
 */
export enum SupportedBuildingBlocks {
    FilterBar = 'filter-bar',
    Chart = 'chart',
    Table = 'table'
}

export interface ApplyAnswers {
    type: typeof APPLY_ANSWERS;
    answers: unknown;
    buildingBlockType: SupportedBuildingBlocks;
}

export interface ResetAnswers {
    type: typeof RESET_ANSWERS;
    buildingBlockType: SupportedBuildingBlocks;
}

export interface GetChoices {
    type: typeof GET_CHOICES;
    names: string[];
    answers: any;
    buildingBlockType: SupportedBuildingBlocks;
}

export interface SetChoices {
    type: typeof SET_CHOICES;
    choices: DynamicChoices;
}
export interface GetQuestions {
    type: typeof GET_QUESTIONS;
    value: SupportedBuildingBlocks;
}

interface SetQuestions<T extends Answers> {
    questions: Question<T>[];
}

export type SupportedAnswers = TablePromptsAnswer | ChartPromptsAnswer | FilterBarPromptsAnswer;

export interface SetTableQuestions extends SetQuestions<TablePromptsAnswer> {
    type: typeof SET_TABLE_QUESTIONS;
}

export interface SetChartQuestions extends SetQuestions<ChartPromptsAnswer> {
    type: typeof SET_CHART_QUESTIONS;
}

export interface SetFilterBarQuestions extends SetQuestions<FilterBarPromptsAnswer> {
    type: typeof SET_FILTERBAR_QUESTIONS;
}

export interface SetValidationResults {
    type: typeof SET_VALIDATION_RESULTS;
    validationResults: { [questionName: string]: { isValid: boolean; errorMessage?: string } };
}

// Move to addon?
export const GET_CODE_SNIPPET = 'GET_CODE_SNIPPET';
export const UPDATE_CODE_SNIPPET = 'UPDATE_CODE_SNIPPET';
export interface GetCodeSnippet {
    type: typeof GET_CODE_SNIPPET;
    buildingBlockType: SupportedBuildingBlocks;
    answers: unknown;
}

export interface UpdateCodeSnippetPayload {
    buildingBlockType: SupportedBuildingBlocks;
    codeSnippet: string;
    answers: unknown;
}
export interface UpdateCodeSnippet extends UpdateCodeSnippetPayload {
    type: typeof UPDATE_CODE_SNIPPET;
}