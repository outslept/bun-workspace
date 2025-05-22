interface BunWorkspaceSchema {
  workspaces: {
    /** Array of workspace package patterns */
    packages?: string[];
    /** Default catalog for shared dependency versions across workspaces */
    catalog?: Record<string, string>;
    /** Named catalogs for grouping related dependencies by category */
    catalogs?: Record<string, Record<string, string>>;
  };
}

interface BunWorkspace {
  /** Get the current workspace configuration object */
  getContent: () => BunWorkspaceSchema;

  /** Replace the entire workspace configuration with new content */
  setContent: (content: BunWorkspaceSchema) => void;

  /** Check if the workspace configuration has been modified since parsing */
  hasChanged: () => boolean;

  /**
   * Add or update a package version in the specified catalog
   * @param catalog - Use "default" for the main catalog or a custom name for named catalogs
   * @param packageName - The npm package name (e.g., "react", "@types/node")
   * @param version - The semver version string (e.g., "^18.0.0", "^1.2.3")
   */
  setPackage: (
    catalog: "default" | string,
    packageName: string,
    version: string,
  ) => void;

  /**
   * Find all catalogs that contain a specific package
   * @param packageName - The npm package name to search for
   * @returns Array of catalog names containing this package
   */
  getPackageCatalogs: (packageName: string) => string[];

  /** Convert the workspace configuration to a formatted JSON string */
  toString: () => string;

  /**
   * Create a new empty catalog
   * @param name - Use "default" for the main catalog or a custom name for named catalogs
   */
  createCatalog: (name: string) => void;

  /**
   * Remove an entire catalog and all its package definitions
   * @param name - the catalog name to remove ("default" or custom name)
   */
  removeCatalog: (name: string) => void;

  /**
   * Get the version of a package from a specific catalog
   * @param catalogName - The catalog name to search in
   * @param packageName - The npm package name to look up
   * @returns The version string if found, undefined otherwise
   */
  getCatalogVersion: (
    catalogName: string,
    packageName: string,
  ) => string | undefined;

  /**
   * Get all available catalog names in the workspace
   * @returns Array of catalog names including "default" if it exists
   */
  listCatalogs: () => string[];

  /**
   * Get all packages and their versions from a specific catalog
   * @param catalogName - The catalog name to retrieve packages from
   * @returns Object mapping package names to version string
   */
  getCatalogPackages: (catalogName: string) => Record<string, string>;
}

/**
 * Parse Bun workspace configuration from JSON string and return a management interface
 *
 * Bun workspaces support catalogs for sharing dependency version across packages.
 * The default catalog is stored in `workspaces.catalog`, while named catalogs
 * are stored in `workspaces.catalogs[name]`.
 *
 * @param content - JSON string containing the workspace configuration
 * @returns Object with methods to read and modify catalog configuration
 *
 * @example
 * ```typescript
 * const workspace = parseBunWorkspace(`{
 *   "workspaces": {
 *     "packages": ["packages/*"],
 *     "catalog": {
 *       "react": "^18.0.0"
 *     },
 *     "catalogs": {
 *       "testing": {
 *         "jest": "^29.0.0"
 *       }
 *     }
 *   }
 * }`)
 *
 * // Add a package to the default catalog
 * workspace.setPackage("default", "react-dom", "^18.0.0")
 *
 * // Add a package to a named catalog
 * workspace.setPackage("testing", "vitest", "^0.34.0")
 *
 * // Check what catalogs contain a package
 * const catalogs = workspace.getPackageCatalogs("react") // ["default"]
 * ```
 */
