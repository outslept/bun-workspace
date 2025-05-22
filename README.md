# bun-workspace-catalog

Manage multiple dependency catalogs and version sets in Bun workspaces. Organize packages into named catalogs for better dependency management.

```bash
bun add bun-workspace-catalog
```

## Usage

```ts
import { parseBunWorkspace } from 'bun-workspace-catalog';

// Parse workspace configuration
const workspace = parseBunWorkspace(JSON.stringify({
  workspaces: {
    catalog: {
      "react": "^18.2.0"
    },
    catalogs: {
      "next-app": {
        "next": "^14.0.0",
        "react": "^18.2.0"
      }
    }
  }
}));

// Add package to catalog
workspace.setPackage("next-app", "react-dom", "^18.2.0");

// Get catalogs containing package
workspace.getPackageCatalogs("react"); // ["next-app", "default"]

// Get catalog contents
workspace.getCatalogPackages("next-app");
```

## API

### `parseBunWorkspace(content: string): BunWorkspace`

Creates a workspace instance from JSON string.

### BunWorkspace Interface

```ts
interface BunWorkspace {
  // Get full workspace configuration
  getContent: () => BunWorkspaceSchema;

  // Update workspace configuration
  setContent: (content: BunWorkspaceSchema) => void;

  // Check if workspace was modified
  hasChanged: () => boolean;

  // Add/update package in catalog
  setPackage: (catalog: string, packageName: string, version: string) => void;

  // Get all catalogs containing package
  getPackageCatalogs: (packageName: string) => string[];

  // Create new catalog
  createCatalog: (name: string) => void;

  // Remove catalog
  removeCatalog: (name: string) => void;

  // Set package version in catalog
  setCatalogVersion: (catalogName: string, packageName: string, version: string) => void;

  // Get package version from catalog
  getCatalogVersion: (catalogName: string, packageName: string) => string | undefined;

  // List all catalogs
  listCatalogs: () => string[];

  // Get all packages in catalog
  getCatalogPackages: (catalogName: string) => Record<string, string>;

  // Get workspace as formatted JSON string
  toString: () => string;
}
```

## License

MIT
