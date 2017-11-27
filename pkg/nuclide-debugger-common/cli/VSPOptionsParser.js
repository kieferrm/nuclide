/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {
  StartAction,
  AdapterProperty,
  AdapterPropertyMap,
} from './VSPOptionsData';

import idx from 'idx';
import invariant from 'assert';
import {mapFilter, mapTransform} from 'nuclide-commons/collection';
import VSPOptionsData from './VSPOptionsData';
import yargs from 'yargs';

export default class VSPOptionsParser {
  _optionsData: VSPOptionsData;

  constructor(packagePath: string) {
    this._optionsData = new VSPOptionsData(packagePath);
  }

  get optionsData(): VSPOptionsData {
    return this._optionsData;
  }

  showCommandLineHelp(
    type: string,
    action: StartAction,
    exclude: Set<string>,
  ): void {
    const properties: Map<
      string,
      AdapterProperty,
    > = this._optionsData.adapterPropertiesForAction(type, action);

    const optionKeys = Array.from(properties.keys())
      .filter(_ => !exclude.has(_))
      .sort();

    for (const optionKey of optionKeys) {
      const property = properties.get(optionKey);
      if (property != null) {
        this._printHelpFor(optionKey, property);
      }
    }
  }

  _printHelpFor(optionKey: string, property: AdapterProperty): void {
    const description = property.description;
    if (description != null && description !== '') {
      let spec = '';
      const validValues = property.enum;
      let type = property.type;
      if (validValues != null) {
        spec = validValues.map(_ => `'${_.toString()}'`).join('|');
      } else if (type != null) {
        if (!Array.isArray(type)) {
          type = [type];
        }
        const itemType = idx(property, _ => _.items.type) || null;
        spec = type.map(_ => this._typeToDisplay(_, itemType)).join('|');
      }

      process.stdout.write(`--${optionKey}: ${spec}\n`);

      const maxLineLength = 80;
      const prefix = '  ';

      let line = prefix;
      for (const word of description.split(/\s+/)) {
        if (line === prefix) {
          line = `${line}${word}`;
        } else {
          const newLine = `${line} ${word}`;
          if (newLine.length <= maxLineLength) {
            line = newLine;
          } else {
            process.stdout.write(`${line}\n`);
            line = `${prefix}${word}`;
          }
        }
      }
      if (line !== '') {
        process.stdout.write(`${line}\n`);
      }
    }
  }

  _typeToDisplay(type: string, itemType: ?string): string {
    switch (type) {
      case 'boolean':
        return "'true'|'false'";
      case 'object':
        return 'json';
      case 'array':
        const innerType = itemType == null ? 'arg' : itemType;
        return `${innerType} ${innerType} ...`;
    }

    return type;
  }

  parseCommandLine(
    type: string,
    action: StartAction,
    exclude: Set<string>,
    includeDefaults: Set<string>,
  ): Map<string, any> {
    const propertyMap = this._optionsData.adapterPropertiesForAction(
      type,
      action,
    );

    let args = mapFilter(
      propertyMap,
      (name, prop) => prop.default != null && name in includeDefaults,
    );
    args = mapTransform(args, (prop, name) => [name, prop.default]);

    const parser = this._yargsFromPropertyMap(propertyMap);

    this._applyCommandLineToArgs(args, parser.argv, propertyMap);

    return args;
  }

  // $TODO better flow typing for yargs
  _yargsFromPropertyMap(propertyMap: AdapterPropertyMap): Object {
    let parser = yargs;

    for (const [name, prop] of propertyMap) {
      // If an enum is specified, it gives a list of valid choices, so don't
      // worry about the type
      const validValues = prop.enum;
      if (Array.isArray(validValues)) {
        parser = parser.choices(name, validValues.map(_ => _.toString()));
        continue;
      }

      const propType = prop.type;
      if (propType == null) {
        // if enums and type are both missing, then the prop is busted.
        continue;
      }

      if (Array.isArray(propType)) {
        // If it could be multiple things, figure it out later.
        parser = parser.string(name);
        continue;
      }

      if (propType === 'array') {
        parser = parser.array(name);
        continue;
      }

      if (propType === 'boolean') {
        parser = parser.boolean(name);
        continue;
      }

      parser = parser.string(name);
    }

    return parser;
  }

  _applyCommandLineToArgs(
    args: Map<string, any>,
    commandLine: {[string]: any},
    propertyMap: AdapterPropertyMap,
  ) {
    for (const [name, prop] of propertyMap) {
      const value = commandLine[name];
      if (value == null) {
        continue;
      }

      const validValues = prop.enum;
      if (Array.isArray(validValues)) {
        // yargs will have already validated the value.
        args.set(name, value);
        continue;
      }

      const type = prop.type;
      invariant(type != null);

      switch (type) {
        case 'number':
          const num = parseInt(value, 10);
          if (isNaN(num)) {
            throw new Error(`Value of option --${name} must be numeric.`);
          }
          args.set(name, num);
          break;

        case 'boolean':
          args.set(name, value);
          break;

        case 'object':
          let objectData = {};
          try {
            // $TODO this is hard to get right on the command line, find a better way
            objectData = JSON.parse(value);
          } catch (error) {
            throw new Error(`Value of option --${name} must be valid JSON.`);
          }
          args.set(name, objectData);
          break;

        default:
          args.set(name, value);
      }
    }
  }
}
