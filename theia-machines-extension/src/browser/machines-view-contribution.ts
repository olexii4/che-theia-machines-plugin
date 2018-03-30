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

import {injectable, inject} from 'inversify';
import {AbstractViewContribution} from '@theia/core/lib/browser/shell/view-contribution';
import {DisposableCollection} from '@theia/core';
import {MachinesViewWidget} from './machines-view-widget';
import {MachinesViewService} from './machines-view-service';
import {ICompositeTreeNode, ISelectableTreeNode, IExpandableTreeNode} from '@theia/core/lib/browser';
import {CheWorkspaceMachinesService, IWorkspaceMachine} from './che-workspace-machines-service';

export interface MachinesSymbolInformationNode extends ICompositeTreeNode, ISelectableTreeNode, IExpandableTreeNode {
    iconClass: string;
}

export interface NodeAndSymbol {
    node: MachinesSymbolInformationNode;
    symbol: SymbolInformation;
}

export interface SymbolInformation {
    name: string;
    id: string;
    parentId: string | undefined;
    kind?: SymbolKind | undefined;
}

export const MACHINES_NAVIGATOR_ID = 'machines-view';

const enum SymbolKind {
    Machine = 1,
    Terminal
}
const MACHINE_CLASS = 'fa fas fa-circle';
const TERMINAL_CLASS = 'fa fa-terminal';


@injectable()
export class MachinesViewContribution extends AbstractViewContribution<MachinesViewWidget> {

    protected ids: string[] = [];
    protected symbolList: NodeAndSymbol[] = [];
    protected readonly toDispose = new DisposableCollection();


    constructor(@inject(MachinesViewService) protected readonly machineViewService: MachinesViewService,
                @inject(CheWorkspaceMachinesService) private readonly cheMachines: CheWorkspaceMachinesService) {
        super({
            widgetId: MACHINES_NAVIGATOR_ID,
            widgetName: 'Machines',
            defaultWidgetOptions: {
                area: 'right',
                rank: 500
            },
            toggleCommandId: 'machines:toggle',
            toggleKeybinding: 'ctrlcmd+shift+n'
        });
    }

    protected onStart() {
        this.updateMachines();
        this.machineViewService.onDidChangeOpenState(async isOpen => {
            if (isOpen) {
                this.updateMachines();
            }
        });
        this.machineViewService.onDidSelect(async node => {
            // TODO: Add terminal's call if it terminal node.
        });
    }

    protected updateMachines() {
        this.cheMachines.updateMachines().then(() => {
            const machines: Array<IWorkspaceMachine> = this.cheMachines.machines;
            this.publish(machines);
        });
    }

    protected publish(machines: Array<IWorkspaceMachine>) {
        this.ids.length = 0;
        this.symbolList.length = 0;

        const entries: Array<SymbolInformation> = [];

        machines.forEach(machine => {
            const machineEntry = {
                name: machine.machineName,
                id: this.getId(machine.machineName, 0),
                parentId: undefined,
                kind: SymbolKind.Machine
            };
            entries.push(machineEntry);

            entries.push({
                name: machine.status,
                id: this.getId(machine.machineName + '_status', 0),
                parentId: machineEntry.id
            });

            const servers = machine.servers;
            if (servers) {
                const serversEntryName = 'servers';
                const serversEntry = {
                    name: serversEntryName,
                    id: this.getId(serversEntryName, 100),
                    parentId: machineEntry.id
                };
                entries.push(serversEntry);
                Object.keys(servers).forEach((serverName: string) => {

                    const serverPortEntry = {
                        name: servers[serverName].url.toString(),
                        id: this.getId(serverName + '_port', 200),
                        parentId: serversEntry.id
                    };
                    entries.push(serverPortEntry);
                    entries.push({
                        name: `name: ${serverName}`,
                        id: this.getId(serverName + '_name', 0),
                        parentId: serverPortEntry.id
                    });
                });
            }
/*
            // TODO: Add terminal's call if it terminal node.
            const terminalEntryName = 'terminal';
            entries.push({
                name: terminalEntryName,
                id: this.getId(terminalEntryName, 1000),
                parentId: machineEntry.id,
                kind: SymbolKind.Terminal
            });
*/
        });

        this.machineViewService.publish(this.createTree(undefined, entries));
    }

    protected createTree(parentNode: NodeAndSymbol | undefined, symbolInformationList: Array<SymbolInformation>): MachinesSymbolInformationNode[] {
        const childNodes: NodeAndSymbol[] =
            symbolInformationList
                .filter(s => (!parentNode && !s.parentId) || (parentNode && parentNode.symbol.id === s.parentId))
                .map(sym => this.convertToNode(sym, parentNode));
        childNodes.forEach(childNode => {
            const nodeSymbol = symbolInformationList.filter(s => childNode.symbol.id !== s.id);
            childNode.node.children = this.createTree(childNode, nodeSymbol);
        });
        return childNodes.map(n => n.node);
    }

    protected convertToNode(symbol: SymbolInformation, parent: NodeAndSymbol | undefined): NodeAndSymbol {
        const iconClass = this.getClass(symbol.kind);
        const node: MachinesSymbolInformationNode = {
            children: [],
            id: symbol.id,
            iconClass,
            name: symbol.name,
            parent: parent ? parent.node : undefined,
            selected: false,
            expanded: false
        };
        const symbolAndNode = {node, symbol};
        this.symbolList.push(symbolAndNode);
        return symbolAndNode;
    }

    private getId(nodeName: string, counter: number): string {
        let uniqueId: string;
        do {
            uniqueId = `${nodeName}_id_${counter}`;
            counter++;
        } while (this.ids.find(id => id === uniqueId) && counter < 1000);

        this.ids.push(uniqueId);
        return uniqueId;
    }

    private getClass(symbolKind: SymbolKind): string|undefined {
        switch (symbolKind) {
            case SymbolKind.Machine:
                return MACHINE_CLASS;
            case SymbolKind.Terminal:
                return TERMINAL_CLASS;
        }
        return undefined;
    }
}
