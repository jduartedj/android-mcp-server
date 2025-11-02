# UIAutomator Input Actions Added to Android MCP Server

## Overview
Added comprehensive UIAutomator input action tools to enable direct element manipulation on Android apps. These tools provide more reliable control than basic touch and swipe operations, especially for WebView-based applications.

## New UIAutomator Input Actions

### 1. **android_uiautomator_set_text**
Sets text directly on an EditText or input field element.

**Parameters:**
- `resourceId` (required): Resource ID of the target element
- `text` (required): Text to set in the element
- `deviceSerial` (optional): Target specific device

**Example Usage:**
```javascript
// Set text on an input field
await adb.setTextByResourceId('com.example.app:id/email_input', 'user@example.com');
```

**Advantages:**
- More reliable than simulated typing
- Clears existing text automatically
- Works well with WebView forms

---

### 2. **android_uiautomator_clear_text**
Clears all text from an EditText or input field.

**Parameters:**
- `resourceId` (required): Resource ID of the element to clear
- `deviceSerial` (optional): Target specific device

**Example Usage:**
```javascript
// Clear text from a field
await adb.clearTextByResourceId('com.example.app:id/search_input');
```

**Advantages:**
- Focused clearing on specific elements
- More reliable than manual selection + delete

---

### 3. **android_uiautomator_long_click**
Performs a long click (hold) gesture on an element.

**Parameters:**
- `resourceId` (required): Resource ID of the element to long click
- `deviceSerial` (optional): Target specific device

**Example Usage:**
```javascript
// Long click to open context menu
await adb.longClickElementByResourceId('com.example.app:id/list_item');
```

**Advantages:**
- Triggers context menus
- Opens item edit/delete options
- More reliable than manual timing

---

### 4. **android_uiautomator_double_click**
Performs a double click gesture on an element.

**Parameters:**
- `resourceId` (required): Resource ID of the element
- `deviceSerial` (optional): Target specific device

**Example Usage:**
```javascript
// Double click to zoom or select
await adb.doubleClickElementByResourceId('com.example.app:id/image_view');
```

**Advantages:**
- Zooms in/out on images
- Selects text in fields
- More precise than manual clicks

---

### 5. **android_uiautomator_toggle_checkbox**
Toggles a checkbox element on or off.

**Parameters:**
- `resourceId` (required): Resource ID of the checkbox
- `deviceSerial` (optional): Target specific device

**Example Usage:**
```javascript
// Toggle checkbox state
await adb.toggleCheckboxByResourceId('com.example.app:id/terms_checkbox');
```

**Advantages:**
- Works with WebView checkboxes (where UIAutomator hierarchy may not update)
- Clicks the center of the checkbox automatically
- Handles both native and web-based checkboxes

---

### 6. **android_uiautomator_scroll_in_element**
Scrolls within a specific scrollable element.

**Parameters:**
- `resourceId` (required): Resource ID of the scrollable element
- `direction` (required): Direction to scroll - `'up'`, `'down'`, `'left'`, or `'right'`
- `distance` (optional): Distance to scroll in pixels (default: 500)
- `deviceSerial` (optional): Target specific device

**Example Usage:**
```javascript
// Scroll down within a list view
await adb.scrollInElement('com.example.app:id/list_view', 'down', 300);

// Scroll left in a horizontal scroll view
await adb.scrollInElement('com.example.app:id/carousel', 'left', 500);
```

**Advantages:**
- Scrolls within specific elements only
- More controlled than full screen swipes
- Doesn't affect other UI elements

---

## Implementation Details

### ADB Wrapper Methods (src/adb-wrapper.ts)
All methods in the ADBWrapper class follow this pattern:
1. Query UIAutomator dump to find element coordinates
2. Extract bounds from XML response
3. Calculate center coordinates
4. Perform the action (click, input, scroll, etc.)

### Handler Functions (src/handlers.ts)
Each handler:
- Validates input parameters
- Calls the corresponding ADB wrapper method
- Returns standardized MCP response format
- Includes proper error handling

### MCP Server Integration (src/index.ts)
All tools are:
- Added to the tools list with full schema definitions
- Mapped to their handler functions in the CallToolRequestSchema
- Documented with descriptions and parameter details

---

## Use Cases

### WebView Form Filling (Like the Washer App)
```javascript
// Better approach for WebView forms
await adb.setTextByResourceId('email_field', 'user@example.com');
await adb.setTextByResourceId('phone_field', '1234567890');
await adb.toggleCheckboxByResourceId('terms_checkbox');
```

### Context Menu Operations
```javascript
// Long click to open delete/edit menu
await adb.longClickElementByResourceId('item_id');
```

### List Scrolling
```javascript
// Scroll within a specific list view
await adb.scrollInElement('list_view_id', 'down', 1000);
```

### Text Selection & Copying
```javascript
// Double click to select text, then long click for copy
await adb.doubleClickElementByResourceId('text_field_id');
await adb.longClickElementByResourceId('text_field_id');
```

---

## Comparison: Old vs New Approach

### Old Approach (Touch + Input Text)
```javascript
await adb.touch(540, 880);  // Click field
await adb.inputText('test@example.com');  // Type text
// Issues: Field might not be focused, text gets concatenated
```

### New Approach (Set Text by Resource ID)
```javascript
await adb.setTextByResourceId('email_field', 'test@example.com');
// Advantages: Focused, reliable, handles clearing automatically
```

---

## All New Tools Summary

| Tool Name | Function | Key Benefit |
|-----------|----------|------------|
| `android_uiautomator_set_text` | Sets text on elements | Direct, reliable text input |
| `android_uiautomator_clear_text` | Clears element text | Focused text clearing |
| `android_uiautomator_long_click` | Long press gesture | Context menus & selections |
| `android_uiautomator_double_click` | Double tap gesture | Zoom & text selection |
| `android_uiautomator_toggle_checkbox` | Toggle checkboxes | Reliable checkbox control |
| `android_uiautomator_scroll_in_element` | Scroll specific elements | Precise scrolling control |

All tools are now available through the MCP server and can be used with GitHub Copilot in VS Code!
