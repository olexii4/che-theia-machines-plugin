/*
 * Copyright (c) 2018 Red Hat, Inc.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import {ContainerModule, interfaces} from 'inversify';
import {MachinesViewService} from './machines-view-service';
import {MachinesViewContribution} from './machines-view-contribution';
import {WidgetFactory} from '@theia/core/lib/browser/widget-manager';
import {FrontendApplicationContribution, createTreeContainer, TreeWidget} from '@theia/core/lib/browser';
import {MachinesViewWidgetFactory, MachinesViewWidget} from './machines-view-widget';
import {CommandContribution} from '@theia/core/lib/common/command';
import {KeybindingContribution} from '@theia/core/lib/browser/keybinding';
import {MenuContribution} from '@theia/core/lib/common/menu';
import {CheWorkspaceClientService} from './che-workspace-client-service';
import {CheWorkspaceMachinesService} from './che-workspace-machines-service';
import {IBaseEnvVariablesServer, baseEnvVariablesPath} from '../common/base-env-variables-protocol';
import {WebSocketConnectionProvider} from '@theia/core/lib/browser';


export default new ContainerModule(bind => {
    // add your contribution bindings here
    bind(CheWorkspaceClientService).toSelf();
    bind(CheWorkspaceMachinesService).toSelf();

    bind(MachinesViewWidgetFactory).toFactory(ctx =>
        () => createMachinesViewWidget(ctx.container)
    );

    bind(MachinesViewService).toSelf().inSingletonScope();
    bind(WidgetFactory).toDynamicValue(context => context.container.get(MachinesViewService));

    bind(MachinesViewContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toDynamicValue(c => c.container.get(MachinesViewContribution));

    bind(CommandContribution).toDynamicValue(c => c.container.get(MachinesViewContribution));
    bind(KeybindingContribution).toDynamicValue(c => c.container.get(MachinesViewContribution));
    bind(MenuContribution).toDynamicValue(c => c.container.get(MachinesViewContribution));

    bind(IBaseEnvVariablesServer).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        return connection.createProxy<IBaseEnvVariablesServer>(baseEnvVariablesPath);
    }).inSingletonScope();
});

function createMachinesViewWidget(parent: interfaces.Container): MachinesViewWidget {
    const child = createTreeContainer(parent);

    child.unbind(TreeWidget);
    child.bind(MachinesViewWidget).toSelf();

    return child.get(MachinesViewWidget);
}