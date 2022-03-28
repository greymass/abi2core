// adapted from https://github.com/gustavohenke/toposort

export default class Toposort<T = string> {
    edges: [T, T?][] = []

    add(item: T, deps: T | T[]) {
        deps = Array.isArray(deps) ? deps : [deps]
        if (deps.length > 0) {
            for (const dep of deps) {
                this.edges.push([item, dep])
            }
        } else {
            this.edges.push([item])
        }
    }

    sort(): T[] {
        const nodes: (T | false)[] = []
        for (const edge of this.edges) {
            for (const node of edge) {
                if (nodes.indexOf(node!) === -1) {
                    nodes.push(node!)
                }
            }
        }
        let place = nodes.length
        const sorted = new Array(nodes.length)
        const visit = (node: any, predecessors: any) => {
            if (predecessors.length !== 0 && predecessors.indexOf(node) !== -1) {
                throw new Error(
                    `Cyclic dependency found. ${node} is dependent of itself.\n` +
                        `Dependency chain: ${predecessors.join(' -> ')} => ${node}`
                )
            }
            const index = nodes.indexOf(node)
            if (index !== -1) {
                let copy = false
                nodes[index] = false
                for (const edge of this.edges) {
                    if (edge[0] === node) {
                        copy = copy || predecessors.concat([node])
                        visit(edge[1], copy)
                    }
                }
                sorted[--place] = node
            }
        }
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]
            if (node !== false) {
                nodes[i] = false
                for (const edge of this.edges) {
                    if (edge[0] === node) {
                        visit(edge[1], [node])
                    }
                }
                sorted[--place] = node
            }
        }
        return sorted
    }
}
