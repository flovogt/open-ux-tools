import FlexCommand from 'sap/ui/rta/command/FlexCommand';

import { QuickActionContext, NestedQuickActionDefinition } from '../../../cpe/quick-actions/quick-action-definition';
import { getControlById } from '../../../utils/core';
import OverlayRegistry from 'sap/ui/dt/OverlayRegistry';
import { DialogNames, handler } from '../../init-dialogs';
import { MDC_TABLE_TYPE, TableQuickActionDefinitionBase } from './table-quick-action-base';

export const CREATE_TABLE_CUSTOM_COLUMN = 'create-table-custom-column';

export const CONTROL_TYPES = [MDC_TABLE_TYPE];

export class AddTableCustomColumnQuickAction
    extends TableQuickActionDefinitionBase
    implements NestedQuickActionDefinition
{
    constructor(context: QuickActionContext) {
        super(CREATE_TABLE_CUSTOM_COLUMN, CONTROL_TYPES, 'QUICK_ACTION_ADD_CUSTOM_TABLE_COLUMN', context);
    }

    async execute(path: string): Promise<FlexCommand[]> {
        const { table, iconTabBarFilterKey, sectionInfo } = this.tableMap[path];
        if (!table) {
            return [];
        }

        if (sectionInfo) {
            const { layout, section, subSection } = sectionInfo;
            layout?.setSelectedSection(section);
            section.setSelectedSubSection(subSection);
            this.selectOverlay(table);
        } else {
            getControlById(table.getId())?.getDomRef()?.scrollIntoView();
            this.selectOverlay(table);
        }

        if (this.iconTabBar && iconTabBarFilterKey) {
            this.iconTabBar.setSelectedKey(iconTabBarFilterKey);
        }

        const overlay = OverlayRegistry.getOverlay(table);
        await handler(overlay, this.context.rta, DialogNames.ADD_FRAGMENT, undefined, {
            aggregation: 'columns',
            title: 'QUICK_ACTION_ADD_CUSTOM_TABLE_COLUMN'
        });
        return [];
    }
}