@greymass/abi2core
==================

Greymass TypeScript library template, intended for packages that work both in the browser and node.js.
`@types/node` are installed only for tests, don't rely on any node.js types or imports inside `src/` (no `buffer`, `crypto` imports etc, they can be filled for browser but will bloat the bundle 100x)

## Installation

The `@greymass/abi2core` package is distributed as a module on [npm](https://www.npmjs.com/package/PACKAGE).

```
yarn global add @greymass/abi2core
# or
npm install --global @greymass/abi2core
```

## Usage

After installing the abi2core command should be available, it takes EOSIO ABI JSON on stdin and outputs @greymass/eosio TypeScript Types on stdout.

Example:

```sh
$ cleos -u https://eos.greymass.com get abi eosio.token | abi2core
```

```ts
// generated by @greymass/abi2core

import {Asset, Name, Struct} from '@greymass/eosio'

@Struct.type('account')
export class Account extends Struct {
    @Struct.field(Asset) balance!: Asset
}

@Struct.type('close')
export class Close extends Struct {
    @Struct.field(Name) owner!: Name
    @Struct.field(Asset.Symbol) symbol!: Asset.Symbol
}

@Struct.type('create')
export class Create extends Struct {
    @Struct.field(Name) issuer!: Name
    @Struct.field(Asset) maximum_supply!: Asset
}

@Struct.type('currency_stats')
export class CurrencyStats extends Struct {
    @Struct.field(Asset) supply!: Asset
    @Struct.field(Asset) max_supply!: Asset
    @Struct.field(Name) issuer!: Name
}

@Struct.type('issue')
export class Issue extends Struct {
    @Struct.field(Name) to!: Name
    @Struct.field(Asset) quantity!: Asset
    @Struct.field('string') memo!: string
}

@Struct.type('open')
export class Open extends Struct {
    @Struct.field(Name) owner!: Name
    @Struct.field(Asset.Symbol) symbol!: Asset.Symbol
    @Struct.field(Name) ram_payer!: Name
}

@Struct.type('retire')
export class Retire extends Struct {
    @Struct.field(Asset) quantity!: Asset
    @Struct.field('string') memo!: string
}

@Struct.type('transfer')
export class Transfer extends Struct {
    @Struct.field(Name) from!: Name
    @Struct.field(Name) to!: Name
    @Struct.field(Asset) quantity!: Asset
    @Struct.field('string') memo!: string
}
```

## Developing

You need [Make](https://www.gnu.org/software/make/), [node.js](https://nodejs.org/en/) and [yarn](https://classic.yarnpkg.com/en/docs/install) installed.

Clone the repository and run `make` to checkout all dependencies and build the project. See the [Makefile](./Makefile) for other useful targets. Before submitting a pull request make sure to run `make lint`.

---

Made with ☕️ & ❤️ by [Greymass](https://greymass.com), if you find this useful please consider [supporting us](https://greymass.com/support-us).