import { assert } from "console";
import { config } from "../../package.json";
import { getLocaleID, getString } from "../utils/locale";
import { getPref, setPref } from "../utils/prefs";
import { AuthType, createClient, WebDAVClient } from "webdav";

export class ZotherdFactory {
  static webdav_client: WebDAVClient | null = null;

  static resetWebDAVClient() {
    ZotherdFactory.webdav_client = null;
  }

  static startWebDAVClient() {
    const webdav_root = getPref("webdav-root") as string;
    const webdav_username = getPref("webdav-username") as string;
    const webdav_password = getPref("webdav-password") as string;

    const client = createClient(webdav_root, {
      authType: AuthType.Auto,
      username: webdav_username,
      password: webdav_password,
    });

    (async () => {
      try {
        const contents = await client.getDirectoryContents("/");
        ztoolkit.log(contents);
      } catch (error) {
        ztoolkit.log(error);
      }
    })();

    ZotherdFactory.webdav_client = client;
  }

  static registerPrefs() {
    Zotero.PreferencePanes.register({
      pluginID: config.addonID,
      src: rootURI + "chrome/content/preferences.xhtml",
      label: getString("prefs-title"),
      image: `chrome://${config.addonRef}/content/icons/favicon.png`,
    });
  }

  static registerNotifier() {
    const callback = {
      notify: async (
        event: string,
        type: string,
        ids: number[] | string[],
        extraData: { [key: string]: any },
      ) => {
        if (!addon?.data.alive) {
          this.unregisterNotifier(notifierID);
          return;
        }
        addon.hooks.onNotify(event, type, ids, extraData);
      },
    };

    // Register the callback in Zotero as an item observer
    const notifierID = Zotero.Notifier.registerObserver(callback, [
      "tab",
      "item",
      "file",
    ]);

    // Unregister callback when the window closes (important to avoid a memory leak)
    window.addEventListener(
      "unload",
      (e: Event) => {
        this.unregisterNotifier(notifierID);
      },
      false,
    );
  }

  private static unregisterNotifier(notifierID: string) {
    Zotero.Notifier.unregisterObserver(notifierID);
  }

  private static checkWebDAVClient(): boolean {
    if (ZotherdFactory.webdav_client === null) {
      ZotherdFactory.startWebDAVClient();
    }

    if (ZotherdFactory.webdav_client === null) {
      return false;
    } else {
      return true;
    }
  }

  static async onAddItem(
    event: string,
    type: string,
    ids: Array<string | number>,
    extraData: { [key: string]: any },
  ) {
    ztoolkit.log("OnAddItem", event, type, ids, extraData);

    const localStorageRoot = getPref("local-storage-root") as string;

    const isWebDAVClientOn = ZotherdFactory.checkWebDAVClient();
    if (!isWebDAVClientOn) {
      return;
    }

    for (const itemID of ids) {
      const item = Zotero.Items.get(itemID);
      if (!item) {
        continue;
      }
      if (item.isAttachment() && !item.isTopLevelItem()) {
        // Use the parent item's key as the subdirectory name
        const parentKey = item.parentItemID;
        if (!parentKey) {
          continue;
        }
        const parentItem = await Zotero.Items.getAsync(parentKey);

        // if (
        //   (await ZotherdFactory.webdav_client?.exists("/" + parentItem.key)) ===
        //   false
        // ) {
        //   await ZotherdFactory.webdav_client?.createDirectory(
        //     "/" + parentItem.key,
        //   );
        // }

        // get file location
        const filePath = item.getFilePath();
        ztoolkit.log("File path: " + filePath);

        // Set the attachment link mode
        item.attachmentLinkMode = Zotero.Attachments.LINK_MODE_LINKED_FILE;

        // Copy the attachment to the subdirectory
        const file = Zotero.File.pathToFile(filePath);
        let targetFolderPath = localStorageRoot + parentItem.key.toString();
        ztoolkit.log("Target path: " + targetFolderPath);
        targetFolderPath = targetFolderPath.replace(/\//g, "\\");
        ztoolkit.log("Target path: " + targetFolderPath);
        const targetFolder = Zotero.File.pathToFile(targetFolderPath);
        const fileName = item.key.toString() + ".pdf";
        file.moveTo(targetFolder, fileName);

        // Set the attachment path in the item
        let targetFilePath = targetFolderPath + "\\" + fileName;
        targetFilePath = targetFilePath.replace(/\//g, "\\");
        ztoolkit.log("Target file path: " + targetFilePath);
        item.attachmentPath = targetFilePath;

        // Save the item
        item.saveTx();
      }
    }
  }

  static async onDeleteItem(
    event: string,
    type: string,
    ids: Array<string | number>,
    extraData: { [key: string]: any },
  ) {
    const isWebDAVClientOn = ZotherdFactory.checkWebDAVClient();
    if (!isWebDAVClientOn) {
      return;
    }

    for (const itemID of ids) {
      ztoolkit.log(itemID);
      const item = Zotero.Items.get(itemID);
      if (item) {
        ztoolkit.log(item.key);
        return;
      }
    }
  }
}
