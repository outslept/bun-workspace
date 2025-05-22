interface BunWorkspaceSchema {
  workspaces: {
    packages?: string[];
    // Default catalog for  dependencies
    catalog?: Record<string, string>;
    // Named catalogs for grouped dependencies
    catalogs?: Record<string, Record<string, string>>;
  };
}

interface BunWorkspace {
  getContent: () => BunWorkspaceSchema;
  setContent: (content: BunWorkspaceSchema) => void;
  hasChanged: () => boolean;
  setPackage: (
    catalog: "default" | string,
    packageName: string,
    version: string,
  ) => void;
  getPackageCatalogs: (packageName: string) => string[];
  toString: () => string;
  createCatalog: (name: string) => void;
  removeCatalog: (name: string) => void;
  setCatalogVersion: (
    catalogName: string,
    packageName: string,
    version: string,
  ) => void;
  getCatalogVersion: (
    catalogName: string,
    packageName: string,
  ) => string | undefined;
  listCatalogs: () => string[];
  getCatalogPackages: (catalogName: string) => Record<string, string>;
}

function parseBunWorkspace(content: string): BunWorkspace {
  let config: BunWorkspaceSchema = JSON.parse(content);
  let hasChanged = false;

  // Initialize workspaces object if it doesn't exist
  function ensureWorkspaces() {
    if (!config.workspaces) {
      config.workspaces = {};
      hasChanged = true;
    }
  }

  // Create new catalog (default or named)
  function createCatalog(name: string): void {
    ensureWorkspaces();

    if (name === "default") {
      if (!config.workspaces.catalog) {
        config.workspaces.catalog = {};
        hasChanged = true;
      }
    } else {
      if (!config.workspaces.catalogs) {
        config.workspaces.catalogs = {};
      }
      if (!config.workspaces.catalogs[name]) {
        config.workspaces.catalogs[name] = {};
        hasChanged = true;
      }
    }
  }

  // Remove catalog and all its packages
  function removeCatalog(name: string): void {
    if (name === "default") {
      if (config.workspaces?.catalog) {
        delete config.workspaces.catalog;
        hasChanged = true;
      }
    } else if (config.workspaces?.catalogs?.[name]) {
      delete config.workspaces.catalogs[name];
      hasChanged = true;
    }
  }

  // Set package version in specified catalog
  function setCatalogVersion(
    catalogName: string,
    packageName: string,
    version: string,
  ): void {
    createCatalog(catalogName);

    if (catalogName === "default") {
      config.workspaces.catalog![packageName] = version;
    } else {
      const catalogs = (config.workspaces.catalogs =
        config.workspaces.catalogs || {});
      const catalogObj = (catalogs[catalogName] = catalogs[catalogName] || {});
      catalogObj[packageName] = version;
    }
    hasChanged = true;
  }

  // Get package version from catalog
  function getCatalogVersion(
    catalogName: string,
    packageName: string,
  ): string | undefined {
    if (catalogName === "default") {
      return config.workspaces?.catalog?.[packageName];
    }
    return config.workspaces?.catalogs?.[catalogName]?.[packageName];
  }

  // Get all catalog names including default
  function listCatalogs(): string[] {
    const catalogs: string[] = [];

    if (config.workspaces?.catalog) {
      catalogs.push("default");
    }

    if (config.workspaces?.catalogs) {
      catalogs.push(...Object.keys(config.workspaces.catalogs));
    }

    return catalogs;
  }

  // Get all packages and versions from catalog
  function getCatalogPackages(catalogName: string): Record<string, string> {
    if (catalogName === "default") {
      return config.workspaces?.catalog || {};
    }
    return config.workspaces?.catalogs?.[catalogName] || {};
  }

  // Legacy method that uses setCatalogVersion
  function setPackage(
    catalog: string,
    packageName: string,
    version: string,
  ): void {
    setCatalogVersion(catalog, packageName, version);
  }

  // Find all catalogs containing package
  function getPackageCatalogs(packageName: string): string[] {
    const catalogs: string[] = [];

    if (config.workspaces?.catalogs) {
      for (const catalog of Object.keys(config.workspaces.catalogs)) {
        if (config.workspaces.catalogs[catalog]?.[packageName]) {
          catalogs.push(catalog);
        }
      }
    }

    if (config.workspaces?.catalog?.[packageName]) {
      catalogs.push("default");
    }

    return catalogs;
  }

  return {
    getContent: () => config,
    setContent: (newContent: BunWorkspaceSchema) => {
      config = newContent;
      hasChanged = true;
    },
    hasChanged: () => hasChanged,
    setPackage,
    getPackageCatalogs,
    toString: () => JSON.stringify(config, null, 2),
    createCatalog,
    removeCatalog,
    setCatalogVersion,
    getCatalogVersion,
    listCatalogs,
    getCatalogPackages,
  };
}

export { parseBunWorkspace, type BunWorkspace, type BunWorkspaceSchema };
