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

import type {NuclideUri} from 'nuclide-commons/nuclideUri';
import type UniversalDisposable from 'nuclide-commons/UniversalDisposable';
import type {Subject} from 'rxjs';
import type {ConsoleMessage} from 'atom-ide-ui';

import * as Immutable from 'immutable';

export type SshTunnelService = {
  openTunnel(
    tunnel: Tunnel,
    onOpen: (?Error) => void,
    onClose: (?Error) => void,
  ): UniversalDisposable,
  getOpenTunnels(): Set<Tunnel>,
  getAvailableServerPort(uri: NuclideUri): Promise<number>,
};

export type Store = {
  getState(): AppState,
  dispatch(action: Action): void,
};

export type AppState = {
  openTunnels: Immutable.Map<Tunnel, OpenTunnel>,
  currentWorkingDirectory: ?string,
  consoleOutput: Subject<ConsoleMessage>,
};

export type Host = {
  host: 'localhost' | NuclideUri,
  port: number,
  family?: 4 | 6,
};

export type Tunnel = {
  description: string,
  from: Host,
  to: Host,
};

export type OpenTunnel = {
  close(error: ?Error): void,
  state: TunnelState,
};

export type TunnelState = 'initializing' | 'ready' | 'active';

export type Action =
  | CloseTunnelAction
  | OpenTunnelAction
  | RequestTunnelAction
  | SetCurrentWorkingDirectoryAction
  | SetTunnelStateAction;

export type CloseTunnelAction = {
  type: 'CLOSE_TUNNEL',
  payload: {
    tunnel: Tunnel,
    error: ?Error,
  },
};

export type OpenTunnelAction = {
  type: 'OPEN_TUNNEL',
  payload: {
    tunnel: Tunnel,
    open: () => void,
    close: (?Error) => void,
  },
};

export type RequestTunnelAction = {
  type: 'REQUEST_TUNNEL',
  payload: {
    tunnel: Tunnel,
    onOpen: (?Error) => void,
    onClose: (?Error) => void,
  },
};

export type SetCurrentWorkingDirectoryAction = {
  type: 'SET_CURRENT_WORKING_DIRECTORY',
  payload: {
    directory: ?string,
  },
};

export type SetTunnelStateAction = {
  type: 'SET_TUNNEL_STATE',
  payload: {
    tunnel: Tunnel,
    state: TunnelState,
  },
};
