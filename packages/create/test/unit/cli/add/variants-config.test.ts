import { Command } from 'commander';
import type { Editor } from 'mem-fs-editor';
import type { ToolsLogger } from '@sap-ux/logger';
import { addAddVariantsConfigCommand } from '../../../../src/cli/add/variants-config';
import * as appConfigWriter from '@sap-ux/app-config-writer';
import * as logger from '../../../../src/tracing/logger';
import * as childProcess from 'child_process';
import { join } from 'path';

jest.mock('child_process');
jest.mock('prompts');

describe('Test command add variants-config', () => {
    const appRoot = join(__dirname, '../../../fixtures/bare-minimum');
    let loggerMock: ToolsLogger;
    let fsMock: Editor;
    let logLevelSpy: jest.SpyInstance;
    let spawnSpy: jest.SpyInstance;

    const getArgv = (arg: string[]) => ['', '', ...arg];

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock setup
        loggerMock = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        } as Partial<ToolsLogger> as ToolsLogger;
        jest.spyOn(logger, 'getLogger').mockImplementation(() => loggerMock);
        logLevelSpy = jest.spyOn(logger, 'setLogLevelVerbose').mockImplementation(() => undefined);
        fsMock = {
            dump: jest.fn(),
            exists: jest.fn(),
            commit: jest.fn().mockImplementation((callback) => callback())
        } as Partial<Editor> as Editor;
        jest.spyOn(appConfigWriter, 'generateVariantsConfig').mockResolvedValue(fsMock);
        spawnSpy = jest.spyOn(childProcess, 'spawnSync');
    });

    test('Test create-fiori add variants-config <appRoot>', async () => {
        // Test execution
        const command = new Command('add');
        addAddVariantsConfigCommand(command);
        await command.parseAsync(getArgv(['variants-config', appRoot]));

        // Result check
        expect(logLevelSpy).not.toBeCalled();
        expect(loggerMock.debug).toBeCalled();
        expect(loggerMock.info).toBeCalled();
        expect(loggerMock.warn).not.toBeCalled();
        expect(loggerMock.error).not.toBeCalled();
        expect(fsMock.commit).toBeCalled();
        expect(spawnSpy).not.toBeCalled();
    });

    test('Test create-fiori add variants-config <appRoot> --simulate', async () => {
        // Test execution
        const command = new Command('add');
        addAddVariantsConfigCommand(command);
        await command.parseAsync(getArgv(['variants-config', appRoot, '-s']));

        // Result check
        expect(logLevelSpy).toBeCalled();
        expect(loggerMock.warn).not.toBeCalled();
        expect(loggerMock.error).not.toBeCalled();
        expect(spawnSpy).not.toBeCalled();
        expect(fsMock.commit).not.toBeCalled();
    });

    test('Test create-fiori add variants-config --verbose', async () => {
        // Test execution
        const command = new Command('add');
        addAddVariantsConfigCommand(command);
        await command.parseAsync(getArgv(['variants-config', '--verbose']));

        // Result check
        expect(logLevelSpy).toBeCalled();
        expect(loggerMock.debug).toBeCalled();
        expect(loggerMock.error).toBeCalled();
        expect(fsMock.commit).not.toBeCalled();
        expect(spawnSpy).not.toBeCalled();
    });
});