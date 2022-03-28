import {ABI, ABIDef} from '@greymass/eosio'
import Toposort from './toposort'

export default function transform(abiDef: ABIDef) {
    const abi = ABI.from(abiDef)
    const out: string[] = ['']
    const resolved = abi.resolveAll()

    const imports = new Set<string>()
    if (resolved.structs.length > 0) {
        imports.add('Struct')
    }
    if (resolved.types.length > 0) {
        imports.add('TypeAlias')
    }
    if (resolved.variants.length > 0) {
        imports.add('Variant')
    }

    const typeGraph = new Toposort<string>()
    resolved.types.forEach((type) => {
        typeGraph.add(type.name, type.ref!.name)
    })
    resolved.structs.forEach((type) => {
        typeGraph.add(
            type.name,
            type.fields!.map((f) => f.type.name)
        )
    })
    resolved.variants.forEach((type) => {
        typeGraph.add(
            type.name,
            type.variant!.map((t) => t.name)
        )
    })
    const typeOrder = typeGraph.sort().reverse()

    const allTypes = resolved.structs
        .concat(resolved.variants)
        .concat(resolved.types)
        .sort((a, b) => {
            return typeOrder.indexOf(a.name) - typeOrder.indexOf(b.name)
        })

    const getTypeName = (type: ABI.ResolvedType) => {
        const builtin = getBuiltin(type)
        if (builtin) {
            if (allTypes.find((t) => t.name === type.name)) {
                process.stderr.write(
                    `WARNING: ABI re-declares builtin: "${type.name}". This will result in undefined behavior.\n`
                )
            } else {
                imports.add(builtin.import)
            }
        }
        return builtin ? builtin.name : snakeToPascal(sanitizeTypeName(type.name))
    }

    for (const type of allTypes) {
        if (type.ref) {
            if (type.ref.name === 'string' || type.ref.name === 'bool') {
                throw new Error(
                    '@greymass/eosio can not represent aliases to types represented by js natives (string and bool)'
                )
            }
            const baseType = getTypeName(type.ref)
            out.push(`@TypeAlias('${type.name}')`)
            out.push(`class ${getTypeName(type)} extends ${baseType} {}`)
            out.push('')
        } else if (type.fields) {
            const baseClass = type.base ? snakeToPascal(type.base.name) : 'Struct'
            out.push(`@Struct.type('${type.name}')`)
            out.push(`export class ${getTypeName(type)} extends ${baseClass} {`)
            for (const field of type.fields) {
                let fieldType = getTypeName(field.type)
                let fieldDef = fieldType
                if (field.type.name === 'string' || field.type.name === 'bool') {
                    fieldType = field.type.name === 'string' ? 'string' : 'boolean'
                    fieldDef = `'${field.type.typeName}'`
                } else if (field.type.isArray || field.type.isExtension || field.type.isOptional) {
                    const fieldOpts: string[] = []
                    if (field.type.isOptional) {
                        fieldOpts.push('optional: true')
                    }
                    if (field.type.isArray) {
                        fieldOpts.push('array: true')
                    }
                    if (field.type.isExtension) {
                        fieldOpts.push('extension: true')
                    }
                    fieldDef += `, {${fieldOpts.join(',')}}`
                }
                out.push(
                    `    @Struct.field(${fieldDef}) ${field.name}${
                        field.type.isOptional ? '?' : '!'
                    }: ${fieldType}${field.type.isArray ? '[]' : ''}`
                )
            }
            out.push('}')
            out.push('')
        } else if (type.variant) {
            const variantTypes = type.variant.map((t) => {
                if (t.name === 'bool' || t.name === 'string') {
                    return t.typeName
                }
                const name = getTypeName(t)
                if (t.isArray || t.isExtension || t.isOptional) {
                    let def = `{type: ${name}`
                    if (t.isArray) {
                        def += ', array: true'
                    }
                    if (t.isOptional) {
                        def += ', optional: true'
                    }
                    if (t.isExtension) {
                        def += ', extension: true'
                    }
                    def += '}'
                    return def
                }
                return name
            })
            out.push(`@Variant.type('${type.name}', [${variantTypes.join(', ')}])`)
            out.push(`class ${getTypeName(type)} extends Variant {}`)
            out.push('')
        }
    }

    const sortedImports = Array.from(imports).sort((a, b) => a.localeCompare(b))
    if (sortedImports.length > 0) {
        let importDef = sortedImports.join(', ')
        if (importDef.length > 70) {
            importDef = '\n    ' + importDef.replace(/, /g, ',\n    ') + ',\n'
        }
        out.unshift(`import {${importDef}} from '@greymass/eosio'`)
        out.unshift('')
    }

    while (out[out.length - 1] === '') {
        out.splice(out.length - 1, 1)
    }

    out.unshift('// generated by @greymass/abi2core')

    return {out}
}

