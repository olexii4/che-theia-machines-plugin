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

import { injectable, inject } from 'inversify';
import {
    TreeWidget,
    ITreeNode,
    NodeProps,
    ISelectableTreeNode,
    TreeProps,
    ContextMenuRenderer,
    TreeModel,
    IExpandableTreeNode
} from "@theia/core/lib/browser";
import { h, ElementInlineStyle } from "@phosphor/virtualdom/lib";
 import { Message } from '@phosphor/messaging';
import { Emitter } from '@theia/core';
import { ICompositeTreeNode } from '@theia/core/lib/browser';

export interface MachinesSymbolInformationNode extends ICompositeTreeNode, ISelectableTreeNode, IExpandableTreeNode {
    iconClass: string;
}

export namespace MachinesSymbolInformationNode {
    export function is(node: ITreeNode): node is MachinesSymbolInformationNode {
        return !!node && ISelectableTreeNode.is(node) && 'iconClass' in node;
    }
}

export type MachinesViewWidgetFactory = () => MachinesViewWidget;
export const MachinesViewWidgetFactory = Symbol('MachinesViewWidgetFactory');





@injectable()
export class MachinesViewWidget extends TreeWidget {

    readonly onDidChangeOpenStateEmitter = new Emitter<boolean>();

    constructor(
        @inject(TreeProps) protected readonly treeProps: TreeProps,
        @inject(TreeModel) model: TreeModel,
        @inject(ContextMenuRenderer) protected readonly contextMenuRenderer: ContextMenuRenderer
    ) {
        super(treeProps, model, contextMenuRenderer);

        this.id = 'machines-view';
        this.title.label = 'Machines';
        this.addClass('theia-machines-view');
    }

    public setMachinesTree(roots: MachinesSymbolInformationNode[]) {
        const nodes = this.reconcileTreeState(roots);
        this.model.root = <ICompositeTreeNode>{
            id: 'machines-view-root',
            name: 'Machines Root',
            visible: false,
            children: nodes,
            parent: undefined
        };
    }

    protected reconcileTreeState(nodes: ITreeNode[]): ITreeNode[] {
        nodes.forEach(node => {
            if (MachinesSymbolInformationNode.is(node)) {
                const treeNode = this.model.getNode(node.id);
                if (treeNode && MachinesSymbolInformationNode.is(treeNode)) {
                    node.expanded = treeNode.expanded;
                    node.selected = treeNode.selected;
                }
                this.reconcileTreeState(Array.from(node.children));
            }
        });
        return nodes;
    }

    protected onAfterHide(msg: Message) {
        super.onAfterHide(msg);
        this.onDidChangeOpenStateEmitter.fire(false);
    }

    protected onAfterShow(msg: Message) {
        super.onAfterShow(msg);
        this.onDidChangeOpenStateEmitter.fire(true);
    }

    protected onUpdateRequest(msg: Message): void {
        if (!this.model.selectedNode && ISelectableTreeNode.is(this.model.root)) {
            this.model.selectNode(this.model.root);
        }
        super.onUpdateRequest(msg);
    }

/*    createNodeClassNames(node: ITreeNode, props: NodeProps): string[] {
        const classNames = super.createNodeClassNames(node, props);
        if (MachinesSymbolInformationNode.is(node)) {
             classNames.push(node.iconClass);
        }
        return classNames;
    }*/

    protected renderNode(node: ITreeNode, props: NodeProps): h.Child {
        const attributes = super.createNodeAttributes(node, props);
        return h.div(attributes, this.renderIcon(node), super.renderNodeCaption(node, props));
    }

    protected createNodeStyle(node: ITreeNode, props: NodeProps): ElementInlineStyle | undefined {
        return {
            height: '22px',
            paddingLeft: `${props.indentSize}px`,
            display: props.visible ? 'flex' : 'none',
        };
    }

    renderIcon(node: ITreeNode): h.Child {
        if (MachinesSymbolInformationNode.is(node)) {
            return h.i({
                className: node.iconClass,
                style: {
                    fontSize: '15px',
                    lineHeight: '22px',
                    marginLeft: '1px',
                    marginRight: !node.children.length ? '4px' : '0px'
                }
            });
        }
        return null;
    }


    protected isExpandable(node: ITreeNode): node is IExpandableTreeNode {
        return MachinesSymbolInformationNode.is(node) && node.children && node.children.length > 0;
    }

}
