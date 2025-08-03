# CODex Report

## Build Failure Investigation
- `npm run build` fails because dependencies like `ag-grid-react` and `ag-grid-community` are missing.
- `npm install` cannot fetch packages from the registry (`403 Forbidden`).
- As a result, Jest and other modules are unavailable locally.

## API Import Fallback
- Removed `pdf2pic` dependency that required GraphicsMagick/ImageMagick.
- Added `pdf-lib` and implemented an `extractImageFromPdf` helper so scanned PDFs are converted to images in pure Node.js before OCR.

## Package.json Cleanup
- Eliminated `pdf2pic` from dependencies.
- Added `pdf-lib` to support PDF image extraction.

## Test Results
- `npm test` could not run (`jest: not found`) due to failed `npm install`.
- `npm run build` fails because `ag-grid-react` and style packages are missing.

## Expected Vercel Behaviour
- Once dependencies are successfully installed, build should succeed and OCR fallback should work without external binaries.
