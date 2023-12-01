import { WebviewPanel, ViewColumn, ExtensionContext, Uri, window } from 'vscode';
import { getWebviewContent, createWebviewPanel } from '../../utils';
import { WEBVIEW_ICON } from '../../constants';
import * as event from './event';
import i18n from '../../i18n';
import * as fs from 'fs-extra';

class PackageManage {
  public static currentPanel: PackageManage | undefined;
  public static payload: Record<string, any>;
  private readonly _panel: WebviewPanel;
  private constructor(panel: WebviewPanel, private context: ExtensionContext) {
    this._panel = panel;
    this._panel.onDidDispose(
      () => {
        PackageManage.currentPanel = undefined;
      },
      null,
      context.subscriptions,
    );
    this._panel.webview.onDidReceiveMessage(
      (message) => this.receiveMessage(message, () => this.run()),
      undefined,
      context.subscriptions,
    );
  }

  async run() {
    this._panel.webview.html = getWebviewContent(this._panel.webview, this.context.extensionUri, {
      ...PackageManage.payload,
      packageJson: fs.readJSONSync(PackageManage.payload.packagePath)
    });
    return this;
  }
  public static async render(context: ExtensionContext, payload: Record<string, any> = {}) {
    PackageManage.payload = payload;
    if (PackageManage.currentPanel) {
      PackageManage.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = createWebviewPanel('PackageManage', i18n('vscode.common.package_manage'));
      // panel.iconPath = Uri.parse(WEBVIEW_ICON);
      PackageManage.currentPanel = await new PackageManage(panel, context).run();
    }
  }

  private async receiveMessage(message: any, update: () => Promise<this>) {
    const eventId = message.eventId;
    const data = message.data;
    switch (eventId) {
      case 'update':
        event.update(data);
        await update();
        break;
      // Add more switch case statements here as more webview message commands
    }
  }
}

export default PackageManage;
