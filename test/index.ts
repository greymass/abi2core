import {strict as assert} from 'assert'
import 'mocha'

import transform from '../src/transform'

suite('transform', function () {
    test('basic', function () {
        const result = transform({
            structs: [
                {
                    name: 'foo',
                    base: '',
                    fields: [
                        {name: 'bar', type: 'public_key'},
                        {name: 'baz', type: 'string?'},
                    ],
                },
            ],
        })
        const out = result.out.map((l) => l.trim())
        const fooIdx = out.indexOf("@Struct.type('foo')")
        assert.notEqual(fooIdx, -1)
        assert.equal(out[fooIdx + 1], 'export class Foo extends Struct {')
        assert.equal(out[fooIdx + 2], '@Struct.field(PublicKey) bar!: PublicKey')
        assert.equal(out[fooIdx + 3], "@Struct.field('string?') baz?: string")
    })

    test('circular refs', function () {
        assert.throws(() => {
            transform({
                structs: [
                    {
                        name: 'foo',
                        base: '',
                        fields: [{name: 'bar', type: 'foo'}],
                    },
                ],
            })
        }, /foo is dependent of itself/)
        assert.throws(() => {
            transform({
                types: [
                    {new_type_name: 'b', type: 'c'},
                    {new_type_name: 'c', type: 'a'},
                ],
                structs: [
                    {
                        name: 'a',
                        base: '',
                        fields: [{name: 'a1', type: 'b'}],
                    },
                ],
            })
        }, /b -> c -> a => b/)
    })

    test('string alias', function () {
        assert.throws(() => {
            transform({
                types: [{new_type_name: 'foo', type: 'string'}],
                structs: [{name: 'bar', base: '', fields: [{name: 'f1', type: 'foo'}]}],
            })
        })
    })
})
