import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';

const outputChannel = vscode.window.createOutputChannel('Package Manager');

export const update = (data: Record<string, any> = {}, cb: () => Promise<any>) => {
  const subprocess = spawn('npm', ['install', `${data.name}@${data.version}`], {
    cwd: path.dirname(data.packagePath),
  });
  outputChannel.clear();
  outputChannel.show();
  outputChannel.appendLine(`Package ${data.name}@${data.version} is updating...`);
  subprocess.stdout.on('data', data => {
    outputChannel.appendLine(data);
  });
  subprocess.stderr.on('data', data => {
    outputChannel.appendLine(data);
  });
  subprocess.on('close', async code => {
    console.log(`child process exited with code ${code}`);
    if (code === 0) {
      outputChannel.appendLine(`Package ${data.name}@${data.version} updated successfully`);
      await cb();
      return;
    }
    outputChannel.appendLine(`Package ${data.name}@${data.version} updated failed`);
    vscode.window.showErrorMessage(`Package ${data.name}@${data.version} updated failed`);
  });
};

export const remove = (data: Record<string, any> = {}, cb: () => Promise<any>) => {
  const subprocess = spawn('npm', ['remove', data.name], {
    cwd: path.dirname(data.packagePath),
  });
  outputChannel.clear();
  outputChannel.show();
  outputChannel.appendLine(`Package ${data.name} is removing...`);
  subprocess.stdout.on('data', data => {
    outputChannel.appendLine(data);
  });
  subprocess.stderr.on('data', data => {
    outputChannel.appendLine(data);
  });
  subprocess.on('close', async code => {
    console.log(`child process exited with code ${code}`);
    if (code === 0) {
      outputChannel.appendLine(`Package ${data.name} removed successfully`);
      await cb();
      return;
    }
    outputChannel.appendLine(`Package ${data.name} removed failed`);
    vscode.window.showErrorMessage(`Package ${data.name} removed failed`);
  });
};