/** Return PascalCase version of snake_case string. */
function snakeToPascal(name: string): string {
    return name
        .split('_')
        .map((v) => (v[0] ? v[0].toUpperCase() : '_') + v.slice(1))
        .join('')
}

function getBuiltin(type: ABI.ResolvedType) {
    switch (type.name) {
        case 'asset':
            return {name: 'Asset', import: 'Asset'}
        case 'symbol':
            return {name: 'Asset.Symbol', import: 'Asset'}
        case 'symbol_code':
            return {name: 'Asset.SymbolCode', import: 'Asset'}
        case 'block_timestamp':
            return {name: 'BlockTimestamp', import: 'BlockTimestamp'}
        case 'bytes':
            return {name: 'Bytes', import: 'Bytes'}
        case 'checksum160':
            return {name: 'Checksum160', import: 'Checksum160'}
        case 'checksum256':
            return {name: 'Checksum256', import: 'Checksum256'}
        case 'checksum512':
            return {name: 'Checksum512', import: 'Checksum512'}
        case 'extended_asset':
            return {name: 'ExtendedAsset', import: 'ExtendedAsset'}
        case 'float32':
            return {name: 'Float32', import: 'Float32'}
        case 'float64':
            return {name: 'Float64', import: 'Float64'}
        case 'float128':
            return {name: 'Float128', import: 'Float128'}
        case 'uint8':
            return {name: 'UInt8', import: 'UInt8'}
        case 'uint16':
            return {name: 'UInt16', import: 'UInt16'}
        case 'uint32':
            return {name: 'UInt32', import: 'UInt32'}
        case 'uint64':
            return {name: 'UInt64', import: 'UInt64'}
        case 'uint128':
            return {name: 'UInt128', import: 'UInt128'}
        case 'int8':
            return {name: 'Int8', import: 'Int8'}
        case 'int16':
            return {name: 'Int16', import: 'Int16'}
        case 'int32':
            return {name: 'Int32', import: 'Int32'}
        case 'int64':
            return {name: 'Int64', import: 'Int64'}
        case 'int128':
            return {name: 'Int128', import: 'Int128'}
        case 'varint32':
            return {name: 'VarInt', import: 'VarInt'}
        case 'varuint32':
            return {name: 'VarUInt', import: 'VarUInt'}
        case 'name':
            return {name: 'Name', import: 'Name'}
        case 'public_key':
            return {name: 'PublicKey', import: 'PublicKey'}
        case 'signature':
            return {name: 'Signature', import: 'Signature'}
        case 'time_point':
            return {name: 'TimePoint', import: 'TimePoint'}
        case 'time_point_sec':
            return {name: 'TimePointSec', import: 'TimePointSec'}
        case 'block_timestamp_type':
            return {name: 'BlockTimestamp', import: 'BlockTimestamp'}
        default:
            return null
    }
}

/** Makes sure the type names declared by the ABI are valid TypeScript. */
function sanitizeTypeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '_')
}
