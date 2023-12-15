import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';

export const update = (data: Record<string, any> = {}, cb: () => Promise<any>) => {
  const outputChannel = vscode.window.createOutputChannel('Package Manager#update');
  const subprocess = spawn('npm', ['install', `${data.name}@${data.version}`, data.dev ? '--save-dev' : '--save', '--registry=https://registry.npmmirror.com'], {
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
  const outputChannel = vscode.window.createOutputChannel('Package Manager#remove');
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


export const sync = (data: Record<string, any> = {}, cb: () => Promise<any>) => {
  const outputChannel = vscode.window.createOutputChannel('Package Manager#sync');

  const subprocess = spawn('npx', ['cnpm', 'sync', data.name]);
  outputChannel.clear();
  outputChannel.show();
  outputChannel.appendLine(`Package ${data.name} is Synchronizing...`);
  subprocess.stdout.on('data', data => {
    outputChannel.appendLine(data);
  });
  subprocess.stderr.on('data', data => {
    outputChannel.appendLine(data);
  });
  subprocess.on('close', async code => {
    console.log(`child process exited with code ${code}`);
    if (code === 0) {
      outputChannel.appendLine(`Package ${data.name} Synchronized successfully`);
      await cb();
      return;
    }
    outputChannel.appendLine(`Package ${data.name} Synchronized failed`);
    vscode.window.showErrorMessage(`Package ${data.name} Synchronized failed`);
  });
};
