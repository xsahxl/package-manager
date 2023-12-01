import * as vscode from 'vscode';
import * as path from 'path';
import { spawnSync } from 'child_process';

export const update = (data: Record<string, any> = {}) => {
  vscode.window.showInformationMessage(`Package ${data.name}@${data.version} is updating`);
  spawnSync('npm', ['install', `${data.name}@${data.version}`], { cwd: path.dirname(data.packagePath) })
  vscode.window.showInformationMessage(`Package ${data.name}@${data.version} updated successfully`);
}
