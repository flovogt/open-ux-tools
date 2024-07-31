import RuntimeAuthoring from 'sap/ui/rta/RuntimeAuthoring';
import { ActionService } from 'sap/ui/rta/service/Action';

import {
    executeQuickAction,
    ExternalAction,
    QuickAction,
    quickActionListChanged,
    SIMPLE_QUICK_ACTION_KIND,
    NESTED_QUICK_ACTION_KIND,
    QuickActionExecutionPayload
} from '@sap-ux-private/control-property-editor-common';

import { ActionSenderFunction, ControlTreeIndex, Service, SubscribeFunction } from '../types';

import { QUICK_ACTION_DEFINITIONS } from './definitions/index';

import { QuickActionContext, QuickActionDefinition } from './definitions/quick-action-definition';

/**
 *
 */
export class QuickActionService implements Service {
    private sendAction: ActionSenderFunction = () => {};
    private actions: QuickActionDefinition[] = [];
    private actionService: ActionService;

    /**
     *
     * @param rta - rta object.
     * @param ui5 - facade for ui5 framework methods
     */
    constructor(private readonly rta: RuntimeAuthoring) {}

    /**
     * Initialize selection service.
     *
     * @param sendAction action sender function
     * @param subscribe subscriber function
     */
    public async init(sendAction: ActionSenderFunction, subscribe: SubscribeFunction): Promise<void> {
        this.sendAction = sendAction;
        this.actionService = await this.rta.getService('action');
        subscribe(async (action: ExternalAction): Promise<void> => {
            if (executeQuickAction.match(action)) {
                const actionInstance = this.actions.find(
                    (quickActionDefinition) => quickActionDefinition.type === action.payload.type
                );
                if (!actionInstance) {
                    return;
                }
                const commands = await this.executeAction(actionInstance, action.payload);

                for (const command of commands) {
                    await this.rta.getCommandStack().pushAndExecute(command);
                }
            }
        });
    }

    public async reloadQuickActions(controlIndex: ControlTreeIndex): Promise<void> {
        const context: QuickActionContext = {
            controlIndex,
            manifest: this.rta.getRootControlInstance().getManifest(),
            actionService: this.actionService,
            rta: this.rta
        };

        const quickActions: QuickAction[] = [];
        for (const Definition of QUICK_ACTION_DEFINITIONS) {
            const instance = new Definition(context);
            await instance.initialize();
            if (instance.isActive) {
                const quickAction = instance.getActionObject();
                quickActions.push(quickAction);
                this.actions.push(instance);
            }
        }

        this.sendAction(quickActionListChanged(quickActions));
    }

    private executeAction(actionInstance: QuickActionDefinition, payload: QuickActionExecutionPayload) {
        if (payload.kind === SIMPLE_QUICK_ACTION_KIND && actionInstance.kind === SIMPLE_QUICK_ACTION_KIND) {
            return actionInstance.execute();
        }
        if (payload.kind === NESTED_QUICK_ACTION_KIND && actionInstance.kind === NESTED_QUICK_ACTION_KIND) {
            return actionInstance.execute(payload.path);
        }
        return Promise.resolve([]);
    }
}
