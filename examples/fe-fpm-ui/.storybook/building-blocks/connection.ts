import { join } from 'path';
import {
    getTableBuildingBlockPrompts,
    getChartBuildingBlockPrompts,
    getFilterBarBuildingBlockPrompts,
    getBuildingBlockChoices
} from '@sap-ux/fe-fpm-writer';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { create as createStorage } from 'mem-fs';
import type { Editor } from 'mem-fs-editor';
import { create } from 'mem-fs-editor';
import WebSocket from 'ws';
import type { Data } from 'ws';
import {
    GET_QUESTIONS,
    SET_TABLE_QUESTIONS,
    SET_CHART_QUESTIONS,
    SET_FILTERBAR_QUESTIONS,
    SupportedBuildingBlocks,
    GET_CHOICES,
    SET_CHOICES,
    APPLY_ANSWERS,
    RESET_ANSWERS,
    GET_PROJECT_PATH,
    SET_PROJECT_PATH,
    SetProjectPath,
    UPDATE_PROJECT_PATH,
    UPDATE_PROJECT_PATH_RESULT
} from '../../stories/utils/types';
import type { Actions, ResetAnswers, SetChoices, UpdateProjectPathResult } from '../../stories/utils/types';
import { fpmWriterApi } from './writerApi';

const sampleAppPath = join(__dirname, '../../../fe-fpm-cli/sample/fe-app');
const testAppPath = join(__dirname, '../../../fe-fpm-cli/test-output/fe-app', `${Date.now()}`);
let currentAppPath = testAppPath;

let fsEditor: Editor | undefined;
let connections: WebSocket[] = [];

/**
 * Initializes the memfs and copies over the sample Fiori elements application.
 *
 * @returns {Promise<Editor>} the memfs editor object
 */
async function getEditor(forceUpdate = false): Promise<Editor> {
    if (fsEditor && !forceUpdate) {
        return fsEditor;
    }
    fsEditor = create(createStorage());

    if (testAppPath === currentAppPath) {
        fsEditor.copy([join(sampleAppPath)], join(testAppPath));
    }

    await promisify(fsEditor.commit).call(fsEditor);
    return fsEditor;
}

export async function createWebSocketConnection(): Promise<void> {
    const wss = new WebSocket.Server({ port: 8080 });

    // Listen for WebSocket connections
    wss.on('connection', async (ws: WebSocket) => {
        // Store active connection
        connections.push(ws);
        //Handle initialization
        console.log('WebSocket connection created');
        // Handle messages received from the preview
        ws.on('message', async (message: Data) => {
            console.log(`Received message from the storybook preview: ${message}`);
            try {
                const action: Actions = JSON.parse(message.toString());
                await handleAction(action);
            } catch (error) {
                // do nothing
            }
        });
    });
}

export function sendMessage(action: Actions): void {
    if (!connections.length) {
        return;
    }
    for (const connection of connections) {
        connection.send(JSON.stringify(action));
    }
}

async function handleAction(action: Actions): Promise<void> {
    let fs = await getEditor();
    switch (action.type) {
        case GET_QUESTIONS: {
            let responseAction: Actions | undefined;
            if (action.value === SupportedBuildingBlocks.Table) {
                const prompts = await getTableBuildingBlockPrompts(currentAppPath, fs);
                // Post processing
                responseAction = { type: SET_TABLE_QUESTIONS, questions: prompts };
            } else if (action.value === SupportedBuildingBlocks.Chart) {
                const prompts = await getChartBuildingBlockPrompts(currentAppPath, fs);
                // Post processing
                responseAction = { type: SET_CHART_QUESTIONS, questions: prompts };
            } else if (action.value === SupportedBuildingBlocks.FilterBar) {
                const prompts = await getFilterBarBuildingBlockPrompts(currentAppPath, fs);
                // Post processing
                responseAction = { type: SET_FILTERBAR_QUESTIONS, questions: prompts };
            }
            if (responseAction) {
                sendMessage(responseAction);
            }
            break;
        }
        case GET_CHOICES: {
            const { name, buildingBlockType, answers } = action;
            const choices = await getBuildingBlockChoices(buildingBlockType as any, name, answers, currentAppPath);

            const responseAction: SetChoices = {
                type: SET_CHOICES,
                name,
                choices
            };
            sendMessage(responseAction);
            break;
        }
        case APPLY_ANSWERS: {
            const { answers, buildingBlockType /* projectRoot */ } = action;
            const _fs = fpmWriterApi(buildingBlockType as any, answers as any, currentAppPath, fs);
            console.log(currentAppPath);
            await promisify(_fs.commit).call(_fs);
            const responseAction: ResetAnswers = {
                type: RESET_ANSWERS,
                buildingBlockType
            };
            sendMessage(responseAction);
            break;
        }
        case GET_PROJECT_PATH: {
            const responseAction: SetProjectPath = {
                type: SET_PROJECT_PATH,
                path: currentAppPath
            };
            sendMessage(responseAction);
            break;
        }
        case UPDATE_PROJECT_PATH: {
            let newProjectPath = action.path ? join(action.path) : testAppPath;
            let message: string | undefined;
            try {
                if (action.path && !existsSync(newProjectPath)) {
                    message = 'Provided path does not exist';
                }
                // Reset fs
                if (!message) {
                    currentAppPath = newProjectPath;
                }
                fs = await getEditor(true);
                // Call API to get table questions - it should validate of path is supported
                const questions = await getTableBuildingBlockPrompts(currentAppPath, fs);
                const entityQuestion = questions.find((question) => question.name === 'entity');
                if (entityQuestion && 'choices' in entityQuestion && typeof entityQuestion.choices === 'function') {
                    await entityQuestion.choices();
                }
            } catch (e) {
                message = `Error: ${e.message || e}`;
                console.log(e);
            }
            const responseAction: UpdateProjectPathResult = {
                type: UPDATE_PROJECT_PATH_RESULT,
                saved: !message,
                message,
                path: !message ? currentAppPath : undefined
            };
            sendMessage(responseAction);
            break;
        }
    }
}
