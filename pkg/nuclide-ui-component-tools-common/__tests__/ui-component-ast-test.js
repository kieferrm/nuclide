/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {
  getRequiredProps,
  parseCode,
  getDefaultPropNames,
} from '../lib/uiComponentAst';
import {BASIC_FDSTEST_COMPONENT_WITH_PROPS_SOURCE} from '../__mocks__/common';

describe('ui-component-ast', () => {
  it('parses a React component module', () => {
    const ast = parseCode(BASIC_FDSTEST_COMPONENT_WITH_PROPS_SOURCE);
    expect(ast).toBeTruthy();
  });

  it('retrieves required props from a React component', () => {
    const requiredProps = getRequiredProps(
      'FDSTest',
      BASIC_FDSTEST_COMPONENT_WITH_PROPS_SOURCE,
    );
    expect(requiredProps).toEqual([
      {
        name: 'value',
        typeAnnotation: 'NumberTypeAnnotation',
        leadingComment: 'Test value.',
      },
      {
        name: 'type',
        typeAnnotation: 'FDSType',
        leadingComment: 'A test required enum.',
      },
    ]);
  });

  it('gets default prop names', () => {
    const defaultProps = getDefaultPropNames(
      'FDSTest',
      parseCode(BASIC_FDSTEST_COMPONENT_WITH_PROPS_SOURCE),
    );
    expect(defaultProps).toEqual(['type', 'optionalValue']);
  });

  it('gets default prop names with declaration indirection', () => {
    const defaultProps = getDefaultPropNames(
      'FDSTest',
      parseCode(`
const Props = {
  value: number,
  type: string,
}

const DEFAULT_PROPS = {
  value: 0,
  type: 'foo',
};

class FDSTest extends React.PureComponent<Props> {
  static defaultProps = DEFAULT_PROPS;
}
    `),
    );

    expect(defaultProps).toEqual(['value', 'type']);
  });
});
