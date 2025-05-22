# bun-workspace

TypeScript library for managing Bun workspace catalogs and dependency versions.

```sh
bun add bun-workspace
```

## Usage

```typescript
import { parseBunWorkspace } from 'bun-workspace';

const workspace = parseBunWorkspace(`{
  "workspaces": {
    "catalog": {
      "react": "^18.2.0"
    },
    "catalogs": {
      "testing": {
        "jest": "^29.0.0"
      }
    }
  }
}`);

// Add packages to catalogs
workspace.setPackage("default", "react-dom", "^18.2.0");
workspace.setPackage("testing", "vitest", "^0.34.0");

// Query catalogs
workspace.getPackageCatalogs("react"); // ["default"]
workspace.getCatalogPackages("testing"); // { jest: "^29.0.0", vitest: "^0.34.0" }
```

## API

### parseBunWorkspace(content: string)

Parse workspace configuration from JSON string.

### BunWorkspace Methods

**Package Management**

```typescript
setPackage(catalog: string, packageName: string, version: string): void
getCatalogVersion(catalogName: string, packageName: string): string | undefined
getPackageCatalogs(packageName: string): string[]
```

**Catalog Management**

```typescript
createCatalog(name: string): void
removeCatalog(name: string): void
listCatalogs(): string[]
getCatalogPackages(catalogName: string): Record<string, string>
```

**Configuration**

```typescript
getContent(): BunWorkspaceSchema
setContent(content: BunWorkspaceSchema): void
hasChanged(): boolean
toString(): string
```

### Catalog Types

**Default Catalog** - Use "default" for `workspaces.catalog`

```
workspace.setPackage("default", "react", "^18.2.0");
```

**Named Catalogs** - Custom names for `workspaces.catalogs[name]`

```typescript
workspace.setPackage("testing", "jest", "^29.0.0");
workspace.setPackage("build", "webpack", "^5.88.0");
```

Integration
Reference catalogs in package.json using the catalog: protocol:

```
{
  "dependencies": {
    "react": "catalog:"
  },
  "devDependencies": {
    "jest": "catalog:testing"
  }
}
```

## License

MIT
