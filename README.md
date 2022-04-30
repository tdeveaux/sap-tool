# sap-tool
A tool to help find picks using UPC codes

Requirements:
- Chrome Android 83 or later
- Experimental Web Platform features enabled
(<chrome://flags/#enable-experimental-web-platform-features>) for
[Shape Detection API](https://wicg.github.io/shape-detection-api/)

How to use it:
1. Zoom in and wait for focus on UPCs of pick list, preferability blocking
everything else, and
tap add.
2. Add multiple times to account for misreads. Only valid and no duplicate UPCs
are added.
3. Scan barcodes. A message will appear if part of pick list. Otherwise, barcode
will show below.
