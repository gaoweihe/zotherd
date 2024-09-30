import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { AuthType, createClient } from "webdav"; 
import { getPref, setPref } from "../utils/prefs"; 

export async function registerPrefsScripts(_window: Window) {
  // This function is called when the prefs window is opened
  // See addon/chrome/content/preferences.xul onpaneload
  const webdav_root: string = getPref("webdav-root") as string; 
  const webdav_username: string = getPref("webdav-username") as string; 
  const webdav_password: string = getPref("webdav-password") as string; 

  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window, 
      webdav_root: webdav_root, 
      webdav_username: webdav_username, 
      webdav_password: webdav_password, 
      columns: [
        {
          dataKey: "title",
          label: getString("prefs-table-title"),
          fixedWidth: true,
          width: 100,
        },
        {
          dataKey: "detail",
          label: getString("prefs-table-detail"),
        },
      ],
      rows: [
        {
          title: "Group A",
          detail: "My Library/Group A",
        },
        {
          title: "Group B",
          detail: "My Library/Group B",
        },
        {
          title: "Group C",
          detail: "My Library/Group C",
        },
      ],
    };
  } else {
    addon.data.prefs.window = _window;
  }
  updatePrefsUI();
  bindPrefEvents();
}

async function updatePrefsUI() {
  // You can initialize some UI elements on prefs window
  // with addon.data.prefs.window.document
  // Or bind some events to the elements
  const renderLock = ztoolkit.getGlobal("Zotero").Promise.defer();
  if (addon.data.prefs?.window == undefined) return; 

  // const curr_doc = addon.data.prefs.window.document; 
  // const webdav_root_element = curr_doc.getElementById(`${config.addonRef}-webdav-root`); 
  // const webdav_username_element = curr_doc.getElementById(`${config.addonRef}-webdav-username`); 
  // const webdav_password_element = curr_doc.getElementById(`${config.addonRef}-webdav-password`); 
  // webdav_root_element.value = addon.data.prefs?.webdav_root; 
  // webdav_username_element.value = addon.data.prefs?.webdav_username; 
  // webdav_password_element.value = addon.data.prefs?.webdav_password; 

  const tableHelper = new ztoolkit.VirtualizedTable(addon.data.prefs?.window)
    .setContainerId(`${config.addonRef}-table-container`)
    .setProp({
      id: `${config.addonRef}-prefs-table`,
      // Do not use setLocale, as it modifies the Zotero.Intl.strings
      // Set locales directly to columns
      columns: addon.data.prefs?.columns,
      showHeader: true,
      multiSelect: true,
      staticColumns: true,
      disableFontSizeScaling: true,
    })
    .setProp("getRowCount", () => addon.data.prefs?.rows.length || 0)
    .setProp(
      "getRowData",
      (index) =>
        addon.data.prefs?.rows[index] || {
          title: "no data",
          detail: "no data",
        },
    )
    // Show a progress window when selection changes
    .setProp("onSelectionChange", (selection) => {
      new ztoolkit.ProgressWindow(config.addonName)
        .createLine({
          text: `Selected line: ${addon.data.prefs?.rows
            .filter((v, i) => selection.isSelected(i))
            .map((row) => row.title)
            .join(",")}`,
          progress: 100,
        })
        .show();
    })
    // When pressing delete, delete selected line and refresh table.
    // Returning false to prevent default event.
    .setProp("onKeyDown", (event: KeyboardEvent) => {
      if (event.key == "Delete" || (Zotero.isMac && event.key == "Backspace")) {
        addon.data.prefs!.rows =
          addon.data.prefs?.rows.filter(
            (v, i) => !tableHelper.treeInstance.selection.isSelected(i),
          ) || [];
        tableHelper.render();
        return false;
      }
      return true;
    })
    // For find-as-you-type
    .setProp(
      "getRowString",
      (index) => addon.data.prefs?.rows[index].title || "",
    )
    // Render the table.
    .render(-1, () => {
      renderLock.resolve();
    });
  await renderLock.promise;
  ztoolkit.log("Preference table rendered!");
}

function bindPrefEvents() {
  // addon.data
  //   .prefs!.window.document.querySelector(
  //     `#zotero-prefpane-${config.addonRef}-enable`,
  //   )
  //   ?.addEventListener("command", (e) => {
  //     ztoolkit.log(e);
  //     addon.data.prefs!.window.alert(
  //       `Successfully changed to ${(e.target as XUL.Checkbox).checked}!`,
  //     );
  //   });

  // addon.data
  //   .prefs!.window.document.querySelector(
  //     `#zotero-prefpane-${config.addonRef}-input`,
  //   )
  //   ?.addEventListener("change", (e) => {
  //     ztoolkit.log(e);
  //     addon.data.prefs!.window.alert(
  //       `Successfully changed to ${(e.target as HTMLInputElement).value}!`,
  //     );
  //   });

  addon.data
    .prefs!.window.document.querySelector(
      `#zotero-prefpane-${config.addonRef}-webdav-root`,
    )
    ?.addEventListener("change", (e) => {
      ztoolkit.log(e);
      const content = (e.target as HTMLInputElement).value; 
      setPref("webdav-root", content); 
      addon.data.prefs!.window.alert(
        `Successfully changed to ${content}!`,
      ); 
    });

  addon.data
    .prefs!.window.document.querySelector(
      `#zotero-prefpane-${config.addonRef}-webdav-username`,
    )
    ?.addEventListener("change", (e) => {
      ztoolkit.log(e);
      const content = (e.target as HTMLInputElement).value; 
      setPref("webdav-username", content); 
      addon.data.prefs!.window.alert(
        `Successfully changed to ${content}!`,
      ); 
    });

  addon.data
    .prefs!.window.document.querySelector(
      `#zotero-prefpane-${config.addonRef}-webdav-password`,
    )
    ?.addEventListener("change", (e) => {
      ztoolkit.log(e);
      const content = (e.target as HTMLInputElement).value; 
      setPref("webdav-password", content); 
      addon.data.prefs!.window.alert(
        `Successfully changed to ${content}!`,
      ); 
    });

  addon.data
    .prefs!.window.document.querySelector(
      `#zotero-prefpane-${config.addonRef}-webdav-verify`,
    )
    ?.addEventListener("click", (e) => {
      ztoolkit.log(e);
      addon.data.prefs!.window.alert(
        `Verify`,
      ); 

      const webdav_root = getPref("webdav-root") as string; 
      const webdav_username = getPref("webdav-username") as string; 
      const webdav_password = getPref("webdav-password") as string; 

      ztoolkit.log(webdav_root); 
      ztoolkit.log(webdav_username); 
      ztoolkit.log(webdav_password); 

      const client = createClient(webdav_root, {
        authType: AuthType.Auto,
        username: webdav_username,
        password: webdav_password
      }); 

      (async () => {
        try {
          const contents = await client.getDirectoryContents("/");
          ztoolkit.log(contents);
        } catch (error) {
          ztoolkit.log(error);
        }
      })(); 

      // const directoryItems = client.getDirectoryContents("/"); 
      // ztoolkit.log(directoryItems); 

    });
}
