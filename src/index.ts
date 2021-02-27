import {ArgumentParser} from 'argparse'
import {createReadStream, createWriteStream} from 'fs'

import transform from './transform'

export interface Arguments {
    output?: string
    input?: string
}

export async function main(args: Arguments) {
    const input = args.input ? createReadStream(args.input) : process.stdin
    const output = args.output
        ? createWriteStream(args.output)
        : (process.stdout as NodeJS.WritableStream)

    let data = await readJSONStream(input)

    if (data.abi && data.account_name) {
        data = data.abi
    }
    const result = transform(data)

    for (const line of result.out) {
        output.write(line + '\n')
    }
    output.end()
}

function readJSONStream(stream: NodeJS.ReadableStream) {
    return new Promise<any>((resolve, reject) => {
        const chunks: Buffer[] = []
        stream.on('data', (chunk) => {
            chunks.push(chunk)
        })
        stream.on('error', reject)
        stream.on('end', () => {
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
            } catch (error) {
                error.message = `Unable to parse JSON: ${error.message}`
                reject(error)
            }
        })
    })
}

export {transform}

if (module == require.main) {
    function log(...args: string[]) {
        process.stderr.write(args.join(' ') + '\n')
    }

    const parser = new ArgumentParser({add_help: true})

    parser.add_argument('-o', '--output', {
        nargs: '?',
        help: 'Output file to write to instead of stdout.',
    })

    parser.add_argument('-i', '--input', {
        nargs: '?',
        help: 'Read ABI JSON from file instead of stdin.',
    })

    main(parser.parse_args()).catch((error) => {
        log('ERROR', error.message)
    })
}
