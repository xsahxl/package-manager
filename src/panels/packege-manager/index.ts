import { WebviewPanel, ViewColumn, ExtensionContext, Uri, window } from 'vscode';
import { getWebviewContent, createWebviewPanel } from '../../utils';
import { WEBVIEW_ICON } from '../../constants';
import * as event from './event';
import i18n from '../../i18n';
import * as fs from 'fs-extra';

class PackageManager {
  public static id: string; // webview id 
  public static currentPanel: PackageManager | undefined;
  public static payload: Record<string, any>;
  private readonly _panel: WebviewPanel;
  private constructor(
    panel: WebviewPanel,
    private context: ExtensionContext,
  ) {
    this._panel = panel;
    this._panel.onDidDispose(
      () => {
        PackageManager.currentPanel = undefined;
      },
      null,
      context.subscriptions,
    );
    this._panel.webview.onDidReceiveMessage(message => this.receiveMessage(message, () => this.run()), undefined, context.subscriptions);
  }

  async run() {
    this._panel.webview.html = getWebviewContent(this._panel.webview, this.context.extensionUri, {
      ...PackageManager.payload,
      packageJson: fs.readJSONSync(PackageManager.payload.packagePath),
    });
    return this;
  }
  public static async render(context: ExtensionContext, payload: Record<string, any> = {}) {
    const packageJson = fs.readJSONSync(payload.packagePath);
    PackageManager.payload = payload;
    if (PackageManager.currentPanel && PackageManager.id === packageJson.name) {
      PackageManager.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = createWebviewPanel('PackageManager', i18n('vscode.common.package_manager', { name: packageJson.name }));
      // panel.iconPath = Uri.parse(WEBVIEW_ICON);
      PackageManager.currentPanel = await new PackageManager(panel, context).run();
      PackageManager.id = packageJson.name;
    }
  }

  private async receiveMessage(message: any, update: () => Promise<this>) {
    const eventId = message.eventId;
    const data = message.data;
    switch (eventId) {
      case 'update':
        event.update(data, update.bind(this));
        break;
      // Add more switch case statements here as more webview message commands
      case 'remove':
        event.remove(data, update.bind(this));
        break;
    }
  }
}

export default PackageManager;