function parseBunWorkspace(content: string): BunWorkspace {
  let config: BunWorkspaceSchema = JSON.parse(content);
  let hasChanged = false;

  /**
   * Ensure the workspaces object exists in the configuration.
   * Creates it if missing and marks the configuration as changed.
   */
  const ensureWorkspaces = () => {
    if (!config.workspaces) {
      config.workspaces = {};
      hasChanged = true;
    }
  };

  /**
   * Set a package version in the specified catalog.
   * Creates the catalog structure if it doesn't exist.
   * @param catalogName - "default" for main catalog, or custom name for named catalog
   * @param packageName - npm package name
   * @param version - semver version string
   */
  const setPackage = (
    catalogName: string,
    packageName: string,
    version: string,
  ): void => {
    ensureWorkspaces();

    if (catalogName === "default") {
      config.workspaces.catalog = config.workspaces.catalog || {};
      config.workspaces.catalog[packageName] = version;
    } else {
      config.workspaces.catalogs = config.workspaces.catalogs || {};
      config.workspaces.catalogs[catalogName] =
        config.workspaces.catalogs[catalogName] || {};
      config.workspaces.catalogs[catalogName][packageName] = version;
    }
    hasChanged = true;
  };

  /**
   * Create a new empty catalog if it doesn't already exist.
   * Marks configuration as changed only if a new catalog was created.
   * @param name - The catalog name to create ("default" or custom name)
   */
  const createCatalog = (name: string): void => {
    ensureWorkspaces();

    if (name === "default") {
      if (!config.workspaces.catalog) {
        config.workspaces.catalog = {};
        hasChanged = true;
      }
    } else {
      config.workspaces.catalogs = config.workspaces.catalogs || {};
      if (!config.workspaces.catalogs[name]) {
        config.workspaces.catalogs[name] = {};
        hasChanged = true;
      }
    }
  };

  /**
   * Remove an entire catalog and all its package definitions.
   * Only removes if the catalog exists, marks as changed if removed.
   * @param name - The catalog name to remove ("default" or custom name)
   */
  const removeCatalog = (name: string): void => {
    if (name === "default" && config.workspaces?.catalog) {
      delete config.workspaces.catalog;
      hasChanged = true;
    } else if (config.workspaces?.catalogs?.[name]) {
      delete config.workspaces.catalogs[name];
      hasChanged = true;
    }
  };

  /**
   * Retrieve the version of a package from a specific catalog.
   * @param catalogName - The catalog to search in
   * @param packageName - The package to look up
   * @returns Version string if found, undefined if package or catalog doesn't exist
   */
  const getCatalogVersion = (
    catalogName: string,
    packageName: string,
  ): string | undefined =>
    catalogName === "default"
      ? config.workspaces?.catalog?.[packageName]
      : config.workspaces?.catalogs?.[catalogName]?.[packageName];

  /**
   * Get all available catalog names in the workspace.
   * Includes "default" if the default catalog exists.
   * @returns Array of all catalog names
   */
  const listCatalogs = (): string[] => {
    const catalogs: string[] = [];
    if (config.workspaces?.catalog) catalogs.push("default");
    if (config.workspaces?.catalogs)
      catalogs.push(...Object.keys(config.workspaces.catalogs));
    return catalogs;
  };

  /**
   * Get all packages and their versions from a specific catalog.
   * Returns empty object if catalog doesn't exist.
   * @param catalogName - The catalog to retrieve packages from
   * @returns Object mapping package names to version strings
   */
  const getCatalogPackages = (catalogName: string): Record<string, string> =>
    catalogName === "default"
      ? config.workspaces?.catalog || {}
      : config.workspaces?.catalogs?.[catalogName] || {};

  /**
   * Find all catalogs that contain a specific package.
   * Searches both named catalogs and the default catalog.
   * @param packageName - The package name to search for
   * @returns Array of catalog names that contain this package
   */
  const getPackageCatalogs = (packageName: string): string[] => {
    const catalogs: string[] = [];

    // Search named catalogs
    if (config.workspaces?.catalogs) {
      for (const [catalogName, catalog] of Object.entries(
        config.workspaces.catalogs,
      )) {
        if (catalog[packageName]) catalogs.push(catalogName);
      }
    }

    // Check default catalog
    if (config.workspaces?.catalog?.[packageName]) {
      catalogs.push("default");
    }

    return catalogs;
  };

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
    getCatalogVersion,
    listCatalogs,
    getCatalogPackages,
  };
}

export { parseBunWorkspace, type BunWorkspace, type BunWorkspaceSchema };
