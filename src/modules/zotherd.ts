import { config } from "../../package.json";
import { getLocaleID, getString } from "../utils/locale";

export class ZotherdFactory {

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

    static onAddItem(
      event: string,
      type: string,
      ids: Array<string | number>,
      extraData: { [key: string]: any }
    ) {
        ztoolkit.log(""); 

        for (const itemID of ids) {
          ztoolkit.log(itemID);
          const item = Zotero.Items.get(itemID); 
          if (item) {
            ztoolkit.log(item.key);
            return; 
          }
        }
    }

    static onDeleteItem(
      event: string,
      type: string,
      ids: Array<string | number>,
      extraData: { [key: string]: any }
    ) {
        ztoolkit.log(""); 

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