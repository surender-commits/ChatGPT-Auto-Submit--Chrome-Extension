
# ChatGPT Auto Submit

A lightweight Chrome extension that automatically clicks ChatGPT's Send button after you finish typing or editing a message.

The extension monitors user activity in the ChatGPT message composer, waits for a period of inactivity, and then attempts to click the currently available Send button.

You can enable or disable the functionality by clicking the extension icon in the Chrome toolbar.

## Features

- **Automatic Submission:** Automatically clicks ChatGPT's Send button after you stop interacting with the message composer.
- **Inactivity Detection:** Waits until the configured inactivity period has elapsed before attempting submission.
- **Live Button Detection:** Searches for the current Send button instead of relying on a previously stored button reference.
- **Dynamic Interface Support:** Designed to work with ChatGPT's single-page application behavior by checking the button again before clicking.
- **ON/OFF Toggle:** Click the extension toolbar icon to enable or disable automatic submission.
- **Visual Status Indicator:** Uses different toolbar icons for enabled and disabled states.
- **Persistent Enabled State:** Stores the extension's enabled state using Chrome local storage.
- **Lightweight Implementation:** Uses plain JavaScript and the Chrome Extension Manifest V3 architecture.

## Requirements

- Google Chrome or a compatible Chromium-based browser.
- Access to [ChatGPT](https://chatgpt.com/).
- Permission to install unpacked extensions if installing locally.

## Installation

### Install Using Chrome Developer Mode

1. Download or clone this repository.
2. Extract the ZIP archive if necessary.
3. Open Google Chrome.
4. Navigate to `chrome://extensions/`.
5. Enable **Developer mode**.
6. Click **Load unpacked**.
7. Select the project folder containing `manifest.json`.

After installation, open or refresh ChatGPT.

No build process or package installation is required.

## How to Use

### 1. Open ChatGPT

Navigate to [https://chatgpt.com/](https://chatgpt.com/) or the supported legacy ChatGPT URL.

### 2. Enable Automatic Submission

Click the extension icon in the Chrome toolbar.

The extension toggles between enabled and disabled states. Its toolbar icon changes to indicate the current state.

### 3. Type a Message

Enter a message in the ChatGPT composer as usual.

The extension listens for input, paste, and keyboard activity within the message composer.

### 4. Stop Interacting

After you stop interacting with the composer, the extension waits for the configured inactivity period.

### 5. Automatic Submission

If a visible, enabled button with an accessible label or title containing `send` or `submit` is found, the extension attempts to click it.

The extension rechecks the button immediately before clicking to reduce problems caused by interface updates.

## Configuration

The timing values are defined near the top of `content.js`.

| Constant | Default | Purpose |
|---|---:|---|
| `SCAN_INTERVAL` | 500 ms | Interval between checks for the Send button. |
| `INACTIVITY_TIME` | 1500 ms | Required inactivity period before submission is attempted. |
| `FINAL_DELAY` | 100 ms | Additional delay before the final button check and click. |

To change these values:

1. Open `content.js` in a text editor.
2. Modify the required constants.
3. Save the file.
4. Open `chrome://extensions/`.
5. Reload the extension.
6. Refresh the ChatGPT tab if necessary.

The extension uses a 1.5-second inactivity threshold. The final delay adds another 100 milliseconds before the button is checked and clicked.

## Project Structure

```text
ChatGPT_Auto_Submit/
├── manifest.json
├── background.js
├── content.js
├── icon.png
├── on.png
└── off.png
```

### File Descriptions

| File | Purpose |
|---|---|
| `manifest.json` | Defines the extension metadata, permissions, supported ChatGPT URLs, service worker, and content script. |
| `background.js` | Manages the enabled state, toolbar icon, and communication with open ChatGPT tabs. |
| `content.js` | Detects composer activity, checks inactivity, finds the Send button, and attempts automatic submission. |
| `icon.png` | Default extension icon. |
| `on.png` | Toolbar icon displayed when automatic submission is enabled. |
| `off.png` | Toolbar icon displayed when automatic submission is disabled. |

## How It Works

### 1. Background Service Worker

`background.js` initializes the enabled state when the extension is installed.

It stores the state in `chrome.storage.local` and updates the toolbar icon.

When the extension icon is clicked, the service worker toggles the enabled state and sends a state-change message to open ChatGPT tabs.

### 2. Composer Activity Detection

`content.js` listens for three event types:

- `input`
- `paste`
- `keydown`

Events are considered relevant when their target is a textarea or a content-editable element.

When relevant activity occurs, the script records the current time and cancels any pending submission timer.

The script records the activity timestamp rather than reading or storing the message text.

### 3. Inactivity Monitoring

The extension checks for a suitable Send button every 500 milliseconds.

If the user has been inactive for at least 1.5 seconds and a suitable button exists, the extension schedules a final check after another 100 milliseconds.

### 4. Send Button Detection

The extension searches visible buttons for an `aria-label` or `title` containing `send` or `submit`.

It ignores buttons that are hidden, disabled, or marked with `aria-disabled="true"`.

Before clicking, it searches again to account for changes to the ChatGPT interface.

### 5. Enable and Disable

When enabled, the content script starts its event listeners and periodic button checks.

When disabled, it clears the timers and removes the event listeners.

The extension stores the enabled state locally so it can be restored when the content script initializes.

## Permissions

The extension declares the following permission:

| Permission | Purpose |
|---|---|
| `storage` | Stores the enabled state using Chrome local storage. |

The manifest also grants host access to:

- `https://chatgpt.com/*`
- `https://chat.openai.com/*`

The content script runs on these supported ChatGPT URLs.

## Privacy

The extension monitors input, paste, and keyboard events in the ChatGPT composer to determine when the user has stopped interacting.

According to the supplied implementation, it records the activity timestamp and does not read or store the message text for inactivity detection.

It does not declare a remote server or external analytics service in the supplied source code.

The extension still operates on the ChatGPT page, so review the source code and permissions before installing or distributing it.

## Troubleshooting

### Automatic Submission Does Not Work

- Confirm that the extension is enabled.
- Refresh the ChatGPT tab after installing or reloading the extension.
- Make sure the message composer is a textarea or content-editable element.
- Confirm that ChatGPT displays a visible, enabled Send button.
- Check the browser console for JavaScript errors.

### The Extension Clicks Too Early or Too Late

Adjust `INACTIVITY_TIME` in `content.js`.

A larger value waits longer after the last interaction. A smaller value makes the extension attempt submission sooner.

### The Toolbar Icon Does Not Change

Open `chrome://extensions/` and check for extension errors.

Reload the extension and refresh the ChatGPT tab if necessary.

### The Extension Stops Working After a ChatGPT Update

The extension relies on the Send button's accessible label or title containing `send` or `submit`.

If ChatGPT changes these attributes or the composer structure, the detection logic may need to be updated.

### The Extension Does Not Respond on a ChatGPT Tab

Confirm that the tab uses one of the supported URLs:

- `https://chatgpt.com/`
- `https://chat.openai.com/`

Browser restrictions and changes to ChatGPT's interface may affect behavior.

## Known Limitations

- The extension depends on the current ChatGPT webpage structure and accessible button attributes.
- It detects composer activity through input, paste, and keydown events.
- It does not verify that the message contains valid or complete content before attempting submission.
- A visible Send button may not always mean the message is ready to submit.
- The extension attempts to click the button; it cannot guarantee that ChatGPT accepts or processes the message.
- The supplied implementation does not include a dedicated settings page.
- The extension does not include an automated test suite or build process.

## Contributing

Bug reports, suggestions, and improvements are welcome.

When reporting an issue, include:

- Your Chrome version.
- The ChatGPT URL being used.
- Steps to reproduce the problem.
- Relevant console errors, if available.

For pull requests, describe the change and explain how it was tested.

## License

No license file was included with the supplied project.

If you intend to publish this project as open source, add a `LICENSE` file specifying how others may use, modify, and redistribute the code.

Until a license is added, do not assume that the repository grants standard open-source reuse permissions.
